'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ContaReceberComPaciente, ContaStatus, FormaPagamento } from '@/types/financeiro';
import { CONTA_STATUS_CONFIG, FORMA_PAGAMENTO_LABELS, formatBRL } from '@/types/financeiro';

type Filtro = 'todos' | 'pendente' | 'vencido' | 'pago' | 'cancelado';

interface Props {
  contas: ContaReceberComPaciente[];
  filtroInicial: Filtro;
}

const hojeStr = () => new Date().toISOString().slice(0, 10);

function statusEfetivo(c: ContaReceberComPaciente): ContaStatus {
  if (c.status === 'pendente' && c.vencimento < hojeStr()) return 'vencido';
  return c.status;
}

export function ReceberClient({ contas, filtroInicial }: Props) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial);
  const [baixaConta, setBaixaConta] = useState<ContaReceberComPaciente | null>(null);
  const [novaConta, setNovaConta] = useState(false);
  const [loading, setLoading] = useState('');
  const [erro, setErro] = useState('');
  const [stripeLink, setStripeLink] = useState<{ url: string; codigo: string } | null>(null);

  const filtradas = useMemo(() => {
    if (filtro === 'todos') return contas;
    return contas.filter(c => statusEfetivo(c) === filtro);
  }, [contas, filtro]);

  const totais = useMemo(() => {
    const t: Record<Filtro, { count: number; valor: number }> = {
      todos: { count: 0, valor: 0 }, pendente: { count: 0, valor: 0 },
      vencido: { count: 0, valor: 0 }, pago: { count: 0, valor: 0 }, cancelado: { count: 0, valor: 0 },
    };
    for (const c of contas) {
      const s = statusEfetivo(c);
      t.todos.count++; t.todos.valor += Number(c.valor);
      t[s as Filtro].count++; t[s as Filtro].valor += Number(c.valor);
    }
    return t;
  }, [contas]);

  const gerarVindi = async (conta: ContaReceberComPaciente) => {
    setLoading('vindi-' + conta.id);
    setErro('');
    try {
      const res = await fetch(`/api/financeiro/receber/${conta.id}/vindi`, { method: 'POST' });
      const data = await res.json() as { _dev_mode?: boolean; message?: string; error?: string };
      if (!res.ok) setErro(data.error ?? 'Erro Vindi');
      else if (data._dev_mode) setErro(data.message ?? 'Modo dev');
      else router.refresh();
    } finally {
      setLoading('');
    }
  };

  const gerarStripe = async (conta: ContaReceberComPaciente) => {
    setLoading('stripe-' + conta.id);
    setErro('');
    try {
      const res = await fetch('/api/pagamentos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conta_receber_id: conta.id }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) { setErro(data.error ?? 'Erro ao gerar link'); return; }
      setStripeLink({ url: data.url, codigo: conta.codigo });
    } finally {
      setLoading('');
    }
  };

  const cancelar = async (conta: ContaReceberComPaciente) => {
    setLoading('cancel-' + conta.id);
    try {
      await fetch(`/api/financeiro/receber/${conta.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelado' }),
      });
      router.refresh();
    } finally {
      setLoading('');
    }
  };

  const FILTROS: { key: Filtro; label: string; cor: string }[] = [
    { key: 'todos', label: 'Todos', cor: '#6B6B66' },
    { key: 'pendente', label: 'Pendentes', cor: '#C98A1E' },
    { key: 'vencido', label: 'Vencidos', cor: '#C0392B' },
    { key: 'pago', label: 'Pagos', cor: '#1F7A4D' },
    { key: 'cancelado', label: 'Cancelados', cor: '#6B6B66' },
  ];

  return (
    <div>
      {/* Filtro cards */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className="card text-left transition-colors"
            style={{
              padding: '12px 18px', minWidth: 130, cursor: 'pointer',
              border: `1px solid ${filtro === f.key ? f.cor : 'rgba(0,0,0,0.08)'}`,
            }}
          >
            <div style={{ fontSize: 10, color: f.cor, fontFamily: 'var(--font-montserrat)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {f.label}
            </div>
            <div className="text-offwhite font-bold" style={{ fontFamily: 'var(--font-montserrat)', fontSize: 16 }}>
              {totais[f.key].count} <span className="text-muted" style={{ fontSize: 11, fontWeight: 400 }}>· {formatBRL(totais[f.key].valor)}</span>
            </div>
          </button>
        ))}
        <button
          onClick={() => setNovaConta(true)}
          className="btn-primary text-xs ml-auto self-center"
          style={{ padding: '10px 18px' }}
        >
          + Nova Cobrança
        </button>
      </div>

      {erro && (
        <div className="mb-4 px-4 py-2.5 rounded-lg" style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)' }}>
          <span style={{ fontSize: 12, color: '#C98A1E', fontFamily: 'var(--font-montserrat)' }}>{erro}</span>
        </div>
      )}

      {/* Table */}
      {filtradas.length === 0 ? (
        <div className="card text-center py-16" style={{ borderStyle: 'dashed', borderColor: 'rgba(31,122,77,0.15)' }}>
          <p className="text-muted text-sm">Nenhuma cobrança neste filtro.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Código', 'Paciente', 'Descrição', 'Vencimento', 'Valor', 'Status', 'Pagamento', ''].map(h => (
                  <th key={h} className="table-header" style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map(c => {
                const st = statusEfetivo(c);
                const cfg = CONTA_STATUS_CONFIG[st];
                return (
                  <tr key={c.id} className="table-row-hover" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: '11px 14px' }}>
                      <span className="text-gold" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', fontWeight: 500 }}>{c.codigo}</span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {c.paciente_id ? (
                        <Link href={`/pacientes/${c.paciente_id}`} className="text-offwhite hover:text-gold transition-colors" style={{ fontSize: 12 }}>
                          {c.pacientes?.nome ?? '—'}
                        </Link>
                      ) : <span className="text-muted" style={{ fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span className="text-offwhite" style={{ fontSize: 12 }}>{c.descricao}</span>
                      {c.orcamentos?.codigo && (
                        <span className="text-muted block" style={{ fontSize: 10 }}>{c.orcamentos.codigo}</span>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 12, color: st === 'vencido' ? '#C0392B' : '#1C1C1C' }}>
                        {new Date(c.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span className="text-offwhite font-semibold" style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)' }}>{formatBRL(Number(c.valor))}</span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 9 }}>
                        {cfg.label.toUpperCase()}
                      </span>
                      {c.pago_em && (
                        <span className="text-muted block" style={{ fontSize: 9, marginTop: 2 }}>
                          {new Date(c.pago_em).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {c.vindi_url ? (
                        <a href={c.vindi_url} target="_blank" rel="noopener noreferrer" className="text-gold" style={{ fontSize: 11 }}>
                          Link Vindi →
                        </a>
                      ) : c.forma_pagamento ? (
                        <span className="text-muted" style={{ fontSize: 11 }}>{FORMA_PAGAMENTO_LABELS[c.forma_pagamento as FormaPagamento]}</span>
                      ) : (
                        <span className="text-muted" style={{ fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {(st === 'pendente' || st === 'vencido') && (
                        <>
                          {!c.vindi_bill_id && c.paciente_id && (
                            <button
                              onClick={() => gerarVindi(c)}
                              disabled={!!loading}
                              className="btn-ghost"
                              style={{ fontSize: 10, padding: '4px 10px', marginRight: 6 }}
                            >
                              {loading === 'vindi-' + c.id ? '...' : 'Cobrar Vindi'}
                            </button>
                          )}
                          <button
                            onClick={() => gerarStripe(c)}
                            disabled={!!loading}
                            className="btn-ghost"
                            style={{ fontSize: 10, padding: '4px 10px', marginRight: 6, color: '#1F7A4D' }}
                          >
                            {loading === 'stripe-' + c.id ? '...' : 'Link Stripe'}
                          </button>
                          <button
                            onClick={() => setBaixaConta(c)}
                            className="btn-primary"
                            style={{ fontSize: 10, padding: '4px 10px', marginRight: 6 }}
                          >
                            Dar Baixa
                          </button>
                          <button
                            onClick={() => cancelar(c)}
                            disabled={!!loading}
                            className="btn-ghost"
                            style={{ fontSize: 10, padding: '4px 8px', color: '#C0392B' }}
                          >
                            {loading === 'cancel-' + c.id ? '...' : '✕'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {baixaConta && <BaixaModal conta={baixaConta} onClose={() => setBaixaConta(null)} />}
      {novaConta && <NovaContaModal onClose={() => setNovaConta(false)} />}
      {stripeLink && <StripeLinkModal url={stripeLink.url} codigo={stripeLink.codigo} onClose={() => setStripeLink(null)} />}
    </div>
  );
}

// ============ Modal: dar baixa ============
function BaixaModal({ conta, onClose }: { conta: ContaReceberComPaciente; onClose: () => void }) {
  const router = useRouter();
  const [forma, setForma] = useState<FormaPagamento>(conta.forma_pagamento ?? 'pix');
  const [valorPago, setValorPago] = useState(String(conta.valor));
  const [loading, setLoading] = useState(false);

  const confirmar = async () => {
    setLoading(true);
    try {
      await fetch(`/api/financeiro/receber/${conta.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pago', forma_pagamento: forma, valor_pago: parseFloat(valorPago) || conta.valor }),
      });
      router.refresh();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Dar Baixa" onClose={onClose}>
      <p className="text-muted text-xs mb-4">{conta.codigo} — {conta.descricao}</p>
      <div className="space-y-4">
        <div>
          <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor Recebido</label>
          <input type="number" step="0.01" className="input-field w-full" value={valorPago} onChange={e => setValorPago(e.target.value)} />
        </div>
        <div>
          <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Forma de Pagamento</label>
          <select className="input-field w-full" value={forma} onChange={e => setForma(e.target.value as FormaPagamento)}>
            {(Object.keys(FORMA_PAGAMENTO_LABELS) as FormaPagamento[]).map(k => (
              <option key={k} value={k}>{FORMA_PAGAMENTO_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="btn-ghost text-xs" style={{ padding: '8px 16px' }}>Cancelar</button>
          <button onClick={confirmar} disabled={loading} className="btn-primary text-xs" style={{ padding: '8px 20px' }}>
            {loading ? '...' : 'Confirmar Baixa'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ============ Modal: nova cobrança avulsa ============
function NovaContaModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState(hojeStr());
  const [pacienteBusca, setPacienteBusca] = useState('');
  const [pacientes, setPacientes] = useState<{ id: string; nome: string; cpf: string | null }[]>([]);
  const [pacienteSel, setPacienteSel] = useState<{ id: string; nome: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const buscar = async (q: string) => {
    setPacienteBusca(q);
    if (q.length < 2) { setPacientes([]); return; }
    const res = await fetch(`/api/pacientes?q=${encodeURIComponent(q)}&limit=6`);
    if (res.ok) setPacientes(await res.json());
  };

  const salvar = async () => {
    if (!descricao || !valor || !vencimento) { setErro('Preencha descrição, valor e vencimento'); return; }
    setLoading(true);
    setErro('');
    try {
      const res = await fetch('/api/financeiro/receber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao,
          valor: parseFloat(valor),
          vencimento,
          paciente_id: pacienteSel?.id ?? null,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setErro(data.error ?? 'Erro ao salvar'); return; }
      router.refresh();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Nova Cobrança" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paciente (opcional)</label>
          {pacienteSel ? (
            <div className="flex items-center justify-between input-field">
              <span className="text-offwhite text-sm">{pacienteSel.nome}</span>
              <button onClick={() => { setPacienteSel(null); setPacienteBusca(''); }} style={{ color: '#6B6B66', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
          ) : (
            <div className="relative">
              <input className="input-field w-full" placeholder="Buscar por nome ou CPF..." value={pacienteBusca} onChange={e => buscar(e.target.value)} />
              {pacientes.length > 0 && (
                <div className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden" style={{ background: '#FAF8F4', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {pacientes.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setPacienteSel(p); setPacientes([]); }}
                      className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors"
                      style={{ fontSize: 13, color: '#1C1C1C', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {p.nome} {p.cpf && <span className="text-muted" style={{ fontSize: 11 }}>· {p.cpf}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</label>
          <input className="input-field w-full" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Consulta avulsa" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor (R$)</label>
            <input type="number" step="0.01" className="input-field w-full" value={valor} onChange={e => setValor(e.target.value)} />
          </div>
          <div>
            <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vencimento</label>
            <input type="date" className="input-field w-full" value={vencimento} onChange={e => setVencimento(e.target.value)} />
          </div>
        </div>
        {erro && <p style={{ fontSize: 12, color: '#C0392B', fontFamily: 'var(--font-montserrat)' }}>{erro}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="btn-ghost text-xs" style={{ padding: '8px 16px' }}>Cancelar</button>
          <button onClick={salvar} disabled={loading} className="btn-primary text-xs" style={{ padding: '8px 20px' }}>
            {loading ? '...' : 'Criar Cobrança'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ============ Modal: link Stripe para copiar ============
function StripeLinkModal({ url, codigo, onClose }: { url: string; codigo: string; onClose: () => void }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  return (
    <ModalShell title="Link de Pagamento" onClose={onClose}>
      <p className="text-muted text-xs mb-4">
        Cobrança <span className="text-gold font-medium">{codigo}</span> — envie o link abaixo ao paciente via WhatsApp ou e-mail.
      </p>
      <div style={{ background: '#F5F3EF', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, wordBreak: 'break-all' }}>
        <span style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-montserrat)' }}>{url}</span>
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-ghost text-xs" style={{ padding: '8px 16px' }}>Fechar</button>
        <button
          onClick={copiar}
          className="btn-primary text-xs"
          style={{ padding: '8px 20px', background: copiado ? 'rgba(74,222,128,0.15)' : undefined, color: copiado ? '#1F7A4D' : undefined }}
        >
          {copiado ? 'Copiado!' : 'Copiar Link'}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost text-xs"
          style={{ padding: '8px 16px' }}
        >
          Abrir →
        </a>
      </div>
    </ModalShell>
  );
}

// ============ Shell de modal ============
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card" style={{ width: 460, maxWidth: '95vw', padding: 28 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 24, color: '#1C1C1C', fontWeight: 500 }}>{title}</h2>
          <button onClick={onClose} style={{ color: '#6B6B66', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
