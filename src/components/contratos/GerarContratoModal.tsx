'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ContratoTemplate } from '@/types/contratos';
import { TEMPLATE_TIPO_LABELS } from '@/types/contratos';

interface Props {
  orcamentoId: string;
  pacienteId: string;
  onClose: () => void;
}

export function GerarContratoModal({ orcamentoId, pacienteId, onClose }: Props) {
  const router = useRouter();
  const [templates, setTemplates] = useState<ContratoTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/contratos-templates')
      .then(r => r.json())
      .then((data: ContratoTemplate[]) => {
        setTemplates(data);
        if (data.length > 0) setSelectedTemplate(data[0].id);
      })
      .catch(() => setError('Falha ao carregar templates'))
      .finally(() => setLoadingTemplates(false));
  }, []);

  const gerar = async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orcamento_id: orcamentoId, paciente_id: pacienteId, template_id: selectedTemplate }),
      });
      const data = await res.json() as { id?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Erro ao gerar contrato');
        return;
      }
      router.push(`/contratos/${data.id}`);
      onClose();
    } catch {
      setError('Erro de rede');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdrop}
    >
      <div className="card" style={{ width: 480, maxWidth: '95vw', padding: 28 }}>
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 26, color: '#F5F2EA', fontWeight: 500 }}>
            Gerar Contrato
          </h2>
          <button
            onClick={onClose}
            style={{ color: '#8A8A93', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {loadingTemplates ? (
          <div className="text-muted text-sm py-4">Carregando templates...</div>
        ) : templates.length === 0 ? (
          <div className="py-4">
            <p className="text-muted text-sm mb-3">Nenhum template cadastrado.</p>
            <a href="/configuracoes/templates" className="text-gold text-sm" style={{ fontFamily: 'var(--font-montserrat)' }}>
              Criar templates →
            </a>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <label className="text-muted block mb-2" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Modelo de Contrato
              </label>
              <div className="space-y-2">
                {templates.map(t => (
                  <label
                    key={t.id}
                    className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-colors"
                    style={{
                      border: `1px solid ${selectedTemplate === t.id ? 'rgba(184,154,90,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      background: selectedTemplate === t.id ? 'rgba(184,154,90,0.07)' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={t.id}
                      checked={selectedTemplate === t.id}
                      onChange={() => setSelectedTemplate(t.id)}
                      style={{ accentColor: '#B89A5A' }}
                    />
                    <div>
                      <div className="text-offwhite text-sm font-medium" style={{ fontFamily: 'var(--font-montserrat)' }}>{t.nome}</div>
                      <div className="text-muted" style={{ fontSize: 10, marginTop: 1 }}>{TEMPLATE_TIPO_LABELS[t.tipo]}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p style={{ fontSize: 12, color: '#F87171', fontFamily: 'var(--font-montserrat)', marginBottom: 12 }}>{error}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="btn-ghost text-xs" style={{ padding: '9px 18px' }}>
                Cancelar
              </button>
              <button
                onClick={gerar}
                disabled={loading || !selectedTemplate}
                className="btn-primary text-xs"
                style={{ padding: '9px 22px' }}
              >
                {loading ? 'Gerando...' : 'Gerar Contrato'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
