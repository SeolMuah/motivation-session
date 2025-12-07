'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Maximize2, Lock } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';
import type { Session, SessionStep } from '@/lib/types';

import EmojiVote from '@/components/EmojiVote';
import Timer from '@/components/Timer';
import FloatingMessages from '@/components/FloatingMessages';
import ConflictVote from '@/components/ConflictVote';
import ProblemKeyword from '@/components/ProblemKeyword';
import CheerButton from '@/components/CheerButton';

const STEPS: { id: SessionStep; title: string; quote?: string }[] = [
  { id: 'condition', title: '컨디션 체크', quote: '포기하지 않고 최종 프로젝트 중간 발표까지 오신 지금\n여러분은 이미 상위 10%입니다' },
  { id: 'reset', title: '리셋 타임', quote: '잠시 눈을 감고, 처음 이 여정을 시작했을 때를 떠올려보세요...' },
  { id: 'first-me', title: '처음의 나에게', quote: '스파르타 내일배움캠프를 시작하기 전의 나에게' },
  { id: 'conflict', title: '협업 이야기', quote: '완벽한 팀은 없습니다. 함께 완주하는 팀이 있을 뿐\n서로 다르게 생각하는 그 시선에서 새로운 가능성이 시작됩니다' },
  { id: 'why', title: '나의 고민, 나의 서사', quote: '나의 고민, 나의 서사' },
  { id: 'proud', title: '뿌듯할 순간', quote: '과정을 견딘 사람만이, 결과의 열매를 맺습니다' },
  { id: 'cheer', title: '화이팅!', quote: '데이터가 쌓일수록 의미가 발견되었지요? 여러분의 시간도 마찬가지예요\n지금은 막막하고 두렵다고 느낄지라도 여러분들의 노력은 반드시 꽃을 피웁니다.' },
];

export default function DisplayPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const supabase = getSupabase();

  // 관리자 토큰 검증
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem('admin_logged_in');
    const adminToken = localStorage.getItem('admin_token');
    const adminId = localStorage.getItem('admin_id');

    // 토큰과 ID가 모두 있어야 인증됨
    setIsAuthorized(adminLoggedIn === 'true' && !!adminToken && !!adminId);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadSession();

    // 키보드 네비게이션
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNextStep();
      } else if (e.key === 'ArrowLeft') {
        handlePrevStep();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionId, currentStep]);

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // DB에 현재 단계 업데이트
  const updateStepInDB = async (step: number) => {
    console.log('DB 단계 업데이트 시도:', step);
    const { error } = await supabase
      .from('sessions')
      .update({ current_step: step })
      .eq('id', sessionId);

    if (error) {
      console.error('DB 업데이트 오류:', error);
    } else {
      console.log('DB 단계 업데이트 성공:', step);
    }
  };

  const handleNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      updateStepInDB(newStep);
    } else if (currentStep === STEPS.length - 1) {
      // 마지막 단계에서 다음 버튼 누르면 회고 페이지로 이동
      router.push(`/session/${sessionId}/recap`);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      updateStepInDB(newStep);
    }
  };

  // 인디케이터 클릭으로 특정 단계로 이동
  const goToStep = (step: number) => {
    setCurrentStep(step);
    updateStepInDB(step);
  };

  const nextStep = () => handleNextStep();
  const prevStep = () => handlePrevStep();

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

  // 관리자 로그인 필요
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-bg p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-md w-full text-center"
        >
          <Lock size={48} className="mx-auto text-[var(--primary)] mb-6" />
          <h1 className="text-2xl font-bold mb-2">진행자 전용 페이지</h1>
          <p className="text-[var(--muted)] mb-6">
            이 페이지에 접근하려면 관리자 로그인이 필요합니다.
          </p>
          <a href="/" className="btn-primary inline-block">
            로그인 페이지로 이동
          </a>
        </motion.div>
      </div>
    );
  }

  const currentStepData = STEPS[currentStep];

  return (
    <main className="min-h-screen gradient-bg overflow-hidden">
      {/* 풀스크린 버튼 */}
      <button
        onClick={toggleFullscreen}
        className="fixed top-4 right-4 z-50 p-3 rounded-full bg-[var(--card)] hover:bg-[var(--card-hover)] transition-colors"
      >
        <Maximize2 size={24} />
      </button>

      {/* 단계 인디케이터 */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        {STEPS.map((_, index) => (
          <button
            key={index}
            onClick={() => goToStep(index)}
            className={`w-4 h-4 rounded-full transition-all ${
              index === currentStep
                ? 'bg-[var(--primary)] scale-125'
                : index < currentStep
                ? 'bg-[var(--accent)]'
                : 'bg-[var(--border)]'
            }`}
          />
        ))}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="min-h-screen flex flex-col items-center pt-20 pb-24 px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-6xl text-center flex flex-col items-center"
          >
            {/* 인용구 */}
            {currentStepData.quote && (
              <motion.p
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-5xl font-bold gradient-text mb-8 leading-tight whitespace-pre-line"
              >
                &ldquo;{currentStepData.quote}&rdquo;
              </motion.p>
            )}

            {/* 단계별 콘텐츠 (Display 모드) */}
            <div className="w-full mt-12">
              {currentStepData.id === 'condition' && (
                <EmojiVote sessionId={sessionId} isDisplay />
              )}

              {currentStepData.id === 'reset' && (
                <Timer sessionId={sessionId} duration={60} isDisplay />
              )}

              {currentStepData.id === 'first-me' && (
                <FloatingMessages
                  sessionId={sessionId}
                  table="first_me_messages"
                  title="처음의 나에게 한마디"
                  isDisplay
                />
              )}

              {currentStepData.id === 'conflict' && (
                <ConflictVote sessionId={sessionId} isDisplay />
              )}

              {currentStepData.id === 'why' && (
                <ProblemKeyword sessionId={sessionId} isDisplay />
              )}

              {currentStepData.id === 'proud' && (
                <FloatingMessages
                  sessionId={sessionId}
                  table="proud_moments"
                  title="뿌듯할 순간들"
                  isDisplay
                />
              )}

              {currentStepData.id === 'cheer' && (
                <CheerButton sessionId={sessionId} isDisplay />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 네비게이션 (진행자용) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[var(--card)]/90 backdrop-blur-sm rounded-full px-6 py-3">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="p-2 rounded-full hover:bg-[var(--card-hover)] disabled:opacity-50 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>

        <span className="text-lg font-medium min-w-[100px] text-center">
          {currentStepData.title}
        </span>

        <button
          onClick={nextStep}
          className="p-2 rounded-full hover:bg-[var(--card-hover)] transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

    </main>
  );
}
