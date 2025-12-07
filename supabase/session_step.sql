-- sessions 테이블에 현재 단계 컬럼 추가
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 0;
