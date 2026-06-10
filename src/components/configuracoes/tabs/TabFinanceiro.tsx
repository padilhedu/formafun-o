'use client';

import { useState } from 'react';

interface FinanceiroConfig {
  iss_aliquota?: number; iss_codigo_servico?: string;
  regime_tributario?: string; nota_automatica?: boolean;
  formas_pagamento?: string[];
}

interface Props { config: Record<string, unknown>; }

const FORMAS = ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia', 'cheque'];
const FORMAS_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro', pix: 'PIX', cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito', boleto: 'Boleto', transferencia: 'Transferência', cheque: 'Cheque',
};

export function TabFinanceiro({ config }: Props) {
  const initial = (config['financeiro'] as FinanceiroConfig) ?? {};
  const [form, setForm] = useState<FinanceiroConfig>({
    formas_pagamento: ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito'],
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleForma(f: string) {
    const cur = form.formas_pagamento ?? [];
    setForm(prev => ({
      ...prev,
      formas_pagamento: cur.includes(f) ? cur.filter(x => x !== f) : [...cur, f],
    }));
  }

  async function handleSave() {
    setSaving(true);
    await fetch('/api/configuracoes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chave: 'financeiro', valor: form }),
    });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="heading text-offwhite" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>Configurações Financeiras</h2>
        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '6px 20px', fontSize: 12 }}>
          {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar'}
        </button>
      </div>

      <div className="card p-5 space-y-4">
        <p className="table-header" style={{ color: '#B89A5A', marginBottom: 8 }}>FORMAS DE PAGAMENTO ACEITAS</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {FORMAS.map(f => {
            const active = form.formas_pagamento?.includes(f);
            return (
              <button key={f} onClick={() => toggleForma(f)} style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                fontFamily: 'var(--font-montserrat)', fontWeight: 500,
                background: active ? 'rgba(184,154,90,0.15)' : 'transparent',
                border: `1px solid ${active ? '#B89A5A' : 'rgba(80,80,90,0.4)'}`,
                color: active ? '#B89A5A' : '#8A8A93',
              }}>
                {FORMAS_LABELS[f]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <p className="table-header" style={{ color: '#B89A5A', marginBottom: 8 }}>NFS-e / FISCAL</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="table-header block mb-1">Regime Tributário</label>
            <select className="input-field" value={form.regime_tributario ?? 'simples'} onChange={e => setForm(p => ({ ...p, regime_tributario: e.target.value }))}>
              <option value="simples">Simples Nacional</option>
              <option value="presumido">Lucro Presumido</option>
              <option value="real">Lucro Real</option>
              <option value="mei">MEI</option>
            </select>
          </div>
          <div>
            <label className="table-header block mb-1">Alíquota ISS (%)</label>
            <input type="number" min="0" max="5" step="0.5" className="input-field"
              value={form.iss_aliquota ?? 2} onChange={e => setForm(p => ({ ...p, iss_aliquota: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="table-header block mb-1">Código de Serviço</label>
            <input className="input-field" placeholder="Ex: 4.03" value={form.iss_codigo_servico ?? ''} onChange={e => setForm(p => ({ ...p, iss_codigo_servico: e.target.value }))} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, nota_automatica: !p.nota_automatica }))}
            style={{
              width: 40, height: 22, borderRadius: 11, cursor: 'pointer', border: 'none',
              background: form.nota_automatica ? '#B89A5A' : 'rgba(80,80,90,0.4)',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 2, left: form.nota_automatica ? 20 : 2,
              width: 18, height: 18, borderRadius: 9, background: '#fff', transition: 'left 0.2s',
            }} />
          </button>
          <span className="text-muted text-sm">Emissão automática de nota ao confirmar pagamento</span>
        </div>
      </div>
    </div>
  );
}
