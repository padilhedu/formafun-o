'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { maskCPF, maskPhone, maskCEP, validateCPF } from '@/lib/masks';
import type { Paciente } from '@/types/pacientes';

interface Props {
  paciente?: Paciente;
}

export function FormPaciente({ paciente }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: paciente?.nome ?? '',
    cpf: paciente?.cpf ?? '',
    rg: paciente?.rg ?? '',
    data_nascimento: paciente?.data_nascimento ?? '',
    sexo: paciente?.sexo ?? '',
    telefone: paciente?.telefone ?? '',
    whatsapp: paciente?.whatsapp ?? '',
    email: paciente?.email ?? '',
    convenio: paciente?.convenio ?? '',
    indicacao_origem: paciente?.indicacao_origem ?? '',
    observacoes: paciente?.observacoes ?? '',
    status: paciente?.status ?? 'ativo',
    // Endereço
    cep: paciente?.endereco?.cep ?? '',
    logradouro: paciente?.endereco?.logradouro ?? '',
    numero: paciente?.endereco?.numero ?? '',
    complemento: paciente?.endereco?.complemento ?? '',
    bairro: paciente?.endereco?.bairro ?? '',
    cidade: paciente?.endereco?.cidade ?? '',
    estado: paciente?.endereco?.estado ?? '',
  });

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.nome.trim()) { setError('Nome é obrigatório.'); return; }
    if (form.cpf && !validateCPF(form.cpf)) { setError('CPF inválido.'); return; }

    setLoading(true);

    const payload = {
      nome: form.nome.trim(),
      cpf: form.cpf.replace(/\D/g, '') || null,
      rg: form.rg || null,
      data_nascimento: form.data_nascimento || null,
      sexo: form.sexo || null,
      telefone: form.telefone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      convenio: form.convenio || null,
      indicacao_origem: form.indicacao_origem || null,
      observacoes: form.observacoes || null,
      status: form.status,
      endereco: {
        cep: form.cep, logradouro: form.logradouro, numero: form.numero,
        complemento: form.complemento, bairro: form.bairro,
        cidade: form.cidade, estado: form.estado,
      },
    };

    const url = paciente ? `/api/pacientes/${paciente.id}` : '/api/pacientes';
    const method = paciente ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Erro ao salvar.');
      setLoading(false);
      return;
    }

    const saved = await res.json();
    router.push(`/pacientes/${saved.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="flex items-center gap-2 text-error text-xs py-2.5 px-4 rounded-lg"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
          {error}
        </div>
      )}

      {/* Dados pessoais */}
      <Section title="Dados Pessoais">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome completo *" className="col-span-2">
            <input className="input-field" value={form.nome} onChange={e => set('nome', e.target.value)} required />
          </Field>
          <Field label="CPF">
            <input className="input-field" value={form.cpf}
              onChange={e => set('cpf', maskCPF(e.target.value))}
              placeholder="000.000.000-00" maxLength={14} />
          </Field>
          <Field label="RG">
            <input className="input-field" value={form.rg} onChange={e => set('rg', e.target.value)} />
          </Field>
          <Field label="Data de nascimento">
            <input type="date" className="input-field" value={form.data_nascimento}
              onChange={e => set('data_nascimento', e.target.value)} />
          </Field>
          <Field label="Sexo">
            <select className="input-field" value={form.sexo} onChange={e => set('sexo', e.target.value)}
              style={{ background: '#1A1A1E' }}>
              <option value="">Selecionar</option>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
              <option value="outro">Outro</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* Contato */}
      <Section title="Contato">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Telefone">
            <input className="input-field" value={form.telefone}
              onChange={e => set('telefone', maskPhone(e.target.value))}
              placeholder="(47) 99999-9999" />
          </Field>
          <Field label="WhatsApp">
            <input className="input-field" value={form.whatsapp}
              onChange={e => set('whatsapp', maskPhone(e.target.value))}
              placeholder="(47) 99999-9999" />
          </Field>
          <Field label="E-mail" className="col-span-2">
            <input type="email" className="input-field" value={form.email}
              onChange={e => set('email', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Endereço */}
      <Section title="Endereço">
        <div className="grid grid-cols-3 gap-4">
          <Field label="CEP">
            <input className="input-field" value={form.cep}
              onChange={e => set('cep', maskCEP(e.target.value))} placeholder="00000-000" />
          </Field>
          <Field label="Logradouro" className="col-span-2">
            <input className="input-field" value={form.logradouro} onChange={e => set('logradouro', e.target.value)} />
          </Field>
          <Field label="Número">
            <input className="input-field" value={form.numero} onChange={e => set('numero', e.target.value)} />
          </Field>
          <Field label="Complemento" className="col-span-2">
            <input className="input-field" value={form.complemento} onChange={e => set('complemento', e.target.value)} />
          </Field>
          <Field label="Bairro">
            <input className="input-field" value={form.bairro} onChange={e => set('bairro', e.target.value)} />
          </Field>
          <Field label="Cidade">
            <input className="input-field" value={form.cidade} onChange={e => set('cidade', e.target.value)} />
          </Field>
          <Field label="Estado">
            <input className="input-field" value={form.estado} onChange={e => set('estado', e.target.value)}
              maxLength={2} placeholder="SC" />
          </Field>
        </div>
      </Section>

      {/* Clínico */}
      <Section title="Informações Clínicas">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Convênio">
            <input className="input-field" value={form.convenio} onChange={e => set('convenio', e.target.value)}
              placeholder="Particular, Unimed..." />
          </Field>
          <Field label="Como nos conheceu">
            <select className="input-field" value={form.indicacao_origem}
              onChange={e => set('indicacao_origem', e.target.value)}
              style={{ background: '#1A1A1E' }}>
              <option value="">Selecionar</option>
              <option value="Indicação">Indicação</option>
              <option value="Instagram">Instagram</option>
              <option value="Google">Google</option>
              <option value="Facebook">Facebook</option>
              <option value="Passante">Passante</option>
              <option value="Outro">Outro</option>
            </select>
          </Field>
          <Field label="Observações" className="col-span-2">
            <textarea className="input-field" rows={3} value={form.observacoes}
              onChange={e => set('observacoes', e.target.value)} />
          </Field>
          {paciente && (
            <Field label="Status">
              <select className="input-field" value={form.status}
                onChange={e => set('status', e.target.value)}
                style={{ background: '#1A1A1E' }}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </Field>
          )}
        </div>
      </Section>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Salvando...' : paciente ? 'Salvar alterações' : 'Cadastrar paciente'}
        </button>
        <button type="button" className="btn-ghost" onClick={() => router.back()}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="text-offwhite font-semibold text-sm mb-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-muted text-xs font-medium mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
