'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Lightbulb } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';

interface ProblemKeywordProps {
  sessionId: string;
  isDisplay?: boolean;
}

interface KeywordData {
  keyword: string;
  count: number;
}

export default function ProblemKeyword({ sessionId, isDisplay = false }: ProblemKeywordProps) {
  const [keyword, setKeyword] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [showInsight, setShowInsight] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    loadKeywords();
    checkIfSubmitted();

    // Polling: 진행자 2초, 학생 3초
    const pollInterval = setInterval(() => {
      loadKeywords();
    }, isDisplay ? 2000 : 3000);

    return () => {
      clearInterval(pollInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isDisplay]);

  const loadKeywords = async () => {
    const { data } = await supabase
      .from('problem_keywords')
      .select('keyword')
      .eq('session_id', sessionId);

    if (data) {
      // 키워드별 카운트 계산
      const keywordMap = new Map<string, number>();
      data.forEach((item: { keyword: string }) => {
        const k = item.keyword.toLowerCase().trim();
        keywordMap.set(k, (keywordMap.get(k) || 0) + 1);
      });

      // 정렬 및 상위 15개
      const sorted = Array.from(keywordMap.entries())
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      setKeywords(sorted);
      setTotalCount(data.length);
    }
  };

  const checkIfSubmitted = () => {
    const submitted = localStorage.getItem(`submitted_keyword_${sessionId}`);
    if (submitted) {
      setHasSubmitted(true);
      setTimeout(() => setShowInsight(true), 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || isSubmitting || hasSubmitted || isDisplay) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('problem_keywords').insert({
        session_id: sessionId,
        keyword: keyword.trim(),
      });

      if (!error) {
        // 성공 시 즉시 키워드 새로고침
        await loadKeywords();
      }

      setHasSubmitted(true);
      localStorage.setItem(`submitted_keyword_${sessionId}`, 'true');
      setKeyword('');
      setTimeout(() => setShowInsight(true), 500);
    } catch (error) {
      console.error('키워드 전송 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 키워드 크기 계산 (빈도에 따라)
  const getKeywordSize = (count: number): string => {
    const maxCount = keywords[0]?.count || 1;
    const ratio = count / maxCount;
    if (ratio >= 0.8) return 'text-3xl md:text-4xl';
    if (ratio >= 0.5) return 'text-2xl md:text-3xl';
    if (ratio >= 0.3) return 'text-xl md:text-2xl';
    return 'text-lg md:text-xl';
  };

  // 랜덤 색상
  const getKeywordColor = (index: number): string => {
    const colors = [
      'text-indigo-400',
      'text-amber-400',
      'text-emerald-400',
      'text-rose-400',
      'text-cyan-400',
      'text-purple-400',
      'text-pink-400',
      'text-orange-400',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 질문 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="text-5xl mb-4"
        >
          💡
        </motion.div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          최종 프로젝트에서 발생한
        </h2>
        <p className="text-2xl md:text-3xl font-bold gradient-text">
          나의 고민을 하나만 적어주세요
        </p>
        <p className="text-[var(--muted)] mt-4">
          예: 기술 활용, 역할 분담, 의견 충돌, 시간 부족,  방향성...
        </p>
      </motion.div>

      {/* 입력 폼 */}
      {!hasSubmitted && !isDisplay && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="card space-y-4 mb-8"
        >
          <div className="relative">
            <Lightbulb
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="키워드를 입력하세요"
              maxLength={20}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-4 pl-12 pr-4 text-lg focus:outline-none focus:border-[var(--primary)] transition-colors text-center"
            />
          </div>
          <motion.button
            type="submit"
            disabled={!keyword.trim() || isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
            {isSubmitting ? '전송 중...' : '키워드 공유하기'}
          </motion.button>
        </motion.form>
      )}

      {/* 제출 완료 메시지 */}
      <AnimatePresence>
        {hasSubmitted && !isDisplay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card text-center py-6 mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-5xl mb-3"
            >
              💡
            </motion.div>
            <p className="text-lg font-semibold">키워드가 공유되었어요!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 워드 클라우드 */}
      <AnimatePresence>
        {(isDisplay || hasSubmitted || keywords.length > 0) && keywords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-center mb-6 text-[var(--muted)]">
              우리들의 고민들
            </h3>
            <div className="flex flex-wrap justify-center gap-4 min-h-[150px]">
              {keywords.map((item, index) => (
                <motion.span
                  key={item.keyword}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.1 }}
                  className={`${getKeywordSize(item.count)} ${getKeywordColor(index)} font-bold cursor-default transition-transform`}
                  title={`${item.count}명`}
                >
                  {item.keyword}
                </motion.span>
              ))}
            </div>
            <p className="text-center text-[var(--muted)] mt-6">
              총 <span className="text-[var(--accent)] font-bold">{totalCount}</span>개의 키워드
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 인사이트 메시지 */}
      <AnimatePresence>
        {showInsight && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 card text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <p className="text-xl md:text-2xl font-semibold mb-3">
                우리들의 고민들은 문제가 아니라
              </p>
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 }}
                className="text-2xl md:text-3xl font-bold gradient-text mb-6"
              >
                나의 서사를 쌓는 중요한 시간입니다
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
                className="text-xl md:text-2xl font-bold text-white"
              >
                이 경험이 &apos;왜 당신을 뽑아야 하나요?&apos;에 대한 근거이자 답입니다
              </motion.p>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
