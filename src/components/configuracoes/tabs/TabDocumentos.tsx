'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ContratoTemplate, CategoriaDocumento, ArquivoTipo } from '@/types/contratos';
import { TEMPLATE_TIPO_LABELS, PLACEHOLDERS } from '@/types/contratos';

const CATEGORIAS_PROCEDIMENTO = [
  'Consulta', 'Implante', 'Cirurgia', 'Endodontia', 'Ortodontia', 'Prótese', 'Estética', 'Periodontia', 'Prevenção',
];

interface ProcDocRow {
  id: string;
  categoria_procedimento: string;
  template_id: string;
  obrigatorio: boolean;
  contratos_templates?: { nome: string; categoria_documento: string };
}

// ─── Badge de tipo de arquivo ────────────────────────────────────────────────

function ArquivoBadge({ tipo, estatico }: { tipo: ArquivoTipo | null; estatico: boolean }) {
  if (tipo === 'docx') {
    return (
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
        padding: '2px 7px', borderRadius: 4,
        background: 'rgba(31,122,77,0.1)', color: '#1F7A4D',
        border: '1px solid rgba(31,122,77,0.25)',
        fontFamily: 'var(--font-montserrat)',
      }}>
        DOCX DINÂMICO
      </span>
    );
  }
  if (tipo === 'pdf' && estatico) {
    return (
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
        padding: '2px 7px', borderRadius: 4,
        background: 'rgba(96,165,250,0.1)', color: '#60A5FA',
        border: '1px solid rgba(96,165,250,0.25)',
        fontFamily: 'var(--font-montserrat)',
      }}>
        PDF ESTÁTICO
      </span>
    );
  }
  if (tipo === 'html' || !tipo) {
    return (
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
        padding: '2px 7px', borderRadius: 4,
        background: 'rgba(201,138,30,0.1)', color: '#C98A1E',
        border: '1px solid rgba(201,138,30,0.25)',
        fontFamily: 'var(--font-montserrat)',
      }}>
        HTML LEGADO
      </span>
    );
  }
  return null;
}

// ─── Dropzone ─────────────────────────────────────────────────────────────────

interface DropzoneProps {
  onFile: (file: File) => void;
  estatico: boolean;
  disabled?: boolean;
}

