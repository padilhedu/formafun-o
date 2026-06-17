import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ConfiguracoesClient } from '@/components/configuracoes/ConfiguracoesClient';

export const dynamic = 'force-dynamic';

export default async function ConfiguracoesPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <div className="text-muted p-8">Configure o Supabase.</div>;
  }

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return (
      <div className="card p-8 text-center max-w-md mx-auto mt-16">
        <p className="heading text-offwhite mb-2">Acesso restrito</p>
        <p className="text-muted text-sm">Apenas administradores podem acessar as configurações.</p>
      </div>
    );
  }

  // Fetch all config data in parallel
  const [configRes, profRes, procRes, usersRes, auditRes] = await Promise.all([
    sb.from('configuracoes').select('*'),
    sb.from('profissionais').select('*').order('nome'),
    sb.from('procedimentos_tabela').select('*').order('nome'),
    sb.from('profiles').select('id, role, nome, created_at').order('role'),
    sb.from('audit_log').select('*').order('criado_em', { ascending: false }).limit(100),
  ]);

  const configMap: Record<string, unknown> = {};
  for (const row of (configRes.data ?? [])) configMap[row.chave] = row.valor;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1F7A4D', marginBottom: 4 }}>OPERACIONAL</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 32, fontWeight: 600, color: '#1C1C1C', lineHeight: 1.1, marginBottom: 4 }}>
          Configurações
        </h1>
        <p style={{ fontSize: 13, color: '#6B6B66', fontFamily: 'var(--font-montserrat)' }}>Administração do sistema — acesso restrito</p>
      </div>

      <ConfiguracoesClient
        config={configMap}
        profissionais={profRes.data ?? []}
        procedimentos={procRes.data ?? []}
        usuarios={usersRes.data ?? []}
        auditLog={auditRes.data ?? []}
        userEmail={user.email ?? ''}
      />
    </div>
  );
}
