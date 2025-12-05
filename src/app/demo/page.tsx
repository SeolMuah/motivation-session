'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Users, ChevronDown, Monitor, Smartphone } from 'lucide-react';

// 샘플 데이터 생성
const SAMPLE_EMOJIS = ['😊', '😴', '😰', '🔥', '😐'];
const SAMPLE_KEYWORDS = [
  '역할분담', '시간부족', '의견충돌', '기술활용', '소통', '방향성',
  '일정관리', '코드리뷰', '디자인', 'API연동', '테스트', '배포',
  '문서화', '회의', '협업툴', '깃충돌', '버그수정', '성능최적화',
  '데이터베이스', '프론트엔드', '백엔드', '인증', 'UI/UX', '기획변경'
];
const SAMPLE_NAMES = [
  '김민수', '이서연', '박지훈', '최예린', '정우진',
  '강하늘', '윤서준', '임수빈', '조현우', '한지민',
  '송민재', '오세영', '신동욱', '류지원', '황다은',
  '전승호', '배수아', '고태현', '문채원', '안지호'
];
const SAMPLE_MESSAGES_FIRST_ME = [
  '처음의 나야, 포기하지 마!', '끝까지 해내자!', '할 수 있어!',
  '지금 이 순간이 성장이야', '힘들어도 버텨보자', '나를 믿어!',
  '이미 많이 왔어', '조금만 더 힘내자', '최선을 다하자',
  '실패해도 괜찮아', '경험이 재산이야', '함께라서 가능해',
  '두려워하지 마', '한 걸음씩 나아가자', '넌 충분히 잘하고 있어',
  '후회 없이 도전해', '배움에는 끝이 없어', '오늘의 노력이 내일의 실력'
];
const SAMPLE_MESSAGES_PROUD = [
  '팀원들과 완주했을 때', '버그를 해결했을 때', '발표를 마쳤을 때',
  '코드가 작동했을 때', '디자인이 완성됐을 때', '배포에 성공했을 때',
  '칭찬을 받았을 때', '성장을 느꼈을 때', '목표를 달성했을 때',
  '협업이 잘 됐을 때', '새로운 기술을 배웠을 때', '문제를 해결했을 때',
  '사용자 피드백이 좋을 때', '팀원이 고마워할 때', '완성된 결과물을 봤을 때'
];
const SAMPLE_CONFLICT_MESSAGES = [
  '서로 존중하면서 의견을 나눴어요', '결국 더 좋은 결과가 나왔어요',
  '소통의 중요성을 깨달았어요', '다양한 시각이 도움이 됐어요',
  '타협점을 찾는 법을 배웠어요', '갈등이 성장의 기회였어요',
  '대화로 해결할 수 있었어요', '서로의 입장을 이해하게 됐어요',
  '팀워크가 더 좋아졌어요', '의견 차이가 발전의 계기가 됐어요'
];

const PASTEL_COLORS = ['pastel-pink', 'pastel-blue', 'pastel-green', 'pastel-yellow', 'pastel-purple'];
const DECORATIONS = ['✨', '💫', '⭐', '🌟', '💕', '🎯', '🚀', '💪'];
const KEYWORD_COLORS = [
  'text-indigo-400', 'text-amber-400', 'text-emerald-400', 'text-rose-400',
  'text-cyan-400', 'text-purple-400', 'text-pink-400', 'text-orange-400'
];

// 20개 조, 각 조 5명씩 = 100명
const TOTAL_TEAMS = 20;
const MEMBERS_PER_TEAM = 5;

// 학생 목록 생성 (조별 5명)
const generateStudents = () => {
  const students: { name: string; team: number }[] = [];
  for (let team = 1; team <= TOTAL_TEAMS; team++) {
    for (let i = 0; i < MEMBERS_PER_TEAM; i++) {
      const nameIndex = ((team - 1) * MEMBERS_PER_TEAM + i) % SAMPLE_NAMES.length;
      students.push({
        name: SAMPLE_NAMES[nameIndex],
        team
      });
    }
  }
  return students;
};

