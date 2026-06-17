'use client';

import { useState } from 'react';
import type { Anamnese } from '@/types/pacientes';

const CAMPOS_ANAMNESE = [
  { grupo: 'Queixa Principal', campos: [
    { id: 'queixa_principal', label: 'Queixa principal', tipo: 'textarea' },
    { id: 'historico_medico', label: 'Histórico médico relevante', tipo: 'textarea' },
    { id: 'medicamentos', label: 'Medicamentos em uso', tipo: 'textarea' },
  ]},
  { grupo: 'Condições de Saúde', campos: [
    { id: 'hipertensao', label: 'Hipertensão arterial', tipo: 'yesno', alerta: 'Hipertensão' },
    { id: 'diabetes', label: 'Diabetes', tipo: 'yesno', alerta: 'Diabetes' },
    { id: 'cardiopatia', label: 'Cardiopatia / doença cardíaca', tipo: 'yesno', alerta: 'Cardiopatia' },
    { id: 'hepatite', label: 'Hepatite / doença hepática', tipo: 'yesno', alerta: 'Hepatite' },
    { id: 'coagulacao', label: 'Distúrbio de coagulação', tipo: 'yesno', alerta: 'Distúrbio de coagulação' },
    { id: 'gestante', label: 'Gestante ou possível gestação', tipo: 'yesno', alerta: 'Gestante' },
    { id: 'epilepsia', label: 'Epilepsia / convulsões', tipo: 'yesno', alerta: 'Epilepsia' },
    { id: 'hiv', label: 'HIV / imunossuprimido', tipo: 'yesno', alerta: 'Imunossuprimido' },
  ]},
  { grupo: 'Alergias e Reações', campos: [
    { id: 'alergia_anestesico', label: 'Alergia a anestésico local', tipo: 'yesno', alerta: 'Alergia a anestésico' },
    { id: 'alergia_penicilina', label: 'Alergia a penicilina / antibióticos', tipo: 'yesno', alerta: 'Alergia a antibiótico' },
    { id: 'alergia_latex', label: 'Alergia a látex', tipo: 'yesno', alerta: 'Alergia a látex' },
    { id: 'outras_alergias', label: 'Outras alergias (descrever)', tipo: 'text' },
  ]},
  { grupo: 'Hábitos', campos: [
    { id: 'fumante', label: 'Fumante', tipo: 'yesno' },
    { id: 'alcool', label: 'Consumo de álcool', tipo: 'yesno' },
    { id: 'bruxismo', label: 'Bruxismo / ranger de dentes', tipo: 'yesno' },
    { id: 'pressao_arterial', label: 'Pressão arterial (mmHg)', tipo: 'text' },
  ]},
  { grupo: 'Histórico Odontológico', campos: [
    { id: 'ultima_visita', label: 'Última visita ao dentista', tipo: 'text' },
    { id: 'tratamento_anterior', label: 'Tratamento odontológico anterior relevante', tipo: 'textarea' },
    { id: 'medo_dentista', label: 'Medo ou ansiedade ao dentista', tipo: 'yesno' },
  ]},
];

interface Props { pacienteId: string; anamnese: Anamnese | null; }

export function AbaAnamnese({ pacienteId, anamnese }: Props) {
  const [respostas, setRespostas] = useState<Record<string, string | boolean | null>>(anamnese?.respostas ?? {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function computeAlertas(): string[] {
    const alertas: string[] = [];
    CAMPOS_ANAMNESE.forEach(grupo => {
      grupo.campos.forEach(campo => {
        if ('alerta' in campo && campo.alerta && respostas[campo.id] === true) {
          alertas.push(campo.alerta);
        }
      });
    });
    return alertas;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const alertas = computeAlertas();
    const res = await fetch(`/api/pacientes/${pacienteId}/anamnese`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respostas, alertas }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Erro ao salvar.');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  return (
    <div className="max-w-3xl space-y-5">
      {anamnese?.assinada_em && (
        <div className="flex items-center gap-3 py-3 px-4 rounded-xl"
          style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)' }}>
          <span className="text-success text-sm">✓</span>
          <span className="text-success text-sm font-medium">
            Anamnese assinada em {new Date(anamnese.assinada_em).toLocaleDateString('pt-BR')}
          </span>
        </div>
      )}

      {CAMPOS_ANAMNESE.map(grupo => (
        <div key={grupo.grupo} className="card p-5">
          <h3 className="text-offwhite font-semibold text-sm mb-4"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', paddingBottom: '0.75rem' }}>
            {grupo.grupo}
          </h3>
          <div className="space-y-4">
            {grupo.campos.map(campo => (
              <div key={campo.id}>
                <label className="block text-muted text-xs font-medium mb-1.5 uppercase tracking-wide">
                  {campo.label}
                  {'alerta' in campo && campo.alerta && respostas[campo.id] === true && (
                    <span className="ml-2 text-error">⚠ Alerta clínico</span>
                  )}
                </label>
                {campo.tipo === 'yesno' && (
                  <div className="flex gap-2">
                    {(['Sim', 'Não', 'Não sei'] as const).map(opt => {
                      const val = opt === 'Sim' ? true : opt === 'Não' ? false : null;
                      const active = respostas[campo.id] === val || (val === null && respostas[campo.id] === null && campo.id in respostas);
                      return (
                        <button key={opt} type="button"
                          onClick={() => setRespostas(r => ({ ...r, [campo.id]: val }))}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: active ? (opt === 'Sim' ? 'rgba(248,113,113,0.15)' : 'rgba(74,222,128,0.1)') : '#FAF8F4',
                            color: active ? (opt === 'Sim' ? '#C0392B' : '#1F7A4D') : '#6B6B66',
                            border: `1px solid ${active ? (opt === 'Sim' ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.25)') : 'rgba(0,0,0,0.08)'}`,
                          }}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
                {campo.tipo === 'text' && (
                  <input className="input-field"
                    value={(respostas[campo.id] as string) ?? ''}
                    onChange={e => setRespostas(r => ({ ...r, [campo.id]: e.target.value }))} />
                )}
                {campo.tipo === 'textarea' && (
                  <textarea className="input-field" rows={2}
                    value={(respostas[campo.id] as string) ?? ''}
                    onChange={e => setRespostas(r => ({ ...r, [campo.id]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Alertas computados */}
      {computeAlertas().length > 0 && (
        <div className="card p-4" style={{ borderColor: 'rgba(248,113,113,0.25)', borderLeftWidth: 3, borderLeftColor: '#C0392B' }}>
          <p className="text-error text-xs font-semibold uppercase tracking-wider mb-2">Alertas gerados</p>
          <div className="flex flex-wrap gap-2">
            {computeAlertas().map(a => (
              <span key={a} className="badge" style={{ background: 'rgba(248,113,113,0.1)', color: '#C0392B', border: '1px solid rgba(248,113,113,0.25)' }}>
                ⚠ {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-error text-sm">{error}</p>}

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Anamnese'}
        </button>
        {saved && <span className="text-success text-sm">✓ Salvo com sucesso</span>}
      </div>
    </div>
  );
}
