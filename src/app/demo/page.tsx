'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Users, ChevronDown } from 'lucide-react';
import EmojiVote from '@/components/EmojiVote';
import FloatingMessages from '@/components/FloatingMessages';
import ProblemKeyword from '@/components/ProblemKeyword';
import ConflictVote from '@/components/ConflictVote';
import CheerButton from '@/components/CheerButton';
import type { VoteStats, FirstMeMessage, ProudMoment } from '@/lib/types';

// 20개 조, 조별 5명 = 100명
const TOTAL_TEAMS = 20;
const MEMBERS_PER_TEAM = 5;

// 학생 데이터 생성
interface Student {
  id: string;
  nickname: string;
  teamNumber: number;
}

// 이름 풀
const FIRST_NAMES = [
  '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
  '한', '오', '서', '신', '권', '황', '안', '송', '류', '전',
  '홍', '고', '문', '양', '손', '배', '조', '백', '허', '유',
];

const LAST_NAMES = [
  '민준', '서윤', '예준', '서연', '도윤', '지우', '시우', '하윤', '주원', '하은',
  '지호', '수아', '지훈', '지민', '준서', '채원', '건우', '지윤', '현우', '은서',
  '우진', '소율', '선우', '다은', '민재', '예은', '윤서', '유진', '재민', '소희',
  '지원', '민서', '승현', '유나', '민규', '연우', '태윤', '수빈', '준혁', '서영',
  '시현', '민지', '유준', '수현', '정우', '나연', '현준', '하린', '승민', '지수',
];

// 다양한 길이의 메시지 템플릿
const FIRST_ME_SHORT = [
  '포기하지 마!',
  '힘내자 화이팅!',
  '잘하고 있어!',
  '조금만 더!',
  '넌 할 수 있어!',
  '대단해!',
  '멋있어!',
  '고마워!',
  '믿고 있어!',
  '최고야!',
];

const FIRST_ME_MEDIUM = [
  '처음 시작할 때 떨렸던 마음 기억해?',
  '매일 조금씩 성장하고 있어!',
  '어려운 건 당연한 거야, 포기만 하지 마',
  '우리 함께라서 여기까지 왔어',
  '실패해도 괜찮아, 배우면 돼',
  '네가 얼마나 노력했는지 알아',
  '힘들 때 쉬어가도 괜찮아',
  '오늘 하루도 수고했어!',
  '목표를 향해 한 걸음씩!',
  '시작이 반이야, 이미 반은 왔어',
];

const FIRST_ME_LONG = [
  '처음 이 캠프에 지원했을 때를 떠올려봐. 그때의 열정과 설렘을 잊지 마! 힘들겠지만 끝까지 해보자!',
  '데이터 분석이라는 새로운 세계에 뛰어든 용기가 대단해. 지금까지 온 것만으로도 충분히 잘하고 있어!',
  '매일 새벽까지 코딩하며 고생하는 너의 모습이 정말 멋있어. 조금만 더 힘내자!',
  '혼자가 아니야. 우리 조원들이 함께 하잖아. 서로 의지하면서 끝까지 가보자!',
  '어려운 건 당연해. 쉬웠으면 아무나 했겠지? 너라서 해낼 수 있어!',
  '프로젝트 마감이 다가오는데 걱정되지? 하지만 지금까지 해온 것들을 믿어봐!',
  '에러 나면 당황하지 말고 하나씩 해결해나가자. 그게 진짜 개발자야!',
  '오늘 힘들었다면 내일은 더 나아질 거야. 매일이 성장의 기회니까!',
  '완벽하지 않아도 괜찮아. 최선을 다하는 모습 그 자체가 아름다운 거야!',
  '처음 만났을 때보다 훨씬 성장한 너를 보고 있어. 정말 대단해!',
];

const PROUD_SHORT = [
  '첫 코드 작성!',
  '버그 해결!',
  'SQL 마스터!',
  '시각화 완성!',
  '분석 끝!',
  '발표 성공!',
  '팀플 완료!',
  '프로젝트 완성!',
  '파이썬 정복!',
  '데이터 수집!',
];

