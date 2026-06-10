'use client';

import { useState, useCallback, useEffect, useRef, memo } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
export type ToothCondition =
  | 'saudavel' | 'carie' | 'restaurado' | 'coroa' | 'extraido'
  | 'implante' | 'endodontia' | 'fratura' | 'ausente';

export type ToothSurface = 'vestibular' | 'mesial' | 'oclusal' | 'distal' | 'lingual';
export type Camada = 'situacao' | 'plano';

interface ToothData {
  situacao: Partial<Record<ToothSurface, ToothCondition>>;
  plano: Partial<Record<ToothSurface, ToothCondition>>;
  observacao?: string;
}

// Legacy shape (Phase 1-8 format)
interface LegacyTooth {
  condicao?: ToothCondition;
  superficies?: Partial<Record<ToothSurface, ToothCondition>>;
  plano_superficies?: Partial<Record<ToothSurface, ToothCondition>>;
  observacao?: string;
}

export interface OdontogramaData {
  dentes: Record<string, LegacyTooth | ToothData>;
  observacoes?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const COND_COLORS: Record<ToothCondition, string> = {
  saudavel:   '#1E1E22',
  carie:      '#EF4444',
  restaurado: '#3B82F6',
  coroa:      '#F59E0B',
  extraido:   '#4B4B55',
  implante:   '#8B5CF6',
  endodontia: '#EC4899',
  fratura:    '#F97316',
  ausente:    '#141416',
};

const COND_LABELS: Record<ToothCondition, string> = {
  saudavel:   'Saudável',
  carie:      'Cárie',
  restaurado: 'Restaurado',
  coroa:      'Coroa',
  extraido:   'Extraído',
  implante:   'Implante',
  endodontia: 'Endodontia',
  fratura:    'Fratura',
  ausente:    'Ausente',
};

const ALL_CONDITIONS: ToothCondition[] = [
  'saudavel', 'carie', 'restaurado', 'coroa', 'extraido',
  'implante', 'endodontia', 'fratura', 'ausente',
];
const ALL_SURFACES: ToothSurface[] = ['vestibular', 'mesial', 'oclusal', 'distal', 'lingual'];
const SURFACE_LABELS: Record<ToothSurface, string> = {
  vestibular: 'Vestibular', mesial: 'Mesial', oclusal: 'Oclusal/Incisal',
  distal: 'Distal', lingual: 'Lingual',
};

// FDI arrays — arranged left-to-right on screen
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];
const UPPER_RIGHT_DEC = [55, 54, 53, 52, 51];
const UPPER_LEFT_DEC  = [61, 62, 63, 64, 65];
const LOWER_RIGHT_DEC = [85, 84, 83, 82, 81];
const LOWER_LEFT_DEC  = [71, 72, 73, 74, 75];

const MAX_UNDO = 20;

// ─── Data migration ───────────────────────────────────────────────────────────
function migrate(raw: Record<string, LegacyTooth | ToothData>): Record<string, ToothData> {
  const out: Record<string, ToothData> = {};
  for (const [k, v] of Object.entries(raw)) {
    if ('situacao' in v || 'plano' in v) {
      out[k] = v as ToothData;
    } else {
      const l = v as LegacyTooth;
      const situacao: Partial<Record<ToothSurface, ToothCondition>> = {};
      if (l.superficies) {
        Object.assign(situacao, l.superficies);
      } else if (l.condicao && l.condicao !== 'saudavel') {
        ALL_SURFACES.forEach(s => { situacao[s] = l.condicao!; });
      }
      out[k] = { situacao, plano: l.plano_superficies ?? {}, observacao: l.observacao };
    }
  }
  return out;
}

// ─── 5-face tooth SVG ─────────────────────────────────────────────────────────
// 44×44 viewBox divided into:
//   vestibular = top trapezoid  (0,0)(44,0)(33,11)(11,11)
//   distal     = right trapezoid (44,0)(44,44)(33,33)(33,11)
//   lingual    = bottom trapezoid(0,44)(44,44)(33,33)(11,33)
//   mesial     = left trapezoid  (0,0)(0,44)(11,33)(11,11)
//   oclusal    = center rect     (11,11)(33,33)
const FACE_DEFS: { s: ToothSurface; pts: string }[] = [
  { s: 'vestibular', pts: '0,0 44,0 33,11 11,11' },
  { s: 'distal',     pts: '44,0 44,44 33,33 33,11' },
  { s: 'lingual',    pts: '0,44 44,44 33,33 11,33' },
  { s: 'mesial',     pts: '0,0 0,44 11,33 11,11' },
];

