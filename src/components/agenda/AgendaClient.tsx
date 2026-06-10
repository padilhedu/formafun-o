'use client';

import { useState, useCallback, useEffect } from 'react';
import { AgendaEvento, STATUS_COR, STATUS_LABEL, TIPO_LABEL, TIPO_COR } from '@/types/agenda';
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

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }

function ptDia(d: Date) {
  return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
}

function semanaAtual(ref: Date): Date[] {
  const days: Date[] = [];
  const d = new Date(ref);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  for (let i = 0; i < 7; i++) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return days;
}

function eventTop(iso: string) {
  const d = new Date(iso);
  const min = d.getHours() * 60 + d.getMinutes() - HORA_INICIO * 60;
  return Math.max(0, (min / TOTAL_MIN) * GRID_H);
}

function eventHeight(inicio: string, fim: string) {
  const dur = (new Date(fim).getTime() - new Date(inicio).getTime()) / 60000;
  return Math.max(18, (dur / TOTAL_MIN) * GRID_H);
}

// ─── Mini calendário ──────────────────────────────────────────────────────────
function MiniCalendario({ referencia, onSelect }: { referencia: Date; onSelect: (d: Date) => void }) {
  const [mes, setMes] = useState(new Date(referencia.getFullYear(), referencia.getMonth(), 1));
  const diasNoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const primeiroDow = new Date(mes.getFullYear(), mes.getMonth(), 1).getDay();
  const offset = primeiroDow === 0 ? 6 : primeiroDow - 1;
  const hoje = isoDate(new Date());
  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= diasNoMes; d++) cells.push(new Date(mes.getFullYear(), mes.getMonth(), d));

  return (
    <div style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '0.75rem' }}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} className="text-muted hover:text-offwhite px-1 text-base leading-none">‹</button>
        <span className="text-offwhite font-semibold" style={{ fontSize: '0.72rem' }}>{MESES_PT[mes.getMonth()]} {mes.getFullYear()}</span>
        <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} className="text-muted hover:text-offwhite px-1 text-base leading-none">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['S','T','Q','Q','S','S','D'].map((d, i) => (
          <div key={i} className="text-center" style={{ fontSize: '0.58rem', color: '#8A8A93', fontWeight: 700 }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = isoDate(d);
          const isHoje = iso === hoje;
          const isRef = iso === isoDate(referencia);
          return (
            <button key={i} onClick={() => onSelect(d)} style={{
              width: 24, height: 24, borderRadius: '50%', fontSize: '0.62rem', margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isRef ? '#59399E' : isHoje ? 'rgba(89,57,158,0.2)' : 'transparent',
              color: isRef ? '#fff' : isHoje ? '#A07FD4' : '#8A8A93',
              fontWeight: isHoje || isRef ? 700 : 400, border: 'none', cursor: 'pointer',
            }}>{d.getDate()}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Coluna de um dia ──────────────────────────────────────────────────────────
function DiaColuna({ dia, eventos, onClickSlot, onClickEvento }: {
  dia: Date;
  eventos: AgendaEvento[];
  onClickSlot: (dia: Date, hora: number) => void;
  onClickEvento: (ev: AgendaEvento, e: React.MouseEvent) => void;
}) {
  const horas = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => i);

  return (
    <div style={{ position: 'relative', height: GRID_H, borderLeft: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Linhas de hora — clickáveis */}
      {horas.map(i => (
        <div
          key={i}
          onClick={() => onClickSlot(dia, HORA_INICIO + i)}
          style={{
            position: 'absolute', top: i * HORA_PX, left: 0, right: 0, height: HORA_PX,
            borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer',
          }}
        />
      ))}

      {/* Eventos */}
      {eventos.map(ev => (
        <button
          key={ev.id}
          onClick={(e) => onClickEvento(ev, e)}
          style={{
            position: 'absolute',
            top: eventTop(ev.inicio),
            height: eventHeight(ev.inicio, ev.fim),
            left: 2, right: 2,
            background: ev.cor ?? '#59399E',
            opacity: ev.status === 'cancelado' ? 0.4 : 0.88,
            borderRadius: 6, padding: '2px 5px',
            textAlign: 'left', border: 'none', cursor: 'pointer',
            overflow: 'hidden', zIndex: 2,
          }}
        >
          <div style={{ fontSize: '0.63rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
            {ev.titulo}
          </div>
          {eventHeight(ev.inicio, ev.fim) > 28 && (
            <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.75)' }}>
              {new Date(ev.inicio).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
            </div>
          )}
          {ev.pacientes && eventHeight(ev.inicio, ev.fim) > 44 && (
            <div style={{ fontSize: '0.57rem', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ev.pacientes.nome}
            </div>
          )}
        </button>
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
  const [slotInicio, setSlotInicio] = useState('');
  const [slotFim, setSlotFim] = useState('');
  const [carregando, setCarregando] = useState(false);

  const dias = semanaAtual(referencia);
  const inicioSemana = isoDate(dias[0]);
  const fimSemana = isoDate(dias[6]) + 'T23:59:59';

  const carregar = useCallback(async () => {
    setCarregando(true);
    const res = await fetch(`/api/agenda?inicio=${inicioSemana}&fim=${fimSemana}`);
    if (res.ok) setEventos(await res.json());
    setCarregando(false);
  }, [inicioSemana, fimSemana]);

  useEffect(() => { carregar(); }, [carregar]);

  function eventosDoDia(dia: Date) {
    return eventos.filter(ev => ev.inicio.slice(0, 10) === isoDate(dia));
  }

  function abrirSlot(dia: Date, hora: number) {
    const d = new Date(dia); d.setHours(hora, 0, 0, 0);
    const f = new Date(d); f.setMinutes(f.getMinutes() + 60);
    setSlotInicio(d.toISOString());
    setSlotFim(f.toISOString());
    setEventoSelecionado(null);
    setModalAberto(true);
  }

  function abrirEvento(ev: AgendaEvento, e: React.MouseEvent) {
    e.stopPropagation();
    setEventoSelecionado(ev); setSlotInicio(''); setSlotFim('');
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

  const hoje = isoDate(new Date());
  const eventosHoje = eventos.filter(ev => ev.inicio.slice(0, 10) === hoje);
  const horas = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => HORA_INICIO + i);

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 120px)' }}>
      {/* ── Grade semanal ── */}
      <div className="flex-1 flex flex-col min-w-0 card" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button onClick={() => setReferencia(new Date())} className="btn-ghost text-xs" style={{ padding: '0.25rem 0.6rem' }}>Hoje</button>
          <button onClick={() => { const d = new Date(referencia); d.setDate(d.getDate()-7); setReferencia(d); }} className="btn-ghost text-xs" style={{ padding: '0.25rem 0.5rem' }}>‹</button>
          <button onClick={() => { const d = new Date(referencia); d.setDate(d.getDate()+7); setReferencia(d); }} className="btn-ghost text-xs" style={{ padding: '0.25rem 0.5rem' }}>›</button>
          <span className="text-offwhite font-semibold ml-1" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1rem' }}>
            {dias[0].getDate()} – {dias[6].getDate()} {MESES_PT[dias[6].getMonth()]} {dias[6].getFullYear()}
          </span>
          {carregando && <span className="text-muted text-xs">·  carregando</span>}
          <div className="flex-1" />
          <button onClick={() => { setEventoSelecionado(null); setSlotInicio(''); setSlotFim(''); setModalAberto(true); }} className="btn-primary">
            + Novo Evento
          </button>
        </div>

        {/* Cabeçalho dias */}
        <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(7, 1fr)', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div />
          {dias.map(dia => {
            const isHoje = isoDate(dia) === hoje;
            return (
              <div key={isoDate(dia)} className="text-center py-2">
                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isHoje ? '#A07FD4' : '#8A8A93' }}>
                  {ptDia(dia)}
                </div>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', margin: '2px auto 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isHoje ? '#59399E' : 'transparent',
                  color: isHoje ? '#fff' : '#F5F2EA', fontSize: '0.78rem', fontWeight: isHoje ? 700 : 400,
                }}>
                  {dia.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Corpo scrollável */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(7, 1fr)', minWidth: 560 }}>
            {/* Labels de hora */}
            <div style={{ position: 'relative' }}>
              {horas.map(h => (
                <div key={h} style={{ height: HORA_PX, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 6, paddingTop: 3 }}>
                  <span style={{ fontSize: '0.58rem', color: '#8A8A93' }}>{String(h).padStart(2,'0')}:00</span>
                </div>
              ))}
            </div>

            {/* Colunas por dia */}
            {dias.map(dia => (
              <DiaColuna
                key={isoDate(dia)}
                dia={dia}
                eventos={eventosDoDia(dia)}
                onClickSlot={abrirSlot}
                onClickEvento={abrirEvento}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Painel lateral ── */}
      <div className="flex flex-col gap-3" style={{ width: 210, flexShrink: 0 }}>
        <MiniCalendario referencia={referencia} onSelect={setReferencia} />

        {/* Seu dia hoje */}
        <div style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '0.75rem', flex: 1, overflowY: 'auto' }}>
          <h3 className="table-header mb-2">Seu dia hoje</h3>
          {eventosHoje.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.7rem' }}>Nenhum evento hoje.</p>
          ) : (
            <ul className="space-y-2">
              {eventosHoje.map(ev => (
                <li key={ev.id} className="cursor-pointer" onClick={(e) => abrirEvento(ev, e as React.MouseEvent)}>
                  <div className="flex items-start gap-2">
                    <div style={{ width: 3, minHeight: 32, borderRadius: 2, background: STATUS_COR[ev.status], flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div className="text-offwhite font-medium" style={{ fontSize: '0.7rem', lineHeight: 1.3 }}>{ev.titulo}</div>
                      <div className="text-muted" style={{ fontSize: '0.6rem' }}>
                        {new Date(ev.inicio).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
                        {' – '}
                        {new Date(ev.fim).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
                      </div>
                      <div style={{ fontSize: '0.58rem', fontWeight: 700, color: STATUS_COR[ev.status] }}>{STATUS_LABEL[ev.status]}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Legenda */}
        <div style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '0.75rem' }}>
          <h3 className="table-header mb-2">Tipos</h3>
          <ul className="space-y-1.5">
            {(Object.entries(TIPO_LABEL) as [AgendaEvento['tipo'], string][]).map(([tipo, label]) => (
              <li key={tipo} className="flex items-center gap-2">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: TIPO_COR[tipo], flexShrink: 0 }} />
                <span className="text-muted" style={{ fontSize: '0.67rem', flex: 1 }}>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

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
  );
}