const PROUD_MEDIUM = [
  '처음으로 복잡한 SQL 쿼리를 작성했을 때',
  '밤새 디버깅해서 버그 찾았을 때',
  '팀원들이 내 코드를 이해하고 활용했을 때',
  '시각화 대시보드를 완성했을 때',
  '교육생 발표에서 박수 받았을 때',
  '웹 스크래핑으로 데이터 수집 성공했을 때',
  '머신러닝 모델 정확도 90% 달성했을 때',
  '내가 만든 분석 결과로 인사이트 도출했을 때',
  '팀원들과 협업해서 문제 해결했을 때',
  'EDA로 숨겨진 패턴 발견했을 때',
];

const PROUD_LONG = [
  '처음에는 print(\'Hello World\')도 어려웠는데, 이제는 API 개발까지 할 수 있게 됐어요! 정말 뿌듯합니다.',
  '3일 동안 고민하던 알고리즘 문제를 드디어 해결했을 때, 그 쾌감은 잊을 수 없어요!',
  '팀 프로젝트에서 데이터베이스 설계를 담당했는데, 다들 좋다고 해줘서 너무 기뻤어요.',
  'Tableau로 만든 대시보드가 강사님께 칭찬받았을 때 정말 행복했어요!',
  '매일 TIL 작성하며 배운 것들을 정리했는데, 돌아보니 정말 많이 성장했더라고요.',
  '처음 협업 프로젝트에서 Git 충돌 해결하고 성공적으로 merge했을 때 자신감이 생겼어요!',
  '데이터 전처리에서 결측치 처리 방법을 팀원들에게 설명해줬는데, 다들 이해해서 뿌듯했어요.',
  '내가 분석한 결과가 실제 비즈니스 인사이트로 활용될 수 있다는 걸 알았을 때 감동이었어요.',
  '캠프 시작 때는 파이썬 기초도 몰랐는데, 이제 라이브러리를 자유롭게 사용할 수 있어요!',
  '발표 울렁증이 있었는데, 팀원들 앞에서 분석 결과 발표를 성공적으로 마쳤어요!',
];

// 다양한 팀 메시지
const TEAM_SHORT = [
  '고마워!',
  '화이팅!',
  '최고야!',
  '사랑해!',
  '믿어!',
  '응원해!',
  '수고해!',
  '잘하자!',
  '힘내!',
  '파이팅!',
];

const TEAM_MEDIUM = [
  '우리 조 진짜 최고야!',
  '함께해서 든든해요!',
  '힘든데 같이 버텨줘서 고마워',
  '서로 의지하며 완주하자!',
  '우리 팀이 최고의 팀이야',
  '다들 고생 많았어 진짜!',
  '너무 즐거운 프로젝트였어',
  '앞으로도 잘 부탁해!',
  '같이 성장하는 느낌이 좋아',
  '우리 모두 대단해!',
];

const TEAM_LONG = [
  '처음엔 어색했는데 이제는 가족 같은 느낌이야. 프로젝트 끝나도 계속 연락하자!',
  '밤새 코딩할 때 옆에서 같이 고생해줘서 정말 고마워. 혼자였으면 못 했을 거야.',
  '의견 충돌도 있었지만 그래서 더 좋은 결과가 나온 것 같아. 다들 대단해!',
  '매일 아침 스크럼 미팅하면서 서로 응원하는 게 정말 힘이 됐어요. 감사합니다!',
  '우리 팀 분위기가 너무 좋아서 힘든 것도 견딜 수 있었어. 다들 사랑해!',
  '서로 다른 배경인데 이렇게 잘 맞을 줄 몰랐어. 운명 같은 팀이야!',
  '코드 리뷰하면서 많이 배웠어. 팀원들 덕분에 실력이 늘었어!',
  '갈등도 있었지만 솔직하게 대화해서 해결할 수 있었어. 어른스러운 팀이야!',
  '발표 준비할 때 다들 밤새워줘서 감동이었어. 최고의 팀워크야!',
  '힘들 때 웃으면서 해결하는 우리 팀 분위기가 너무 좋아. 평생 기억할 거야!',
];

// 다양한 키워드 풀 (40개 이상)
const KEYWORDS = [
  '시간 부족', '역할 분담', '의견 충돌', '기술 활용', '방향성',
  '소통 문제', 'Git 충돌', '코드 통합', '발표 준비', '데이터 수집',
  '머신러닝', 'SQL 쿼리', '시각화', 'EDA', '전처리',
  '협업 도구', '일정 관리', '피드백', '코드 리뷰', '문서화',
  '테스트', '배포', 'API 연동', '크롤링', '모델링',
  '하이퍼파라미터', '과적합', '특성 선택', '데이터 품질', '결측치',
  '이상치 처리', '정규화', '인코딩', '차원 축소', '클러스터링',
  '회귀 분석', '분류 모델', 'A/B 테스트', '통계 검정', '인사이트 도출',
  '성능 최적화', '메모리 관리', '코드 품질', '리팩토링', '디버깅',
];