interface ToothSVGProps {
  num: number;
  data: ToothData | undefined;
  camada: Camada;
  selected: boolean;
  activeSurface: ToothSurface | null;
  onFaceClick: (s: ToothSurface) => void;
}

const ToothSVG = memo(function ToothSVG({ num, data, camada, selected, activeSurface, onFaceClick }: ToothSVGProps) {
  const faces = camada === 'situacao' ? (data?.situacao ?? {}) : (data?.plano ?? {});
  const isExtracted = ALL_SURFACES.some(s =>
    (data?.situacao[s] === 'extraido' || data?.situacao[s] === 'ausente')
  );

  function fc(s: ToothSurface) {
    return COND_COLORS[faces[s] ?? 'saudavel'];
  }

  const hasCrown   = ALL_SURFACES.some(s => faces[s] === 'coroa');
  const hasImplant = ALL_SURFACES.some(s => faces[s] === 'implante');
  const hasEndo    = ALL_SURFACES.some(s => faces[s] === 'endodontia');
  const clipId     = `oc-clip-${num}`;

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="44" height="44" rx="5" />
        </clipPath>
      </defs>

      {isExtracted ? (
        <>
          <rect x="0" y="0" width="44" height="44" rx="5" fill="#141416" stroke="rgba(80,80,90,0.3)" strokeWidth="1" />
          <line x1="9" y1="9" x2="35" y2="35" stroke="#4B4B55" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="35" y1="9" x2="9"  y2="35" stroke="#4B4B55" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          {FACE_DEFS.map(({ s, pts }) => {
            const isSel = selected && activeSurface === s;
            return (
              <polygon
                key={s}
                points={pts}
                fill={fc(s)}
                stroke={isSel ? '#B89A5A' : 'rgba(0,0,0,0.25)'}
                strokeWidth={isSel ? 1.5 : 0.5}
                clipPath={`url(#${clipId})`}
                onClick={e => { e.stopPropagation(); onFaceClick(s); }}
                style={{ cursor: 'pointer' }}
                className="tooth-face-poly"
                aria-label={SURFACE_LABELS[s]}
              />
            );
          })}
          {/* Oclusal center */}
          {(() => {
            const isSel = selected && activeSurface === 'oclusal';
            return (
              <rect
                x="11" y="11" width="22" height="22"
                fill={fc('oclusal')}
                stroke={isSel ? '#B89A5A' : 'rgba(0,0,0,0.25)'}
                strokeWidth={isSel ? 1.5 : 0.5}
                onClick={e => { e.stopPropagation(); onFaceClick('oclusal'); }}
                style={{ cursor: 'pointer' }}
                className="tooth-face-poly"
              />
            );
          })()}
          {/* Outer border */}
          <rect x="0" y="0" width="44" height="44" rx="5" fill="none"
            stroke={selected ? '#B89A5A' : 'rgba(80,80,90,0.4)'}
            strokeWidth={selected ? 2 : 0.8}
            style={{ pointerEvents: 'none' }}
          />
          {/* Special markers */}
          {hasCrown   && <rect x="2" y="2" width="40" height="40" rx="4" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3,2" style={{ pointerEvents: 'none' }} />}
          {hasImplant && <circle cx="22" cy="22" r="7" fill="none" stroke="#8B5CF6" strokeWidth="1.5" style={{ pointerEvents: 'none' }} />}
          {hasEndo    && <circle cx="22" cy="22" r="4" fill="#EC4899" style={{ pointerEvents: 'none' }} />}
        </>
      )}
    </svg>
  );
});

// ─── Tooth button wrapper ─────────────────────────────────────────────────────
interface ToothBtnProps {
  num: number;
  data: ToothData | undefined;
  camada: Camada;
  selected: boolean;
  activeSurface: ToothSurface | null;
  isUpper: boolean;
  small?: boolean;
  onClick: () => void;
  onFaceClick: (s: ToothSurface) => void;
}

