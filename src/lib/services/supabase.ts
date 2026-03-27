import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    storageKey: 'sb-auth',
    // Bypass navigator.locks to avoid orphan-lock hangs in static exports
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: (async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
      return fn();
    }) as any,
  },
});
