'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, User, Users, ChevronDown, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';
import type { Session, SessionStep } from '@/lib/types';

import EmojiVote from '@/components/EmojiVote';
import Timer from '@/components/Timer';
import MessageInput from '@/components/MessageInput';
import FloatingMessages from '@/components/FloatingMessages';
import ConflictVote from '@/components/ConflictVote';
import ProblemKeyword from '@/components/ProblemKeyword';
import CheerButton from '@/components/CheerButton';

const STEPS: { id: SessionStep; title: string; subtitle: string }[] = [
  { id: 'condition', title: '컨디션 체크', subtitle: '지금 기분은 어떠세요?' },
  { id: 'reset', title: '리셋 타임', subtitle: '1분간 눈을 감고 생각해보세요' },
  { id: 'first-me', title: '처음의 나에게', subtitle: '한마디를 남겨보세요' },
  { id: 'conflict', title: '협업 이야기', subtitle: '갈등을 경험해본 적 있나요?' },
  { id: 'why', title: '나의 고민, 나의 서사', subtitle: '우리들의 고민은?' },
  { id: 'proud', title: '뿌듯할 순간', subtitle: '프로젝트 후 가장 뿌듯할 순간은?' },
  { id: 'cheer', title: '화이팅!', subtitle: '함께 응원해요' },
];

