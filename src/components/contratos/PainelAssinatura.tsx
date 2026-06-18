'use client';

import { useState, useEffect, useRef } from 'react';
import { mascararCPF } from '@/lib/cpf';

interface ContratoAssinatura {
  id: string;
  codigo: string;
  status: string;
  sign_token?: string | null;
  sign_token_exp?: string | null;
  enviado_em?: string | null;
  visualizado_em?: string | null;
  assinado_em?: string | null;
  recusado_em?: string | null;
  recusa_motivo?: string | null;
  signer_nome?: string | null;
  signer_cpf?: string | null;
  signer_ip?: string | null;
  signer_user_agent?: string | null;
  pdf_signed_url?: string | null;
  orcamento_id?: string | null;
}

interface Props {
  contrato: ContratoAssinatura;
  onAtualizar?: () => void;
}

function StepDot({ ativo, concluido, label }: { ativo: boolean; concluido: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-montserrat)',
        background: concluido ? '#1F7A4D' : ativo ? 'rgba(31,122,77,0.2)' : 'rgba(138,138,147,0.15)',
        color: concluido ? '#F5F3EF' : ativo ? '#1F7A4D' : '#6B6B66',
        border: ativo ? '2px solid #1F7A4D' : concluido ? 'none' : '1px solid rgba(138,138,147,0.2)',
      }}>
        {concluido ? '✓' : ''}
      </div>
      <span style={{ fontSize: 10, color: ativo ? '#6B6B66' : concluido ? '#1F7A4D' : '#6B6B66', fontFamily: 'var(--font-montserrat)', textAlign: 'center' }}>
        {label}
      </span>
    </div>
  );
}

function StepLine({ ativo }: { ativo: boolean }) {
  return <div style={{ flex: 1, height: 1, background: ativo ? '#1F7A4D' : 'rgba(138,138,147,0.2)', margin: '0 4px 20px', alignSelf: 'center' }} />;
}

const STEP_ORDER = ['rascunho', 'enviado', 'visualizado', 'assinado'];

