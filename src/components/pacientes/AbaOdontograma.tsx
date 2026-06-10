'use client';

import { useState, useCallback } from 'react';

// FDI tooth numbering
// Quadrant 1: upper right (11-18), Quadrant 2: upper left (21-28)
// Quadrant 3: lower left (31-38), Quadrant 4: lower right (41-48)
// Deciduous: 51-55, 61-65, 71-75, 81-85

export type ToothCondition =
  | 'saudavel'
  | 'carie'
  | 'restaurado'
  | 'coroa'
  | 'extraido'
  | 'implante'
  | 'endodontia'
  | 'fratura'
  | 'ausente';

export type ToothSurface = 'oclusal' | 'mesial' | 'distal' | 'vestibular' | 'lingual';

export interface ToothState {
  condicao: ToothCondition;
  superficies?: Partial<Record<ToothSurface, ToothCondition>>;
  observacao?: string;
}

export interface OdontogramaData {
  dentes: Record<string, ToothState>;
  observacoes?: string;
}

interface Props {
  pacienteId: string;
  odontograma: OdontogramaData | null;
}

const CONDITION_COLORS: Record<ToothCondition, string> = {
  saudavel:   '#2A2A2E',
  carie:      '#EF4444',
  restaurado: '#3B82F6',
  coroa:      '#F59E0B',
  extraido:   '#6B7280',
  implante:   '#8B5CF6',
  endodontia: '#EC4899',
  fratura:    '#F97316',
  ausente:    '#1A1A1E',
};

const CONDITION_LABELS: Record<ToothCondition, string> = {
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

// Upper row: right to left visually (patient's right = our left)
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];

// Deciduous
const UPPER_RIGHT_DEC = [55, 54, 53, 52, 51];
const UPPER_LEFT_DEC  = [61, 62, 63, 64, 65];
const LOWER_RIGHT_DEC = [85, 84, 83, 82, 81];
const LOWER_LEFT_DEC  = [71, 72, 73, 74, 75];

function isMolar(n: number): boolean {
  const d = n % 10;
  return d >= 6 && d <= 8;
}
function isPremolar(n: number): boolean {
  const d = n % 10;
  return d === 4 || d === 5;
}
function isCanine(n: number): boolean {
  return n % 10 === 3;
}

