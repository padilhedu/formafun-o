'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import SignaturePad from 'signature_pad';
import DOMPurify from 'dompurify';

export interface CampoPaciente {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'cpf';
  options?: string[];
  placeholder?: string;
}

interface Props {
  token: string;
  contratoId: string;
  contratoHtml: string;
  pacienteNome: string;
  pacienteEmail: string | null;
  clinicaNome: string;
  clinicaTelefone: string;
  camposPaciente: CampoPaciente[] | null;
}

function sanitize(html: string) {
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p','br','strong','em','u','h1','h2','h3','h4','h5','h6','table','thead','tbody','tr','th','td','ul','ol','li','div','span'],
    ALLOWED_ATTR: ['style','colspan','rowspan'],
    FORBID_TAGS: ['script','iframe','object','embed','form','input','button'],
    FORBID_ATTR: ['onerror','onload','onclick','onmouseover'],
  });
}

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
          .replace(/(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
}

export function AssinarClient({
  token, contratoId, contratoHtml: rawHtml, pacienteNome, pacienteEmail,
  clinicaNome, clinicaTelefone, camposPaciente,
}: Props) {
  const temCamposPaciente = Array.isArray(camposPaciente) && camposPaciente.length > 0;

  // Steps: se há campos do paciente → [Dados, Leitura, Identificação, Assinatura]
  //        caso contrário           → [Leitura, Identificação, Assinatura]
  const STEPS = temCamposPaciente
    ? ['Dados', 'Leitura', 'Identificação', 'Assinatura']
    : ['Leitura', 'Identificação', 'Assinatura'];

  const [step, setStep] = useState(0);
  const [contratoHtml, setContratoHtml] = useState(sanitize(rawHtml));
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [recusaOpen, setRecusaOpen] = useState(false);
  const [recusaMotivo, setRecusaMotivo] = useState('');
  const [recusandoLoading, setRecusandoLoading] = useState(false);

  // Step "Dados" — campos do paciente
  const [dadosPaciente, setDadosPaciente] = useState<Record<string, string>>({});
  const [dadosErrors, setDadosErrors] = useState<Record<string, string>>({});
  const [enviandoDados, setEnviandoDados] = useState(false);
  const [erroDados, setErroDados] = useState('');

  // Step "Identificação"
  const [nome, setNome] = useState(pacienteNome);
  const [cpf, setCpf] = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const [email, setEmail] = useState(pacienteEmail ?? '');
  const [declaracao, setDeclaracao] = useState(false);
  const [idErrors, setIdErrors] = useState<Record<string, string>>({});

  // Step "Assinatura"
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  // Índices reais de cada passo (depende de temCamposPaciente)
  const stepLeitura = temCamposPaciente ? 1 : 0;
  const stepId = temCamposPaciente ? 2 : 1;
  const stepAssinatura = temCamposPaciente ? 3 : 2;

  useEffect(() => {
    fetch(`/api/contratos/${contratoId}/visualizado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).catch(() => {});
  }, [contratoId, token]);

  useEffect(() => {
    if (step !== stepLeitura || !endRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setScrolledToEnd(true);
    }, { threshold: 0.8 });
    obs.observe(endRef.current);
    return () => obs.disconnect();
  }, [step, stepLeitura]);

  useEffect(() => {
    if (step !== stepAssinatura || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.scale(ratio, ratio); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    };
    resize();
    padRef.current = new SignaturePad(canvas, { penColor: '#000', minWidth: 1.5, maxWidth: 2.5, backgroundColor: 'rgb(255,255,255)' });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [step, stepAssinatura]);

  const requestGeo = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
    }, () => {});
  }, []);

  // ── Validar e submeter campos do paciente ────────────────────────────────────
  async function handleSubmitDados() {
    if (!camposPaciente) return;
    const errs: Record<string, string> = {};
    for (const campo of camposPaciente) {
      const v = (dadosPaciente[campo.key] ?? '').trim();
      if (!v) {
        errs[campo.key] = `${campo.label} é obrigatório`;
      } else if (campo.type === 'cpf') {
        if (v.replace(/\D/g, '').length !== 11) errs[campo.key] = 'CPF inválido (11 dígitos)';
      }
    }
    setDadosErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setEnviandoDados(true);
    setErroDados('');
    try {
      const res = await fetch(`/api/contratos/${contratoId}/completar-dados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, dados_paciente: dadosPaciente }),
      });
      const json = await res.json() as { corpo_html_final?: string; error?: string };
      if (!res.ok) { setErroDados(json.error ?? 'Erro ao salvar dados.'); return; }
      if (json.corpo_html_final) setContratoHtml(sanitize(json.corpo_html_final));
      setStep(stepLeitura);
    } catch {
      setErroDados('Erro de conexão. Tente novamente.');
    } finally {
      setEnviandoDados(false);
    }
  }

  // ── Validar identificação ────────────────────────────────────────────────────
  function validateId() {
    const errs: Record<string, string> = {};
    if (!nome.trim() || nome.trim().split(/\s+/).length < 2) errs.nome = 'Informe o nome completo (mínimo 2 palavras)';
    const rawCpf = cpf.replace(/\D/g, '');
    if (rawCpf.length !== 11) errs.cpf = 'CPF inválido';
    if (!dataNasc) errs.dataNasc = 'Data de nascimento obrigatória';
    else {
      const nasc = new Date(dataNasc);
      const limite = new Date(); limite.setFullYear(limite.getFullYear() - 18);
      if (isNaN(nasc.getTime()) || nasc > limite) errs.dataNasc = 'É necessário ter 18 anos ou mais';
    }
    if (!declaracao) errs.declaracao = 'Você deve aceitar os termos';
    setIdErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleRecusa() {
    if (!recusaMotivo.trim()) return;
    setRecusandoLoading(true);
    await fetch('/api/contratos/recusar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, motivo: recusaMotivo }),
    });
    window.location.href = `/assinar/${token}/recusado`;
  }

  async function handleConfirmarAssinatura() {
    if (!padRef.current || padRef.current.isEmpty()) {
      setSubmitError('Por favor, assine no campo acima antes de confirmar.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    const signaturePng = padRef.current.toDataURL('image/png');
    try {
      const res = await fetch('/api/contratos/assinar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nome: nome.trim(), cpf: cpf.replace(/\D/g, ''), data_nascimento: dataNasc, email: email.trim() || null, signature_png_base64: signaturePng, lat, lng }),
      });
      const json = await res.json();
      if (!res.ok) { setSubmitError(json.error ?? 'Erro ao processar assinatura.'); setSubmitting(false); return; }
      window.location.href = `/assinar/${token}/obrigado?email=${encodeURIComponent(email.trim())}`;
    } catch {
      setSubmitError('Erro de conexão. Tente novamente.');
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(180,160,100,0.3)',
    background: 'rgba(255,255,255,0.04)', color: '#1C1C1C', fontSize: 16,
    fontFamily: 'var(--font-montserrat,sans-serif)', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: '#D9C9A3', fontFamily: 'var(--font-montserrat,sans-serif)',
    marginBottom: 6, display: 'block', fontWeight: 500,
  };
  const errStyle: React.CSSProperties = { color: '#F87171', fontSize: 12, marginTop: 4, fontFamily: 'var(--font-montserrat,sans-serif)' };

  function renderCampo(campo: CampoPaciente) {
    const v = dadosPaciente[campo.key] ?? '';
    const err = dadosErrors[campo.key];
    const set = (val: string) => setDadosPaciente(prev => ({ ...prev, [campo.key]: val }));

    return (
      <div key={campo.key} style={{ marginBottom: 16 }}>
        <label style={labelStyle}>{campo.label} *</label>
        {campo.type === 'select' && campo.options ? (
          <select style={{ ...inputStyle, background: '#fff' }} value={v} onChange={e => set(e.target.value)}>
            <option value="">Selecione...</option>
            {campo.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : campo.type === 'cpf' ? (
          <input style={inputStyle} value={formatCPF(v)} onChange={e => set(formatCPF(e.target.value))} placeholder={campo.placeholder ?? '000.000.000-00'} inputMode="numeric" />
        ) : (
          <input
            style={inputStyle}
            type={campo.type === 'number' ? 'number' : 'text'}
            value={v}
            onChange={e => set(e.target.value)}
            placeholder={campo.placeholder ?? ''}
          />
        )}
        {err && <p style={errStyle}>{err}</p>}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', color: '#1C1C1C', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 60px' }}>
      {/* Topbar */}
      <div style={{ width: '100%', background: '#121214', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 20px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontFamily: 'var(--font-cormorant,serif)', fontSize: 18, color: '#1F7A4D', fontWeight: 600 }}>{clinicaNome}</p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Assinatura Eletrônica de Documento</p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 0', width: '100%', maxWidth: 520, padding: '0 20px', boxSizing: 'border-box' }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', background: i <= step ? '#1F7A4D' : 'rgba(138,138,147,0.2)', color: i <= step ? '#0A0A0B' : '#6B6B66', border: i === step ? '2px solid #D9C9A3' : 'none', transition: 'all .3s' }}>
                {i < step ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#0A0A0B" strokeWidth="2"><path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg> : i + 1}
              </div>
              <span style={{ fontSize: 9, marginTop: 4, color: i === step ? '#D9C9A3' : '#6B6B66', fontFamily: 'var(--font-montserrat,sans-serif)', textAlign: 'center' }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? '#1F7A4D' : 'rgba(138,138,147,0.2)', margin: '0 2px', marginBottom: 18 }} />}
          </div>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 480, padding: '0 20px', boxSizing: 'border-box', marginTop: 24 }}>

        {/* PASSO 0 — Preencher dados do paciente (apenas quando temCamposPaciente) */}
        {temCamposPaciente && step === 0 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 22, color: '#1F7A4D', margin: '0 0 6px' }}>Complete seus dados</h2>
            <p style={{ fontSize: 13, color: '#6B6B66', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: 24 }}>
              Estas informações serão inseridas no documento antes da sua assinatura.
            </p>
            {camposPaciente!.map(renderCampo)}
            {erroDados && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', fontSize: 13, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                {erroDados}
              </div>
            )}
            <button
              onClick={handleSubmitDados}
              disabled={enviandoDados}
              style={{ width: '100%', padding: '14px', borderRadius: 10, background: enviandoDados ? 'rgba(31,122,77,0.5)' : '#1F7A4D', color: '#0A0A0B', fontWeight: 700, fontSize: 15, border: 'none', cursor: enviandoDados ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}
            >
              {enviandoDados ? 'Salvando...' : 'Continuar →'}
            </button>
          </div>
        )}

        {/* PASSO Leitura */}
        {step === stepLeitura && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 22, color: '#1F7A4D', margin: '0 0 16px' }}>Leia o documento completo</h2>
            <div
              style={{ background: '#fff', color: '#1a1a1a', borderRadius: 12, padding: 20, maxHeight: '55vh', overflowY: 'auto', fontSize: 14, lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: contratoHtml }}
            />
            <div ref={endRef} style={{ height: 1 }} />
            {!scrolledToEnd && (
              <p style={{ fontSize: 12, color: '#FBBF24', textAlign: 'center', marginTop: 10, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                Role até o final para ler o documento completo
              </p>
            )}
            <button
              onClick={() => setStep(stepId)}
              disabled={!scrolledToEnd}
              style={{ width: '100%', marginTop: 16, padding: '14px', borderRadius: 10, background: scrolledToEnd ? '#1F7A4D' : 'rgba(31,122,77,0.3)', color: scrolledToEnd ? '#0A0A0B' : '#6B6B66', fontWeight: 700, fontSize: 15, border: 'none', cursor: scrolledToEnd ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-montserrat,sans-serif)', transition: 'all .2s' }}
            >
              Li e aceito o documento
            </button>
            <button
              onClick={() => setRecusaOpen(true)}
              style={{ width: '100%', marginTop: 10, padding: '12px', borderRadius: 10, background: 'transparent', color: '#F87171', fontWeight: 500, fontSize: 13, border: '1px solid rgba(248,113,113,0.3)', cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}
            >
              Não concordo com os termos
            </button>
          </div>
        )}

        {/* PASSO Identificação */}
        {step === stepId && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 22, color: '#1F7A4D', margin: '0 0 20px' }}>Seus dados de identificação</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Nome completo *</label>
              <input style={inputStyle} value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
              {idErrors.nome && <p style={errStyle}>{idErrors.nome}</p>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>CPF *</label>
              <input style={inputStyle} value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" />
              {idErrors.cpf && <p style={errStyle}>{idErrors.cpf}</p>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Data de nascimento *</label>
              <input style={inputStyle} type="date" value={dataNasc} onChange={e => setDataNasc(e.target.value)} />
              {idErrors.dataNasc && <p style={errStyle}>{idErrors.dataNasc}</p>}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>E-mail (para receber o PDF)</label>
              <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 20 }}>
              <input type="checkbox" checked={declaracao} onChange={e => { setDeclaracao(e.target.checked); requestGeo(); }} style={{ width: 18, height: 18, marginTop: 2, accentColor: '#1F7A4D', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#D9C9A3', fontFamily: 'var(--font-montserrat,sans-serif)', lineHeight: 1.5 }}>
                Declaro que li o documento integralmente e concordo com todos os termos, ciente de que esta assinatura eletrônica possui validade jurídica conforme a Medida Provisória 2.200-2/2001.
              </span>
            </label>
            {idErrors.declaracao && <p style={errStyle}>{idErrors.declaracao}</p>}
            <button
              onClick={() => { if (validateId()) setStep(stepAssinatura); }}
              style={{ width: '100%', padding: '14px', borderRadius: 10, background: '#1F7A4D', color: '#0A0A0B', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}
            >
              Continuar →
            </button>
          </div>
        )}

        {/* PASSO Assinatura */}
        {step === stepAssinatura && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 22, color: '#1F7A4D', margin: '0 0 8px' }}>Assine abaixo</h2>
            <p style={{ fontSize: 13, color: '#6B6B66', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: 16 }}>
              Assine com o dedo ou mouse
            </p>
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(31,122,77,0.4)' }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: 200, display: 'block', touchAction: 'none' }} />
            </div>
            <button onClick={() => padRef.current?.clear()} style={{ marginTop: 8, padding: '8px 16px', borderRadius: 8, background: 'transparent', color: '#6B6B66', border: '1px solid rgba(138,138,147,0.3)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              Limpar
            </button>
            {submitError && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', fontSize: 13, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                {submitError}
              </div>
            )}
            <button
              onClick={handleConfirmarAssinatura}
              disabled={submitting}
              style={{ width: '100%', marginTop: 16, padding: '15px', borderRadius: 10, background: submitting ? 'rgba(31,122,77,0.5)' : '#1F7A4D', color: '#0A0A0B', fontWeight: 700, fontSize: 16, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}
            >
              {submitting ? 'Processando...' : 'Confirmar assinatura'}
            </button>
          </div>
        )}
      </div>

      {/* Modal de recusa */}
      {recusaOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 }}>
          <div style={{ background: '#121214', borderRadius: 16, padding: 24, width: '100%', maxWidth: 440, border: '1px solid rgba(248,113,113,0.3)' }}>
            <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 20, color: '#F87171', margin: '0 0 12px' }}>Recusar documento</h3>
            <p style={{ fontSize: 13, color: '#D9C9A3', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: 12 }}>Informe o motivo. A clínica será notificada.</p>
            <textarea value={recusaMotivo} onChange={e => setRecusaMotivo(e.target.value)} rows={4} placeholder="Descreva o motivo..." style={{ ...inputStyle, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setRecusaOpen(false)} style={{ flex: 1, padding: 12, borderRadius: 8, background: 'transparent', color: '#6B6B66', border: '1px solid rgba(138,138,147,0.3)', cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-montserrat,sans-serif)' }}>Cancelar</button>
              <button onClick={handleRecusa} disabled={!recusaMotivo.trim() || recusandoLoading} style={{ flex: 1, padding: 12, borderRadius: 8, background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)', cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600 }}>
                {recusandoLoading ? 'Enviando...' : 'Confirmar recusa'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Dúvidas? Contate a clínica: {clinicaTelefone}</p>
      </div>
    </div>
  );
}
