import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}
function formatHour(d: string) {
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function PortalHomePage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/portal/login');

  // Find paciente linked to this user via portal_acessos
  const { data: acesso } = await sb
    .from('portal_acessos')
    .select('paciente_id, pacientes(nome)')
    .eq('user_id', user.id)
    .eq('habilitado', true)
    .single();

  if (!acesso) {
    return (
      <div className="card p-8 text-center">
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem', color: '#1F7A4D', marginBottom: 8 }}>
          Acesso não encontrado
        </p>
        <p style={{ color: '#6B6B66', fontSize: 13 }}>
          Seu acesso ainda não foi habilitado. Entre em contato com a clínica.
        </p>
      </div>
    );
  }

  const pacienteId = acesso.paciente_id;
  const pacienteNome = (acesso.pacientes as unknown as { nome: string } | null)?.nome ?? 'Paciente';

  // Update last access + audit log (fire-and-forget)
  sb.from('portal_acessos').update({ ultimo_acesso: new Date().toISOString() }).eq('user_id', user.id).then(() => {});
  sb.from('audit_log').insert({
    usuario_id: user.id, usuario_email: user.email,
    acao: 'portal_acesso', tabela: 'portal_acessos', registro_id: pacienteId,
  }).then(() => {});

  // Fetch data for home
  const now = new Date().toISOString();
  const [consultasRes, financeiroRes, contratosRes] = await Promise.all([
    sb.from('agenda_eventos')
      .select('id, data_hora, duracao_minutos, status, tipo, notas_publicas')
      .eq('paciente_id', pacienteId)
      .gte('data_hora', now)
      .order('data_hora')
      .limit(3),
    sb.from('lancamentos')
      .select('id, descricao, valor, tipo, data_vencimento, status')
      .eq('paciente_id', pacienteId)
      .order('data_vencimento', { ascending: false })
      .limit(10),
    sb.from('contratos')
      .select('id, codigo, status, assinado_em, pdf_url, zapsign_doc_url')
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const consultas = consultasRes.data ?? [];
  const lancamentos = financeiroRes.data ?? [];
  const contratos = contratosRes.data ?? [];

  const proximaConsulta = consultas[0];
  const saldoAberto = lancamentos
    .filter(l => l.tipo === 'receita' && l.status === 'pendente')
    .reduce((s, l) => s + Number(l.valor), 0);

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem', color: '#1F7A4D', fontWeight: 600, margin: 0 }}>
          Olá, {pacienteNome.split(' ')[0]}
        </h1>
        <p style={{ color: '#6B6B66', fontSize: 13, marginTop: 4 }}>Bem-vindo ao seu portal de acompanhamento</p>
      </div>

      {/* Próxima consulta */}
      {proximaConsulta ? (
        <div className="card" style={{ padding: 20, borderLeft: '3px solid #1F7A4D' }}>
          <p style={{ fontSize: 10, color: '#1F7A4D', fontFamily: 'var(--font-montserrat)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Próxima Consulta
          </p>
          <p style={{ fontSize: '1.1rem', color: '#1C1C1C', fontFamily: 'var(--font-montserrat)', fontWeight: 600, textTransform: 'capitalize', marginBottom: 4 }}>
            {formatDate(proximaConsulta.data_hora)}
          </p>
          <p style={{ color: '#6B6B66', fontSize: 13, marginBottom: 12 }}>
            {formatHour(proximaConsulta.data_hora)} · {proximaConsulta.tipo ?? 'Consulta'}
            {proximaConsulta.notas_publicas && <span> · {proximaConsulta.notas_publicas}</span>}
          </p>
          {proximaConsulta.status === 'agendado' && (
            <form action="/api/portal/confirmar-consulta" method="POST">
              <input type="hidden" name="evento_id" value={proximaConsulta.id} />
              <button type="submit" className="btn-primary" style={{ padding: '8px 20px', fontSize: 12 }}>
                Confirmar presença
              </button>
            </form>
          )}
          {proximaConsulta.status === 'confirmado' && (
            <span style={{ fontSize: 12, color: '#1F7A4D', fontFamily: 'var(--font-montserrat)' }}>✓ Presença confirmada</span>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 20, borderStyle: 'dashed', borderColor: 'rgba(31,122,77,0.2)', textAlign: 'center' }}>
          <p style={{ color: '#6B6B66', fontSize: 13 }}>Nenhuma consulta agendada.</p>
        </div>
      )}

      {/* Saldo e contratos */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card" style={{ padding: 16, borderLeft: saldoAberto > 0 ? '3px solid #C0392B' : '3px solid #1F7A4D' }}>
          <p style={{ fontSize: 10, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Saldo em Aberto
          </p>
          <p style={{ fontSize: '1.3rem', fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: saldoAberto > 0 ? '#C0392B' : '#1F7A4D', margin: 0 }}>
            {formatBRL(saldoAberto)}
          </p>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 10, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Documentos
          </p>
          <p style={{ fontSize: '1.3rem', fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: '#1C1C1C', margin: 0 }}>
            {contratos.length}
          </p>
          {contratos.some(c => c.status !== 'assinado') && (
            <p style={{ fontSize: 11, color: '#C98A1E', marginTop: 4 }}>⚠ Pendente de assinatura</p>
          )}
        </div>
      </div>

      {/* Documentos pendentes de assinatura */}
      {contratos.filter(c => c.status !== 'assinado' && c.zapsign_doc_url).length > 0 && (
        <div className="card" style={{ padding: 16, background: 'rgba(251,191,36,0.04)', borderColor: 'rgba(251,191,36,0.2)' }}>
          <p style={{ fontSize: 11, color: '#C98A1E', fontFamily: 'var(--font-montserrat)', fontWeight: 600, marginBottom: 10 }}>
            ⚠ Documentos aguardando sua assinatura
          </p>
          {contratos.filter(c => c.status !== 'assinado' && c.zapsign_doc_url).map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#1C1C1C' }}>{c.codigo}</span>
              <a href={c.zapsign_doc_url!} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '5px 14px', fontSize: 11, textDecoration: 'none' }}>
                Assinar agora →
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-2">
        {[
          { href: '/portal/tratamento', label: 'Meu Tratamento', desc: 'Plano de tratamento e procedimentos' },
          { href: '/portal/documentos', label: 'Meus Documentos', desc: 'Contratos e termos de consentimento' },
          { href: '/portal/financeiro', label: 'Financeiro', desc: 'Pagamentos realizados e parcelas em aberto' },
          { href: '/portal/consultas', label: 'Minhas Consultas', desc: 'Histórico de consultas' },
          { href: '/portal/perfil', label: 'Meu Perfil', desc: 'Seus dados cadastrais' },
        ].map(l => (
          <Link key={l.href} href={l.href} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 18px', textDecoration: 'none',
            background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 12,
          }}>
            <div>
              <div style={{ color: '#1C1C1C', fontSize: 13, fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}>{l.label}</div>
              <div style={{ color: '#6B6B66', fontSize: 11, marginTop: 2 }}>{l.desc}</div>
            </div>
            <span style={{ color: '#1F7A4D', fontSize: 18 }}>›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