const STUDENTS = generateStudents();

// 메시지 생성 (일부 학생은 여러 번 작성)
const generateMessages = (type: 'first-me' | 'proud' | 'conflict') => {
  const messages: {
    id: string;
    message: string;
    nickname: string;
    team_number: number;
    created_at: string;
  }[] = [];

  const sourceMessages = type === 'first-me' ? SAMPLE_MESSAGES_FIRST_ME :
                         type === 'proud' ? SAMPLE_MESSAGES_PROUD : SAMPLE_CONFLICT_MESSAGES;

  let msgId = 0;

  // 모든 학생이 1개씩 작성
  STUDENTS.forEach((student, index) => {
    messages.push({
      id: `msg-${msgId++}`,
      message: sourceMessages[index % sourceMessages.length],
      nickname: student.name,
      team_number: student.team,
      created_at: new Date(Date.now() - Math.random() * 3600000).toISOString()
    });
  });

  // 30% 학생은 추가로 1-2개 더 작성
  STUDENTS.filter(() => Math.random() < 0.3).forEach((student) => {
    const extraCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < extraCount; i++) {
      messages.push({
        id: `msg-${msgId++}`,
        message: sourceMessages[Math.floor(Math.random() * sourceMessages.length)],
        nickname: student.name,
        team_number: student.team,
        created_at: new Date(Date.now() - Math.random() * 3600000).toISOString()
      });
    }
  });

  return messages.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

// 키워드 생성 (중복 포함)
const generateKeywords = () => {
  const keywordCounts: Record<string, number> = {};

  // 각 학생이 1개씩 키워드 입력 (일부 중복)
  STUDENTS.forEach(() => {
    // 상위 키워드가 더 많이 선택되도록 가중치
    const weightedIndex = Math.floor(Math.pow(Math.random(), 1.5) * SAMPLE_KEYWORDS.length);
    const keyword = SAMPLE_KEYWORDS[weightedIndex];
    keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
  });

  return Object.entries(keywordCounts)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
};

// 이모지 통계 생성
const generateEmojiStats = () => {
  const stats: Record<string, number> = {};
  SAMPLE_EMOJIS.forEach(emoji => { stats[emoji] = 0; });

  STUDENTS.forEach(() => {
    const emoji = SAMPLE_EMOJIS[Math.floor(Math.random() * SAMPLE_EMOJIS.length)];
    stats[emoji]++;
  });

  return SAMPLE_EMOJIS.map(emoji => ({
    emoji,
    count: stats[emoji]
  }));
};

type DemoSection = 'emoji' | 'keywords' | 'first-me' | 'conflict' | 'proud' | 'cheer';
type ViewMode = 'display' | 'student';

