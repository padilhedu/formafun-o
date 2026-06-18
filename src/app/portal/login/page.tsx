'use client';

import { useState } from 'react';

export default function PortalLoginPage() {
  const [modo, setModo] = useState<'magic' | 'convite'>('magic');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [enviado, setEnviado] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg('');
    const res = await fetch('/api/portal/magic-link', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) { setEnviado(true); }
    else { const d = await res.json(); setMsg(d.error ?? 'Erro ao enviar link'); }
  }

  async function handleConvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg('');
    const res = await fetch('/api/portal/primeiro-acesso', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, cpf, senha }),
    });
    setLoading(false);
    if (res.ok) { window.location.href = '/portal'; }
    else { const d = await res.json(); setMsg(d.error ?? 'Código ou CPF inválido'); }
  }

  return (
    <div style={{ maxWidth: 380, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', color: '#1F7A4D', fontSize: '2rem', fontWeight: 600, margin: 0 }}>
          Forma & Função
        </h1>
        <p style={{ color: '#6B6B66', fontSize: 13, marginTop: 4 }}>Portal do Paciente</p>
      </div>

      {/* Mode switch */}
      <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
        <button onClick={() => setModo('magic')} style={{
          flex: 1, padding: '10px', fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 600,
          background: modo === 'magic' ? 'rgba(31,122,77,0.15)' : 'transparent',
          color: modo === 'magic' ? '#1F7A4D' : '#6B6B66',
          border: 'none', cursor: 'pointer',
        }}>
          Link por E-mail
        </button>
        <button onClick={() => setModo('convite')} style={{
          flex: 1, padding: '10px', fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 600,
          background: modo === 'convite' ? 'rgba(31,122,77,0.15)' : 'transparent',
          color: modo === 'convite' ? '#1F7A4D' : '#6B6B66',
          border: 'none', cursor: 'pointer',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        }}>
          Código de Convite
        </button>
      </div>

      <div className="card" style={{ padding: 24, borderRadius: 16 }}>
        {modo === 'magic' ? (
          enviado ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
              <p style={{ color: '#4ADE80', fontFamily: 'var(--font-montserrat)', fontWeight: 600, marginBottom: 8 }}>Link enviado!</p>
              <p style={{ color: '#6B6B66', fontSize: 13 }}>Verifique seu e-mail <strong style={{ color: '#1C1C1C' }}>{email}</strong> e clique no link para entrar.</p>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label style={{ fontSize: 11, color: '#6B6B66', display: 'block', marginBottom: 6, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  E-mail cadastrado
                </label>
                <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com" required style={{ fontSize: 14 }} />
              </div>
              {msg && <p style={{ color: '#F87171', fontSize: 12 }}>{msg}</p>}
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: 13 }}>
                {loading ? 'Enviando...' : 'Enviar link de acesso'}
              </button>
              <p style={{ fontSize: 11, color: '#6B6B66', textAlign: 'center' }}>Você receberá um link seguro por e-mail. Não é necessário senha.</p>
            </form>
          )
        ) : (
          <form onSubmit={handleConvite} className="space-y-4">
            <div>
              <label style={{ fontSize: 11, color: '#6B6B66', display: 'block', marginBottom: 6, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Código de Convite
              </label>
              <input className="input-field" value={codigo} onChange={e => setCodigo(e.target.value)}
                placeholder="Código fornecido pela clínica" required style={{ fontSize: 14, letterSpacing: '0.1em' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#6B6B66', display: 'block', marginBottom: 6, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CPF (confirmação)
              </label>
              <input className="input-field" value={cpf} onChange={e => setCpf(e.target.value)}
                placeholder="000.000.000-00" required style={{ fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#6B6B66', display: 'block', marginBottom: 6, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Criar senha de acesso
              </label>
              <input type="password" className="input-field" value={senha} onChange={e => setSenha(e.target.value)}
                placeholder="Mínimo 8 caracteres" required minLength={8} style={{ fontSize: 14 }} />
            </div>
            {msg && <p style={{ color: '#F87171', fontSize: 12 }}>{msg}</p>}
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: 13 }}>
              {loading ? 'Verificando...' : 'Ativar meu acesso'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