// 학생 생성
const generateStudents = (): Student[] => {
  const students: Student[] = [];
  let studentId = 1;

  for (let team = 1; team <= TOTAL_TEAMS; team++) {
    for (let member = 1; member <= MEMBERS_PER_TEAM; member++) {
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      students.push({
        id: `student-${studentId}`,
        nickname: `${firstName}${lastName}`,
        teamNumber: team,
      });
      studentId++;
    }
  }

  return students;
};

const STUDENTS = generateStudents();

// 다양한 길이의 메시지 선택 함수
const getRandomFirstMeMessage = () => {
  const rand = Math.random();
  if (rand < 0.3) return FIRST_ME_SHORT[Math.floor(Math.random() * FIRST_ME_SHORT.length)];
  if (rand < 0.7) return FIRST_ME_MEDIUM[Math.floor(Math.random() * FIRST_ME_MEDIUM.length)];
  return FIRST_ME_LONG[Math.floor(Math.random() * FIRST_ME_LONG.length)];
};

const getRandomProudMessage = () => {
  const rand = Math.random();
  if (rand < 0.3) return PROUD_SHORT[Math.floor(Math.random() * PROUD_SHORT.length)];
  if (rand < 0.7) return PROUD_MEDIUM[Math.floor(Math.random() * PROUD_MEDIUM.length)];
  return PROUD_LONG[Math.floor(Math.random() * PROUD_LONG.length)];
};

const getRandomTeamMessage = () => {
  const rand = Math.random();
  if (rand < 0.25) return TEAM_SHORT[Math.floor(Math.random() * TEAM_SHORT.length)];
  if (rand < 0.65) return TEAM_MEDIUM[Math.floor(Math.random() * TEAM_MEDIUM.length)];
  return TEAM_LONG[Math.floor(Math.random() * TEAM_LONG.length)];
};

// 메시지 생성 (일부 학생은 여러 번)
const generateFirstMeMessages = (): FirstMeMessage[] => {
  const messages: FirstMeMessage[] = [];
  let messageId = 1;

  STUDENTS.forEach((student) => {
    // 기본 메시지
    messages.push({
      id: `firstme-${messageId++}`,
      session_id: 'demo',
      message: getRandomFirstMeMessage(),
      nickname: student.nickname,
      team_number: student.teamNumber,
      is_highlighted: false,
      created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    });

    // 35% 확률로 추가 메시지 (1~2개)
    if (Math.random() < 0.35) {
      const extraCount = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < extraCount; i++) {
        messages.push({
          id: `firstme-${messageId++}`,
          session_id: 'demo',
          message: getRandomFirstMeMessage(),
          nickname: student.nickname,
          team_number: student.teamNumber,
          is_highlighted: false,
          created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        });
      }
    }
  });

  return messages.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

const generateProudMoments = (): ProudMoment[] => {
  const messages: ProudMoment[] = [];
  let messageId = 1;

  STUDENTS.forEach((student) => {
    messages.push({
      id: `proud-${messageId++}`,
      session_id: 'demo',
      message: getRandomProudMessage(),
      nickname: student.nickname,
      team_number: student.teamNumber,
      hearts: Math.floor(Math.random() * 10),
      created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    });

    // 30% 확률로 추가 메시지
    if (Math.random() < 0.30) {
      const extraCount = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < extraCount; i++) {
        messages.push({
          id: `proud-${messageId++}`,
          session_id: 'demo',
          message: getRandomProudMessage(),
          nickname: student.nickname,
          team_number: student.teamNumber,
          hearts: Math.floor(Math.random() * 10),
          created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        });
      }
    }
  });

  return messages.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

interface TeamMessage {
  id: string;
  session_id: string;
  message: string;
  nickname: string;
  team_number?: number;
  created_at: string;
}

