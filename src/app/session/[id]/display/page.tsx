'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';
import type { Session, SessionStep } from '@/lib/types';

import EmojiVote from '@/components/EmojiVote';
import Timer from '@/components/Timer';
import FloatingMessages from '@/components/FloatingMessages';
import ConflictVote from '@/components/ConflictVote';
import ProblemKeyword from '@/components/ProblemKeyword';
import CheerButton from '@/components/CheerButton';

const STEPS: { id: SessionStep; title: string; quote?: string }[] = [
  { id: 'condition', title: '컨디션 체크', quote: '지금 여러분은 이미 상위 10%입니다' },
  { id: 'reset', title: '리셋 타임', quote: '처음의 나에게 한마디' },
  { id: 'first-me', title: '처음의 나에게', quote: '그때의 나한테 부끄럽지 않으려면?' },
  { id: 'conflict', title: '협업 이야기', quote: '협업은 고통이 아니라 성장의 가속기' },
  { id: 'why', title: '다시, 왜?', quote: '결국 모든 것은 문제 해결로 연결됩니다' },
  { id: 'proud', title: '뿌듯할 순간', quote: '지금은 버티는 게 아니라 쌓이는 중입니다' },
  { id: 'cheer', title: '화이팅!', quote: '오늘의 막막함이, 내일의 포트폴리오가 됩니다' },
];

export default function DisplayPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    loadSession();

    // 키보드 네비게이션
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionId]);

  const loadSession = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (data) {
      setSession(data);
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

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
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
            onClick={() => setCurrentStep(index)}
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
          disabled={currentStep === STEPS.length - 1}
          className="p-2 rounded-full hover:bg-[var(--card-hover)] disabled:opacity-50 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* 키보드 단축키 안내 */}
      <div className="fixed bottom-4 right-4 text-xs text-[var(--muted)]">
        ← → 이동 | F 전체화면
      </div>
    </main>
  );
}