function ToothShape({
  number,
  state,
  selected,
  onClick,
  small = false,
}: {
  number: number;
  state: ToothState | undefined;
  selected: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  const condicao = state?.condicao ?? 'saudavel';
  const fill = CONDITION_COLORS[condicao];
  const isUpper = number < 50 ? number < 30 : number >= 50 && number < 70;
  const absent = condicao === 'ausente' || condicao === 'extraido';

  const w = small ? 20 : (isMolar(number) ? 26 : isPremolar(number) ? 22 : isCanine(number) ? 20 : 18);
  const h = small ? 28 : 36;
  const rx = small ? 4 : (isCanine(number) ? 6 : isMolar(number) ? 4 : 5);

  return (
    <g
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={`Dente ${number}`}
    >
      {/* Root */}
      {!absent && (
        <rect
          x={-w / 2 + 3}
          y={isUpper ? -h / 2 - 10 : h / 2 - 2}
          width={w - 6}
          height={12}
          rx={2}
          fill={selected ? 'rgba(184,154,90,0.3)' : 'rgba(60,60,65,0.6)'}
          stroke={selected ? '#B89A5A' : 'rgba(80,80,90,0.5)'}
          strokeWidth={0.5}
        />
      )}
      {/* Crown */}
      <rect
        x={-w / 2}
        y={isUpper ? -h / 2 + 2 : -h / 2}
        width={w}
        height={h - 4}
        rx={rx}
        fill={absent ? 'transparent' : fill}
        stroke={selected ? '#B89A5A' : absent ? 'rgba(80,80,90,0.3)' : 'rgba(120,120,130,0.4)'}
        strokeWidth={selected ? 1.5 : 0.8}
        strokeDasharray={absent ? '3,2' : undefined}
        opacity={absent ? 0.4 : 1}
      />
      {/* X for extracted */}
      {condicao === 'extraido' && (
        <>
          <line x1={-w / 2 + 4} y1={-h / 2 + 6} x2={w / 2 - 4} y2={h / 2 - 6} stroke="#6B7280" strokeWidth={1.5} />
          <line x1={w / 2 - 4} y1={-h / 2 + 6} x2={-w / 2 + 4} y2={h / 2 - 6} stroke="#6B7280" strokeWidth={1.5} />
        </>
      )}
      {/* Implant circle */}
      {condicao === 'implante' && (
        <circle cx={0} cy={0} r={5} fill="none" stroke="#8B5CF6" strokeWidth={1.5} />
      )}
      {/* Selection ring */}
      {selected && (
        <rect
          x={-w / 2 - 2}
          y={isUpper ? -h / 2 : -h / 2 - 2}
          width={w + 4}
          height={h}
          rx={rx + 2}
          fill="none"
          stroke="#B89A5A"
          strokeWidth={1.5}
          strokeDasharray="3,2"
        />
      )}
      {/* Tooth number */}
      <text
        x={0}
        y={isUpper ? h / 2 + 14 : -h / 2 - 6}
        textAnchor="middle"
        fontSize={small ? 7 : 8}
        fill={selected ? '#B89A5A' : '#8A8A93'}
        style={{ userSelect: 'none', fontFamily: 'var(--font-montserrat)' }}
      >
        {number}
      </text>
    </g>
  );
}

export function AbaOdontograma({ pacienteId, odontograma: initialData }: Props) {
  const [dentes, setDentes] = useState<Record<string, ToothState>>(
    initialData?.dentes ?? {}
  );
  const [observacoes, setObservacoes] = useState(initialData?.observacoes ?? '');
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeciduous, setShowDeciduous] = useState(false);

  const getState = (n: number): ToothState | undefined => dentes[String(n)];

  const selectTooth = useCallback((n: number) => {
    setSelected(prev => prev === n ? null : n);
  }, []);

  const setCondicao = (condicao: ToothCondition) => {
    if (!selected) return;
    setDentes(prev => ({
      ...prev,
      [String(selected)]: { ...prev[String(selected)], condicao },
    }));
  };

  const setObservacaoDente = (obs: string) => {
    if (!selected) return;
    setDentes(prev => ({
      ...prev,
      [String(selected)]: { ...prev[String(selected)], observacao: obs },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pacientes/${pacienteId}/odontograma`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dentes, observacoes }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const GAP = 2;

  function renderRow(teeth: number[], yOffset: number, isUpper: boolean, small = false) {
    const totalWidth = teeth.reduce((acc, n) => {
      const w = small ? 22 : (isMolar(n) ? 28 : isPremolar(n) ? 24 : isCanine(n) ? 22 : 20);
      return acc + w + GAP;
    }, 0);
    let x = -totalWidth / 2;
    return teeth.map(n => {
      const w = small ? 22 : (isMolar(n) ? 28 : isPremolar(n) ? 24 : isCanine(n) ? 22 : 20);
      const cx = x + w / 2;
      x += w + GAP;
      return (
        <g key={n} transform={`translate(${cx}, ${yOffset})`}>
          <ToothShape
            number={n}
            state={getState(n)}
            selected={selected === n}
            onClick={() => selectTooth(n)}
            small={small}
          />
        </g>
      );
    });
  }

  const selectedState = selected ? getState(selected) : undefined;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-offwhite font-medium" style={{ fontFamily: 'var(--font-montserrat)', fontSize: 13 }}>
            ODONTOGRAMA
          </h2>
          <button
            onClick={() => setShowDeciduous(!showDeciduous)}
            className="btn-ghost text-xs"
            style={{ padding: '4px 10px' }}
          >
            {showDeciduous ? 'Ocultar Decíduos' : 'Mostrar Decíduos'}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-xs"
          style={{ padding: '6px 16px' }}
        >
          {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'SALVAR ODONTOGRAMA'}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.keys(CONDITION_COLORS) as ToothCondition[]).filter(c => c !== 'saudavel').map(c => (
          <div key={c} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: CONDITION_COLORS[c] }} />
            <span className="text-muted" style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)' }}>
              {CONDITION_LABELS[c]}
            </span>
          </div>
        ))}
      </div>

      {/* SVG Odontogram */}
      <div className="card overflow-x-auto" style={{ padding: 16 }}>
        <svg
          viewBox="-220 -120 440 240"
          width="100%"
          style={{ minWidth: 500, maxWidth: 900, display: 'block', margin: '0 auto' }}
        >
          {/* Center cross lines */}
          <line x1={0} y1={-105} x2={0} y2={105} stroke="rgba(80,80,90,0.3)" strokeWidth={0.5} strokeDasharray="4,3" />
          <line x1={-215} y1={0} x2={215} y2={0} stroke="rgba(80,80,90,0.3)" strokeWidth={0.5} strokeDasharray="4,3" />

          {/* Quadrant labels */}
          <text x={-180} y={-100} fontSize={7} fill="rgba(138,138,147,0.6)" style={{ fontFamily: 'var(--font-montserrat)' }}>Q1 — Superior Direito</text>
          <text x={20}   y={-100} fontSize={7} fill="rgba(138,138,147,0.6)" style={{ fontFamily: 'var(--font-montserrat)' }}>Q2 — Superior Esquerdo</text>
          <text x={-180} y={108}  fontSize={7} fill="rgba(138,138,147,0.6)" style={{ fontFamily: 'var(--font-montserrat)' }}>Q4 — Inferior Direito</text>
          <text x={20}   y={108}  fontSize={7} fill="rgba(138,138,147,0.6)" style={{ fontFamily: 'var(--font-montserrat)' }}>Q3 — Inferior Esquerdo</text>

          {/* Upper permanent teeth */}
          <g transform="translate(0, -55)">
            {/* Upper right (18→11) left half */}
            <g transform="translate(-4, 0)">{renderRow(UPPER_RIGHT, 0, true)}</g>
            {/* Upper left (21→28) right half */}
            <g transform="translate(4, 0)">{renderRow(UPPER_LEFT, 0, true)}</g>
          </g>

          {/* Upper deciduous (above permanent, smaller) */}
          {showDeciduous && (
            <g transform="translate(0, -88)" opacity={0.85}>
              <g transform="translate(-4, 0)">{renderRow(UPPER_RIGHT_DEC, 0, true, true)}</g>
              <g transform="translate(4, 0)">{renderRow(UPPER_LEFT_DEC, 0, true, true)}</g>
            </g>
          )}

          {/* Lower permanent teeth */}
          <g transform="translate(0, 55)">
            <g transform="translate(-4, 0)">{renderRow(LOWER_RIGHT, 0, false)}</g>
            <g transform="translate(4, 0)">{renderRow(LOWER_LEFT, 0, false)}</g>
          </g>

          {/* Lower deciduous */}
          {showDeciduous && (
            <g transform="translate(0, 88)" opacity={0.85}>
              <g transform="translate(-4, 0)">{renderRow(LOWER_RIGHT_DEC, 0, false, true)}</g>
              <g transform="translate(4, 0)">{renderRow(LOWER_LEFT_DEC, 0, false, true)}</g>
            </g>
          )}
        </svg>
      </div>

      {/* Tooth detail panel */}
      {selected && (
        <div className="card" style={{ padding: 20 }}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(184,154,90,0.12)', color: '#B89A5A', fontFamily: 'var(--font-montserrat)' }}
            >
              {selected}
            </div>
            <h3 className="text-offwhite font-medium" style={{ fontFamily: 'var(--font-montserrat)', fontSize: 13 }}>
              Dente {selected} — {CONDITION_LABELS[selectedState?.condicao ?? 'saudavel']}
            </h3>
          </div>

          {/* Condition selector */}
          <div className="mb-4">
            <p className="text-muted mb-2" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Condição</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CONDITION_LABELS) as ToothCondition[]).map(c => (
                <button
                  key={c}
                  onClick={() => setCondicao(c)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: 'var(--font-montserrat)',
                    border: `1px solid ${selectedState?.condicao === c ? CONDITION_COLORS[c] : 'rgba(80,80,90,0.4)'}`,
                    background: selectedState?.condicao === c ? `${CONDITION_COLORS[c]}22` : 'transparent',
                    color: selectedState?.condicao === c ? CONDITION_COLORS[c] : '#8A8A93',
                    cursor: 'pointer',
                  }}
                >
                  {CONDITION_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Note for this tooth */}
          <div>
            <p className="text-muted mb-1" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observação</p>
            <input
              className="input-field w-full"
              style={{ fontSize: 13 }}
              placeholder="Observação sobre este dente..."
              value={selectedState?.observacao ?? ''}
              onChange={e => setObservacaoDente(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* General observations */}
      <div className="card" style={{ padding: 16 }}>
        <p className="text-muted mb-2" style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observações Gerais</p>
        <textarea
          className="input-field w-full"
          rows={3}
          style={{ fontSize: 13, resize: 'vertical' }}
          placeholder="Observações gerais sobre o odontograma..."
          value={observacoes}
          onChange={e => setObservacoes(e.target.value)}
        />
      </div>
    </div>
  );
}
