'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronDown } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';
import type { FirstMeMessage, ProudMoment } from '@/lib/types';

const PASTEL_COLORS = [
  'pastel-pink',
  'pastel-blue',
  'pastel-green',
  'pastel-yellow',
  'pastel-purple',
  'pastel-orange',
];

const DECORATIONS = ['✨', '💫', '🌟', '💕', '🎈', '🌸', '🍀', '⭐'];

interface FloatingMessagesProps {
  sessionId: string;
  table: 'first_me_messages' | 'proud_moments';
  title?: string;
  isDisplay?: boolean;
  myTeamNumber?: number;
  demoData?: Message[]; // 데모 데이터
}

type Message = FirstMeMessage | ProudMoment;

export default function FloatingMessages({
  sessionId,
  table,
  title = '여러분의 메시지',
  isDisplay = false,
  myTeamNumber,
  demoData,
}: FloatingMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | 'all'>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const supabase = getSupabase();

  // 데모 모드일 경우 demoData 사용
  useEffect(() => {
    if (demoData) {
      setMessages(demoData);
    }
  }, [demoData]);

  // 내 조의 메시지 개수
  const myTeamMessageCount = useMemo(() => {
    if (!myTeamNumber) return 0;
    return messages.filter((msg) => msg.team_number === myTeamNumber).length;
  }, [messages, myTeamNumber]);

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

  // Load messages function
  const loadMessages = useCallback(async () => {
    if (demoData) return; // 데모 모드면 실제 데이터 로드 스킵

    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('메시지 로드 실패:', error);
        return;
      }

      if (data) {
        setMessages(data);
      }
    } catch (err) {
      console.error('메시지 로드 중 오류:', err);
    }
  }, [supabase, table, sessionId, demoData]);

  // Polling으로 데이터 로드
  useEffect(() => {
    if (demoData) return; // 데모 모드면 폴링 스킵

    loadMessages();

    // Polling: 진행자 2초, 학생 3초
    const pollInterval = setInterval(() => {
      loadMessages();
    }, isDisplay ? 2000 : 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [sessionId, table, isDisplay, loadMessages, demoData]);

  // Styling helpers with stable values
  const getRotation = (index: number) => ((index * 7) % 10) - 5;
  const getColor = (index: number) => PASTEL_COLORS[index % PASTEL_COLORS.length];
  const getDecoration = (index: number) => DECORATIONS[index % DECORATIONS.length];

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-4 mb-6">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-3xl font-bold text-center"
        >
          {title}
          <span className="ml-2 text-[var(--accent)]">{messages.length}</span>
        </motion.h2>
      </div>

      {/* 진행자용 커스텀 드롭다운 필터 */}
      {messages.length > 0 && isDisplay && (
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
      {messages.length > 0 && !isDisplay && myTeamNumber && (
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
            onClick={() => setSelectedTeam(myTeamNumber)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedTeam === myTeamNumber
                ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-lg'
                : 'bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--card-hover)]'
            }`}
          >
            우리 조 ({myTeamMessageCount})
          </motion.button>
        </div>
      )}

      {/* 메시지 그리드 영역 - Masonry 스타일 */}
      <div className="w-full rounded-2xl bg-[var(--card)] p-4 md:p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--muted)]">
            <span className="text-6xl mb-4">💭</span>
            <p>아직 메시지가 없어요</p>
            <p className="text-sm">첫 번째 메시지를 남겨보세요!</p>
          </div>
        ) : (
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
                    transition: { duration: 0.2 }
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
        )}
      </div>
    </div>
  );
}
