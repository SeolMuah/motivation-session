'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, MessageSquare, Heart, Sparkles, Hash } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';
import type { Session, ConditionVote, FirstMeMessage, ConflictVote, ProudMoment, ProblemKeyword, TeamMessage } from '@/lib/types';

export default function RecapPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [conditionVotes, setConditionVotes] = useState<ConditionVote[]>([]);
  const [firstMeMessages, setFirstMeMessages] = useState<FirstMeMessage[]>([]);
  const [conflictVotes, setConflictVotes] = useState<ConflictVote[]>([]);
  const [proudMoments, setProudMoments] = useState<ProudMoment[]>([]);
  const [problemKeywords, setProblemKeywords] = useState<ProblemKeyword[]>([]);
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);
  const [cheerCount, setCheerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabase();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadAllData();
  }, [sessionId]);

  const loadAllData = async () => {
    // 세션 정보
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionData) setSession(sessionData);

    // 컨디션 투표
    const { data: votes } = await supabase
      .from('condition_votes')
      .select('*')
      .eq('session_id', sessionId);
    if (votes) setConditionVotes(votes);

    // 처음의 나에게 메시지
    const { data: messages } = await supabase
      .from('first_me_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    if (messages) setFirstMeMessages(messages);

    // 갈등 투표
    const { data: conflicts } = await supabase
      .from('conflict_votes')
      .select('*')
      .eq('session_id', sessionId);
    if (conflicts) setConflictVotes(conflicts);

    // 뿌듯할 순간
    const { data: proud } = await supabase
      .from('proud_moments')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    if (proud) setProudMoments(proud);

    // 키워드
    const { data: keywords } = await supabase
      .from('problem_keywords')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    if (keywords) setProblemKeywords(keywords);

    // 팀원 메시지
    const { data: teamMsgs } = await supabase
      .from('team_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    if (teamMsgs) setTeamMessages(teamMsgs);

    // 화이팅 수
    const { count } = await supabase
      .from('cheers')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);
    if (count !== null) setCheerCount(count);

    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  // 통계 계산
  const emojiStats = ['😴', '😵', '🔥', '💪'].map((emoji) => ({
    emoji,
    count: conditionVotes.filter((v) => v.emoji === emoji).length,
  }));

  const conflictYes = conflictVotes.filter((v) => v.has_conflict).length;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const conflictNo = conflictVotes.filter((v) => !v.has_conflict).length;

  return (
    <main className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <a
            href="/"
            className="p-2 rounded-full bg-[var(--card)] hover:bg-[var(--card-hover)] transition-colors"
          >
            <ArrowLeft size={24} />
          </a>
          <div>
            <h1 className="text-3xl font-bold">{session.name}</h1>
            <p className="text-[var(--muted)]">{formatDate(session.created_at)}</p>
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center"
          >
            <Users className="mx-auto mb-2 text-[var(--primary)]" size={32} />
            <p className="text-3xl font-bold">{conditionVotes.length}</p>
            <p className="text-[var(--muted)]">참여자</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card text-center"
          >
            <MessageSquare className="mx-auto mb-2 text-[var(--accent)]" size={32} />
            <p className="text-3xl font-bold">{firstMeMessages.length + proudMoments.length}</p>
            <p className="text-[var(--muted)]">메시지</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card text-center"
          >
            <Hash className="mx-auto mb-2 text-blue-500" size={32} />
            <p className="text-3xl font-bold">{problemKeywords.length}</p>
            <p className="text-[var(--muted)]">키워드</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card text-center"
          >
            <Heart className="mx-auto mb-2 text-rose-500" size={32} />
            <p className="text-3xl font-bold">{cheerCount}</p>
            <p className="text-[var(--muted)]">화이팅</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card text-center"
          >
            <Sparkles className="mx-auto mb-2 text-emerald-500" size={32} />
            <p className="text-3xl font-bold">
              {conflictVotes.length > 0
                ? Math.round((conflictYes / conflictVotes.length) * 100)
                : 0}%
            </p>
            <p className="text-[var(--muted)]">갈등 경험</p>
          </motion.div>
        </div>

        {/* 컨디션 분포 */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">📊 컨디션 분포</h2>
          <div className="card">
            <div className="grid grid-cols-4 gap-4">
              {emojiStats.map((stat) => (
                <div key={stat.emoji} className="text-center">
                  <span className="text-4xl">{stat.emoji}</span>
                  <p className="text-2xl font-bold mt-2">{stat.count}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {conditionVotes.length > 0
                      ? Math.round((stat.count / conditionVotes.length) * 100)
                      : 0}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* 우리들의 고민 키워드 */}
        {problemKeywords.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-6">🎯 우리들의 고민 ({problemKeywords.length})</h2>
            <div className="card">
              <div className="flex flex-wrap gap-3 justify-center">
                {problemKeywords.map((keyword, index) => (
                  <motion.span
                    key={keyword.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-[var(--primary)]/20 to-[var(--accent)]/20 text-[var(--foreground)] font-medium border border-[var(--primary)]/30"
                  >
                    #{keyword.keyword}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* 처음의 나에게 메시지 */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">💌 처음의 나에게 ({firstMeMessages.length})</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {firstMeMessages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="message-card"
              >
                <p className="font-medium">{msg.message}</p>
                <p className="text-sm text-[var(--muted)] mt-2">- {msg.nickname}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 뿌듯할 순간 */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">🌟 뿌듯할 순간 ({proudMoments.length})</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proudMoments.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-2xl p-4 ${
                  ['pastel-pink', 'pastel-blue', 'pastel-green', 'pastel-yellow', 'pastel-purple', 'pastel-orange'][index % 6]
                }`}
              >
                <p className="font-medium">{msg.message}</p>
                <p className="text-sm opacity-70 mt-2">- {msg.nickname}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 팀원들에게 전하는 메시지 */}
        {teamMessages.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-6">💌 팀원들에게 ({teamMessages.length})</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMessages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-2xl p-4 ${
                    ['pastel-pink', 'pastel-blue', 'pastel-green', 'pastel-yellow', 'pastel-purple', 'pastel-orange'][index % 6]
                  }`}
                >
                  {msg.team_number && (
                    <span className="text-xs font-bold opacity-60 block mb-1">{msg.team_number}조</span>
                  )}
                  <p className="font-medium">{msg.message}</p>
                  <p className="text-sm opacity-70 mt-2">- {msg.nickname}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* 마무리 메시지 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center py-12"
        >
          <p className="text-3xl md:text-5xl font-bold gradient-text">
            모두 수고하셨습니다! 💪
          </p>
        </motion.div>
      </div>
    </main>
  );
}
