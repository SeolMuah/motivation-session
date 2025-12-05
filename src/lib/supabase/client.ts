import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        params: {
          eventsPerSecond: 10, // Rate limiting
        },
      },
    }
  );
}

// 싱글톤 인스턴스 (클라이언트 컴포넌트용)
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (!client) {
    client = createClient();
  }
  return client;
}
