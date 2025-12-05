'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';

interface ConflictVoteProps {
  sessionId: string;
  isDisplay?: boolean;
  nickname?: string;
  teamNumber?: number;
}

interface TeamMessage {
  id: string;
  session_id: string;
  message: string;
  nickname: string;
  created_at: string;
}

export default function ConflictVote({ sessionId, isDisplay = false, nickname = '', teamNumber }: ConflictVoteProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [yesCount, setYesCount] = useState(0);
  const [noCount, setNoCount] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [teamMessage, setTeamMessage] = useState('');
  const [hasSubmittedMessage, setHasSubmittedMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const supabase = getSupabase();

  const totalVotes = yesCount + noCount;
  const yesPercentage = totalVotes > 0 ? Math.round((yesCount / totalVotes) * 100) : 0;

  useEffect(() => {
    loadStats();
    loadMessages();
    checkIfVoted();
    checkIfSubmittedMessage();

    const channel = supabase
      .channel(`conflict_votes_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conflict_votes',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          loadStats();
        }
      )
      .subscribe();

    const messageChannel = supabase
      .channel(`team_messages_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    // 진행자 페이지에서는 추가로 polling (2초마다)
    let pollInterval: NodeJS.Timeout | null = null;
    if (isDisplay) {
      pollInterval = setInterval(() => {
        loadStats();
        loadMessages();
      }, 2000);
    }

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(messageChannel);
      if (pollInterval) clearInterval(pollInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isDisplay]);

  const loadStats = async () => {
    const { data } = await supabase
      .from('conflict_votes')
      .select('has_conflict')
      .eq('session_id', sessionId);

    if (data) {
      setYesCount(data.filter((v: { has_conflict: boolean }) => v.has_conflict).length);
      setNoCount(data.filter((v: { has_conflict: boolean }) => !v.has_conflict).length);
    }
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from('team_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (data) {
      setMessages(data);
    }
  };

  const checkIfVoted = () => {
    const voted = localStorage.getItem(`voted_conflict_${sessionId}`);
    if (voted) {
      setHasVoted(true);
      setShowMessage(true);
    }
  };

  const checkIfSubmittedMessage = () => {
    const submitted = localStorage.getItem(`submitted_team_message_${sessionId}`);
    if (submitted) {
      setHasSubmittedMessage(true);
    }
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamMessage.trim() || !nickname || isSubmitting || hasSubmittedMessage || isDisplay) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('team_messages').insert({
        session_id: sessionId,
        message: teamMessage.trim(),
        nickname: nickname,
        team_number: teamNumber || null,
      });

      if (!error) {
        setHasSubmittedMessage(true);
        localStorage.setItem(`submitted_team_message_${sessionId}`, 'true');
        setTeamMessage('');
        await loadMessages();
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (hasConflict: boolean) => {
    if (hasVoted || isDisplay) return;

    setHasVoted(true);
    localStorage.setItem(`voted_conflict_${sessionId}`, 'true');

    const { error } = await supabase.from('conflict_votes').insert({
      session_id: sessionId,
      has_conflict: hasConflict,
    });

    if (!error) {
      // 투표 성공 후 즉시 통계 새로고침
      await loadStats();
    }

    setTimeout(() => setShowMessage(true), 500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 질문 */}
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl md:text-3xl font-bold text-center mb-4"
      >
        팀에서 갈등을 경험해본 적 있나요?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center text-[var(--muted)] mb-8"
      >
        솔직하게 답해주세요 ✋
      </motion.p>

      {/* 투표 버튼 */}
      {!showMessage && (
        <div className="flex justify-center gap-6 mb-8">
          <motion.button
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleVote(true)}
            disabled={hasVoted || isDisplay}
            className="flex-1 max-w-[200px] py-8 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-white font-bold text-xl shadow-lg disabled:opacity-50"
          >
            <span className="text-4xl block mb-2">✋</span>
            있어요
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleVote(false)}
            disabled={hasVoted || isDisplay}
            className="flex-1 max-w-[200px] py-8 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-xl shadow-lg disabled:opacity-50"
          >
            <span className="text-4xl block mb-2">😌</span>
            없어요
          </motion.button>
        </div>
      )}

      {/* 결과 */}
      <AnimatePresence>
        {(isDisplay || hasVoted) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* 같은 행에 왼쪽/오른쪽 막대 */}
            <div className="flex items-center gap-2">
              {/* 왼쪽: 있어요 */}
              <div className="flex items-center gap-2 flex-1">
                <span className="text-2xl shrink-0">✋</span>
                <div className="flex-1 h-12 flex justify-end">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${yesPercentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-l from-rose-500 to-pink-500 rounded-l-full flex items-center justify-start pl-3 min-w-[50px]"
                  >
                    <span className="text-white font-bold text-sm">{yesPercentage}%</span>
                  </motion.div>
                </div>
              </div>

              {/* 구분선 */}
              <div className="w-1 h-12 bg-[var(--border)] rounded-full shrink-0" />

              {/* 오른쪽: 없어요 */}
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1 h-12 flex justify-start">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - yesPercentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-r-full flex items-center justify-end pr-3 min-w-[50px]"
                  >
                    <span className="text-white font-bold text-sm">{100 - yesPercentage}%</span>
                  </motion.div>
                </div>
                <span className="text-2xl shrink-0">😌</span>
              </div>
            </div>

            <p className="text-center text-[var(--muted)] mt-4">
              총 <span className="text-[var(--accent)] font-bold">{totalVotes}</span>명 참여
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 팀에게 한마디 섹션 */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            {/* 제목 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <span className="text-4xl mb-2 block">💌</span>
              <h3 className="text-xl md:text-2xl font-bold gradient-text">
                함께하는 소중한 팀원에게 전하는 따뜻한 한마디
              </h3>
            </motion.div>

            {/* 입력 폼 - 학생용 */}
            {!hasSubmittedMessage && !isDisplay && nickname && (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onSubmit={handleSubmitMessage}
                className="card space-y-4 mb-6"
              >
                <p className="text-center text-[var(--muted)] text-sm">
                  <span className="text-[var(--accent)] font-semibold">{nickname}</span>님의 메시지
                </p>
                <textarea
                  value={teamMessage}
                  onChange={(e) => setTeamMessage(e.target.value)}
                  placeholder="팀원에게 전하고 싶은 한마디를 적어주세요..."
                  maxLength={100}
                  rows={3}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
                />
                <motion.button
                  type="submit"
                  disabled={!teamMessage.trim() || isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                  {isSubmitting ? '전송 중...' : '메시지 보내기'}
                </motion.button>
              </motion.form>
            )}

            {/* 제출 완료 메시지 */}
            {hasSubmittedMessage && !isDisplay && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card text-center py-4 mb-6"
              >
                <span className="text-3xl mb-2 block">💕</span>
                <p className="font-semibold">따뜻한 메시지가 전달되었어요!</p>
              </motion.div>
            )}

            {/* 메시지 목록 */}
            {messages.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <p className="text-center text-[var(--muted)] text-sm mb-4">
                  총 <span className="text-[var(--accent)] font-bold">{messages.length}</span>개의 메시지
                </p>
                <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="card bg-gradient-to-br from-[var(--card)] to-[var(--card-hover)] p-4"
                    >
                      <p className="text-base mb-2">&ldquo;{msg.message}&rdquo;</p>
                      <p className="text-sm text-[var(--muted)] text-right">- {msg.nickname}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 메시지가 없을 때 */}
            {messages.length === 0 && (isDisplay || hasSubmittedMessage) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-[var(--muted)]"
              >
                <span className="text-4xl block mb-2">💭</span>
                <p>아직 메시지가 없어요</p>
                <p className="text-sm">첫 번째 메시지를 남겨보세요!</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
