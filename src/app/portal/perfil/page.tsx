import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PortalPerfilPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: acesso } = await sb.from('portal_acessos').select('paciente_id').eq('user_id', user.id).single();
  if (!acesso) redirect('/portal');

  const { data: paciente } = await sb.from('pacientes')
    .select('nome, cpf, telefone, whatsapp, data_nascimento, endereco_logradouro, endereco_cidade, endereco_uf')
    .eq('id', acesso.paciente_id)
    .single();

  const p = paciente;

  function Row({ label, value }: { label: string; value: string | null | undefined }) {
    return (
      <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 14, color: '#F5F2EA', margin: '3px 0 0' }}>{value || '—'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/portal" style={{ color: '#8A8A93', fontSize: 13 }}>← Início</Link>
      </div>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.6rem', color: '#B89A5A', fontWeight: 600, margin: 0 }}>
        Meu Perfil
      </h1>

      <div className="card p-4" style={{ background: 'rgba(96,165,250,0.04)', borderColor: 'rgba(96,165,250,0.15)' }}>
        <p style={{ fontSize: 12, color: '#60A5FA' }}>Para alterar seus dados, entre em contato com a recepção da clínica.</p>
      </div>

      <div className="card" style={{ padding: '4px 20px 16px' }}>
        <Row label="Nome completo" value={p?.nome} />
        <Row label="CPF" value={p?.cpf ? `***.***.${p.cpf.slice(-5)}` : null} />
        <Row label="Telefone" value={p?.telefone ?? p?.whatsapp} />
        <Row label="Data de nascimento" value={p?.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString('pt-BR') : null} />
        <Row label="Endereço" value={[p?.endereco_logradouro, p?.endereco_cidade, p?.endereco_uf].filter(Boolean).join(', ') || null} />
      </div>

      <div className="card" style={{ padding: '4px 20px 16px' }}>
        <Row label="E-mail de acesso" value={user.email} />
        <div style={{ paddingTop: 12 }}>
          <Link href="/portal/perfil/senha" style={{ fontSize: 12, color: '#B89A5A', textDecoration: 'none' }}>
            Alterar senha →
          </Link>
        </div>
      </div>
    </div>
  );
}