const ToothBtn = memo(function ToothBtn({
  num, data, camada, selected, activeSurface, isUpper, small = false, onClick, onFaceClick,
}: ToothBtnProps) {
  const numEl = (
    <span style={{
      fontSize: 9, lineHeight: 1, fontFamily: 'var(--font-montserrat)',
      color: selected ? '#B89A5A' : '#8A8A93', userSelect: 'none',
    }}>
      {num}
    </span>
  );
  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={`Dente ${num}`}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        cursor: 'pointer', outline: 'none',
        transform: small ? 'scale(0.7)' : undefined,
        transformOrigin: isUpper ? 'bottom center' : 'top center',
      }}
      className="tooth-wrapper"
    >
      {isUpper && numEl}
      <ToothSVG
        num={num} data={data} camada={camada}
        selected={selected} activeSurface={activeSurface}
        onFaceClick={onFaceClick}
      />
      {!isUpper && numEl}
    </div>
  );
});

// ─── Divider line ─────────────────────────────────────────────────────────────
function Divider({ vertical }: { vertical?: boolean }) {
  return (
    <div style={{
      width: vertical ? 1 : '100%',
      height: vertical ? '100%' : 1,
      minHeight: vertical ? 44 : undefined,
      background: 'rgba(80,80,90,0.25)',
      flexShrink: 0,
      alignSelf: 'stretch',
    }} />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  pacienteId: string;
  odontograma: OdontogramaData | null;
}

export function AbaOdontograma({ pacienteId, odontograma: initial }: Props) {
  const [dentes, setDentes] = useState<Record<string, ToothData>>(() =>
    migrate(initial?.dentes ?? {})
  );
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? '');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [activeSurface, setActiveSurface] = useState<ToothSurface | null>(null);
  const [camada, setCamada] = useState<Camada>('situacao');
  const [modoRapido, setModoRapido] = useState(false);
  const [condRapida, setCondRapida] = useState<ToothCondition>('carie');
  const [showDec, setShowDec] = useState(false);
  const [legendaVis, setLegendaVis] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Undo stack
  const undoStack = useRef<Record<string, ToothData>[]>([JSON.parse(JSON.stringify(migrate(initial?.dentes ?? {})))]);
  const undoIdx = useRef(0);

  function pushUndo(next: Record<string, ToothData>) {
    const clone = JSON.parse(JSON.stringify(next));
    undoStack.current = undoStack.current.slice(0, undoIdx.current + 1);
    undoStack.current.push(clone);
    if (undoStack.current.length > MAX_UNDO + 1) undoStack.current.shift();
    else undoIdx.current++;
  }

  function undo() {
    if (undoIdx.current <= 0) return;
    undoIdx.current--;
    setDentes(JSON.parse(JSON.stringify(undoStack.current[undoIdx.current])));
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Setters
  function applyFace(tooth: number, surface: ToothSurface, cond: ToothCondition) {
    setDentes(prev => {
      const key = String(tooth);
      const cur = prev[key] ?? { situacao: {}, plano: {} };
      const next = {
        ...prev,
        [key]: { ...cur, [camada]: { ...(cur[camada] as object), [surface]: cond } },
      };
      pushUndo(next);
      return next;
    });
  }

  function applyAllFaces(tooth: number, cond: ToothCondition) {
    setDentes(prev => {
      const key = String(tooth);
      const cur = prev[key] ?? { situacao: {}, plano: {} };
      const all = Object.fromEntries(ALL_SURFACES.map(s => [s, cond])) as Record<ToothSurface, ToothCondition>;
      const next = { ...prev, [key]: { ...cur, [camada]: all } };
      pushUndo(next);
      return next;
    });
  }

  function handleToothClick(num: number) {
    if (modoRapido) { applyAllFaces(num, condRapida); return; }
    if (selectedTooth === num) { setSelectedTooth(null); setActiveSurface(null); }
    else { setSelectedTooth(num); setActiveSurface(null); }
  }

  function handleFaceClick(num: number, surface: ToothSurface) {
    if (modoRapido) { applyFace(num, surface, condRapida); return; }
    setSelectedTooth(num);
    setActiveSurface(surface);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const dentesAPI: Record<string, object> = {};
      for (const [k, v] of Object.entries(dentes)) {
        dentesAPI[k] = { superficies: v.situacao, plano_superficies: v.plano, observacao: v.observacao };
      }
      const res = await fetch(`/api/pacientes/${pacienteId}/odontograma`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dentes: dentesAPI, observacoes }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } finally {
      setSaving(false);
    }
  }

  // Summary
  let sumCarie = 0, sumAusente = 0, sumRestaurado = 0, sumPlano = 0;
  for (const d of Object.values(dentes)) {
    const sit = Object.values(d.situacao);
    if (sit.some(c => c === 'carie')) sumCarie++;
    if (sit.some(c => c === 'extraido' || c === 'ausente')) sumAusente++;
    if (sit.some(c => c === 'restaurado')) sumRestaurado++;
    if (Object.keys(d.plano).length > 0) sumPlano++;
  }

  const selData = selectedTooth ? dentes[String(selectedTooth)] : undefined;
  const selFaces = camada === 'situacao' ? (selData?.situacao ?? {}) : (selData?.plano ?? {});

  function renderRow(teeth: number[], isUpper: boolean, small = false) {
    return teeth.map(num => (
      <ToothBtn
        key={num}
        num={num}
        data={dentes[String(num)]}
        camada={camada}
        selected={selectedTooth === num}
        activeSurface={selectedTooth === num ? activeSurface : null}
        isUpper={isUpper}
        small={small}
        onClick={() => handleToothClick(num)}
        onFaceClick={s => handleFaceClick(num, s)}
      />
    ));
  }

  function Arcade({ upper }: { upper: boolean }) {
    const perms = upper ? [UPPER_RIGHT, UPPER_LEFT] : [LOWER_RIGHT, LOWER_LEFT];
    const decs  = upper ? [UPPER_RIGHT_DEC, UPPER_LEFT_DEC] : [LOWER_RIGHT_DEC, LOWER_LEFT_DEC];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {/* Deciduous row */}
        {showDec && (
          <div style={{ display: 'flex', gap: 2, alignItems: 'center', opacity: 0.75 }}>
            <div style={{ display: 'flex', gap: 1 }}>{renderRow(decs[0], upper, true)}</div>
            <Divider vertical />
            <div style={{ display: 'flex', gap: 1 }}>{renderRow(decs[1], upper, true)}</div>
          </div>
        )}
        {/* Permanent row */}
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 1 }}>{renderRow(perms[0], upper)}</div>
          <Divider vertical />
          <div style={{ display: 'flex', gap: 1 }}>{renderRow(perms[1], upper)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <style>{`
        .tooth-face-poly { transition: filter 0.08s; }
        .tooth-face-poly:hover { filter: brightness(1.4) saturate(1.2); }
        .tooth-wrapper:focus-visible { outline: 2px solid #B89A5A; outline-offset: 3px; border-radius: 7px; }
      `}</style>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Layer toggle */}
        <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, overflow: 'hidden' }}>
          {(['situacao', 'plano'] as Camada[]).map(c => (
            <button key={c} onClick={() => setCamada(c)} style={{
              padding: '5px 13px', fontSize: 11, fontFamily: 'var(--font-montserrat)', fontWeight: 600,
              background: camada === c ? (c === 'situacao' ? 'rgba(184,154,90,0.18)' : 'rgba(96,165,250,0.18)') : 'transparent',
              color: camada === c ? (c === 'situacao' ? '#B89A5A' : '#60A5FA') : '#8A8A93',
              border: 'none', cursor: 'pointer',
              borderLeft: c === 'plano' ? '1px solid rgba(255,255,255,0.08)' : undefined,
            }}>
              {c === 'situacao' ? 'Situação Atual' : 'Plano de Trat.'}
            </button>
          ))}
        </div>

        {/* Adult/child */}
        <button onClick={() => setShowDec(!showDec)} className="btn-ghost" style={{ padding: '5px 11px', fontSize: 11 }}>
          {showDec ? 'Ocultar Decíduos' : 'Mostrar Decíduos'}
        </button>

        {/* Quick mode */}
        <button onClick={() => setModoRapido(!modoRapido)} style={{
          padding: '5px 11px', fontSize: 11, fontFamily: 'var(--font-montserrat)', fontWeight: 600,
          background: modoRapido ? 'rgba(251,191,36,0.14)' : 'transparent',
          color: modoRapido ? '#FBBF24' : '#8A8A93',
          border: `1px solid ${modoRapido ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 6, cursor: 'pointer',
        }}>
          ⚡ {modoRapido ? 'Modo Rápido ativo' : 'Modo Rápido'}
        </button>

        {/* Rapid palette (mini) */}
        {modoRapido && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {ALL_CONDITIONS.filter(c => c !== 'saudavel').map(c => (
              <button key={c} onClick={() => setCondRapida(c)} title={COND_LABELS[c]} style={{
                width: 20, height: 20, borderRadius: 4, cursor: 'pointer', border: 'none',
                background: COND_COLORS[c],
                outline: condRapida === c ? '2px solid #F5F2EA' : '2px solid transparent',
                outlineOffset: 1,
              }} />
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />
        <button onClick={undo} className="btn-ghost" title="Ctrl+Z" style={{ padding: '5px 10px', fontSize: 11 }}>↩ Desfazer</button>
        <button onClick={() => setLegendaVis(!legendaVis)} className="btn-ghost" style={{ padding: '5px 10px', fontSize: 11 }}>
          {legendaVis ? 'Ocultar legenda' : 'Legenda'}
        </button>
        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '5px 16px', fontSize: 11 }}>
          {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar'}
        </button>
      </div>

      {/* ── QUICK MODE PALETTE ── */}
      {modoRapido && (
        <div className="card p-3" style={{ background: 'rgba(251,191,36,0.04)', borderColor: 'rgba(251,191,36,0.25)' }}>
          <p style={{ fontSize: 11, color: '#FBBF24', fontFamily: 'var(--font-montserrat)', marginBottom: 8 }}>
            ⚡ Clique nos dentes ou faces para marcar como <strong>{COND_LABELS[condRapida]}</strong>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ALL_CONDITIONS.map(c => (
              <button key={c} onClick={() => setCondRapida(c)} style={{
                padding: '3px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                fontFamily: 'var(--font-montserrat)', fontWeight: 600,
                background: condRapida === c ? `${COND_COLORS[c]}30` : 'transparent',
                border: `1px solid ${condRapida === c ? COND_COLORS[c] : 'rgba(255,255,255,0.1)'}`,
                color: condRapida === c ? COND_COLORS[c] : '#8A8A93',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: COND_COLORS[c], display: 'inline-block', flexShrink: 0 }} />
                {COND_LABELS[c]}
              </button>
            ))}
            <button onClick={() => setModoRapido(false)} className="btn-ghost" style={{ padding: '3px 10px', fontSize: 11 }}>Sair</button>
          </div>
        </div>
      )}

      {/* ── LEGEND ── */}
      {legendaVis && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '4px 0' }}>
          {ALL_CONDITIONS.map(c => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: COND_COLORS[c], border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)' }}>{COND_LABELS[c]}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── SUMMARY BAR ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
        {[
          { label: 'com cárie', value: sumCarie, color: '#EF4444' },
          { label: 'ausentes/extraídos', value: sumAusente, color: '#6B7280' },
          { label: 'restaurados', value: sumRestaurado, color: '#3B82F6' },
          { label: 'no plano', value: sumPlano, color: '#60A5FA' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'var(--font-montserrat)', lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)' }}>{s.label}</span>
          </div>
        ))}
        {sumPlano > 0 && (
          <button className="btn-primary" style={{ padding: '4px 14px', fontSize: 11, marginLeft: 'auto' }}>
            Gerar Orçamento do Plano →
          </button>
        )}
      </div>

      {/* ── ODONTOGRAM + PANEL ── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Odontogram card */}
        <div className="card" style={{ padding: 20, flex: 1, minWidth: 320, overflowX: 'auto' }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 0, minWidth: 'max-content' }}>
            {/* Q1/Q2 labels */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 4 }}>
              {['Q1 — Sup. Direito', 'Q2 — Sup. Esquerdo'].map(q => (
                <span key={q} style={{ fontSize: 8, color: 'rgba(138,138,147,0.4)', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{q}</span>
              ))}
            </div>

            {/* Upper arcade */}
            <Arcade upper={true} />

            {/* Horizontal midline */}
            <Divider />

            {/* Lower arcade */}
            <Arcade upper={false} />

            {/* Q4/Q3 labels */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 4 }}>
              {['Q4 — Inf. Direito', 'Q3 — Inf. Esquerdo'].map(q => (
                <span key={q} style={{ fontSize: 8, color: 'rgba(138,138,147,0.4)', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{q}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedTooth && (
          <div className="card" style={{ width: 260, flexShrink: 0, padding: 16 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 7,
                  background: 'rgba(184,154,90,0.12)', border: '1px solid rgba(184,154,90,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: '#B89A5A', fontSize: 14,
                }}>
                  {selectedTooth}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#F5F2EA', fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}>Dente {selectedTooth}</div>
                  <div style={{ fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)' }}>
                    {camada === 'situacao' ? 'Situação atual' : 'Plano de tratamento'}
                  </div>
                </div>
              </div>
              <button onClick={() => { setSelectedTooth(null); setActiveSurface(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8A93', fontSize: 20, lineHeight: 1, padding: 2 }}>
                ×
              </button>
            </div>

            {/* Active surface tag */}
            {activeSurface && (
              <div style={{ marginBottom: 10, padding: '3px 10px', borderRadius: 5, background: 'rgba(184,154,90,0.1)', border: '1px solid rgba(184,154,90,0.25)', display: 'inline-block' }}>
                <span style={{ fontSize: 11, color: '#B89A5A', fontFamily: 'var(--font-montserrat)' }}>
                  Face: {SURFACE_LABELS[activeSurface]}
                </span>
              </div>
            )}

            {/* Condition palette */}
            <p style={{ fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {activeSurface ? `Condição — ${SURFACE_LABELS[activeSurface]}` : 'Aplicar a todas as faces'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {ALL_CONDITIONS.map(c => {
                const active = activeSurface
                  ? selFaces[activeSurface] === c
                  : ALL_SURFACES.every(s => selFaces[s] === c);
                return (
                  <button key={c} onClick={() => {
                    if (activeSurface) applyFace(selectedTooth, activeSurface, c);
                    else applyAllFaces(selectedTooth, c);
                  }} style={{
                    padding: '6px 10px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer',
                    fontFamily: 'var(--font-montserrat)', textAlign: 'left',
                    background: active ? `${COND_COLORS[c]}28` : 'transparent',
                    border: `1px solid ${active ? COND_COLORS[c] : 'rgba(80,80,90,0.3)'}`,
                    color: active ? COND_COLORS[c] : '#8A8A93',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: COND_COLORS[c], flexShrink: 0, display: 'inline-block' }} />
                    {COND_LABELS[c]}
                  </button>
                );
              })}
            </div>

            {/* Per-surface overview */}
            <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Faces</p>
              {ALL_SURFACES.map(s => {
                const cond = selFaces[s] ?? 'saudavel';
                const isSel = activeSurface === s;
                return (
                  <div key={s} onClick={() => setActiveSurface(isSel ? null : s)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '4px 6px', borderRadius: 5, marginBottom: 2, cursor: 'pointer',
                    background: isSel ? 'rgba(184,154,90,0.1)' : 'transparent',
                    border: `1px solid ${isSel ? 'rgba(184,154,90,0.25)' : 'transparent'}`,
                  }}>
                    <span style={{ fontSize: 11, color: '#8A8A93', fontFamily: 'var(--font-montserrat)' }}>{SURFACE_LABELS[s]}</span>
                    <span style={{ fontSize: 11, color: COND_COLORS[cond], fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}>{COND_LABELS[cond]}</span>
                  </div>
                );
              })}
            </div>

            {/* Note */}
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Observação</p>
              <textarea
                className="input-field w-full"
                rows={2}
                style={{ fontSize: 12, resize: 'none' }}
                placeholder="Obs. sobre este dente..."
                value={selData?.observacao ?? ''}
                onChange={e => {
                  const key = String(selectedTooth);
                  setDentes(prev => ({
                    ...prev,
                    [key]: { ...(prev[key] ?? { situacao: {}, plano: {} }), observacao: e.target.value },
                  }));
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── GENERAL NOTES ── */}
      <div className="card" style={{ padding: 14 }}>
        <p style={{ fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Observações Gerais</p>
        <textarea
          className="input-field w-full"
          rows={2}
          style={{ fontSize: 13, resize: 'vertical' }}
          placeholder="Observações gerais do odontograma..."
          value={observacoes}
          onChange={e => setObservacoes(e.target.value)}
        />
      </div>
    </div>
  );
}
