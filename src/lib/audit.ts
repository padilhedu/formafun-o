import { createClient } from '@/lib/supabase/server';

export async function registrarAudit(
  acao: string,
  tabela: string,
  registroId: string,
  detalhes?: Record<string, unknown>
) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('audit_log').insert({
      usuario_id: user.id,
      acao,
      tabela,
      registro_id: registroId,
      detalhes: detalhes ?? {},
    });
  } catch {
    // audit nunca deve quebrar o fluxo principal
  }
}
