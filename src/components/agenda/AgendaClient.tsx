'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  useDraggable, useDroppable,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { AgendaEvento, STATUS_COR, STATUS_LABEL, TIPO_LABEL, TIPO_COR } from '@/types/agenda';
import { dataBRT, hojeBRT, formatarHoraBRT, minutosNoDiaBRT, localInputParaUTC } from '@/lib/datas';
import { NovoEventoModal } from './NovoEventoModal';

interface Paciente { id: string; nome: string; telefone: string | null; }

interface Props {
  eventosIniciais: AgendaEvento[];
  pacientes: Paciente[];
}

const HORA_INICIO = 7;
const HORA_FIM = 20;
const TOTAL_MIN = (HORA_FIM - HORA_INICIO) * 60;
const HORA_PX = 64;
const GRID_H = (HORA_FIM - HORA_INICIO) * HORA_PX;

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DIAS_PT_CURTO = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

// Cria array de 7 dias (segunda→domingo) para a semana BRT que contém ref.
// Os objetos Date ficam em meia-noite BRT (03:00 UTC) para evitar deslizamento de data.
function semanaAtual(ref: Date): Date[] {
  const days: Date[] = [];
  const brtStr = dataBRT(ref);
  const refMidnight = new Date(`${brtStr}T00:00:00-03:00`);
  const dow = refMidnight.getUTCDay(); // 0=Dom
  const diffParaSeg = dow === 0 ? -6 : 1 - dow;
  const seg = new Date(refMidnight);
  seg.setUTCDate(seg.getUTCDate() + diffParaSeg);
  for (let i = 0; i < 7; i++) {
    days.push(new Date(seg));
    seg.setUTCDate(seg.getUTCDate() + 1);
  }
  return days;
}

function eventTop(iso: string) {
  const min = minutosNoDiaBRT(iso) - HORA_INICIO * 60;
  return Math.max(0, (min / TOTAL_MIN) * GRID_H);
}

function eventHeight(inicio: string, fim: string) {
  const dur = (new Date(fim).getTime() - new Date(inicio).getTime()) / 60000;
  return Math.max(20, (dur / TOTAL_MIN) * GRID_H);
}

const fmtHora = formatarHoraBRT;