export default function DemoPage() {
  const [activeSection, setActiveSection] = useState<DemoSection>('emoji');
  const [viewMode, setViewMode] = useState<ViewMode>('display');
  const [cheerCount, setCheerCount] = useState(127);
  const [selectedTeam, setSelectedTeam] = useState<number | 'all'>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 고정된 샘플 데이터 (useMemo로 리렌더링 방지)
  const emojiStats = useMemo(() => generateEmojiStats(), []);
  const totalEmojiVotes = emojiStats.reduce((sum, s) => sum + s.count, 0);
  const keywords = useMemo(() => generateKeywords(), []);
  const totalKeywords = keywords.reduce((sum, k) => sum + k.count, 0);
  const firstMeMessages = useMemo(() => generateMessages('first-me'), []);
  const proudMessages = useMemo(() => generateMessages('proud'), []);
  const conflictMessages = useMemo(() => generateMessages('conflict'), []);

  // 팀 목록
  const teams = useMemo(() => {
    const teamSet = new Set<number>();
    firstMeMessages.forEach(msg => teamSet.add(msg.team_number));
    return Array.from(teamSet).sort((a, b) => a - b);
  }, [firstMeMessages]);

  // 필터링된 메시지
  const filteredFirstMe = selectedTeam === 'all'
    ? firstMeMessages
    : firstMeMessages.filter(m => m.team_number === selectedTeam);
  const filteredProud = selectedTeam === 'all'
    ? proudMessages
    : proudMessages.filter(m => m.team_number === selectedTeam);

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366F1', '#F59E0B', '#EC4899', '#10B981', '#F43F5E']
    });
    setCheerCount(prev => prev + 1);
  };

  const getKeywordSize = (count: number): string => {
    const maxCount = keywords[0]?.count || 1;
    const ratio = count / maxCount;
    if (ratio >= 0.8) return 'text-3xl md:text-4xl';
    if (ratio >= 0.5) return 'text-2xl md:text-3xl';
    if (ratio >= 0.3) return 'text-xl md:text-2xl';
    return 'text-lg md:text-xl';
  };

  const sections: { id: DemoSection; label: string; count: number }[] = [
    { id: 'emoji', label: '컨디션', count: totalEmojiVotes },
    { id: 'keywords', label: '키워드', count: totalKeywords },
    { id: 'first-me', label: '처음의 나', count: firstMeMessages.length },
    { id: 'conflict', label: '협업', count: conflictMessages.length },
    { id: 'proud', label: '뿌듯', count: proudMessages.length },
    { id: 'cheer', label: '화이팅', count: cheerCount },
  ];

  const isDisplay = viewMode === 'display';

  return (
    <main className="min-h-screen gradient-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            🧪 데모 페이지
          </h1>
          <p className="text-[var(--muted)] mb-4">
            {TOTAL_TEAMS}개 조 × {MEMBERS_PER_TEAM}명 = {TOTAL_TEAMS * MEMBERS_PER_TEAM}명 샘플 데이터
          </p>

          {/* 뷰 모드 토글 */}
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => setViewMode('display')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                viewMode === 'display'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--card)] hover:bg-[var(--card-hover)]'
              }`}
            >
              <Monitor size={18} />
              진행자 화면
            </button>
            <button
              onClick={() => setViewMode('student')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                viewMode === 'student'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--card)] hover:bg-[var(--card-hover)]'
              }`}
            >
              <Smartphone size={18} />
              학생 화면
            </button>
          </div>
        </motion.div>

        {/* 섹션 선택 탭 */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-3 py-2 rounded-full text-sm transition-all ${
                activeSection === section.id
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--card)] hover:bg-[var(--card-hover)]'
              }`}
            >
              {section.label}
              <span className="ml-1 opacity-70">({section.count})</span>
            </button>
          ))}
        </div>

        {/* 조 필터 (메시지 섹션에서만) */}
        {(activeSection === 'first-me' || activeSection === 'proud') && (
          <div className="flex justify-center mb-6">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] rounded-xl hover:bg-[var(--card-hover)]"
              >
                <Users size={18} />
                {selectedTeam === 'all' ? '전체 조' : `${selectedTeam}조`}
                <ChevronDown size={18} />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 bg-[var(--card)] rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedTeam('all'); setIsDropdownOpen(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-[var(--card-hover)]"
                  >
                    전체 조
                  </button>
                  {teams.map(team => (
                    <button
                      key={team}
                      onClick={() => { setSelectedTeam(team); setIsDropdownOpen(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-[var(--card-hover)]"
                    >
                      {team}조
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 컨텐츠 영역 */}
        <div className={isDisplay ? '' : 'max-w-md mx-auto'}>
          <AnimatePresence mode="wait">
            {/* 이모지 투표 */}
            {activeSection === 'emoji' && (
              <motion.div
                key="emoji"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card"
              >
                <h2 className={`font-bold text-center mb-6 ${isDisplay ? 'text-3xl' : 'text-xl'}`}>
                  지금 컨디션은 어떠세요?
                </h2>
                <div className={`grid grid-cols-5 gap-4 ${isDisplay ? 'max-w-3xl' : 'max-w-sm'} mx-auto`}>
                  {emojiStats.map((stat, index) => {
                    const percentage = totalEmojiVotes > 0
                      ? Math.round((stat.count / totalEmojiVotes) * 100)
                      : 0;
                    return (
                      <motion.div
                        key={stat.emoji}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex flex-col items-center"
                      >
                        <span className={`mb-2 ${isDisplay ? 'text-5xl md:text-6xl' : 'text-4xl'}`}>
                          {stat.emoji}
                        </span>
                        <div className="w-full bg-[var(--background)] rounded-full h-3 mb-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                            className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                          />
                        </div>
                        <span className={`font-bold ${isDisplay ? 'text-lg' : 'text-sm'}`}>{percentage}%</span>
                        <span className="text-xs text-[var(--muted)]">{stat.count}명</span>
                      </motion.div>
                    );
                  })}
                </div>
                <p className="text-center text-[var(--muted)] mt-6">
                  총 <span className="text-[var(--accent)] font-bold">{totalEmojiVotes}</span>명 참여
                </p>
              </motion.div>
            )}

            {/* 키워드 워드클라우드 */}
            {activeSection === 'keywords' && (
              <motion.div
                key="keywords"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card"
              >
                <h2 className={`font-bold text-center mb-2 ${isDisplay ? 'text-3xl' : 'text-xl'}`}>
                  우리들의 고민들
                </h2>
                <p className="text-center text-[var(--muted)] mb-6">
                  최종 프로젝트에서 발생한 나의 고민
                </p>
                <div className={`flex flex-wrap justify-center gap-4 ${isDisplay ? 'min-h-[200px]' : 'min-h-[150px]'}`}>
                  {keywords.map((item, index) => (
                    <motion.span
                      key={item.keyword}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.1 }}
                      className={`${isDisplay ? getKeywordSize(item.count) : 'text-lg'} ${KEYWORD_COLORS[index % KEYWORD_COLORS.length]} font-bold cursor-default transition-transform relative`}
                    >
                      {item.keyword}
                      {item.count > 1 && (
                        <sup className="absolute -top-1 -right-3 text-xs bg-white/20 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {item.count}
                        </sup>
                      )}
                    </motion.span>
                  ))}
                </div>
                <p className="text-center text-[var(--muted)] mt-6">
                  총 <span className="text-[var(--accent)] font-bold">{totalKeywords}</span>개의 키워드
                </p>
              </motion.div>
            )}

            {/* 처음의 나에게 메시지 */}
            {activeSection === 'first-me' && (
              <motion.div
                key="first-me"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h2 className={`font-bold text-center mb-2 ${isDisplay ? 'text-3xl' : 'text-xl'}`}>
                  처음의 나에게 한마디
                </h2>
                <p className="text-center text-[var(--muted)] mb-6">
                  {filteredFirstMe.length}개의 메시지
                  {selectedTeam !== 'all' && ` (${selectedTeam}조)`}
                </p>
                <div className={`grid gap-4 max-h-[600px] overflow-y-auto p-2 ${
                  isDisplay ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                }`}>
                  {filteredFirstMe.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.02, 1) }}
                      className={`${PASTEL_COLORS[index % PASTEL_COLORS.length]} p-4 rounded-2xl shadow-lg ${
                        isDisplay ? '' : 'text-sm'
                      }`}
                      style={{ transform: isDisplay ? `rotate(${((index * 7) % 10) - 5}deg)` : 'none' }}
                    >
                      <p className={`text-gray-800 font-medium mb-2 ${isDisplay ? 'text-lg' : ''}`}>
                        &ldquo;{msg.message}&rdquo;
                      </p>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>{msg.team_number}조 {msg.nickname}</span>
                        <span>{DECORATIONS[index % DECORATIONS.length]}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 협업 이야기 */}
            {activeSection === 'conflict' && (
              <motion.div
                key="conflict"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="card">
                  <h2 className={`font-bold text-center mb-6 ${isDisplay ? 'text-3xl' : 'text-xl'}`}>
                    팀 협업 중 의견 충돌을 경험했나요?
                  </h2>
                  <div className="flex justify-center gap-8">
                    <div className="text-center">
                      <div className={`mb-2 ${isDisplay ? 'text-6xl' : 'text-4xl'}`}>😅</div>
                      <div className={`font-bold text-rose-400 ${isDisplay ? 'text-2xl' : 'text-xl'}`}>72%</div>
                      <div className="text-[var(--muted)] text-sm">네, 있었어요</div>
                    </div>
                    <div className="text-center">
                      <div className={`mb-2 ${isDisplay ? 'text-6xl' : 'text-4xl'}`}>😊</div>
                      <div className={`font-bold text-emerald-400 ${isDisplay ? 'text-2xl' : 'text-xl'}`}>28%</div>
                      <div className="text-[var(--muted)] text-sm">아니요, 원만했어요</div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className={`font-bold text-center mb-4 ${isDisplay ? 'text-xl' : 'text-lg'}`}>
                    갈등 극복 스토리 ({conflictMessages.length}개)
                  </h3>
                  <div className={`grid gap-4 max-h-[400px] overflow-y-auto ${
                    isDisplay ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                  }`}>
                    {conflictMessages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(index * 0.02, 1) }}
                        className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]"
                      >
                        <p className="mb-2">&ldquo;{msg.message}&rdquo;</p>
                        <p className="text-sm text-[var(--muted)]">
                          {msg.team_number}조 {msg.nickname}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 뿌듯할 순간 */}
            {activeSection === 'proud' && (
              <motion.div
                key="proud"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h2 className={`font-bold text-center mb-2 ${isDisplay ? 'text-3xl' : 'text-xl'}`}>
                  프로젝트 끝나고 가장 뿌듯할 순간은?
                </h2>
                <p className="text-center text-[var(--muted)] mb-6">
                  {filteredProud.length}개의 메시지
                  {selectedTeam !== 'all' && ` (${selectedTeam}조)`}
                </p>
                <div className={`grid gap-4 max-h-[600px] overflow-y-auto p-2 ${
                  isDisplay ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                }`}>
                  {filteredProud.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.02, 1) }}
                      className={`${PASTEL_COLORS[index % PASTEL_COLORS.length]} p-4 rounded-2xl shadow-lg ${
                        isDisplay ? '' : 'text-sm'
                      }`}
                      style={{ transform: isDisplay ? `rotate(${((index * 7) % 10) - 5}deg)` : 'none' }}
                    >
                      <p className={`text-gray-800 font-medium mb-2 ${isDisplay ? 'text-lg' : ''}`}>
                        &ldquo;{msg.message}&rdquo;
                      </p>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>{msg.team_number}조 {msg.nickname}</span>
                        <span>{DECORATIONS[index % DECORATIONS.length]}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 화이팅 */}
            {activeSection === 'cheer' && (
              <motion.div
                key="cheer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card text-center"
              >
                <h2 className={`font-bold mb-4 ${isDisplay ? 'text-3xl' : 'text-xl'}`}>
                  최종 프로젝트 함께 화이팅! 🔥
                </h2>
                <motion.div
                  key={cheerCount}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  className={`font-bold gradient-text mb-8 ${isDisplay ? 'text-7xl md:text-9xl' : 'text-5xl'}`}
                >
                  {cheerCount}
                </motion.div>
                {!isDisplay && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={fireConfetti}
                    className="text-2xl px-8 py-4 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] shadow-lg"
                  >
                    💪 화이팅!
                  </motion.button>
                )}
                {isDisplay && (
                  <div className="flex justify-center gap-4">
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
                )}
                <p className="text-[var(--muted)] mt-6">
                  데이터가 쌓일수록 의미가 발견되었지요? 여러분의 시간도 마찬가지예요
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 하단 안내 */}
        <div className="text-center mt-8 text-[var(--muted)] text-sm">
          💡 이 페이지는 UI 테스트용 데모입니다. 실제 데이터가 아닙니다.
          <br />
          일부 학생은 여러 개의 메시지를 작성했습니다.
        </div>
      </div>
    </main>
  );
}
