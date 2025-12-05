'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { REALTIME_SUBSCRIBE_STATES, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
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
}

type Message = FirstMeMessage | ProudMoment;
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export default function FloatingMessages({
  sessionId,
  table,
  title = '여러분의 메시지',
  isDisplay = false,
}: FloatingMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [isPolling, setIsPolling] = useState(false);

  // Refs for stable references
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = getSupabase();

  // Load messages function
  const loadMessages = useCallback(async () => {
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
  }, [supabase, table, sessionId]);

  // Start fallback polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    setIsPolling(true);
    pollingIntervalRef.current = setInterval(() => {
      loadMessages();
    }, 3000); // Poll every 3 seconds
  }, [loadMessages]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Handle new message from realtime
  const handleNewMessage = useCallback((newMessage: Message) => {
    setMessages((prev) => {
      // Prevent duplicates
      if (prev.some((msg) => msg.id === newMessage.id)) {
        return prev;
      }
      return [newMessage, ...prev];
    });
  }, []);

  // Setup realtime subscription
  useEffect(() => {
    loadMessages();

    const channelName = `${table}_realtime_${sessionId}_${Date.now()}`;

    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: true },
          presence: { key: sessionId },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          console.log('실시간 메시지 수신:', payload);
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            handleNewMessage(payload.new as Message);
          }
        }
      )
      .subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`, err?: Error) => {
        console.log(`Realtime 상태 (${table}):`, status, err);

        switch (status) {
          case REALTIME_SUBSCRIBE_STATES.SUBSCRIBED:
            setConnectionStatus('connected');
            // 진행자 페이지가 아닌 경우에만 polling 중지
            if (!isDisplay) {
              stopPolling();
            }
            break;
          case REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR:
          case REALTIME_SUBSCRIBE_STATES.TIMED_OUT:
            setConnectionStatus('error');
            startPolling(); // Realtime 실패시 polling 시작
            break;
          case REALTIME_SUBSCRIBE_STATES.CLOSED:
            setConnectionStatus('disconnected');
            startPolling();
            break;
          default:
            setConnectionStatus('connecting');
        }
      });

    // 진행자 페이지에서는 항상 polling 활성화 (2초마다)
    if (isDisplay) {
      startPolling();
    }

    // Cleanup
    return () => {
      stopPolling();
      supabase.removeChannel(channel);
    };
  }, [sessionId, table, supabase, loadMessages, handleNewMessage, startPolling, stopPolling, isDisplay]);

  // Manual refresh
  const handleManualRefresh = () => {
    loadMessages();
  };

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

        {/* 연결 상태 표시 */}
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Wifi size={14} />
              실시간
            </span>
          )}
          {connectionStatus === 'connecting' && (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <RefreshCw size={14} className="animate-spin" />
              연결 중
            </span>
          )}
          {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
            <span className="flex items-center gap-1 text-xs text-rose-400">
              <WifiOff size={14} />
              {isPolling ? '폴링 모드' : '연결 끊김'}
            </span>
          )}

          {/* 수동 새로고침 버튼 */}
          <button
            onClick={handleManualRefresh}
            className="p-1 rounded-full hover:bg-[var(--card)] transition-colors"
            title="새로고침"
          >
            <RefreshCw size={14} className="text-[var(--muted)]" />
          </button>
        </div>
      </div>

      {/* 메시지 그리드 영역 - Masonry 스타일 */}
      <div className="w-full rounded-2xl bg-[var(--card)] p-4 md:p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--muted)]">
            <span className="text-6xl mb-4">💭</span>
            <p>아직 메시지가 없어요</p>
            <p className="text-sm">첫 번째 메시지를 남겨보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, index) => (
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
                  className={`relative ${getColor(index)} rounded-2xl p-4 shadow-md cursor-pointer break-inside-avoid`}
                >
                  {/* 장식 */}
                  <span className="absolute -top-2 -right-2 text-lg drop-shadow-sm">
                    {getDecoration(index)}
                  </span>

                  {/* 메시지 */}
                  <p className="text-sm font-medium leading-relaxed">{msg.message}</p>

                  {/* 닉네임 */}
                  <p className="text-xs mt-3 opacity-60 font-medium">- {msg.nickname}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
