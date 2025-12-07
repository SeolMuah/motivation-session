'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, ChevronDown } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';

interface TeamMessage {
  id: string;
  session_id: string;
  message: string;
  nickname: string;
  team_number?: number;
  created_at: string;
}

interface ConflictVoteDemoData {
  yesCount: number;
  noCount: number;
  messages: TeamMessage[];
}

interface ConflictVoteProps {
  sessionId: string;
  isDisplay?: boolean;
  nickname?: string;
  teamNumber?: number;
  demoData?: ConflictVoteDemoData; // 데모 데이터
}

const PASTEL_COLORS = [
  'pastel-pink',
  'pastel-blue',
  'pastel-green',
  'pastel-yellow',
  'pastel-purple',
  'pastel-orange',
];

const DECORATIONS = ['✨', '💫', '🌟', '💕', '🎈', '🌸', '🍀', '⭐'];

export default function ConflictVote({ sessionId, isDisplay = false, nickname = '', teamNumber, demoData }: ConflictVoteProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [yesCount, setYesCount] = useState(0);
  const [noCount, setNoCount] = useState(0);
  const [showMessage, setShowMessage] = useState(isDisplay || !!demoData); // 진행자는 항상 메시지 섹션 표시, 데모도 마찬가지
  const [teamMessage, setTeamMessage] = useState('');
  const [hasSubmittedMessage, setHasSubmittedMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  // 학생은 우리 조가 기본, 진행자는 전체가 기본
  const [selectedTeam, setSelectedTeam] = useState<number | 'all'>(
    !isDisplay && teamNumber ? teamNumber : 'all'
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const supabase = getSupabase();

  // 데모 모드일 경우 demoData 사용
  useEffect(() => {
    if (demoData) {
      setYesCount(demoData.yesCount);
      setNoCount(demoData.noCount);
      setMessages(demoData.messages);
      setHasVoted(true); // 데모에서는 이미 투표한 상태로 표시
      setShowMessage(true);
    }
  }, [demoData]);

  // 내 조의 메시지 개수
  const myTeamMessageCount = useMemo(() => {
    if (!teamNumber) return 0;
    return messages.filter((msg) => msg.team_number === teamNumber).length;
  }, [messages, teamNumber]);

  // 모든 조 목록 추출 (진행자용)
  const allTeams = useMemo(() => {
    const teams = new Set<number>();
    messages.forEach((msg) => {
      if (msg.team_number) {
        teams.add(msg.team_number);
      }
    });
    return Array.from(teams).sort((a, b) => a - b);
  }, [messages]);

  // 조별 메시지 개수 (진행자용)
  const teamMessageCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    messages.forEach((msg) => {
      if (msg.team_number) {
        counts[msg.team_number] = (counts[msg.team_number] || 0) + 1;
      }
    });
    return counts;
  }, [messages]);

  // 선택된 조의 메시지
  const filteredMessages = useMemo(() => {
    if (selectedTeam === 'all') {
      return messages;
    }
    return messages.filter((msg) => msg.team_number === selectedTeam);
  }, [selectedTeam, messages]);

  // 스타일 헬퍼 함수
  const getRotation = (index: number) => ((index * 7) % 10) - 5;
  const getColor = (index: number) => PASTEL_COLORS[index % PASTEL_COLORS.length];
  const getDecoration = (index: number) => DECORATIONS[index % DECORATIONS.length];

  const totalVotes = yesCount + noCount;
  const yesPercentage = totalVotes > 0 ? Math.round((yesCount / totalVotes) * 100) : 0;

  useEffect(() => {
    if (demoData) return; // 데모 모드면 실제 데이터 로드 스킵

    loadStats();
    loadMessages();
    checkIfVoted();
    checkIfSubmittedMessage();

    // Polling: 진행자 2초, 학생 3초
    const pollInterval = setInterval(() => {
      loadStats();
      loadMessages();
    }, isDisplay ? 2000 : 3000);

    return () => {
      clearInterval(pollInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isDisplay, demoData]);

  const loadStats = async () => {
    if (demoData) return;

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
    if (demoData) return;

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
    if (!teamMessage.trim() || !nickname || isSubmitting || isDisplay) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('team_messages').insert({
        session_id: sessionId,
        message: teamMessage.trim(),
        nickname: nickname,
        team_number: teamNumber || null,
      });

      if (!error) {
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
                함께하는 소중한 팀원들에게 전하는 따뜻한 한마디
              </h3>
            </motion.div>

            {/* 입력 폼 - 학생용 (여러 번 전송 가능) */}
            {!isDisplay && nickname && (
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

            {/* 메시지 목록 */}
            {messages.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                {/* 진행자용 커스텀 드롭다운 필터 */}
                {isDisplay && (
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      {/* 드롭다운 버튼 - 학생 페이지 탭 스타일 */}
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-lg cursor-pointer"
                      >
                        <Users size={16} />
                        <span>
                          {selectedTeam === 'all' ? `전체 (${messages.length})` : `${selectedTeam}조 (${teamMessageCounts[selectedTeam] || 0})`}
                        </span>
                        <ChevronDown size={14} />
                      </button>

                      {/* 커스텀 드롭다운 메뉴 */}
                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-1 min-w-[160px] bg-[var(--background)] rounded-2xl shadow-lg border border-[var(--border)] overflow-hidden z-50"
                          >
                            <div className="max-h-64 overflow-y-auto py-2">
                              {/* 전체 옵션 */}
                              <button
                                onClick={() => {
                                  setSelectedTeam('all');
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-[var(--card-hover)] transition-colors ${
                                  selectedTeam === 'all' ? 'bg-[var(--primary)]/10' : ''
                                }`}
                              >
                                <span className={`font-medium ${selectedTeam === 'all' ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>
                                  전체
                                </span>
                                <span className={`text-sm ${selectedTeam === 'all' ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`}>
                                  {messages.length}명
                                </span>
                              </button>

                              {/* 구분선 */}
                              {allTeams.length > 0 && (
                                <div className="my-1 mx-3 border-t border-[var(--border)]" />
                              )}

                              {/* 조별 옵션 */}
                              {allTeams.map((team) => (
                                <button
                                  key={team}
                                  onClick={() => {
                                    setSelectedTeam(team);
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-[var(--card-hover)] transition-colors ${
                                    selectedTeam === team ? 'bg-[var(--primary)]/10' : ''
                                  }`}
                                >
                                  <span className={`font-medium ${selectedTeam === team ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>
                                    {team}조
                                  </span>
                                  <span className={`text-sm ${selectedTeam === team ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`}>
                                    {teamMessageCounts[team] || 0}명
                                  </span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* 드롭다운 외부 클릭시 닫기 */}
                      {isDropdownOpen && (
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsDropdownOpen(false)}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* 참가자용 탭 필터 - 전체와 내 조만 표시 */}
                {!isDisplay && teamNumber && (
                  <div className="flex justify-center gap-2 mb-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedTeam('all')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                        selectedTeam === 'all'
                          ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-lg'
                          : 'bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--card-hover)]'
                      }`}
                    >
                      <Users size={14} />
                      전체 ({messages.length})
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedTeam(teamNumber)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedTeam === teamNumber
                          ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-lg'
                          : 'bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--card-hover)]'
                      }`}
                    >
                      우리 조 ({myTeamMessageCount})
                    </motion.button>
                  </div>
                )}

                {/* 포스트잇 스타일 메시지 그리드 */}
                <div className="w-full rounded-2xl bg-[var(--card)] p-4 md:p-6">
                  <div className={`grid gap-3 md:gap-4 ${
                    isDisplay
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  }`}>
                    <AnimatePresence mode="popLayout">
                      {filteredMessages.map((msg, index) => (
                        <motion.div
                          key={msg.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            rotate: getRotation(index),
                          }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                            delay: Math.min(index * 0.03, 0.3),
                          }}
                          whileHover={{
                            scale: 1.05,
                            rotate: 0,
                            zIndex: 10,
                            transition: { duration: 0.2 },
                          }}
                          className={`relative ${getColor(index)} rounded-2xl shadow-md cursor-pointer break-inside-avoid ${
                            isDisplay ? 'p-5 md:p-6' : 'p-4'
                          }`}
                        >
                          {/* 장식 */}
                          <span className={`absolute -top-2 -right-2 drop-shadow-sm ${isDisplay ? 'text-xl' : 'text-lg'}`}>
                            {getDecoration(index)}
                          </span>

                          {/* 조 표시 배지 */}
                          {msg.team_number && (
                            <span className={`absolute -top-2 -left-2 bg-white/80 font-bold rounded-full shadow-sm ${
                              isDisplay ? 'text-sm px-2.5 py-1' : 'text-xs px-2 py-0.5'
                            }`}>
                              {msg.team_number}조
                            </span>
                          )}

                          {/* 메시지 */}
                          <p className={`font-medium leading-relaxed mt-1 ${
                            isDisplay ? 'text-base md:text-lg' : 'text-sm'
                          }`}>{msg.message}</p>

                          {/* 닉네임 */}
                          <p className={`opacity-60 font-medium ${
                            isDisplay ? 'text-sm mt-4' : 'text-xs mt-3'
                          }`}>- {msg.nickname}</p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
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