export function PainelAssinatura({ contrato: c, onAtualizar }: Props) {
  const [loading, setLoading] = useState(false);
  const [linkGerado, setLinkGerado] = useState<string | null>(null);
  const [statusLocal, setStatusLocal] = useState<string | null>(null);
  const [expLocal, setExpLocal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmNewLink, setConfirmNewLink] = useState(false);
  const [reenvioOk, setReenvioOk] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Status efetivo: prioriza estado local (atualizado sem refresh)
  const status = statusLocal ?? c.status;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const signUrl = linkGerado ?? (c.sign_token ? `${appUrl}/assinar/${c.sign_token}` : null);
  const expStr = expLocal
    ? new Date(expLocal).toLocaleDateString('pt-BR')
    : c.sign_token_exp
      ? new Date(c.sign_token_exp).toLocaleDateString('pt-BR')
      : null;

  const step = STEP_ORDER.indexOf(status);
  const isTerminal = status === 'recusado' || status === 'cancelado';

  // Polling a cada 30s quando enviado ou visualizado
  useEffect(() => {
    const shouldPoll = status === 'enviado' || status === 'visualizado';
    if (!shouldPoll) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/contratos/${c.id}/status`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.status && json.status !== status) {
          setStatusLocal(json.status);
          onAtualizar?.();
        }
      } catch {}
    }, 30_000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [status, c.id, onAtualizar]);

  async function gerarLink(force = false) {
    if (!force && status === 'enviado' && !confirmNewLink) {
      setConfirmNewLink(true);
      return;
    }
    setConfirmNewLink(false);
    setLoading(true); setErro('');
    const res = await fetch(`/api/contratos/${c.id}/gerar-link`, { method: 'POST' });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setErro(json.error ?? 'Erro ao gerar link'); return; }
    // Atualiza estado local imediatamente — sem esperar router.refresh()
    setLinkGerado(json.sign_url);
    setStatusLocal('enviado');
    if (json.sign_token_exp) setExpLocal(json.sign_token_exp);
    onAtualizar?.();
  }

  async function copiarLink() {
    if (!signUrl) return;
    await navigator.clipboard.writeText(signUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function reenviarPdf() {
    setLoading(true);
    const res = await fetch(`/api/contratos/${c.id}/reenviar-pdf`, { method: 'POST' });
    setLoading(false);
    if (res.ok) { setReenvioOk(true); setTimeout(() => setReenvioOk(false), 3000); }
    else { const j = await res.json(); setErro(j.error ?? 'Erro ao reenviar'); }
  }

  function downloadPdf() {
    if (!c.sign_token) return;
    window.open(`/api/contratos/${c.id}/download-publico?token=${c.sign_token}`, '_blank');
  }

  const cardStyle: React.CSSProperties = { background: '#FAF8F4', borderRadius: 12, padding: 16, border: '1px solid rgba(0,0,0,0.08)', marginTop: 12 };
  const labelSmall: React.CSSProperties = { fontSize: 10, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 };

  return (
    <div>
      <p style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
        Status da Assinatura
      </p>

      {/* Timeline */}
      {!isTerminal && (
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20 }}>
          <StepDot ativo={step === 0} concluido={step > 0} label="Rascunho" />
          <StepLine ativo={step >= 1} />
          <StepDot ativo={step === 1} concluido={step > 1} label="Enviado" />
          <StepLine ativo={step >= 2} />
          <StepDot ativo={step === 2} concluido={step > 2} label="Visualizado" />
          <StepLine ativo={step >= 3} />
          <StepDot ativo={step === 3} concluido={false} label="Assinado" />
        </div>
      )}

      {/* Estado: RASCUNHO */}
      {status === 'rascunho' && (
        <div>
          <p style={{ fontSize: 13, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', marginBottom: 12 }}>
            Gere o link de assinatura e envie ao paciente pelo WhatsApp.
          </p>
          <button
            onClick={() => gerarLink(true)}
            disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#1F7A4D', color: '#F5F3EF', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-montserrat)', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Gerando...' : 'Gerar link de assinatura'}
          </button>
          <a
            href={`/api/contratos/${c.id}/pdf`}
            target="_blank"
            style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 12, color: '#6B6B66', textDecoration: 'underline', fontFamily: 'var(--font-montserrat)' }}
          >
            Pré-visualizar contrato
          </a>
        </div>
      )}

      {/* Estado: ENVIADO / VISUALIZADO */}
      {(status === 'enviado' || status === 'visualizado') && signUrl && (
        <div>
          <div style={{ ...cardStyle, border: '1px solid rgba(96,165,250,0.2)' }}>
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 5, background: 'rgba(96,165,250,0.1)', color: '#60A5FA', fontFamily: 'var(--font-montserrat)', fontWeight: 600, display: 'inline-block', marginBottom: 10 }}>
              {status === 'visualizado' ? 'Visualizado pelo paciente' : 'Aguardando assinatura'}
            </span>
            <p style={labelSmall}>Link de assinatura</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                readOnly
                value={signUrl}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#6B6B66', fontSize: 12, fontFamily: 'monospace' }}
              />
              <button
                onClick={copiarLink}
                style={{ padding: '8px 14px', borderRadius: 8, background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(31,122,77,0.15)', color: copied ? '#1F7A4D' : '#1F7A4D', border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(31,122,77,0.3)'}`, cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                {copied ? '✓ Copiado!' : 'Copiar'}
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', marginTop: 8 }}>
              Envie este link pelo WhatsApp. O paciente não precisa criar conta para assinar.
            </p>
            {expStr && (
              <p style={{ fontSize: 11, color: '#C98A1E', fontFamily: 'var(--font-montserrat)', marginTop: 4 }}>
                Link válido até {expStr}
              </p>
            )}
          </div>

          {confirmNewLink ? (
            <div style={{ ...cardStyle, border: '1px solid rgba(251,191,36,0.3)' }}>
              <p style={{ fontSize: 13, color: '#C98A1E', fontFamily: 'var(--font-montserrat)', marginBottom: 10 }}>
                Isso invalidará o link anterior. O paciente precisará usar o novo link. Confirmar?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmNewLink(false)} style={{ flex: 1, padding: 10, borderRadius: 8, background: 'transparent', color: '#6B6B66', border: '1px solid rgba(138,138,147,0.3)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-montserrat)' }}>Cancelar</button>
                <button onClick={() => gerarLink(true)} style={{ flex: 1, padding: 10, borderRadius: 8, background: 'rgba(251,191,36,0.1)', color: '#C98A1E', border: '1px solid rgba(251,191,36,0.3)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}>Gerar novo link</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => gerarLink()}
              disabled={loading}
              style={{ marginTop: 10, padding: '9px 14px', borderRadius: 8, background: 'transparent', color: '#6B6B66', border: '1px solid rgba(138,138,147,0.2)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-montserrat)' }}
            >
              ↺ Gerar novo link
            </button>
          )}

          {c.visualizado_em && (
            <p style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', marginTop: 8 }}>
              Visualizado em {new Date(c.visualizado_em).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      )}

      {/* Estado: ASSINADO */}
      {status === 'assinado' && (
        <div>
          <div style={{ ...cardStyle, border: '1px solid rgba(74,222,128,0.25)', background: 'rgba(74,222,128,0.04)' }}>
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 5, background: 'rgba(74,222,128,0.12)', color: '#1F7A4D', fontFamily: 'var(--font-montserrat)', fontWeight: 600, display: 'inline-block', marginBottom: 12 }}>
              Contrato assinado — Orçamento travado
            </span>
            {c.assinado_em && (
              <p style={{ ...labelSmall, marginBottom: 2 }}>
                Assinado em {new Date(c.assinado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </p>
            )}
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {c.signer_nome && (
                <div><p style={labelSmall}>Signatário</p><p style={{ fontSize: 12, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', margin: 0 }}>{c.signer_nome}</p></div>
              )}
              {c.signer_cpf && (
                <div><p style={labelSmall}>CPF</p><p style={{ fontSize: 12, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', margin: 0 }}>{mascararCPF(c.signer_cpf)}</p></div>
              )}
              {c.signer_ip && (
                <div><p style={labelSmall}>IP</p><p style={{ fontSize: 12, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', margin: 0 }}>{c.signer_ip}</p></div>
              )}
              {c.signer_user_agent && (
                <div style={{ gridColumn: '1 / -1' }}><p style={labelSmall}>Dispositivo</p><p style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'monospace', margin: 0, wordBreak: 'break-all' }}>{c.signer_user_agent.slice(0, 80)}</p></div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={downloadPdf}
              style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'rgba(31,122,77,0.12)', color: '#1F7A4D', border: '1px solid rgba(31,122,77,0.3)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}
            >
              Baixar PDF assinado
            </button>
            <button
              onClick={reenviarPdf}
              disabled={loading || reenvioOk}
              style={{ flex: 1, padding: '10px', borderRadius: 8, background: reenvioOk ? 'rgba(74,222,128,0.1)' : 'transparent', color: reenvioOk ? '#1F7A4D' : '#6B6B66', border: `1px solid ${reenvioOk ? 'rgba(74,222,128,0.3)' : 'rgba(138,138,147,0.2)'}`, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-montserrat)' }}
            >
              {reenvioOk ? '✓ Enviado!' : 'Reenviar e-mail'}
            </button>
          </div>
        </div>
      )}

      {/* Estado: RECUSADO */}
      {status === 'recusado' && (
        <div style={{ ...cardStyle, border: '1px solid rgba(248,113,113,0.25)' }}>
          <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 5, background: 'rgba(248,113,113,0.1)', color: '#C0392B', fontFamily: 'var(--font-montserrat)', fontWeight: 600, display: 'inline-block', marginBottom: 10 }}>
            Contrato recusado
          </span>
          {c.recusado_em && (
            <p style={{ fontSize: 12, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', marginBottom: 8 }}>
              Em {new Date(c.recusado_em).toLocaleString('pt-BR')}
            </p>
          )}
          {c.recusa_motivo && (
            <div style={{ background: 'rgba(248,113,113,0.06)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
              <p style={labelSmall}>Motivo da recusa</p>
              <p style={{ fontSize: 13, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', margin: 0 }}>{c.recusa_motivo}</p>
            </div>
          )}
          <a
            href={`/contratos/novo?orcamento=${c.orcamento_id ?? ''}`}
            style={{ display: 'block', textAlign: 'center', padding: '10px', borderRadius: 8, background: 'rgba(31,122,77,0.1)', color: '#1F7A4D', border: '1px solid rgba(31,122,77,0.3)', fontSize: 13, textDecoration: 'none', fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}
          >
            Gerar novo contrato
          </a>
        </div>
      )}

      {/* Estado: CANCELADO */}
      {status === 'cancelado' && (
        <div style={{ ...cardStyle }}>
          <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 5, background: 'rgba(138,138,147,0.1)', color: '#6B6B66', fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}>
            Cancelado
          </span>
        </div>
      )}

      {erro && (
        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#C0392B', fontSize: 13, fontFamily: 'var(--font-montserrat)' }}>
          {erro}
        </div>
      )}
    </div>
  );
}