// ─── Mini calendário ──────────────────────────────────────────────────────────
function MiniCalendario({ referencia, onSelect }: { referencia: Date; onSelect: (d: Date) => void }) {
  const [mes, setMes] = useState(new Date(referencia.getFullYear(), referencia.getMonth(), 1));
  const diasNoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const primeiroDow = new Date(mes.getFullYear(), mes.getMonth(), 1).getDay();
  const offset = primeiroDow === 0 ? 6 : primeiroDow - 1;
  const hoje = hojeBRT();
  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= diasNoMes; d++) cells.push(new Date(mes.getFullYear(), mes.getMonth(), d));

  return (
    <div style={{ background: 'linear-gradient(145deg, #141416 0%, #111113 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px' }}>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
          style={{ color: '#8A8A93', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1 }}
        >‹</button>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: '#F5F2EA', letterSpacing: '0.04em' }}>
          {MESES_PT[mes.getMonth()]} {mes.getFullYear()}
        </span>
        <button
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
          style={{ color: '#8A8A93', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1 }}
        >›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['S','T','Q','Q','S','S','D'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 9, color: '#8A8A93', fontWeight: 700, fontFamily: 'var(--font-montserrat)' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = dataBRT(d);
          const isHoje = iso === hoje;
          const isRef = iso === dataBRT(referencia);
          return (
            <button key={i} onClick={() => onSelect(d)} style={{
              width: 24, height: 24, borderRadius: '50%', fontSize: 10, margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isRef ? '#B89A5A' : isHoje ? 'rgba(184,154,90,0.15)' : 'transparent',
              color: isRef ? '#0A0A0B' : isHoje ? '#B89A5A' : '#8A8A93',
              fontWeight: isHoje || isRef ? 700 : 400,
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-montserrat)',
            }}>{d.getDate()}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Popup de evento (status rápido + ações) ─────────────────────────────────
function EventoPopup({ evento, pos, onEditar, onFechar, onStatusChange }: {
  evento: AgendaEvento;
  pos: { x: number; y: number };
  onEditar: () => void;
  onFechar: () => void;
  onStatusChange: (id: string, status: AgendaEvento['status']) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [salvando, setSalvando] = useState(false);

  // Fechar ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onFechar();
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onFechar]);

  async function mudarStatus(status: AgendaEvento['status']) {
    setSalvando(true);
    const res = await fetch(`/api/agenda/${evento.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      onStatusChange(updated.id, updated.status);
    }
    setSalvando(false);
    onFechar();
  }

  // Ajustar posição para não sair da tela
  const left = Math.min(pos.x, window.innerWidth - 280);
  const top = Math.min(pos.y, window.innerHeight - 340);

  const statusButtons: { status: AgendaEvento['status']; label: string }[] = [
    { status: 'confirmado', label: '✓ Confirmado' },
    { status: 'realizado', label: '✓ Realizado' },
    { status: 'faltou', label: '⚠ Faltou' },
    { status: 'cancelado', label: '✕ Cancelado' },
  ];

  return (
    <div ref={ref} style={{
      position: 'fixed', top, left, zIndex: 100, width: 268,
      background: 'linear-gradient(145deg, #1A1A1E 0%, #141416 100%)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      padding: '16px',
    }}>
      {/* Cabeçalho do evento */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div style={{
            display: 'inline-block', fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700,
            background: `${TIPO_COR[evento.tipo]}20`, color: TIPO_COR[evento.tipo],
            border: `1px solid ${TIPO_COR[evento.tipo]}40`,
            borderRadius: 4, padding: '1px 6px', marginBottom: 6,
          }}>
            {TIPO_LABEL[evento.tipo].toUpperCase()}
          </div>
          <div style={{ fontSize: 14, fontFamily: 'var(--font-montserrat)', fontWeight: 600, color: '#F5F2EA', lineHeight: 1.3 }}>
            {evento.titulo}
          </div>
          {evento.pacientes && (
            <div style={{ fontSize: 12, color: '#8A8A93', marginTop: 2 }}>{evento.pacientes.nome}</div>
          )}
        </div>
        <button onClick={onFechar} style={{ color: '#8A8A93', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0, marginLeft: 8 }}>×</button>
      </div>

      {/* Horário */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
        <span style={{ fontSize: 11, color: '#8A8A93' }}>🕐</span>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-montserrat)', color: '#D9C9A3', fontVariantNumeric: 'tabular-nums' }}>
          {fmtHora(evento.inicio)} – {fmtHora(evento.fim)}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-montserrat)',
          color: STATUS_COR[evento.status], background: `${STATUS_COR[evento.status]}18`,
          border: `1px solid ${STATUS_COR[evento.status]}35`, borderRadius: 4, padding: '1px 6px',
        }}>
          {STATUS_LABEL[evento.status].toUpperCase()}
        </span>
      </div>

      {/* WhatsApp status */}
      {evento.paciente_id && (
        <div style={{ fontSize: 11, color: '#8A8A93', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📱</span>
          {evento.whatsapp_confirmado
            ? <span style={{ color: '#4ADE80' }}>Paciente confirmou via WhatsApp</span>
            : evento.whatsapp_enviado
            ? <span>Lembrete enviado — aguardando resposta</span>
            : <span>Lembrete não enviado ainda</span>}
        </div>
      )}

      {/* Botões de status rápido */}
      <div style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: '#8A8A93', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>
        Atualizar status
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 12 }}>
        {statusButtons.map(btn => (
          <button
            key={btn.status}
            disabled={salvando || evento.status === btn.status}
            onClick={() => mudarStatus(btn.status)}
            style={{
              fontSize: 11, fontFamily: 'var(--font-montserrat)', fontWeight: 600,
              padding: '7px 8px', borderRadius: 7, border: `1px solid ${STATUS_COR[btn.status]}30`,
              background: evento.status === btn.status ? `${STATUS_COR[btn.status]}20` : 'transparent',
              color: evento.status === btn.status ? STATUS_COR[btn.status] : '#8A8A93',
              cursor: evento.status === btn.status ? 'default' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onEditar}
          style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(184,154,90,0.12)', border: '1px solid rgba(184,154,90,0.25)', color: '#B89A5A', fontSize: 12, fontFamily: 'var(--font-montserrat)', fontWeight: 600, cursor: 'pointer' }}
        >
          Editar
        </button>
      </div>
    </div>
  );
}

// ─── Slot de hora droppable ────────────────────────────────────────────────────
function DroppableSlot({ dia, horaIndex, onClickSlot }: {
  dia: Date;
  horaIndex: number;
  onClickSlot: (dia: Date, hora: number) => void;
}) {
  const slotId = `${dataBRT(dia)}-${HORA_INICIO + horaIndex}`;
  const { isOver, setNodeRef } = useDroppable({ id: slotId, data: { dia, hora: HORA_INICIO + horaIndex } });

  return (
    <div
      ref={setNodeRef}
      onClick={() => onClickSlot(dia, HORA_INICIO + horaIndex)}
      style={{
        position: 'absolute', top: horaIndex * HORA_PX, left: 0, right: 0, height: HORA_PX,
        borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer',
        background: isOver ? 'rgba(184,154,90,0.08)' : 'transparent',
        transition: 'background 0.1s ease',
      }}
    />
  );
}

// ─── Evento arrastável ─────────────────────────────────────────────────────────
function DraggableEvento({ ev, onClickEvento }: {
  ev: AgendaEvento;
  onClickEvento: (ev: AgendaEvento, e: React.MouseEvent) => void;
}) {
  const h = eventHeight(ev.inicio, ev.fim);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ev.id,
    data: { ev },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => { if (!isDragging) onClickEvento(ev, e); }}
      style={{
        position: 'absolute',
        top: eventTop(ev.inicio), height: h, left: 3, right: 3,
        background: TIPO_COR[ev.tipo],
        opacity: isDragging ? 0.35 : ev.status === 'cancelado' ? 0.35 : ev.status === 'realizado' ? 0.65 : 0.9,
        borderRadius: 6, padding: '3px 6px',
        textAlign: 'left', border: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        overflow: 'hidden', zIndex: 2,
        boxShadow: ev.status === 'confirmado' ? `0 0 0 2px rgba(74,222,128,0.6)` : 'none',
        transform: CSS.Transform.toString(transform),
        touchAction: 'none',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3, fontFamily: 'var(--font-montserrat)' }}>
        {ev.titulo}
      </div>
      {h > 28 && (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-montserrat)', fontVariantNumeric: 'tabular-nums' }}>
          {fmtHora(ev.inicio)}
        </div>
      )}
      {ev.pacientes && h > 46 && (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat)' }}>
          {ev.pacientes.nome}
        </div>
      )}
      {ev.status === 'confirmado' && h > 28 && (
        <div style={{ fontSize: 8, color: '#4ADE80', fontWeight: 700, marginTop: 1 }}>✓ CONF</div>
      )}
    </button>
  );
}

// ─── Ghost do evento para DragOverlay ─────────────────────────────────────────
function EventoGhost({ ev }: { ev: AgendaEvento }) {
  const h = Math.min(eventHeight(ev.inicio, ev.fim), 80);
  return (
    <div style={{
      width: 120, height: h,
      background: TIPO_COR[ev.tipo],
      borderRadius: 6, padding: '3px 6px',
      opacity: 0.85, boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-montserrat)' }}>
        {ev.titulo}
      </div>
    </div>
  );
}

// ─── Coluna de um dia ──────────────────────────────────────────────────────────
function DiaColuna({ dia, eventos, isHoje, onClickSlot, onClickEvento }: {
  dia: Date;
  eventos: AgendaEvento[];
  isHoje: boolean;
  onClickSlot: (dia: Date, hora: number) => void;
  onClickEvento: (ev: AgendaEvento, e: React.MouseEvent) => void;
}) {
  const horas = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => i);

  return (
    <div style={{ position: 'relative', height: GRID_H, borderLeft: '1px solid rgba(255,255,255,0.04)', background: isHoje ? 'rgba(184,154,90,0.015)' : 'transparent' }}>
      {horas.map(i => (
        <DroppableSlot key={i} dia={dia} horaIndex={i} onClickSlot={onClickSlot} />
      ))}
      {eventos.map(ev => (
        <DraggableEvento key={ev.id} ev={ev} onClickEvento={onClickEvento} />
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function AgendaClient({ eventosIniciais, pacientes }: Props) {
  const [referencia, setReferencia] = useState(new Date());
  const [eventos, setEventos] = useState<AgendaEvento[]>(eventosIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<AgendaEvento | null>(null);
  const [popup, setPopup] = useState<{ evento: AgendaEvento; pos: { x: number; y: number } } | null>(null);
  const [slotInicio, setSlotInicio] = useState('');
  const [slotFim, setSlotFim] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [draggingEvento, setDraggingEvento] = useState<AgendaEvento | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const dias = semanaAtual(referencia);
  const inicioSemana = dataBRT(dias[0]) + 'T00:00:00-03:00';
  const fimSemana = dataBRT(dias[6]) + 'T23:59:59-03:00';
  const hoje = hojeBRT();

  const carregar = useCallback(async () => {
    setCarregando(true);
    const res = await fetch(`/api/agenda?inicio=${encodeURIComponent(inicioSemana)}&fim=${encodeURIComponent(fimSemana)}`);
    if (res.ok) setEventos(await res.json());
    setCarregando(false);
  }, [inicioSemana, fimSemana]);

  useEffect(() => { carregar(); }, [carregar]);

  function eventosDoDia(dia: Date) {
    const diaBRT = dataBRT(dia);
    return eventos.filter(ev => dataBRT(ev.inicio) === diaBRT);
  }

  function abrirSlot(dia: Date, hora: number) {
    setPopup(null);
    const d = new Date(dia); d.setHours(hora, 0, 0, 0);
    const f = new Date(d); f.setMinutes(f.getMinutes() + 60);
    setSlotInicio(d.toISOString());
    setSlotFim(f.toISOString());
    setEventoSelecionado(null);
    setModalAberto(true);
  }

  function abrirPopup(ev: AgendaEvento, e: React.MouseEvent) {
    e.stopPropagation();
    setPopup({ evento: ev, pos: { x: e.clientX + 8, y: e.clientY - 20 } });
  }

  function abrirModalDePopup() {
    if (!popup) return;
    setEventoSelecionado(popup.evento);
    setSlotInicio(''); setSlotFim('');
    setPopup(null);
    setModalAberto(true);
  }

  function onSalvo(ev: AgendaEvento) {
    setEventos(prev => {
      const idx = prev.findIndex(e => e.id === ev.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = ev; return n; }
      return [...prev, ev];
    });
  }

  function onExcluido(id: string) { setEventos(prev => prev.filter(e => e.id !== id)); }

  function onStatusChange(id: string, status: AgendaEvento['status']) {
    setEventos(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  }

  function onDragStart(event: DragStartEvent) {
    const { ev } = event.active.data.current as { ev: AgendaEvento };
    setDraggingEvento(ev);
    setPopup(null);
  }

  async function onDragEnd(event: DragEndEvent) {
    setDraggingEvento(null);
    const { active, over } = event;
    if (!over) return;
    const ev = (active.data.current as { ev: AgendaEvento }).ev;
    const { dia, hora } = over.data.current as { dia: Date; hora: number };

    const durMs = new Date(ev.fim).getTime() - new Date(ev.inicio).getTime();
    const novoInicioISO = localInputParaUTC(`${dataBRT(dia)}T${String(hora).padStart(2, '0')}:00`);
    const novoFimISO = new Date(new Date(novoInicioISO).getTime() + durMs).toISOString();

    if (novoInicioISO === ev.inicio) return; // sem mudança

    // Optimistic update
    const prevEventos = eventos;
    setEventos(prev => prev.map(e => e.id === ev.id ? { ...e, inicio: novoInicioISO, fim: novoFimISO } : e));

    const res = await fetch(`/api/agenda/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inicio: novoInicioISO, fim: novoFimISO }),
    });

    if (!res.ok) setEventos(prevEventos); // revert on error
  }

  const eventosHoje = eventos.filter(ev => dataBRT(ev.inicio) === hoje);
  const horas = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => HORA_INICIO + i);

  // Resumo da semana
  const totalSemana = eventos.filter(e => e.status !== 'cancelado').length;
  const confirmados = eventos.filter(e => e.status === 'confirmado').length;
  const realizados = eventos.filter(e => e.status === 'realizado').length;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
    <div className="flex gap-4" style={{ height: 'calc(100vh - 130px)' }}>
      {/* ── Grade semanal ── */}
      <div className="flex-1 flex flex-col min-w-0" style={{
        borderRadius: 14, overflow: 'hidden',
        background: 'linear-gradient(145deg, #141416 0%, #111113 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Header da grade */}
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button
            onClick={() => setReferencia(new Date())}
            style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(184,154,90,0.1)', border: '1px solid rgba(184,154,90,0.25)', color: '#B89A5A', cursor: 'pointer' }}
          >Hoje</button>
          <button
            onClick={() => { const d = new Date(referencia); d.setDate(d.getDate()-7); setReferencia(d); }}
            style={{ fontSize: 16, color: '#8A8A93', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
          >‹</button>
          <button
            onClick={() => { const d = new Date(referencia); d.setDate(d.getDate()+7); setReferencia(d); }}
            style={{ fontSize: 16, color: '#8A8A93', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
          >›</button>
          <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 16, fontWeight: 600, color: '#F5F2EA', marginLeft: 4 }}>
            {dias[0].getDate()} – {dias[6].getDate()} {MESES_PT[dias[6].getMonth()]} {dias[6].getFullYear()}
          </span>
          {carregando && <span style={{ fontSize: 10, color: '#8A8A93' }}>carregando…</span>}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => { setPopup(null); setEventoSelecionado(null); setSlotInicio(''); setSlotFim(''); setModalAberto(true); }}
            className="btn-primary"
            style={{ fontSize: 12, padding: '6px 16px' }}
          >
            + Novo Evento
          </button>
        </div>

        {/* Cabeçalho dos dias */}
        <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(7, 1fr)', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div />
          {dias.map(dia => {
            const isHoje = dataBRT(dia) === hoje;
            const qtd = eventosDoDia(dia).filter(e => e.status !== 'cancelado').length;
            return (
              <div key={dataBRT(dia)} style={{ textAlign: 'center', padding: '8px 4px 6px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'var(--font-montserrat)', color: isHoje ? '#B89A5A' : '#8A8A93' }}>
                  {DIAS_PT_CURTO[dia.getDay()]}
                </div>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', margin: '3px auto 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isHoje ? '#B89A5A' : 'transparent',
                  color: isHoje ? '#0A0A0B' : '#F5F2EA',
                  fontSize: 13, fontWeight: isHoje ? 700 : 400,
                  fontFamily: 'var(--font-montserrat)',
                }}>
                  {dia.getDate()}
                </div>
                {qtd > 0 && (
                  <div style={{ fontSize: 9, color: isHoje ? '#B89A5A' : '#8A8A93', fontFamily: 'var(--font-montserrat)', marginTop: 1 }}>
                    {qtd}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Corpo scrollável */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(7, 1fr)', minWidth: 560 }}>
            <div style={{ position: 'relative' }}>
              {horas.map(h => (
                <div key={h} style={{ height: HORA_PX, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 3 }}>
                  <span style={{ fontSize: 9, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', fontVariantNumeric: 'tabular-nums' }}>{String(h).padStart(2,'0')}:00</span>
                </div>
              ))}
            </div>
            {dias.map(dia => (
              <DiaColuna
                key={dataBRT(dia)}
                dia={dia}
                isHoje={dataBRT(dia) === hoje}
                eventos={eventosDoDia(dia)}
                onClickSlot={abrirSlot}
                onClickEvento={abrirPopup}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Painel lateral ── */}
      <div className="flex flex-col gap-3" style={{ width: 210, flexShrink: 0 }}>
        <MiniCalendario referencia={referencia} onSelect={setReferencia} />

        {/* Resumo da semana */}
        <div style={{ background: 'linear-gradient(145deg, #141416 0%, #111113 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px' }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8A8A93', marginBottom: 10 }}>
            Esta semana
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {[
              { label: 'Total', value: totalSemana, color: '#D9C9A3' },
              { label: 'Conf.', value: confirmados, color: '#4ADE80' },
              { label: 'Realiz.', value: realizados, color: '#8A8A93' },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: 18, fontFamily: 'var(--font-cormorant)', fontWeight: 600, color: item.color, lineHeight: 1 }}>{item.value}</div>
                <div style={{ fontSize: 8, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', fontWeight: 600, marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Seu dia hoje */}
        <div style={{ background: 'linear-gradient(145deg, #141416 0%, #111113 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8A8A93', marginBottom: 8 }}>
            Hoje
          </div>
          {eventosHoje.length === 0 ? (
            <p style={{ fontSize: 11, color: '#8A8A93' }}>Nenhum evento hoje.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {eventosHoje
                .sort((a, b) => a.inicio.localeCompare(b.inicio))
                .map(ev => (
                <li key={ev.id} style={{ cursor: 'pointer' }} onClick={(e) => abrirPopup(ev, e as React.MouseEvent)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ width: 3, minHeight: 36, borderRadius: 2, background: STATUS_COR[ev.status], flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-montserrat)', fontWeight: 600, color: '#F5F2EA', lineHeight: 1.3 }}>{ev.titulo}</div>
                      <div style={{ fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtHora(ev.inicio)} – {fmtHora(ev.fim)}
                      </div>
                      {ev.pacientes && (
                        <div style={{ fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)' }}>{ev.pacientes.nome}</div>
                      )}
                      <div style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-montserrat)', color: STATUS_COR[ev.status], marginTop: 1 }}>{STATUS_LABEL[ev.status].toUpperCase()}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Legenda de tipos */}
        <div style={{ background: 'linear-gradient(145deg, #141416 0%, #111113 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px' }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8A8A93', marginBottom: 8 }}>
            Tipos
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(Object.entries(TIPO_LABEL) as [AgendaEvento['tipo'], string][]).map(([tipo, label]) => (
              <li key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: TIPO_COR[tipo], flexShrink: 0, boxShadow: `0 0 4px ${TIPO_COR[tipo]}60` }} />
                <span style={{ fontSize: 10, color: '#8A8A93', fontFamily: 'var(--font-montserrat)' }}>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Popup de evento */}
      {popup && (
        <EventoPopup
          evento={popup.evento}
          pos={popup.pos}
          onEditar={abrirModalDePopup}
          onFechar={() => setPopup(null)}
          onStatusChange={onStatusChange}
        />
      )}

      <NovoEventoModal
        aberto={modalAberto}
        evento={eventoSelecionado}
        inicioDefault={slotInicio}
        fimDefault={slotFim}
        pacientes={pacientes}
        onFechar={() => setModalAberto(false)}
        onSalvo={onSalvo}
        onExcluido={onExcluido}
      />
    </div>
    <DragOverlay>
      {draggingEvento && <EventoGhost ev={draggingEvento} />}
    </DragOverlay>
    </DndContext>
  );
}