function Dropzone({ onFile, estatico, disabled }: DropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const acceptMime = estatico
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? '#1F7A4D' : 'rgba(0,0,0,0.15)'}`,
        borderRadius: 12, padding: '28px 20px', textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: dragging ? 'rgba(31,122,77,0.04)' : '#FAF8F4',
        transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
      }}
    >
      <input
        ref={inputRef} type="file" accept={acceptMime}
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        disabled={disabled}
      />
      <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)', marginBottom: 4 }}>
        Arraste ou clique para selecionar
      </div>
      <div style={{ fontSize: 11, color: '#9B9BA0', fontFamily: 'var(--font-montserrat)' }}>
        {estatico ? 'Aceita .docx ou .pdf (estático)' : 'Somente .docx com placeholders'}
      </div>
    </div>
  );
}

// ─── Modal de upload (novo template ou substituição) ──────────────────────────

interface UploadModalProps {
  item?: ContratoTemplate | null;
  onFechar: () => void;
  onSalvo: (t: ContratoTemplate) => void;
}

function UploadModal({ item, onFechar, onSalvo }: UploadModalProps) {
  const isSubstituicao = !!item;
  const [nome, setNome] = useState(item?.nome ?? '');
  const [tipo, setTipo] = useState(item?.tipo ?? 'prestacao_servico');
  const [cat, setCat] = useState<CategoriaDocumento>(item?.categoria_documento ?? 'contrato');
  const [estatico, setEstatico] = useState(item?.arquivo_estatico ?? false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState<{
    placeholders: string[];
    aviso: string | null;
    previewUrl: string | null;
  } | null>(null);

  const LOOP_KEYS = ['{{#itens}}', '{{descricao}}', '{{dente}}', '{{qtd}}', '{{valor}}', '{{total}}', '{{/itens}}'];
  const scalarPlaceholders = PLACEHOLDERS.filter(p => !LOOP_KEYS.includes(p.key));

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome) { setErro('Nome obrigatório'); return; }
    if (!arquivo) { setErro('Selecione um arquivo'); return; }
    setLoading(true); setErro(''); setResultado(null);

    const fd = new FormData();
    fd.append('nome', nome);
    fd.append('tipo', tipo);
    fd.append('categoria_documento', cat);
    fd.append('arquivo_estatico', String(estatico));
    fd.append('arquivo', arquivo);
    if (item) fd.append('template_id', item.id);

    const res = await fetch('/api/configuracoes/templates/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setErro(data.error ?? 'Erro ao processar arquivo'); return; }

    setResultado({ placeholders: data.placeholders ?? [], aviso: data.aviso ?? null, previewUrl: data.preview_pdf_url ?? null });
    onSalvo(data.template);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 860, maxHeight: '92vh', display: 'flex', flexDirection: 'column', borderRadius: 16 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.2rem', fontWeight: 600, color: '#1C1C1C' }}>
            {isSubstituicao ? `Substituir Arquivo — ${item.nome}` : 'Novo Template por Upload'}
          </h2>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9B9BA0' }}>×</button>
        </div>

        {/* 2 colunas */}
        <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: '1fr 280px' }}>
          {/* Coluna principal */}
          <form onSubmit={submit} style={{ padding: '20px 20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!isSubstituicao && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="table-header block mb-1">Nome do template *</label>
                  <input className="input-field w-full" value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex: Contrato de Implante" />
                </div>
                <div>
                  <label className="table-header block mb-1">Tipo</label>
                  <select className="input-field w-full" value={tipo} onChange={e => setTipo(e.target.value as ContratoTemplate['tipo'])}>
                    {Object.entries(TEMPLATE_TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="table-header block mb-1">Categoria</label>
                  <select className="input-field w-full" value={cat} onChange={e => setCat(e.target.value as CategoriaDocumento)}>
                    <option value="contrato">Contrato</option>
                    <option value="tcle">TCLE</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="est" checked={estatico} onChange={e => setEstatico(e.target.checked)} style={{ width: 14, height: 14, accentColor: '#1F7A4D' }} />
                  <label htmlFor="est" style={{ fontSize: 11, color: '#6B6B66', fontFamily: 'var(--font-montserrat)', cursor: 'pointer', lineHeight: 1.4 }}>
                    Documento estático<br />(sem campos variáveis)
                  </label>
                </div>
              </div>
            )}

            {/* Nota */}
            <div style={{ background: 'rgba(31,122,77,0.05)', border: '1px solid rgba(31,122,77,0.15)', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, color: '#3A352B', fontFamily: 'var(--font-montserrat)', lineHeight: 1.6, margin: 0 }}>
                <strong>Formato recomendado: .docx</strong> — O sistema preenche os placeholders preservando fonte, espaçamento e formatação do documento Word.
                Se o jurídico enviou PDF, abra no Word → <em>Arquivo → Salvar como → .docx</em>, insira os campos{' '}
                <code style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 3, padding: '0 3px', fontSize: 10 }}>{'{{paciente_nome}}'}</code>{' '}
                etc. e envie o .docx. Para fontes não-padrão, ative &ldquo;Incorporar fontes no arquivo&rdquo; nas opções do Word.
              </p>
            </div>

            {/* Dropzone */}
            <div>
              <label className="table-header block mb-2">Arquivo *</label>
              <Dropzone onFile={setArquivo} estatico={estatico} disabled={loading} />
              {arquivo && (
                <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(31,122,77,0.07)', border: '1px solid rgba(31,122,77,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{arquivo.name.endsWith('.pdf') ? '📕' : '📘'}</span>
                  <span style={{ fontSize: 12, color: '#1F7A4D', fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}>{arquivo.name}</span>
                  <span style={{ fontSize: 11, color: '#9B9BA0', marginLeft: 'auto' }}>{(arquivo.size / 1024).toFixed(0)} KB</span>
                  <button type="button" onClick={() => setArquivo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B9BA0', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                </div>
              )}
            </div>

            {/* Resultado */}
            {resultado && (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '10px 14px', background: '#F5F3EF', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)' }}>
                    Placeholders detectados ({resultado.placeholders.length})
                  </span>
                </div>
                <div style={{ padding: '10px 14px', background: '#FFFFFF' }}>
                  {resultado.placeholders.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {resultado.placeholders.map(p => (
                        <span key={p} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(31,122,77,0.08)', color: '#1F7A4D', border: '1px solid rgba(31,122,77,0.2)', fontFamily: 'monospace' }}>{p}</span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: '#C98A1E' }}>Nenhum placeholder detectado</span>
                  )}
                  {resultado.aviso && (
                    <p style={{ fontSize: 11, color: '#C98A1E', marginTop: 8, lineHeight: 1.5 }}>⚠ {resultado.aviso}</p>
                  )}
                  {resultado.previewUrl && (
                    <a href={resultado.previewUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#1F7A4D', textDecoration: 'underline', fontFamily: 'var(--font-montserrat)' }}>
                      Abrir pré-visualização PDF →
                    </a>
                  )}
                </div>
              </div>
            )}

            {erro && (
              <div style={{ background: 'rgba(192,57,43,0.07)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ fontSize: 12, color: '#C0392B', margin: 0, fontFamily: 'var(--font-montserrat)', lineHeight: 1.6 }}>{erro}</p>
              </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 16, marginTop: 'auto' }}>
              {isSubstituicao && (
                <span style={{ fontSize: 11, color: '#9B9BA0', fontFamily: 'var(--font-montserrat)' }}>
                  Cria v{(item.versao ?? 1) + 1} — versão atual arquivada
                </span>
              )}
              <div style={{ flex: 1 }} />
              <button type="button" onClick={onFechar} className="btn-ghost" style={{ padding: '6px 18px', fontSize: 12 }}>Cancelar</button>
              {resultado ? (
                <button type="button" onClick={onFechar} className="btn-primary" style={{ padding: '6px 20px', fontSize: 12 }}>Concluído</button>
              ) : (
                <button type="submit" disabled={loading || !arquivo} className="btn-primary" style={{ padding: '6px 20px', fontSize: 12 }}>
                  {loading ? 'Processando...' : 'Enviar e validar'}
                </button>
              )}
            </div>
          </form>

          {/* Coluna lateral: referência de placeholders */}
          <div style={{ borderLeft: '1px solid rgba(0,0,0,0.07)', background: '#FAF8F4', padding: '20px 16px', overflowY: 'auto' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#9B9BA0', letterSpacing: '0.06em', fontFamily: 'var(--font-montserrat)', marginBottom: 8 }}>CAMPOS DISPONÍVEIS</p>
            <p style={{ fontSize: 10, color: '#9B9BA0', fontFamily: 'var(--font-montserrat)', marginBottom: 10, lineHeight: 1.5 }}>
              Clique para copiar. Cole no Word onde o dado deve aparecer.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {scalarPlaceholders.map(p => (
                <button key={p.key} type="button" onClick={() => copyToClipboard(p.key)} title={p.desc} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '5px 8px', borderRadius: 5, border: '1px solid rgba(0,0,0,0.1)',
                  background: '#FFFFFF', cursor: 'pointer',
                }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#1F7A4D', display: 'block' }}>{p.key}</span>
                  <span style={{ fontSize: 9, color: '#9B9BA0', fontFamily: 'var(--font-montserrat)' }}>{p.desc}</span>
                </button>
              ))}
            </div>

            <p style={{ fontSize: 10, fontWeight: 700, color: '#9B9BA0', letterSpacing: '0.06em', fontFamily: 'var(--font-montserrat)', marginTop: 14, marginBottom: 8 }}>TABELA DE ITENS (LOOP)</p>
            <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '10px', fontSize: 10, fontFamily: 'monospace', color: '#1C1C1C', lineHeight: 2 }}>
              {'{{#itens}}'}<br />{'  {{descricao}}'}<br />{'  {{dente}}'}<br />{'  {{qtd}}'}<br />{'  {{valor}}'}<br />{'  {{total}}'}<br />{'{{/itens}}'}
            </div>
            <p style={{ fontSize: 9, color: '#9B9BA0', fontFamily: 'var(--font-montserrat)', marginTop: 6, lineHeight: 1.5 }}>
              Crie uma linha de tabela no Word com esses campos — o sistema repete a linha para cada procedimento do orçamento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Visualizador legado HTML ─────────────────────────────────────────────────

function LegadoViewer({ item, onFechar, onSubstituir }: { item: ContratoTemplate; onFechar: () => void; onSubstituir: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column', borderRadius: 16 }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.15rem', fontWeight: 600, color: '#1C1C1C' }}>{item.nome}</h2>
            <span style={{ fontSize: 10, color: '#C98A1E', fontFamily: 'var(--font-montserrat)' }}>Template HTML legado — somente leitura</span>
          </div>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9B9BA0' }}>×</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          <div dangerouslySetInnerHTML={{ __html: item.corpo_html ?? '' }} style={{ fontSize: 13, lineHeight: 1.7, color: '#1C1C1C' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }}>
          <button onClick={onSubstituir} className="btn-primary" style={{ padding: '6px 18px', fontSize: 12 }}>Substituir por .docx</button>
          <button onClick={onFechar} className="btn-ghost" style={{ padding: '6px 18px', fontSize: 12 }}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function TabDocumentos() {
  const [templates, setTemplates] = useState<ContratoTemplate[]>([]);
  const [procDocs, setProcDocs] = useState<ProcDocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<'templates' | 'matriz'>('templates');
  const [filtroCat, setFiltroCat] = useState<'todos' | 'contrato' | 'tcle'>('todos');
  const [uploadModal, setUploadModal] = useState<ContratoTemplate | null | undefined>(undefined);
  const [legadoViewer, setLegadoViewer] = useState<ContratoTemplate | null>(null);
  const [substituirTarget, setSubstituirTarget] = useState<ContratoTemplate | null>(null);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoTemplate, setNovoTemplate] = useState('');
  const [novoObrig, setNovoObrig] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/configuracoes/templates').then(r => r.json()),
      fetch('/api/configuracoes/procedimento-documentos').then(r => r.json()),
    ]).then(([t, pd]) => {
      setTemplates(Array.isArray(t) ? t : []);
      setProcDocs(Array.isArray(pd) ? pd : []);
      setLoading(false);
    });
  }, []);

  function onSalvo(t: ContratoTemplate) {
    setTemplates(prev => {
      const idx = prev.findIndex(x => x.id === t.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = t; return n; }
      return [...prev, t];
    });
  }

  async function inativarTemplate(id: string) {
    if (!confirm('Inativar este template? Contratos já emitidos são preservados.')) return;
    await fetch(`/api/configuracoes/templates/${id}`, { method: 'DELETE' });
    setTemplates(prev => prev.filter(t => t.id !== id));
  }

  async function adicionarProcDoc() {
    if (!novaCategoria || !novoTemplate) return;
    const res = await fetch('/api/configuracoes/procedimento-documentos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria_procedimento: novaCategoria, template_id: novoTemplate, obrigatorio: novoObrig }),
    });
    const data = await res.json();
    if (res.ok) {
      const templ = templates.find(t => t.id === novoTemplate);
      setProcDocs(prev => [...prev, { ...data, contratos_templates: templ ? { nome: templ.nome, categoria_documento: templ.categoria_documento } : undefined }]);
      setNovaCategoria(''); setNovoTemplate('');
    }
  }

  async function removerProcDoc(id: string) {
    await fetch('/api/configuracoes/procedimento-documentos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setProcDocs(prev => prev.filter(p => p.id !== id));
  }

  if (loading) return <div className="text-muted text-sm p-4">Carregando...</div>;

  const templatesFiltrados = templates.filter(t => filtroCat === 'todos' || t.categoria_documento === filtroCat);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem', fontWeight: 600, color: '#1C1C1C' }}>Documentos e Templates</h2>
        {aba === 'templates' && (
          <button onClick={() => setUploadModal(null)} className="btn-primary" style={{ padding: '6px 18px', fontSize: 12 }}>+ Novo Template</button>
        )}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
        {(['templates', 'matriz'] as const).map(t => (
          <button key={t} onClick={() => setAba(t)} style={{
            padding: '6px 18px', fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 600,
            background: aba === t ? 'rgba(31,122,77,0.12)' : 'transparent',
            color: aba === t ? '#1F7A4D' : '#6B6B66', border: 'none', cursor: 'pointer',
            borderLeft: t === 'matriz' ? '1px solid rgba(0,0,0,0.08)' : undefined,
          }}>
            {t === 'templates' ? 'Biblioteca' : 'Matriz Procedimento → Docs'}
          </button>
        ))}
      </div>

      {aba === 'templates' && (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['todos', 'contrato', 'tcle'] as const).map(c => (
              <button key={c} onClick={() => setFiltroCat(c)} style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                fontFamily: 'var(--font-montserrat)', fontWeight: 600,
                background: filtroCat === c ? 'rgba(31,122,77,0.12)' : 'transparent',
                border: `1px solid ${filtroCat === c ? '#1F7A4D' : 'rgba(0,0,0,0.12)'}`,
                color: filtroCat === c ? '#1F7A4D' : '#6B6B66',
              }}>
                {c === 'todos' ? `Todos (${templates.length})`
                  : c === 'contrato' ? `Contratos (${templates.filter(t => t.categoria_documento === 'contrato').length})`
                    : `TCLEs (${templates.filter(t => t.categoria_documento === 'tcle').length})`}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {templatesFiltrados.length === 0 && (
              <div className="card p-8 text-center text-muted text-sm">Nenhum template encontrado.</div>
            )}
            {templatesFiltrados.map(t => {
              const semPlaceholder = t.arquivo_tipo === 'docx' && !t.arquivo_estatico
                && (!t.placeholders_detectados || t.placeholders_detectados.length === 0);
              return (
                <div key={t.id} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                        background: t.categoria_documento === 'tcle' ? 'rgba(96,165,250,0.1)' : 'rgba(31,122,77,0.1)',
                        color: t.categoria_documento === 'tcle' ? '#60A5FA' : '#1F7A4D',
                        border: `1px solid ${t.categoria_documento === 'tcle' ? 'rgba(96,165,250,0.3)' : 'rgba(31,122,77,0.3)'}`,
                      }}>
                        {t.categoria_documento === 'tcle' ? 'TCLE' : 'CONTRATO'}
                      </span>
                      <ArquivoBadge tipo={t.arquivo_tipo} estatico={t.arquivo_estatico} />
                      <span style={{ fontSize: 13, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)', fontWeight: 500 }}>{t.nome}</span>
                      <span style={{ fontSize: 11, color: '#9B9BA0' }}>v{t.versao}</span>
                      {t.origem === 'sistema' && (
                        <span style={{ fontSize: 9, color: '#C98A1E', background: 'rgba(201,138,30,0.1)', border: '1px solid rgba(201,138,30,0.25)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                          Revisar c/ jurídico
                        </span>
                      )}
                      {semPlaceholder && (
                        <span style={{ fontSize: 9, color: '#C0392B', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                          ⚠ Nenhum campo detectado
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {t.preview_pdf_url && (
                        <a href={t.preview_pdf_url} target="_blank" rel="noopener noreferrer" className="btn-ghost"
                          style={{ padding: '3px 10px', fontSize: 11, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                          Pré-visualizar
                        </a>
                      )}
                      {t.arquivo_original_url && !t.preview_pdf_url && (
                        <a href={t.arquivo_original_url} target="_blank" rel="noopener noreferrer" className="btn-ghost"
                          style={{ padding: '3px 10px', fontSize: 11, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                          Baixar original
                        </a>
                      )}
                      {(t.arquivo_tipo === 'html' || !t.arquivo_tipo) ? (
                        <button onClick={() => setLegadoViewer(t)} className="btn-ghost" style={{ padding: '3px 10px', fontSize: 11 }}>
                          Visualizar HTML
                        </button>
                      ) : (
                        <button onClick={() => setSubstituirTarget(t)} className="btn-ghost" style={{ padding: '3px 10px', fontSize: 11 }}>
                          Substituir arquivo
                        </button>
                      )}
                      <button onClick={() => inativarTemplate(t.id)} className="btn-ghost"
                        style={{ padding: '3px 10px', fontSize: 11, color: '#F87171', borderColor: 'rgba(248,113,113,0.2)' }}>
                        Inativar
                      </button>
                    </div>
                  </div>

                  {t.arquivo_tipo === 'docx' && t.placeholders_detectados && t.placeholders_detectados.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(t.placeholders_detectados as string[]).map(p => (
                        <span key={p} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'rgba(31,122,77,0.06)', color: '#1F7A4D', border: '1px solid rgba(31,122,77,0.15)', fontFamily: 'monospace' }}>{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {aba === 'matriz' && (
        <div className="space-y-4">
          <div className="card p-4" style={{ background: 'rgba(96,165,250,0.04)', borderColor: 'rgba(96,165,250,0.15)' }}>
            <p className="text-muted text-xs">Define quais documentos são exigidos para cada categoria de procedimento. O sistema monta o pacote automaticamente ao aprovar um orçamento.</p>
          </div>
          <div className="card p-4">
            <p className="table-header mb-3" style={{ color: '#1F7A4D' }}>VINCULAR DOCUMENTO A PROCEDIMENTO</p>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="table-header block mb-1">Categoria do Procedimento</label>
                <select className="input-field" style={{ minWidth: 180 }} value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)}>
                  <option value="">Selecionar...</option>
                  {CATEGORIAS_PROCEDIMENTO.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="table-header block mb-1">Documento / Template</label>
                <select className="input-field" style={{ minWidth: 200 }} value={novoTemplate} onChange={e => setNovoTemplate(e.target.value)}>
                  <option value="">Selecionar...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>[{t.categoria_documento === 'tcle' ? 'TCLE' : 'Contrato'}] {t.nome}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="obrig" checked={novoObrig} onChange={e => setNovoObrig(e.target.checked)} style={{ width: 14, height: 14, accentColor: '#1F7A4D' }} />
                <label htmlFor="obrig" className="text-muted text-xs">Obrigatório</label>
              </div>
              <button onClick={adicionarProcDoc} disabled={!novaCategoria || !novoTemplate} className="btn-primary" style={{ padding: '6px 16px', fontSize: 12 }}>Adicionar</button>
            </div>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead>
                <tr>
                  {['Procedimento', 'Documento', 'Tipo', 'Obrigatório', ''].map(h => (
                    <th key={h} className="table-header" style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {procDocs.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted py-10 text-sm">Nenhum vínculo configurado.</td></tr>
                )}
                {procDocs.map(pd => (
                  <tr key={pd.id} className="table-row-hover" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 13, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)' }}>{pd.categoria_procedimento}</span></td>
                    <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 13, color: '#1C1C1C', fontFamily: 'var(--font-montserrat)' }}>{pd.contratos_templates?.nome ?? '—'}</span></td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: pd.contratos_templates?.categoria_documento === 'tcle' ? 'rgba(96,165,250,0.1)' : 'rgba(31,122,77,0.1)', color: pd.contratos_templates?.categoria_documento === 'tcle' ? '#60A5FA' : '#1F7A4D', border: `1px solid ${pd.contratos_templates?.categoria_documento === 'tcle' ? 'rgba(96,165,250,0.3)' : 'rgba(31,122,77,0.3)'}` }}>
                        {pd.contratos_templates?.categoria_documento === 'tcle' ? 'TCLE' : 'Contrato'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}><span style={{ color: pd.obrigatorio ? '#1F7A4D' : '#9B9BA0', fontSize: 12 }}>{pd.obrigatorio ? '✓ Sim' : 'Não'}</span></td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <button onClick={() => removerProcDoc(pd.id)} className="btn-ghost" style={{ padding: '3px 8px', fontSize: 11, color: '#F87171' }}>Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {uploadModal !== undefined && (
        <UploadModal item={uploadModal} onFechar={() => setUploadModal(undefined)} onSalvo={t => { onSalvo(t); }} />
      )}
      {substituirTarget && (
        <UploadModal item={substituirTarget} onFechar={() => setSubstituirTarget(null)} onSalvo={t => { onSalvo(t); setSubstituirTarget(null); }} />
      )}
      {legadoViewer && (
        <LegadoViewer item={legadoViewer} onFechar={() => setLegadoViewer(null)} onSubstituir={() => { setSubstituirTarget(legadoViewer); setLegadoViewer(null); }} />
      )}
    </div>
  );
}
