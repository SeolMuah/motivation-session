'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabase } from '@/lib/supabase/client';
import type { Emoji, VoteStats } from '@/lib/types';

const EMOJIS: Emoji[] = ['😴', '😵', '🔥', '💪'];
const EMOJI_LABELS: Record<Emoji, string> = {
  '😴': '피곤해요',
  '😵': '힘들어요',
  '🔥': '불타오르는 중',
  '💪': '할 수 있어요',
};

// 고유 voter_id 생성/조회
function getVoterId(): string {
  const key = 'voter_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

interface EmojiVoteProps {
  sessionId: string;
  isDisplay?: boolean; // 진행자용 표시 모드
  demoData?: VoteStats[]; // 데모 데이터
}

export default function EmojiVote({ sessionId, isDisplay = false, demoData }: EmojiVoteProps) {
  const [selected, setSelected] = useState<Emoji | null>(null);
  const [stats, setStats] = useState<VoteStats[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  const voterIdRef = useRef<string | null>(null);
  const supabase = getSupabase();

  // 데모 모드일 경우 demoData 사용
  useEffect(() => {
    if (demoData) {
      setStats(demoData);
      setTotalVotes(demoData.reduce((sum, s) => sum + s.count, 0));
      return;
    }
  }, [demoData]);

  // 초기 데이터 로드 및 Polling
  useEffect(() => {
    if (demoData) return; // 데모 모드면 실제 데이터 로드 스킵

    // 클라이언트에서만 voter_id 생성
    if (!isDisplay) {
      voterIdRef.current = getVoterId();
    }

    loadStats();
    loadMyVote();

    // Polling: 진행자 2초, 학생 3초
    const pollInterval = setInterval(() => {
      loadStats();
    }, isDisplay ? 2000 : 3000);

    return () => {
      clearInterval(pollInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isDisplay, demoData]);

  const loadStats = async () => {
    if (demoData) return;

    const { data } = await supabase
      .from('condition_votes')
      .select('emoji')
      .eq('session_id', sessionId);

    if (data) {
      const counts = EMOJIS.map((emoji) => ({
        emoji,
        count: data.filter((v: { emoji: string }) => v.emoji === emoji).length,
        percentage: data.length > 0
          ? Math.round((data.filter((v: { emoji: string }) => v.emoji === emoji).length / data.length) * 100)
          : 0,
      }));
      setStats(counts);
      setTotalVotes(data.length);
    }
  };

  const loadMyVote = async () => {
    if (isDisplay || !voterIdRef.current) return;

    // DB에서 내 투표 확인
    const { data } = await supabase
      .from('condition_votes')
      .select('emoji')
      .eq('session_id', sessionId)
      .eq('voter_id', voterIdRef.current)
      .single();

    if (data?.emoji) {
      setSelected(data.emoji as Emoji);
    }
  };

  const handleVote = async (emoji: Emoji) => {
    if (isDisplay || isVoting || !voterIdRef.current) return;
    if (selected === emoji) return; // 같은 이모지 다시 클릭 방지

    setIsVoting(true);
    const previousSelection = selected;
    setSelected(emoji);

    try {
      // upsert: voter_id가 있으면 업데이트, 없으면 삽입
      const { error } = await supabase.from('condition_votes').upsert(
        {
          session_id: sessionId,
          voter_id: voterIdRef.current,
          emoji,
        },
        {
          onConflict: 'session_id,voter_id',
        }
      );

      if (error) throw error;

      // 투표 성공 후 즉시 통계 새로고침
      await loadStats();
    } catch {
      // 오류 시 이전 선택으로 복원
      setSelected(previousSelection);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 제목 */}
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl md:text-3xl font-bold text-center mb-8"
      >
        지금 컨디션은 어떠신가요?
      </motion.h2>

      {/* 이모지 버튼들 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {EMOJIS.map((emoji, index) => (
          <motion.button
            key={emoji}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleVote(emoji)}
            disabled={isDisplay || isVoting}
            className={`emoji-btn flex flex-col items-center gap-2 ${
              selected === emoji ? 'selected' : ''
            } ${isVoting ? 'opacity-70' : ''}`}
          >
            <span className="text-4xl md:text-5xl">{emoji}</span>
            <span className="text-sm text-[var(--muted)]">{EMOJI_LABELS[emoji]}</span>
          </motion.button>
        ))}
      </div>

      {/* 투표 결과 (항상 표시 또는 투표 후 표시) */}
      <AnimatePresence>
        {(isDisplay || selected) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <p className="text-center text-[var(--muted)]">
              총 <span className="text-[var(--accent)] font-bold">{totalVotes}</span>명 참여
            </p>

            {stats.map((stat) => (
              <div key={stat.emoji} className="flex items-center gap-4">
                <span className="text-2xl w-10">{stat.emoji}</span>
                <div className="flex-1 h-8 bg-[var(--card)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full"
                  />
                </div>
                <span className="w-16 text-right font-bold">
                  {stat.percentage}%
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
