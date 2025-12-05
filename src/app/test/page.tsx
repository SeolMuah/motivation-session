'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase/client';

export default function TestPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [sessions, setSessions] = useState<{ id: string; name: string; created_at: string }[]>([]);
  const supabase = getSupabase();

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus('loading');
      setMessage('Supabase 연결 테스트 중...');

      // 세션 목록 조회 테스트
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      setSessions(data || []);
      setStatus('success');
      setMessage(`연결 성공! ${data?.length || 0}개의 세션을 찾았습니다.`);
    } catch (err) {
      setStatus('error');
      setMessage(`연결 실패: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
    }
  };

  const createTestSession = async () => {
    try {
      setMessage('테스트 세션 생성 중...');

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          name: `테스트 세션 ${new Date().toLocaleTimeString()}`,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setMessage(`세션 생성 성공! ID: ${data.id}`);
      testConnection(); // 새로고침
    } catch (err) {
      setMessage(`세션 생성 실패: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
    }
  };

  return (
    <div className="min-h-screen p-8 gradient-bg">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase 연결 테스트</h1>

        {/* 상태 표시 */}
        <div className={`p-4 rounded-lg mb-6 ${
          status === 'loading' ? 'bg-yellow-500/20' :
          status === 'success' ? 'bg-green-500/20' :
          'bg-red-500/20'
        }`}>
          <p className="text-lg">
            {status === 'loading' && '⏳ '}
            {status === 'success' && '✅ '}
            {status === 'error' && '❌ '}
            {message}
          </p>
        </div>

        {/* 버튼들 */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={testConnection}
            className="btn-primary"
          >
            다시 테스트
          </button>
          <button
            onClick={createTestSession}
            className="btn-secondary"
          >
            테스트 세션 생성
          </button>
          <a href="/" className="btn-secondary">
            메인으로
          </a>
        </div>

        {/* 세션 목록 */}
        {sessions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">최근 세션들:</h2>
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session.id} className="p-3 bg-[var(--card)] rounded-lg">
                  <p className="font-medium">{session.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    ID: {session.id}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    생성: {new Date(session.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 환경 변수 확인 */}
        <div className="mt-8 p-4 bg-[var(--card)] rounded-lg">
          <h2 className="text-xl font-bold mb-2">환경 변수:</h2>
          <p className="text-sm font-mono break-all">
            URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || '(없음)'}
          </p>
          <p className="text-sm font-mono">
            KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20)}...
          </p>
        </div>
      </div>
    </div>
  );
}