const TEAM_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1);

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState(''); // 이름만 (예: 홍길동)
  const [teamNumber, setTeamNumber] = useState<number | ''>(''); // 조 번호 (예: 3)
  const [nicknameInput, setNicknameInput] = useState('');
  const [customTeamInput, setCustomTeamInput] = useState('');
  const [useCustomTeam, setUseCustomTeam] = useState(false);
  const [hasEnteredSession, setHasEnteredSession] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    loadSession();
    // 이전에 저장된 정보가 있는지 확인
    const savedUserName = localStorage.getItem(`userName-${sessionId}`);
    const savedTeam = localStorage.getItem(`team-${sessionId}`);
    if (savedUserName && savedTeam) {
      setUserName(savedUserName);
      setTeamNumber(parseInt(savedTeam));
      setHasEnteredSession(true);
    }

    // Polling으로 세션 상태 동기화 (3초마다)
    const pollInterval = setInterval(() => {
      loadSession();
    }, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const loadSession = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (data) {
      setSession(data);
      // 세션에 저장된 현재 단계가 있으면 복원
      if (data.current_step !== undefined && data.current_step !== null) {
        setCurrentStep(data.current_step);
      }
    }
    setIsLoading(false);
  };

  const handleEnterSession = () => {
    // 조 번호 결정
    let finalTeam: number;
    if (useCustomTeam) {
      const parsed = parseInt(customTeamInput);
      if (isNaN(parsed) || parsed < 1) {
        alert('올바른 조 번호를 입력해주세요 (1 이상의 정수)');
        return;
      }
      finalTeam = parsed;
    } else {
      if (teamNumber === '') {
        alert('조를 선택해주세요');
        return;
      }
      finalTeam = teamNumber;
    }

    const finalUserName = nicknameInput.trim();
    if (!finalUserName) {
      alert('이름을 입력해주세요');
      return;
    }

    // 이름과 조 번호를 각각 저장
    setUserName(finalUserName);
    setTeamNumber(finalTeam);
    localStorage.setItem(`userName-${sessionId}`, finalUserName);
    localStorage.setItem(`team-${sessionId}`, finalTeam.toString());
    setHasEnteredSession(true);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-bg">
        <h1 className="text-3xl font-bold mb-4">세션을 찾을 수 없어요 😢</h1>
        <a href="/" className="btn-primary">
          메인으로 돌아가기
        </a>
      </div>
    );
  }

  // 입장 화면 (세션 진입 전)
  if (!hasEnteredSession) {
    return (
      <main className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-md w-full text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="text-6xl"
          >
            👋
          </motion.div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{session.name}</h1>
            <p className="text-[var(--muted)]">동기부여 세션에 오신 것을 환영해요!</p>
          </div>

          <div className="space-y-4">
            {/* 조 선택 */}
            <div className="space-y-2">
              <label className="text-sm text-[var(--muted)] block text-left flex items-center gap-2">
                <Users size={16} />
                조 선택
              </label>
              {!useCustomTeam ? (
                <div className="relative">
                  <select
                    value={teamNumber}
                    onChange={(e) => setTeamNumber(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 pr-10 focus:outline-none focus:border-[var(--primary)] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">조를 선택해주세요</option>
                    {TEAM_OPTIONS.map((num) => (
                      <option key={num} value={num}>
                        {num}조
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={20}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
                  />
                </div>
              ) : (
                <input
                  type="number"
                  min="1"
                  value={customTeamInput}
                  onChange={(e) => setCustomTeamInput(e.target.value)}
                  placeholder="조 번호 입력 (예: 21)"
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setUseCustomTeam(!useCustomTeam);
                  setTeamNumber('');
                  setCustomTeamInput('');
                }}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                {useCustomTeam ? '1~20조에서 선택하기' : '21조 이상 직접 입력하기'}
              </button>
            </div>

            {/* 이름 입력 */}
            <div className="space-y-2">
              <label className="text-sm text-[var(--muted)] block text-left flex items-center gap-2">
                <User size={16} />
                이름
              </label>
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="이름을 입력해주세요"
                maxLength={20}
                onKeyDown={(e) => e.key === 'Enter' && handleEnterSession()}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
          </div>

          <motion.button
            onClick={handleEnterSession}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Sparkles size={20} />
            세션 시작하기
          </motion.button>
        </motion.div>
      </main>
    );
  }

  const currentStepData = STEPS[currentStep];

  return (
    <main className="min-h-screen gradient-bg">
      {/* 헤더 */}
      <header className="sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-lg">{session.name}</h1>
              <p className="text-sm text-[var(--muted)]">
                {currentStepData.title}
              </p>
            </div>

            {/* 단계 인디케이터 (진행자 동기화) */}
            <div className="flex gap-1">
              {STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-[var(--primary)]'
                      : index < currentStep
                      ? 'bg-[var(--accent)]'
                      : 'bg-[var(--border)]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 - 하단 네비게이션 높이만큼 패딩 추가 */}
      <div className="container mx-auto px-4 py-8 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            {/* 단계별 콘텐츠 */}
            {currentStepData.id === 'condition' && (
              <EmojiVote sessionId={sessionId} />
            )}

            {currentStepData.id === 'reset' && (
              <div className="w-full max-w-2xl">
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl md:text-4xl font-bold text-center mb-12 leading-relaxed"
                >
                  잠시 눈을 감고,<br />
                  처음 이 여정을 시작했을 때를<br />
                  떠올려보세요...
                </motion.h2>
                <Timer sessionId={sessionId} duration={60} />
              </div>
            )}

            {currentStepData.id === 'first-me' && (
              <div className="w-full max-w-2xl space-y-8">
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl md:text-3xl font-bold text-center"
                >
                  처음의 나에게 한마디
                </motion.h2>
                <MessageInput
                  sessionId={sessionId}
                  table="first_me_messages"
                  placeholder="처음의 나에게 해주고 싶은 말을 적어주세요..."
                  nickname={userName}
                  teamNumber={teamNumber as number}
                />
                <FloatingMessages
                  sessionId={sessionId}
                  table="first_me_messages"
                  title="모두의 메시지"
                  myTeamNumber={teamNumber as number}
                />
              </div>
            )}

            {currentStepData.id === 'conflict' && (
              <ConflictVote sessionId={sessionId} nickname={`${teamNumber}조 ${userName}`} teamNumber={teamNumber as number} />
            )}

            {currentStepData.id === 'why' && (
              <ProblemKeyword sessionId={sessionId} />
            )}

            {currentStepData.id === 'proud' && (
              <div className="w-full max-w-2xl space-y-8">
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl md:text-3xl font-bold text-center"
                >
                  최종 프로젝트가 끝나고 가장 뿌듯할 순간, 생각, 느낌을 자유롭게 적어주세요
                </motion.h2>
                <MessageInput
                  sessionId={sessionId}
                  table="proud_moments"
                  placeholder="뿌듯할 순간, 생각, 느낌을 자유롭게 적어주세요..."
                  maxLength={100}
                  nickname={userName}
                  teamNumber={teamNumber as number}
                />
                <FloatingMessages
                  sessionId={sessionId}
                  table="proud_moments"
                  title="뿌듯할 순간들"
                  myTeamNumber={teamNumber as number}
                />
              </div>
            )}

            {currentStepData.id === 'cheer' && (
              <div className="flex flex-col items-center gap-8">
                <CheerButton sessionId={sessionId} />

                {/* 나의 기록 돌아보기 버튼 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <Link
                    href={`/session/${sessionId}/my-recap`}
                    className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--card-hover)] transition-all group"
                  >
                    <BookOpen size={24} className="text-[var(--primary)] group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <div className="font-semibold">나의 기록 돌아보기</div>
                      <div className="text-sm text-[var(--muted)]">오늘 남긴 메시지들을 확인해보세요</div>
                    </div>
                  </Link>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 현재 단계 표시 (진행자가 제어) */}
      <div className="fixed bottom-0 left-0 right-0 p-4">
        <div className="container mx-auto flex justify-center items-center">
          <span className="text-[var(--muted)] bg-[var(--card)] px-4 py-2 rounded-xl">
            {currentStep + 1} / {STEPS.length} 단계
          </span>
        </div>
      </div>
    </main>
  );
}
