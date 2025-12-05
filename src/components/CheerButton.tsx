'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { getSupabase } from '@/lib/supabase/client';

interface CheerButtonProps {
  sessionId: string;
  isDisplay?: boolean;
}

export default function CheerButton({ sessionId, isDisplay = false }: CheerButtonProps) {
  const [cheerCount, setCheerCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    loadCheerCount();

    // Realtime 구독
    const channel = supabase
      .channel(`cheers_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cheers',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          loadCheerCount();
          if (isDisplay) {
            fireConfetti();
          }
        }
      )
      .subscribe();

    // 진행자 페이지에서는 추가로 polling (2초마다)
    let pollInterval: NodeJS.Timeout | null = null;
    if (isDisplay) {
      pollInterval = setInterval(() => {
        loadCheerCount();
      }, 2000);
    }

    return () => {
      supabase.removeChannel(channel);
      if (pollInterval) clearInterval(pollInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isDisplay]);

  const loadCheerCount = async () => {
    const { count } = await supabase
      .from('cheers')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (count !== null) {
      setCheerCount(count);
    }
  };

  const fireConfetti = useCallback(() => {
    const colors = ['#6366F1', '#F59E0B', '#EC4899', '#10B981', '#F43F5E'];

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });

    // 양쪽에서도 발사
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });
  }, []);

  const handleCheer = async () => {
    if (isAnimating || isDisplay) return;

    setIsAnimating(true);
    fireConfetti();

    const { error } = await supabase.from('cheers').insert({
      session_id: sessionId,
    });

    if (!error) {
      // 성공 시 즉시 카운트 새로고침
      await loadCheerCount();
    }

    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <div className="flex flex-col items-center">
      {/* 제목 */}
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl md:text-3xl font-bold text-center mb-4"
      >
        함께 화이팅! 🔥
      </motion.h2>

      {/* 카운터 */}
      <motion.div
        key={cheerCount}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.2, 1] }}
        className="text-6xl md:text-8xl font-bold gradient-text mb-8"
      >
        {cheerCount}
      </motion.div>

      {/* 화이팅 버튼 */}
      {!isDisplay && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCheer}
          disabled={isAnimating}
          className={`
            relative overflow-hidden
            text-4xl md:text-6xl
            px-12 py-8 md:px-16 md:py-10
            rounded-3xl
            bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]
            shadow-lg shadow-[var(--primary)]/30
            ${isAnimating ? 'animate-pulse-glow' : ''}
          `}
        >
          <span className="relative z-10">💪 화이팅!</span>

          {/* 배경 애니메이션 */}
          <motion.div
            className="absolute inset-0 bg-white/20"
            initial={{ x: '-100%' }}
            animate={{ x: isAnimating ? '100%' : '-100%' }}
            transition={{ duration: 0.5 }}
          />
        </motion.button>
      )}

      {/* 진행자용 표시 */}
      {isDisplay && (
        <div className="text-center">
          <p className="text-xl text-[var(--muted)]">
            화이팅 버튼을 눌러주세요!
          </p>
          <div className="flex justify-center gap-4 mt-6">
            {['💪', '🔥', '⭐', '✨', '🎉'].map((emoji, i) => (
              <motion.span
                key={i}
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="text-4xl"
              >
                {emoji}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* 격려 문구 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-[var(--muted)] mt-8 text-lg"
      >
        데이터는 쌓일수록 의미가 생깁니다. 여러분의 시간도 마찬가지예요
      </motion.p>
    </div>
  );
}
