'use client';

import { useState, useEffect } from 'react';
import type { ContratoTemplate, TemplateTipo } from '@/types/contratos';
import { TEMPLATE_TIPO_LABELS, PLACEHOLDERS } from '@/types/contratos';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ContratoTemplate[]>([]);
  const [selected, setSelected] = useState<ContratoTemplate | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editTipo, setEditTipo] = useState<TemplateTipo>('prestacao_servico');
  const [editHtml, setEditHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [preview, setPreview] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/contratos-templates')
      .then(r => r.json())
      .then(setTemplates)
      .catch(() => {});
  }, []);

  const selectTemplate = (t: ContratoTemplate) => {
    setSelected(t);
    setEditNome(t.nome);
    setEditTipo(t.tipo);
    setEditHtml(t.corpo_html);
    setPreview(false);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/contratos-templates/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: editNome, tipo: editTipo, corpo_html: editHtml }),
      });
      if (res.ok) {
        const updated = await res.json() as ContratoTemplate;
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
        setSelected(updated);
        setSavedMsg('Salvo');
        setTimeout(() => setSavedMsg(''), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const createNew = async () => {
    const nome = prompt('Nome do template:');
    if (!nome) return;
    setCreating(true);
    try {
      const res = await fetch('/api/contratos-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          tipo: 'prestacao_servico',
          corpo_html: '<!DOCTYPE html><html><head><meta charset="utf-8"><title>{{paciente_nome}}</title></head><body><h1>Contrato</h1><p>Paciente: {{paciente_nome}}</p></body></html>',
        }),
      });
      const t = await res.json() as ContratoTemplate;
      setTemplates(prev => [...prev, t]);
      selectTemplate(t);
    } finally {
      setCreating(false);
    }
  };

  const insertPlaceholder = (key: string) => {
    setEditHtml(prev => prev + key);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B89A5A', marginBottom: 4 }}>COMERCIAL</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 32, fontWeight: 600, color: '#F5F2EA', lineHeight: 1.1, marginBottom: 4 }}>
          Templates de Contrato
        </h1>
        <p style={{ fontSize: 13, color: '#8A8A93', fontFamily: 'var(--font-montserrat)' }}>Editor de modelos HTML com placeholders dinâmicos</p>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-6" style={{ minHeight: 600 }}>
        {/* Template list */}
        <div>
          <button
            onClick={createNew}
            disabled={creating}
            className="btn-primary w-full text-xs mb-4"
            style={{ padding: '8px 0' }}
          >
            {creating ? '...' : '+ Novo Template'}
          </button>
          <div className="space-y-1">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t)}
                className="w-full text-left px-3 py-2.5 rounded-xl transition-colors"
                style={{
                  background: selected?.id === t.id ? 'rgba(184,154,90,0.1)' : 'transparent',
                  border: `1px solid ${selected?.id === t.id ? 'rgba(184,154,90,0.3)' : 'transparent'}`,
                  fontFamily: 'var(--font-montserrat)',
                }}
              >
                <div className="text-offwhite text-xs font-medium">{t.nome}</div>
                <div className="text-muted" style={{ fontSize: 10, marginTop: 2 }}>
                  {TEMPLATE_TIPO_LABELS[t.tipo]}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        {selected ? (
          <div className="space-y-4">
            {/* Meta fields */}
            <div style={{ borderRadius: 12, background: 'linear-gradient(145deg, #141416 0%, #111113 100%)', border: '1px solid rgba(255,255,255,0.07)', padding: 16 }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome</label>
                  <input className="input-field w-full" value={editNome} onChange={e => setEditNome(e.target.value)} />
                </div>
                <div>
                  <label className="text-muted block mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</label>
                  <select className="input-field w-full" value={editTipo} onChange={e => setEditTipo(e.target.value as TemplateTipo)}>
                    {(Object.keys(TEMPLATE_TIPO_LABELS) as TemplateTipo[]).map(k => (
                      <option key={k} value={k}>{TEMPLATE_TIPO_LABELS[k]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Placeholders */}
            <div style={{ borderRadius: 12, background: 'linear-gradient(145deg, #141416 0%, #111113 100%)', border: '1px solid rgba(255,255,255,0.07)', padding: 14 }}>
              <p className="text-muted mb-2" style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Placeholders — clique para inserir no editor
              </p>
              <div className="flex flex-wrap gap-2">
                {PLACEHOLDERS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => insertPlaceholder(p.key)}
                    title={p.desc}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 5,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      background: 'rgba(184,154,90,0.08)',
                      border: '1px solid rgba(184,154,90,0.2)',
                      color: '#D9C9A3',
                      cursor: 'pointer',
                    }}
                  >
                    {p.key}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle editor/preview */}
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                  onClick={() => setPreview(false)}
                  style={{ padding: '6px 14px', fontSize: 11, fontFamily: 'var(--font-montserrat)', background: !preview ? 'rgba(184,154,90,0.12)' : 'transparent', color: !preview ? '#B89A5A' : '#8A8A93', border: 'none', cursor: 'pointer' }}
                >
                  Editor HTML
                </button>
                <button
                  onClick={() => setPreview(true)}
                  style={{ padding: '6px 14px', fontSize: 11, fontFamily: 'var(--font-montserrat)', background: preview ? 'rgba(184,154,90,0.12)' : 'transparent', color: preview ? '#B89A5A' : '#8A8A93', border: 'none', cursor: 'pointer' }}
                >
                  Pré-visualização
                </button>
              </div>
              <div className="ml-auto flex gap-2">
                <button onClick={save} disabled={saving} className="btn-primary text-xs" style={{ padding: '6px 18px' }}>
                  {saving ? '...' : savedMsg ? '✓ ' + savedMsg : 'SALVAR'}
                </button>
              </div>
            </div>

            {preview ? (
              <div style={{ borderRadius: 12, background: 'linear-gradient(145deg, #141416 0%, #111113 100%)', border: '1px solid rgba(255,255,255,0.07)', padding: 0, overflow: 'hidden' }}>
                <iframe
                  srcDoc={editHtml}
                  style={{ width: '100%', height: 600, border: 'none', background: '#fff' }}
                  title="Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <textarea
                className="input-field w-full"
                rows={28}
                style={{ fontSize: 12, fontFamily: 'monospace', resize: 'vertical' }}
                value={editHtml}
                onChange={e => setEditHtml(e.target.value)}
                spellCheck={false}
              />
            )}
          </div>
        ) : (
          <div style={{ borderRadius: 14, background: 'linear-gradient(145deg, #141416 0%, #111113 100%)', border: '1px dashed rgba(184,154,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className="text-muted text-sm">Selecione um template para editar</p>
          </div>
        )}
      </div>
    </div>
  );
}
