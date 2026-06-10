'use client';

import { useState } from 'react';

interface ClinicaData {
  razao_social?: string; nome_fantasia?: string; cnpj?: string;
  cro_clinica?: string; endereco?: string; cidade?: string; uf?: string;
  telefone?: string; email?: string; responsavel_tecnico?: string; cro_responsavel?: string;
}

interface Props { config: Record<string, unknown>; }

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="table-header block mb-1">{label}</label>
      <input className="input-field" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function TabClinica({ config }: Props) {
  const initial = (config['clinica'] as ClinicaData) ?? {};
  const [form, setForm] = useState<ClinicaData>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [erro, setErro] = useState('');

  function set(k: keyof ClinicaData) {
    return (v: string) => setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleSave() {
    setSaving(true); setErro('');
    const res = await fetch('/api/configuracoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chave: 'clinica', valor: form }),
    });
    setSaving(false);
    if (!res.ok) { setErro('Erro ao salvar'); return; }
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="heading text-offwhite" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>Dados da Clínica</h2>
        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '6px 20px', fontSize: 12 }}>
          {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar'}
        </button>
      </div>
      {erro && <p className="text-error text-sm">{erro}</p>}

      <div className="card p-5 space-y-4">
        <p className="table-header" style={{ color: '#B89A5A', marginBottom: 8 }}>IDENTIFICAÇÃO</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Razão Social" value={form.razao_social ?? ''} onChange={set('razao_social')} />
          <Field label="Nome Fantasia" value={form.nome_fantasia ?? ''} onChange={set('nome_fantasia')} />
          <Field label="CNPJ" value={form.cnpj ?? ''} onChange={set('cnpj')} placeholder="00.000.000/0000-00" />
          <Field label="CRO da Clínica" value={form.cro_clinica ?? ''} onChange={set('cro_clinica')} />
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <p className="table-header" style={{ color: '#B89A5A', marginBottom: 8 }}>ENDEREÇO E CONTATO</p>
        <Field label="Endereço Completo" value={form.endereco ?? ''} onChange={set('endereco')} placeholder="Rua, número, bairro" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cidade" value={form.cidade ?? ''} onChange={set('cidade')} />
          <Field label="UF" value={form.uf ?? ''} onChange={set('uf')} placeholder="SC" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone" value={form.telefone ?? ''} onChange={set('telefone')} placeholder="(47) 3000-0000" />
          <Field label="E-mail" value={form.email ?? ''} onChange={set('email')} placeholder="clinica@exemplo.com" />
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <p className="table-header" style={{ color: '#B89A5A', marginBottom: 8 }}>RESPONSÁVEL TÉCNICO</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome do Responsável" value={form.responsavel_tecnico ?? ''} onChange={set('responsavel_tecnico')} />
          <Field label="CRO do Responsável" value={form.cro_responsavel ?? ''} onChange={set('cro_responsavel')} />
        </div>
      </div>

      <div className="card p-4" style={{ background: 'rgba(184,154,90,0.04)', borderColor: 'rgba(184,154,90,0.15)' }}>
        <p className="text-muted text-xs">Esses dados são usados nos PDFs de orçamento, contratos e notas fiscais.</p>
      </div>
    </div>
  );
}
