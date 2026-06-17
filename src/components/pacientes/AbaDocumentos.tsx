'use client';

import { useState, useRef } from 'react';
import type { DocumentoPaciente } from '@/types/pacientes';

const TIPO_LABELS: Record<string, string> = {
  radiografia: 'Radiografia',
  foto: 'Foto',
  exame: 'Exame',
  contrato: 'Contrato',
  outro: 'Outro',
};

const TIPO_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  radiografia: { bg: 'rgba(96,165,250,0.1)', color: '#60A5FA', border: 'rgba(96,165,250,0.2)' },
  foto: { bg: 'rgba(31,122,77,0.1)', color: '#1F7A4D', border: 'rgba(31,122,77,0.2)' },
  exame: { bg: 'rgba(74,222,128,0.1)', color: '#1F7A4D', border: 'rgba(74,222,128,0.2)' },
  contrato: { bg: 'rgba(217,201,163,0.1)', color: '#6B6B66', border: 'rgba(217,201,163,0.2)' },
  outro: { bg: 'rgba(138,138,147,0.1)', color: '#6B6B66', border: 'rgba(138,138,147,0.15)' },
};

interface Props { pacienteId: string; documentos: DocumentoPaciente[]; }

export function AbaDocumentos({ pacienteId, documentos: iniciais }: Props) {
  const [documentos, setDocumentos] = useState<DocumentoPaciente[]>(iniciais);
  const [uploading, setUploading] = useState(false);
  const [tipo, setTipo] = useState<DocumentoPaciente['tipo']>('outro');
  const [filtro, setFiltro] = useState<string>('todos');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tipo', tipo);
      const res = await fetch(`/api/pacientes/${pacienteId}/documentos`, { method: 'POST', body: fd });
      if (res.ok) {
        const doc = await res.json();
        setDocumentos(ds => [doc, ...ds]);
      }
    }
    setUploading(false);
  }

  const filtrados = filtro === 'todos' ? documentos : documentos.filter(d => d.tipo === filtro);

  function isImage(mime: string | null) {
    return mime?.startsWith('image/') ?? false;
  }

  return (
    <div>
      {/* Upload + filtro */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <select value={tipo} onChange={e => setTipo(e.target.value as DocumentoPaciente['tipo'])}
          className="input-field w-36" style={{ background: '#FAF8F4' }}>
          {Object.entries(TIPO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button className="btn-primary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Enviando...' : '↑ Upload'}
        </button>
        <input ref={inputRef} type="file" multiple className="hidden"
          onChange={e => handleUpload(e.target.files)} />

        <div className="ml-auto flex items-center gap-1">
          {['todos', ...Object.keys(TIPO_LABELS)].map(t => (
            <button key={t} onClick={() => setFiltro(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filtro === t ? 'rgba(31,122,77,0.1)' : 'transparent',
                color: filtro === t ? '#1F7A4D' : '#6B6B66',
                border: `1px solid ${filtro === t ? 'rgba(31,122,77,0.25)' : 'rgba(0,0,0,0.08)'}`,
              }}>
              {t === 'todos' ? 'Todos' : TIPO_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de documentos */}
      {filtrados.length === 0 ? (
        <div className="card p-12 text-center"
          style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)' }}>
          <p className="text-muted text-sm">Nenhum documento enviado ainda.</p>
          <button className="btn-primary mt-4" onClick={() => inputRef.current?.click()}>
            Enviar primeiro documento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtrados.map(doc => {
            const c = TIPO_COLORS[doc.tipo] ?? TIPO_COLORS.outro;
            return (
              <div key={doc.id} className="card-elevated p-3 group cursor-pointer"
                style={{ borderRadius: '12px' }}
                onClick={() => doc.drive_link && window.open(doc.drive_link, '_blank')}>
                {/* Preview */}
                <div className="w-full h-24 rounded-lg mb-3 flex items-center justify-center overflow-hidden"
                  style={{ background: '#FFFFFF' }}>
                  {isImage(doc.mime_type) && doc.drive_link ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={doc.drive_link} alt={doc.nome} className="w-full h-full object-cover" />
                  ) : (
                    <DocIcon tipo={doc.tipo} />
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <span className="badge flex-shrink-0" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                    {TIPO_LABELS[doc.tipo]}
                  </span>
                </div>
                <p className="text-offwhite text-xs font-medium mt-1.5 truncate">{doc.nome}</p>
                <p className="text-muted mt-0.5" style={{ fontSize: '0.6rem' }}>
                  {new Date(doc.criado_em).toLocaleDateString('pt-BR')}
                </p>
                {doc.drive_link && (
                  <p className="text-gold text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Abrir no Drive →
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DocIcon({ tipo }: { tipo: string }) {
  const icons: Record<string, string> = {
    radiografia: '🦷', foto: '📷', exame: '🧪', contrato: '📄', outro: '📎',
  };
  return <span style={{ fontSize: '2rem' }}>{icons[tipo] ?? '📎'}</span>;
}
