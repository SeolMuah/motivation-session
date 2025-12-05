// 데이터베이스 타입 정의

export type Emoji = '😴' | '😵' | '🔥' | '💪';

export interface Session {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  timer_started_at?: string | null;
}

export interface ConditionVote {
  id: string;
  session_id: string;
  emoji: Emoji;
  voter_id?: string;
  created_at: string;
}

export interface FirstMeMessage {
  id: string;
  session_id: string;
  nickname: string;
  message: string;
  is_highlighted: boolean;
  team_number?: number;
  created_at: string;
}

export interface ConflictVote {
  id: string;
  session_id: string;
  has_conflict: boolean;
  created_at: string;
}

export interface ProudMoment {
  id: string;
  session_id: string;
  nickname: string;
  message: string;
  hearts: number;
  team_number?: number;
  created_at: string;
}

export interface Cheer {
  id: string;
  session_id: string;
  created_at: string;
}

export interface ProblemKeyword {
  id: string;
  session_id: string;
  keyword: string;
  created_at: string;
}

export interface TeamMessage {
  id: string;
  session_id: string;
  nickname: string;
  message: string;
  team_number?: number;
  created_at: string;
}

// 투표 통계 타입
export interface VoteStats {
  emoji: Emoji;
  count: number;
  percentage: number;
}

// 세션 단계
export type SessionStep =
  | 'condition'      // 컨디션 체크
  | 'reset'          // 리셋 타임 (타이머)
  | 'first-me'       // 처음의 나에게
  | 'conflict'       // 갈등 경험
  | 'why'            // 다시, '왜'에 집중하기
  | 'proud'          // 뿌듯할 순간
  | 'cheer'          // 화이팅
  | 'result';        // 결과 시각화
