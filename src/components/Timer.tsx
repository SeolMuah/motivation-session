'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  autoStart = false,
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const supabase = getSupabase();

  useEffect(() => {
    // 오디오 요소 생성
    audioRef.current = new Audio('/audio/timer-bgm.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.25;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 타이머 상태 동기화
  useEffect(() => {
    loadTimerState();

    // 실시간 구독
    const channel = supabase
      .channel(`timer_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload: { new: { timer_started_at: string | null } }) => {
          const newTimerStartedAt = payload.new.timer_started_at;
          setTimerStartedAt(newTimerStartedAt);
        }
      )
      .subscribe();

    // Polling으로 타이머 상태 확인 (1초마다)
    const pollInterval = setInterval(() => {
      loadTimerState();
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
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
      // BGM 재생
      if (audioRef.current && !isMuted) {
        audioRef.current.play().catch(() => {
          // 자동 재생 차단된 경우 무시
        });
      }

      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            if (audioRef.current) {
              // 페이드아웃
              const fadeOut = setInterval(() => {
                if (audioRef.current && audioRef.current.volume > 0.1) {
                  audioRef.current.volume -= 0.1;
                } else {
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.volume = 0.25;
                  }
                  clearInterval(fadeOut);
                }
              }, 100);
            }
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isRunning && audioRef.current) {
      audioRef.current.pause();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isMuted, onComplete]);

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
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
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
          <AnimatePresence mode="wait">
            <motion.span
              key={timeLeft}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-5xl md:text-7xl font-bold gradient-text"
            >
              {formatTime(timeLeft)}
            </motion.span>
          </AnimatePresence>
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
