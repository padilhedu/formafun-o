'use client';

import { useState, useEffect } from 'react';
import type { ContratoTemplate, CategoriaDocumento } from '@/types/contratos';
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

interface TemplateEditorProps {
  item?: ContratoTemplate | null;
  onFechar: () => void;
  onSalvo: (t: ContratoTemplate) => void;
}

function TemplateEditor({ item, onFechar, onSalvo }: TemplateEditorProps) {
  const [nome, setNome] = useState(item?.nome ?? '');
  const [tipo, setTipo] = useState(item?.tipo ?? 'prestacao_servico');
  const [cat, setCat] = useState<CategoriaDocumento>(item?.categoria_documento ?? 'contrato');
  const [html, setHtml] = useState(item?.corpo_html ?? '');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [preview, setPreview] = useState(false);

  function insertPlaceholder(key: string) {
    setHtml(prev => prev + key);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !html) { setErro('Nome e conteúdo obrigatórios'); return; }
    setLoading(true); setErro('');
    const url = item ? `/api/configuracoes/templates/${item.id}` : '/api/configuracoes/templates';
    const method = item ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, tipo, categoria_documento: cat, corpo_html: html }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErro(data.error); return; }
    onSalvo(data); onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="card-elevated" style={{ width: '100%', maxWidth: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 16 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <h2 className="heading text-offwhite text-base">{item ? `Editar — ${item.nome} (v${item.versao + 1})` : 'Novo Template'}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPreview(!preview)} className="btn-ghost" style={{ padding: '4px 12px', fontSize: 11 }}>
              {preview ? 'Editar' : 'Preview'}
            </button>
            <button onClick={onFechar} className="text-muted text-xl" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div className="px-5 py-3 space-y-3" style={{ flexShrink: 0 }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="table-header block mb-1">Nome *</label>
                <input className="input-field" value={nome} onChange={e => setNome(e.target.value)} required />
              </div>
              <div>
                <label className="table-header block mb-1">Tipo</label>
                <select className="input-field" value={tipo} onChange={e => setTipo(e.target.value as ContratoTemplate['tipo'])}>
                  {Object.entries(TEMPLATE_TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="table-header block mb-1">Categoria</label>
                <select className="input-field" value={cat} onChange={e => setCat(e.target.value as CategoriaDocumento)}>
                  <option value="contrato">Contrato</option>
                  <option value="tcle">TCLE</option>
                </select>
              </div>
            </div>

            {/* Placeholder palette */}
            {!preview && (
              <div>
                <p className="table-header mb-2">Placeholders disponíveis</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {PLACEHOLDERS.map(p => (
                    <button key={p.key} type="button" onClick={() => insertPlaceholder(p.key)}
                      title={p.desc} style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
                        background: 'rgba(31,122,77,0.1)', border: '1px solid rgba(31,122,77,0.25)',
                        color: '#1F7A4D', fontFamily: 'monospace',
                      }}>
                      {p.key}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Editor / Preview */}
          <div style={{ flex: 1, padding: '0 20px 12px', minHeight: 200 }}>
            {preview ? (
              <div className="card" style={{ padding: 20, height: '100%', overflow: 'auto' }}>
                <div dangerouslySetInnerHTML={{ __html: html }} style={{ color: '#1C1C1C', fontSize: 13, lineHeight: 1.7 }} />
              </div>
            ) : (
              <textarea
                className="input-field w-full"
                style={{ height: '100%', minHeight: 280, resize: 'none', fontSize: 12, fontFamily: 'monospace' }}
                value={html}
                onChange={e => setHtml(e.target.value)}
                placeholder="HTML do template — use os placeholders acima..."
                required
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            {item && (
              <span className="text-muted text-xs">Editar criará versão v{(item.versao ?? 1) + 1}. Versão atual é preservada.</span>
            )}
            {erro && <span className="text-error text-xs">{erro}</span>}
            <div style={{ flex: 1 }} />
            <button type="button" onClick={onFechar} className="btn-ghost" style={{ padding: '6px 16px', fontSize: 12 }}>Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '6px 20px', fontSize: 12 }}>
              {loading ? 'Salvando...' : item ? 'Salvar Nova Versão' : 'Criar Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TabDocumentos() {
  const [templates, setTemplates] = useState<ContratoTemplate[]>([]);
  const [procDocs, setProcDocs] = useState<ProcDocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<ContratoTemplate | null | undefined>(undefined);
  const [aba, setAba] = useState<'templates' | 'matriz'>('templates');
  const [filtroCat, setFiltroCat] = useState<'todos' | 'contrato' | 'tcle'>('todos');

  // Proc-doc matrix state
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

  async function excluirTemplate(id: string) {
    if (!confirm('Inativar este template? Ele será preservado em contratos já emitidos.')) return;
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
        <h2 className="heading text-offwhite" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>Documentos e Templates</h2>
        {aba === 'templates' && (
          <button onClick={() => setEditor(null)} className="btn-primary" style={{ padding: '6px 18px', fontSize: 12 }}>+ Novo Template</button>
        )}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
        {(['templates', 'matriz'] as const).map(t => (
          <button key={t} onClick={() => setAba(t)} style={{
            padding: '6px 18px', fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 600,
            background: aba === t ? 'rgba(31,122,77,0.15)' : 'transparent',
            color: aba === t ? '#1F7A4D' : '#6B6B66',
            border: 'none', cursor: 'pointer',
            borderLeft: t === 'matriz' ? '1px solid rgba(255,255,255,0.08)' : undefined,
          }}>
            {t === 'templates' ? 'Biblioteca' : 'Matriz Procedimento → Docs'}
          </button>
        ))}
      </div>

      {aba === 'templates' && (
        <>
          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 6 }}>
            {(['todos', 'contrato', 'tcle'] as const).map(c => (
              <button key={c} onClick={() => setFiltroCat(c)} style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                fontFamily: 'var(--font-montserrat)', fontWeight: 600,
                background: filtroCat === c ? 'rgba(31,122,77,0.15)' : 'transparent',
                border: `1px solid ${filtroCat === c ? '#1F7A4D' : 'rgba(80,80,90,0.3)'}`,
                color: filtroCat === c ? '#1F7A4D' : '#6B6B66',
              }}>
                {c === 'todos' ? `Todos (${templates.length})` : c === 'contrato' ? `Contratos (${templates.filter(t => t.categoria_documento === 'contrato').length})` : `TCLEs (${templates.filter(t => t.categoria_documento === 'tcle').length})`}
              </button>
            ))}
          </div>

          {/* Template list */}
          <div className="space-y-2">
            {templatesFiltrados.length === 0 && (
              <div className="card p-8 text-center text-muted text-sm">Nenhum template encontrado.</div>
            )}
            {templatesFiltrados.map(t => (
              <div key={t.id} className="card p-4">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge" style={{
                      fontSize: 9, fontWeight: 700,
                      background: t.categoria_documento === 'tcle' ? 'rgba(96,165,250,0.1)' : 'rgba(31,122,77,0.1)',
                      color: t.categoria_documento === 'tcle' ? '#60A5FA' : '#1F7A4D',
                      border: `1px solid ${t.categoria_documento === 'tcle' ? 'rgba(96,165,250,0.3)' : 'rgba(31,122,77,0.3)'}`,
                    }}>
                      {t.categoria_documento === 'tcle' ? 'TCLE' : 'CONTRATO'}
                    </span>
                    <span className="text-offwhite text-sm font-medium">{t.nome}</span>
                    <span className="text-muted text-xs">v{t.versao}</span>
                    {t.origem === 'sistema' && (
                      <span style={{ fontSize: 9, color: '#FBBF24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 4, padding: '1px 5px' }}>
                        Revisar c/ jurídico
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setEditor(t)} className="btn-ghost" style={{ padding: '3px 10px', fontSize: 11 }}>Editar</button>
                    <button onClick={() => excluirTemplate(t.id)} className="btn-ghost" style={{ padding: '3px 10px', fontSize: 11, color: '#F87171', borderColor: 'rgba(248,113,113,0.2)' }}>Inativar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {aba === 'matriz' && (
        <div className="space-y-4">
          <div className="card p-4" style={{ background: 'rgba(96,165,250,0.04)', borderColor: 'rgba(96,165,250,0.15)' }}>
            <p className="text-muted text-xs">Define quais documentos são exigidos para cada categoria de procedimento. O sistema monta o pacote de assinatura automaticamente ao aprovar um orçamento.</p>
          </div>

          {/* Add row */}
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

          {/* Matrix table */}
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
                  <tr key={pd.id} className="table-row-hover" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <span className="text-offwhite text-sm">{pd.categoria_procedimento}</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className="text-offwhite text-sm">{pd.contratos_templates?.nome ?? '—'}</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className="badge" style={{
                        fontSize: 9,
                        background: pd.contratos_templates?.categoria_documento === 'tcle' ? 'rgba(96,165,250,0.1)' : 'rgba(31,122,77,0.1)',
                        color: pd.contratos_templates?.categoria_documento === 'tcle' ? '#60A5FA' : '#1F7A4D',
                        border: `1px solid ${pd.contratos_templates?.categoria_documento === 'tcle' ? 'rgba(96,165,250,0.3)' : 'rgba(31,122,77,0.3)'}`,
                      }}>
                        {pd.contratos_templates?.categoria_documento === 'tcle' ? 'TCLE' : 'Contrato'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ color: pd.obrigatorio ? '#4ADE80' : '#6B6B66', fontSize: 12 }}>
                        {pd.obrigatorio ? '✓ Sim' : 'Não'}
                      </span>
                    </td>
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

      {editor !== undefined && (
        <TemplateEditor item={editor} onFechar={() => setEditor(undefined)} onSalvo={onSalvo} />
      )}
    </div>
  );
}
