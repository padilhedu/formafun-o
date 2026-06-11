import { createClient } from '@/lib/supabase/server';

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 10;

export async function checkRateLimit(ip: string, token: string): Promise<boolean> {
  const supabase = await createClient();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count } = await supabase
    .from('signing_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('tentativa_em', since);

  if ((count ?? 0) >= MAX_ATTEMPTS) return false;

  await supabase.from('signing_attempts').insert({ ip, token });
  return true;
}
