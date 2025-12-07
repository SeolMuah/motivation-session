'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Lightbulb, Trophy, Link2, Check, Users } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';
import type { Session, FirstMeMessage, ProudMoment, ProblemKeyword } from '@/lib/types';

interface TeamMessage {
  id: string;
  session_id: string;
  message: string;
  nickname: string;
  team_number?: number;
  created_at: string;
}

export default function MyRecapPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // 사용자 정보
  const [userName, setUserName] = useState('');
  const [teamNumber, setTeamNumber] = useState<number | null>(null);

  // 데이터
  const [firstMeMessages, setFirstMeMessages] = useState<FirstMeMessage[]>([]);
  const [proudMoments, setProudMoments] = useState<ProudMoment[]>([]);
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);
  const [problemKeywords, setProblemKeywords] = useState<ProblemKeyword[]>([]);

  const supabase = getSupabase();

  useEffect(() => {
    // URL 파라미터에서 사용자 정보 확인 (공유 링크로 접근한 경우)
    const urlName = searchParams.get('name');
    const urlTeam = searchParams.get('team');

    if (urlName && urlTeam) {
      // URL 파라미터가 있으면 그것을 사용 (공유 링크)
      setUserName(decodeURIComponent(urlName));
      setTeamNumber(parseInt(urlTeam));
      loadSession();
      loadAllData();
      return;
    }

    // URL 파라미터가 없으면 localStorage에서 확인
    const savedUserName = localStorage.getItem(`userName-${sessionId}`);
    const savedTeam = localStorage.getItem(`team-${sessionId}`);

    if (!savedUserName || !savedTeam) {
      // 사용자 정보가 없으면 세션 페이지로 리다이렉트
      router.push(`/session/${sessionId}`);
      return;
    }

    setUserName(savedUserName);
    setTeamNumber(parseInt(savedTeam));

    loadSession();
    loadAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, searchParams]);

  const loadSession = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (data) {
      setSession(data);
    }
  };

  const loadAllData = async () => {
    // 모든 데이터 병렬 로드
    const [firstMeRes, proudRes, teamMsgRes, keywordRes] = await Promise.all([
      supabase
        .from('first_me_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false }),
      supabase
        .from('proud_moments')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false }),
      supabase
        .from('team_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false }),
      supabase
        .from('problem_keywords')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false }),
    ]);

    if (firstMeRes.data) setFirstMeMessages(firstMeRes.data);
    if (proudRes.data) setProudMoments(proudRes.data);
    if (teamMsgRes.data) setTeamMessages(teamMsgRes.data);
    if (keywordRes.data) setProblemKeywords(keywordRes.data);
  };

  // 닉네임 (DB에는 이름만 저장됨)
  // first_me_messages, proud_moments는 nickname=이름만, team_number로 동명이인 구분
  // team_messages는 nickname="${teamNumber}조 ${userName}" 형식
  const myNicknameForMessages = userName; // first_me_messages, proud_moments용
  const myNicknameForTeamMsg = `${teamNumber}조 ${userName}`; // team_messages용

  // 내 메시지인지 확인 (이름 + 조번호로 동명이인 구분)
  const isMyMessage = (msg: { nickname: string; team_number?: number }) => {
    return msg.nickname === myNicknameForMessages && msg.team_number === teamNumber;
  };

  // 필터링된 데이터: 처음의 나에게 - 내 기록만
  const filteredFirstMe = useMemo(() => {
    return firstMeMessages.filter((msg) => isMyMessage(msg));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstMeMessages, myNicknameForMessages, teamNumber]);

  // 뿌듯한 순간 - 내 기록만
  const filteredProud = useMemo(() => {
    return proudMoments.filter((msg) => isMyMessage(msg));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proudMoments, myNicknameForMessages, teamNumber]);

  // 협업 이야기 - 우리 조 기록
  const filteredTeamMsg = useMemo(() => {
    return teamMessages.filter((msg) => msg.team_number === teamNumber);
  }, [teamMessages, teamNumber]);

  // 고민 키워드는 전체 표시
  const totalKeywordCount = problemKeywords.length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 내 회고 페이지 고유 URL 생성 및 복사
  const copyMyRecapUrl = () => {
    if (typeof window === 'undefined') return;

    const baseUrl = window.location.origin;
    const encodedName = encodeURIComponent(userName);
    const myRecapUrl = `${baseUrl}/session/${sessionId}/my-recap?name=${encodedName}&team=${teamNumber}`;

    navigator.clipboard.writeText(myRecapUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (!session) {
    return (
      <main className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-pulse text-xl">로딩 중...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen gradient-bg pb-24">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[var(--muted)] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            돌아가기
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="gradient-text">나의 기록</span> 돌아보기
              </h1>
              <p className="text-[var(--muted)]">
                {session.name} · {userName} ({teamNumber}조)
              </p>
            </div>

            {/* 내 페이지 링크 복사 버튼 */}
            <motion.button
              onClick={copyMyRecapUrl}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                isCopied
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--muted)] hover:text-white'
              }`}
            >
              {isCopied ? (
                <>
                  <Check size={18} />
                  <span className="hidden sm:inline">복사됨!</span>
                </>
              ) : (
                <>
                  <Link2 size={18} />
                  <span className="hidden sm:inline">내 링크 복사</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* 처음의 나에게 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageCircle size={24} className="text-[var(--primary)]" />
            처음의 나에게
            <span className="text-sm font-normal text-[var(--muted)]">
              (내 기록 {filteredFirstMe.length}개)
            </span>
          </h2>

          {filteredFirstMe.length === 0 ? (
            <div className="card text-center py-8 text-[var(--muted)]">
              작성한 메시지가 없어요
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredFirstMe.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-2xl p-5 ${
                    ['pastel-pink', 'pastel-blue', 'pastel-purple'][index % 3]
                  }`}
                >
                  <p className="text-lg font-medium">{msg.message}</p>
                  <p className="text-sm opacity-60 mt-3">
                    {formatDate(msg.created_at)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* 협업 이야기 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users size={24} className="text-emerald-400" />
            협업 이야기
            <span className="text-sm font-normal text-[var(--muted)]">
              ({teamNumber}조 기록 {filteredTeamMsg.length}개)
            </span>
          </h2>

          {filteredTeamMsg.length === 0 ? (
            <div className="card text-center py-8 text-[var(--muted)]">
              우리 조의 메시지가 없어요
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTeamMsg.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-2xl p-5 ${
                    ['pastel-green', 'pastel-blue', 'pastel-yellow', 'pastel-purple'][index % 4]
                  } ${msg.nickname === myNicknameForTeamMsg ? 'ring-2 ring-white/30' : ''}`}
                >
                  <p className="text-lg font-medium">{msg.message}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className={`text-sm font-medium ${
                      msg.nickname === myNicknameForTeamMsg ? 'opacity-80' : 'opacity-60'
                    }`}>
                      {msg.nickname === myNicknameForTeamMsg ? '✨ 나' : msg.nickname}
                    </span>
                    <span className="text-sm opacity-60">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* 뿌듯한 순간 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy size={24} className="text-[var(--accent)]" />
            뿌듯한 순간
            <span className="text-sm font-normal text-[var(--muted)]">
              (내 기록 {filteredProud.length}개)
            </span>
          </h2>

          {filteredProud.length === 0 ? (
            <div className="card text-center py-8 text-[var(--muted)]">
              작성한 메시지가 없어요
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProud.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-2xl p-5 ${
                    ['pastel-orange', 'pastel-pink', 'pastel-yellow', 'pastel-green', 'pastel-purple', 'pastel-blue'][index % 6]
                  }`}
                >
                  <p className="text-lg font-medium">{msg.message}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm font-medium opacity-60">
                      {formatDate(msg.created_at)}
                    </span>
                    {msg.hearts > 0 && (
                      <span className="text-sm">
                        ❤️ {msg.hearts}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* 고민 키워드 (전체만 표시) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lightbulb size={24} className="text-amber-400" />
            우리들의 고민 키워드
            <span className="text-sm font-normal text-[var(--muted)]">
              (총 {totalKeywordCount}개)
            </span>
          </h2>

          <div className="card">
            <p className="text-sm text-[var(--muted)] mb-4">
              키워드는 익명으로 수집되어 전체 키워드만 표시됩니다.
            </p>
            <div className="flex flex-wrap gap-2">
              {problemKeywords.slice(0, 30).map((kw, index) => (
                <motion.span
                  key={kw.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-sm"
                >
                  {kw.keyword}
                </motion.span>
              ))}
              {problemKeywords.length > 30 && (
                <span className="px-3 py-1.5 rounded-full bg-[var(--card-hover)] text-[var(--muted)] text-sm">
                  +{problemKeywords.length - 30}개 더
                </span>
              )}
            </div>
          </div>
        </motion.section>

        {/* 마무리 메시지 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center space-y-6"
        >
          <div className="card bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent)]/10">
            <p className="text-2xl md:text-4xl font-bold">
              최종 프로젝트 끝까지 화이팅! 💪
            </p>
          </div>

          {/* 링크 저장 안내 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="card border-dashed border-2 border-[var(--border)]"
          >
            <div className="flex flex-col items-center gap-3">
              <Link2 size={24} className="text-[var(--primary)]" />
              <p className="text-[var(--muted)]">
                이 페이지를 나중에 다시 보고 싶다면
              </p>
              <motion.button
                onClick={copyMyRecapUrl}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  isCopied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[var(--primary)] text-white hover:opacity-90'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check size={20} />
                    링크가 복사되었어요!
                  </>
                ) : (
                  <>
                    <Link2 size={20} />
                    내 회고 링크 복사하기
                  </>
                )}
              </motion.button>
              <p className="text-sm text-[var(--muted)]">
                복사한 링크를 저장해두면 언제든 다시 볼 수 있어요
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
