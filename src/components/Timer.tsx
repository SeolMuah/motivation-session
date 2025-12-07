'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';

interface TimerProps {
  sessionId: string;
  duration?: number; // 초 단위 (기본 60초)
  onComplete?: () => void;
  isDisplay?: boolean;
  autoStart?: boolean;
}

export default function Timer({
  sessionId,
  duration = 60,
  onComplete,
  isDisplay = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  autoStart = false,
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isMuted, setIsMuted] = useState(!isDisplay); // 학생은 음소거 기본, 진행자는 소리 기본
  const [timerStartedAt, setTimerStartedAt] = useState<string | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const supabase = getSupabase();

  useEffect(() => {
    // 오디오 요소 생성
    audioRef.current = new Audio('/audio/timer-bgm.mp3');
    audioRef.current.loop = false; // 타이머 종료 후에도 음악이 끝까지 재생되도록 loop 비활성화
    audioRef.current.volume = 0.25;

    // 사용자 상호작용 감지 (클릭, 터치, 키보드)
    const handleUserInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true);
        // 소리 없이 재생 시도하여 오디오 컨텍스트 활성화
        if (audioRef.current) {
          audioRef.current.volume = 0;
          audioRef.current.play().then(() => {
            audioRef.current?.pause();
            if (audioRef.current) {
              audioRef.current.volume = 0.25;
              audioRef.current.currentTime = 0;
            }
          }).catch(() => {});
        }
      }
    };

    // 다양한 이벤트에서 상호작용 감지
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [userInteracted]);

  // 타이머 상태 동기화 (Polling only)
  useEffect(() => {
    loadTimerState();

    // Polling으로 타이머 상태 확인 (1초마다)
    const pollInterval = setInterval(() => {
      loadTimerState();
    }, 1000);

    return () => {
      clearInterval(pollInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // 타이머 시작 시간이 변경되면 타이머 계산
  useEffect(() => {
    if (timerStartedAt) {
      const startTime = new Date(timerStartedAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);

      if (remaining > 0) {
        setTimeLeft(remaining);
        setIsRunning(true);
        setIsComplete(false);
      } else {
        setTimeLeft(0);
        setIsRunning(false);
        setIsComplete(true);
      }
    } else {
      setTimeLeft(duration);
      setIsRunning(false);
      setIsComplete(false);
    }
  }, [timerStartedAt, duration]);

  const loadTimerState = async () => {
    try {
      const { data } = await supabase
        .from('sessions')
        .select('timer_started_at')
        .eq('id', sessionId)
        .single();

      if (data?.timer_started_at !== undefined) {
        setTimerStartedAt(data.timer_started_at);
      }
    } catch {
      // timer_started_at 컬럼이 없으면 무시
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      // BGM 재생 - 사용자가 상호작용을 했고 음소거가 아닌 경우에만
      if (audioRef.current && userInteracted && !isMuted) {
        audioRef.current.play().catch(() => {
          // 자동 재생 차단된 경우 무시
        });
      }

      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            // 타이머가 끝나도 배경음은 끝까지 재생 (페이드아웃/정지하지 않음)
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isRunning && !isComplete && audioRef.current) {
      // 타이머가 완료된 경우(isComplete)에는 음악을 멈추지 않음
      audioRef.current.pause();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isMuted, userInteracted, onComplete]);

  const startTimer = async () => {
    // 진행자만 시작 가능
    if (!isDisplay) return;

    const { error } = await supabase
      .from('sessions')
      .update({ timer_started_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      console.error('타이머 시작 오류:', error);
      alert('타이머 시작에 실패했습니다. 콘솔을 확인해주세요.');
    } else {
      // 즉시 로컬 상태 업데이트
      setTimerStartedAt(new Date().toISOString());
    }
  };

  const resetTimer = async () => {
    // 진행자만 리셋 가능
    if (!isDisplay) return;

    await supabase
      .from('sessions')
      .update({ timer_started_at: null })
      .eq('id', sessionId);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (!isMuted) {
        // 음소거 시 페이드 아웃 효과
        const fadeOutDuration = 800; // 0.8초
        const fadeOutSteps = 20;
        const stepDuration = fadeOutDuration / fadeOutSteps;
        const volumeStep = audioRef.current.volume / fadeOutSteps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
          currentStep++;
          if (audioRef.current && currentStep < fadeOutSteps) {
            audioRef.current.volume = Math.max(0, audioRef.current.volume - volumeStep);
          } else {
            clearInterval(fadeInterval);
            if (audioRef.current) {
              audioRef.current.muted = true;
              audioRef.current.volume = 0.25; // 볼륨 복구 (음소거 상태)
            }
            setIsMuted(true);
          }
        }, stepDuration);
      } else {
        // 음소거 해제 시 즉시 재생
        audioRef.current.muted = false;
        setIsMuted(false);
        if (isRunning && userInteracted) {
          audioRef.current.play().catch(() => {});
        }
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className={`flex flex-col items-center ${isDisplay ? 'scale-125' : ''}`}>
      {/* 타이머 원형 */}
      <div className="relative w-64 h-64 md:w-80 md:h-80">
        {/* 배경 원 */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="var(--card)"
            strokeWidth="8"
          />
          {/* 진행 원 */}
          <motion.circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}%`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}%`}
            initial={{ strokeDashoffset: `${2 * Math.PI * 45}%` }}
            animate={{ strokeDashoffset: `${2 * Math.PI * 45 * (1 - progress / 100)}%` }}
            transition={{ duration: 0.5 }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
        </svg>

        {/* 시간 표시 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl md:text-7xl font-bold gradient-text">
            {formatTime(timeLeft)}
          </span>
          <span className="text-[var(--muted)] mt-2">
            {isComplete ? '완료!' : isRunning ? '진행 중...' : '준비'}
          </span>
        </div>
      </div>

      {/* 컨트롤 버튼 - 진행자용 */}
      {isDisplay && (
        <div className="flex items-center gap-4 mt-8">
          {!isRunning && !isComplete && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={startTimer}
              className="btn-primary flex items-center gap-2 text-lg"
            >
              <Play size={24} />
              1분 시작
            </motion.button>
          )}

          {(isRunning || isComplete) && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={resetTimer}
              className="p-3 rounded-full bg-[var(--card)] hover:bg-[var(--card-hover)]"
            >
              <RotateCcw size={24} />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className="p-3 rounded-full bg-[var(--card)] hover:bg-[var(--card-hover)]"
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </motion.button>
        </div>
      )}

      {/* 음소거 버튼 - 참가자용 */}
      {!isDisplay && (
        <div className="flex items-center gap-4 mt-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className="p-3 rounded-full bg-[var(--card)] hover:bg-[var(--card-hover)]"
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </motion.button>
        </div>
      )}

      {/* 안내 문구 - 진행 중일 때만 표시 */}
      {isRunning && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-[var(--muted)] mt-6 max-w-md"
        >
          잠시 눈을 감고, 처음 이 여정을 시작했을 때를 떠올려보세요...
        </motion.p>
      )}
    </div>
  );
}
