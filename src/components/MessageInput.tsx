'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, User } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';

interface MessageInputProps {
  sessionId: string;
  table: 'first_me_messages' | 'proud_moments';
  placeholder?: string;
  maxLength?: number;
  nickname: string;
  teamNumber?: number;
  onSubmit?: () => void;
}

export default function MessageInput({
  sessionId,
  table,
  placeholder = '메시지를 입력하세요...',
  maxLength = 200,
  nickname,
  teamNumber,
  onSubmit,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const supabase = getSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await supabase.from(table).insert({
        session_id: sessionId,
        nickname: nickname || '익명',
        message: message.trim(),
        team_number: teamNumber || null,
      });

      setIsSubmitted(true);
      setMessage('');
      onSubmit?.();

      // 3초 후 다시 입력 가능
      setTimeout(() => setIsSubmitted(false), 3000);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-6xl mb-4"
        >
          ✨
        </motion.div>
        <p className="text-xl font-semibold">메시지가 전송되었어요!</p>
        <p className="text-[var(--muted)] mt-2">다른 메시지도 남길 수 있어요</p>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="card space-y-4"
    >
      {/* 닉네임 표시 */}
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <User size={16} />
        <span>{nickname || '익명'}으로 작성</span>
      </div>

      {/* 메시지 입력 */}
      <div className="relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 resize-none focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
        <span className="absolute bottom-3 right-3 text-sm text-[var(--muted)]">
          {message.length}/{maxLength}
        </span>
      </div>

      {/* 전송 버튼 */}
      <motion.button
        type="submit"
        disabled={!message.trim() || isSubmitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send size={20} />
        {isSubmitting ? '전송 중...' : '메시지 보내기'}
      </motion.button>
    </motion.form>
  );
}