const generateTeamMessages = (): TeamMessage[] => {
  const messages: TeamMessage[] = [];
  let messageId = 1;

  STUDENTS.forEach((student) => {
    messages.push({
      id: `team-${messageId++}`,
      session_id: 'demo',
      message: getRandomTeamMessage(),
      nickname: student.nickname,
      team_number: student.teamNumber,
      created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    });

    // 25% 확률로 추가 메시지
    if (Math.random() < 0.25) {
      messages.push({
        id: `team-${messageId++}`,
        session_id: 'demo',
        message: getRandomTeamMessage(),
        nickname: student.nickname,
        team_number: student.teamNumber,
        created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      });
    }
  });

  return messages.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

// 키워드 데이터 생성 (더 다양하게)
const generateKeywordData = () => {
  const keywordCounts = new Map<string, number>();

  // 모든 학생이 각자 키워드 입력
  STUDENTS.forEach(() => {
    // 1~2개의 키워드를 입력
    const numKeywords = Math.random() < 0.4 ? 2 : 1;
    for (let i = 0; i < numKeywords; i++) {
      const keyword = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    }
  });

  // 정렬 및 상위 25개 반환
  return Array.from(keywordCounts.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);
};

// 이모지 투표 데이터 생성
const generateEmojiStats = (): VoteStats[] => {
  const total = STUDENTS.length;
  // 다양한 분포 생성
  const tired = Math.floor(total * (0.1 + Math.random() * 0.15)); // 10~25%
  const exhausted = Math.floor(total * (0.15 + Math.random() * 0.15)); // 15~30%
  const fire = Math.floor(total * (0.25 + Math.random() * 0.15)); // 25~40%
  const canDo = total - tired - exhausted - fire; // 나머지

  const stats = [
    { emoji: '😴' as const, count: tired, percentage: 0 },
    { emoji: '😵' as const, count: exhausted, percentage: 0 },
    { emoji: '🔥' as const, count: fire, percentage: 0 },
    { emoji: '💪' as const, count: canDo, percentage: 0 },
  ];

  stats.forEach(s => {
    s.percentage = Math.round((s.count / total) * 100);
  });

  return stats;
};

// 갈등 투표 데이터 생성
const generateConflictData = () => {
  const total = STUDENTS.length;
  const yesRatio = 0.55 + Math.random() * 0.25; // 55~80%가 있다고 응답
  const yesCount = Math.floor(total * yesRatio);
  const noCount = total - yesCount;

  return { yesCount, noCount };
};

// 단계 정의
type DemoStep = 'condition' | 'reset' | 'first-me' | 'conflict' | 'why' | 'proud' | 'cheer';

const STEPS: { id: DemoStep; title: string }[] = [
  { id: 'condition', title: '컨디션 체크' },
  { id: 'reset', title: '리셋 타임' },
  { id: 'first-me', title: '처음의 나에게' },
  { id: 'conflict', title: '협업 이야기' },
  { id: 'why', title: '나의 고민, 나의 서사' },
  { id: 'proud', title: '뿌듯할 순간' },
  { id: 'cheer', title: '화이팅!' },
];

export default function DemoPage() {
  const [viewMode, setViewMode] = useState<'display' | 'student'>('display');
  const [selectedStep, setSelectedStep] = useState<DemoStep>('condition');
  const [selectedTeam, setSelectedTeam] = useState<number>(1);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);

  // 데모 데이터 생성 (메모이제이션)
  const emojiStats = useMemo(() => generateEmojiStats(), []);
  const firstMeMessages = useMemo(() => generateFirstMeMessages(), []);
  const proudMoments = useMemo(() => generateProudMoments(), []);
  const teamMessages = useMemo(() => generateTeamMessages(), []);
  const keywordData = useMemo(() => generateKeywordData(), []);
  const conflictData = useMemo(() => generateConflictData(), []);
  const cheerCount = useMemo(() => Math.floor(STUDENTS.length * (1.5 + Math.random())), []);

  // 선택된 팀의 학생
  const selectedStudent = useMemo(() => {
    return STUDENTS.find(s => s.teamNumber === selectedTeam) || STUDENTS[0];
  }, [selectedTeam]);

  // 현재 단계 렌더링
  const renderStep = () => {
    const isDisplay = viewMode === 'display';

    switch (selectedStep) {
      case 'condition':
        return (
          <EmojiVote
            sessionId="demo"
            isDisplay={isDisplay}
            demoData={emojiStats}
          />
        );

      case 'reset':
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-6xl mb-4"
            >
              ⏰
            </motion.div>
            <h2 className="text-2xl font-bold mb-4">리셋 타임</h2>
            <p className="text-[var(--muted)]">
              데모 모드에서는 타이머가 표시되지 않습니다.
            </p>
            <p className="text-[var(--muted)] mt-2">
              실제 세션에서는 1분 타이머와 배경 음악이 재생됩니다.
            </p>
          </div>
        );

      case 'first-me':
        return (
          <FloatingMessages
            sessionId="demo"
            table="first_me_messages"
            title="처음의 나에게 한마디"
            isDisplay={isDisplay}
            myTeamNumber={isDisplay ? undefined : selectedTeam}
            demoData={firstMeMessages}
          />
        );

      case 'conflict':
        return (
          <ConflictVote
            sessionId="demo"
            isDisplay={isDisplay}
            nickname={isDisplay ? undefined : selectedStudent.nickname}
            teamNumber={isDisplay ? undefined : selectedTeam}
            demoData={{
              yesCount: conflictData.yesCount,
              noCount: conflictData.noCount,
              messages: teamMessages,
            }}
          />
        );

      case 'why':
        return (
          <ProblemKeyword
            sessionId="demo"
            isDisplay={isDisplay}
            demoData={keywordData}
          />
        );

      case 'proud':
        return (
          <FloatingMessages
            sessionId="demo"
            table="proud_moments"
            title="뿌듯할 순간들"
            isDisplay={isDisplay}
            myTeamNumber={isDisplay ? undefined : selectedTeam}
            demoData={proudMoments}
          />
        );

      case 'cheer':
        return (
          <CheerButton
            sessionId="demo"
            isDisplay={isDisplay}
            demoData={cheerCount}
          />
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen gradient-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            데모 페이지
          </h1>
          <p className="text-[var(--muted)]">
            20개 조 × 5명 = 100명의 샘플 데이터 (일부는 여러 메시지 작성)
          </p>
        </motion.div>

        {/* 컨트롤 패널 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-8"
        >
          {/* 뷰 모드 선택 */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('display')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                viewMode === 'display'
                  ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-lg'
                  : 'bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--card-hover)]'
              }`}
            >
              <Monitor size={20} />
              진행자 화면
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('student')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                viewMode === 'student'
                  ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-lg'
                  : 'bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--card-hover)]'
              }`}
            >
              <Smartphone size={20} />
              학생 화면
            </motion.button>
          </div>

          {/* 학생 모드일 때 조 선택 */}
          <AnimatePresence>
            {viewMode === 'student' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-center mb-6"
              >
                <div className="relative">
                  <button
                    onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--card)] hover:bg-[var(--card-hover)] transition-colors"
                  >
                    <Users size={16} />
                    <span>{selectedTeam}조 - {selectedStudent.nickname}</span>
                    <ChevronDown size={14} />
                  </button>

                  <AnimatePresence>
                    {isTeamDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-[var(--background)] rounded-2xl shadow-lg border border-[var(--border)] overflow-hidden z-50"
                      >
                        <div className="max-h-64 overflow-y-auto py-2">
                          {Array.from({ length: TOTAL_TEAMS }, (_, i) => i + 1).map((team) => (
                            <button
                              key={team}
                              onClick={() => {
                                setSelectedTeam(team);
                                setIsTeamDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2 text-left hover:bg-[var(--card-hover)] transition-colors ${
                                selectedTeam === team ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                              }`}
                            >
                              {team}조
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isTeamDropdownOpen && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsTeamDropdownOpen(false)}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 단계 선택 */}
          <div className="flex flex-wrap justify-center gap-2">
            {STEPS.map((step) => (
              <motion.button
                key={step.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedStep(step.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedStep === step.id
                    ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-lg'
                    : 'bg-[var(--background)] text-[var(--muted)] hover:bg-[var(--card-hover)]'
                }`}
              >
                {step.title}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 메인 콘텐츠 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedStep}-${viewMode}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* 통계 정보 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center text-sm text-[var(--muted)]"
        >
          <p>📊 데이터 통계</p>
          <p className="mt-1">
            총 학생: {STUDENTS.length}명 |
            처음의 나에게: {firstMeMessages.length}개 |
            뿌듯한 순간: {proudMoments.length}개 |
            팀 메시지: {teamMessages.length}개 |
            키워드: {keywordData.reduce((sum, k) => sum + k.count, 0)}개
          </p>
        </motion.div>
      </div>
    </main>
  );
}
