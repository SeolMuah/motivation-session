-- Supabase Realtime 활성화 (sessions 테이블)
-- Supabase Dashboard > Database > Replication에서도 활성화 가능

-- 1. current_step 컬럼 추가 (이미 있으면 무시)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 0;

-- 2. sessions 테이블에 Realtime 활성화
-- 방법 1: Supabase Dashboard에서 활성화
-- Database > Replication > 0 tables > sessions 테이블 선택 후 저장

-- 방법 2: SQL로 직접 활성화 (supabase_realtime publication에 추가)
-- 주의: 이 명령은 Supabase Dashboard의 SQL Editor에서 실행해야 합니다
DO $$
BEGIN
  -- publication이 있는지 확인하고, sessions 테이블 추가
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- 이미 추가되어 있지 않으면 추가
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'sessions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
    END IF;
  END IF;
END $$;

-- 3. 확인용 쿼리 (실행 후 sessions가 목록에 있어야 함)
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
