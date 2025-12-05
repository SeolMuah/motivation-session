'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';
import type { Session } from '@/lib/types';

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newSessionName, setNewSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const supabase = getSupabase();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setSessions(data);
    }
  };

  const createSession = async () => {
    if (!newSessionName.trim() || isCreating) return;

    setIsCreating(true);

    const { data, error } = await supabase
      .from('sessions')
      .insert({ name: newSessionName.trim() })
      .select()
      .single();

    if (data && !error) {
      setSessions([data, ...sessions]);
      setNewSessionName('');
      setShowModal(false);
    }

    setIsCreating(false);
  };

  const copyUrl = (id: string, type: 'student' | 'display') => {
    const baseUrl = window.location.origin;
    const url = type === 'student'
      ? `${baseUrl}/session/${id}`
      : `${baseUrl}/session/${id}/display`;

    navigator.clipboard.writeText(url);
    setCopiedId(`${id}-${type}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-12">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">동기부여</span> 세션
          </h1>
          <p className="text-xl text-[var(--muted)]">
            스파르타 내일배움캠프 데이터 분석 9기 최종 프로젝트 화이팅! 💪
          </p>
        </motion.div>

        {/* 새 세션 생성 버튼 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-3 text-lg px-8 py-4"
          >
            <Plus size={24} />
            새 세션 시작하기
          </button>
        </motion.div>

        {/* 세션 목록 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="text-[var(--accent)]" />
            세션 목록
          </h2>

          {sessions.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-[var(--muted)] text-lg">
                아직 생성된 세션이 없어요
              </p>
              <p className="text-[var(--muted)]">
                위 버튼을 눌러 첫 세션을 시작해보세요!
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">{session.name}</h3>
                      <p className="text-[var(--muted)] text-sm">
                        {formatDate(session.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* 학생용 링크 */}
                      <button
                        onClick={() => copyUrl(session.id, 'student')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors text-sm"
                      >
                        <Copy size={16} />
                        {copiedId === `${session.id}-student` ? '복사됨!' : '학생용 링크'}
                      </button>

                      {/* 진행자용 링크 */}
                      <button
                        onClick={() => copyUrl(session.id, 'display')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:opacity-90 transition-opacity text-sm text-black"
                      >
                        <Copy size={16} />
                        {copiedId === `${session.id}-display` ? '복사됨!' : '진행자용 링크'}
                      </button>

                      {/* 세션 바로가기 */}
                      <a
                        href={`/session/${session.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--card-hover)] hover:bg-[var(--border)] transition-colors text-sm"
                      >
                        <ExternalLink size={16} />
                        열기
                      </a>

                      {/* 회고 페이지 */}
                      <a
                        href={`/session/${session.id}/recap`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--card-hover)] hover:bg-[var(--border)] transition-colors text-sm"
                      >
                        📊 회고
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* 새 세션 생성 모달 */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-6">새 세션 만들기</h3>

            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="세션 이름 (예: 12월 동기부여 세션)"
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 mb-6 focus:outline-none focus:border-[var(--primary)]"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && createSession()}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl bg-[var(--card-hover)] hover:bg-[var(--border)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={createSession}
                disabled={!newSessionName.trim() || isCreating}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {isCreating ? '생성 중...' : '생성하기'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
