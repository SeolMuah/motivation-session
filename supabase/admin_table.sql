-- 관리자 테이블 생성
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 관리자 계정 추가 (비밀번호는 해시 대신 간단히 저장 - 프로덕션에서는 해시 사용 권장)
INSERT INTO admins (username, password_hash)
VALUES ('seolmuah', 'apgpfmqkqk1!')
ON CONFLICT (username) DO NOTHING;

-- RLS 정책 설정
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 읽기 정책 (로그인 검증용)
CREATE POLICY "Allow read for authentication" ON admins
  FOR SELECT USING (true);
