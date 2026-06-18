'use client';

import { useState, useEffect } from 'react';
import { AgendaEvento, TIPO_LABEL, STATUS_LABEL, TIPO_COR } from '@/types/agenda';
import { utcParaLocalInput, localInputParaUTC } from '@/lib/datas';

interface Paciente { id: string; nome: string; telefone: string | null; }

interface Props {
  aberto: boolean;
  evento?: AgendaEvento | null;
  inicioDefault?: string;
  fimDefault?: string;
  pacientes: Paciente[];
  onFechar: () => void;
  onSalvo: (ev: AgendaEvento) => void;
  onExcluido?: (id: string) => void;
}

export function NovoEventoModal({
  aberto, evento, inicioDefault, fimDefault, pacientes, onFechar, onSalvo, onExcluido,
}: Props) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<AgendaEvento['tipo']>('consulta');
  const [status, setStatus] = useState<AgendaEvento['status']>('agendado');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [pacienteId, setPacienteId] = useState('');
  const [enviandoWpp, setEnviandoWpp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [wppMsg, setWppMsg] = useState('');

  const editando = !!evento;

  useEffect(() => {
    if (!aberto) return;
    if (evento) {
      setTitulo(evento.titulo);
      setDescricao(evento.descricao ?? '');
      setTipo(evento.tipo);
      setStatus(evento.status);
      setInicio(utcParaLocalInput(evento.inicio));
      setFim(utcParaLocalInput(evento.fim));
      setPacienteId(evento.paciente_id ?? '');
    } else {
      setTitulo('');
      setDescricao('');
      setTipo('consulta');
      setStatus('agendado');
      setInicio(inicioDefault ? utcParaLocalInput(inicioDefault) : '');
      setFim(fimDefault ? utcParaLocalInput(fimDefault) : '');
      setPacienteId('');
    }
    setErro('');
    setWppMsg('');
  }, [aberto, evento, inicioDefault, fimDefault]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo || !inicio || !fim) { setErro('Preencha título, início e fim.'); return; }
    setLoading(true); setErro('');
    const payload = {
      titulo, descricao: descricao || null, tipo, status,
      inicio: localInputParaUTC(inicio),
      fim: localInputParaUTC(fim),
      paciente_id: pacienteId || null,
      cor: TIPO_COR[tipo],
    };
    const url = editando ? `/api/agenda/${evento!.id}` : '/api/agenda';
    const method = editando ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErro(data.error ?? 'Erro ao salvar'); return; }
    onSalvo(data);
    onFechar();
  }

  async function handleExcluir() {
    if (!evento || !onExcluido) return;
    if (!confirm('Excluir este evento?')) return;
    await fetch(`/api/agenda/${evento.id}`, { method: 'DELETE' });
    onExcluido(evento.id);
    onFechar();
  }

  async function handleEnviarWhatsApp() {
    if (!evento) return;
    setEnviandoWpp(true); setWppMsg('');
    const res = await fetch(`/api/agenda/${evento.id}/confirmar`, { method: 'POST' });
    const data = await res.json();
    setEnviandoWpp(false);
    if (data._dev_mode || data.whatsapp?._dev_mode) {
      setWppMsg('Modo dev: WhatsApp não configurado. Mensagem simulada com sucesso.');
    } else if (res.ok) {
      setWppMsg('Mensagem enviada com sucesso!');
    } else {
      setWppMsg(`Erro: ${data.error}`);
    }
  }

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div className="card-elevated w-full max-w-lg rounded-modal overflow-hidden" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <h2 className="heading text-offwhite text-lg">{editando ? 'Editar Evento' : 'Novo Evento'}</h2>
          <button onClick={onFechar} className="text-muted hover:text-offwhite text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="table-header block mb-1">Título *</label>
            <input className="input-field" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Consulta inicial" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="table-header block mb-1">Tipo</label>
              <select className="input-field" value={tipo} onChange={e => setTipo(e.target.value as AgendaEvento['tipo'])}>
                {(Object.keys(TIPO_LABEL) as AgendaEvento['tipo'][]).map(t => (
                  <option key={t} value={t}>{TIPO_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="table-header block mb-1">Status</label>
              <select className="input-field" value={status} onChange={e => setStatus(e.target.value as AgendaEvento['status'])}>
                {(Object.keys(STATUS_LABEL) as AgendaEvento['status'][]).map(s => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="table-header block mb-1">Início *</label>
              <input type="datetime-local" className="input-field" value={inicio} onChange={e => setInicio(e.target.value)} required />
            </div>
            <div>
              <label className="table-header block mb-1">Fim *</label>
              <input type="datetime-local" className="input-field" value={fim} onChange={e => setFim(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="table-header block mb-1">Paciente</label>
            <select className="input-field" value={pacienteId} onChange={e => setPacienteId(e.target.value)}>
              <option value="">— Sem paciente (bloqueio/intervalo) —</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="table-header block mb-1">Observações</label>
            <textarea className="input-field" rows={2} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Informações adicionais..." />
          </div>

          {erro && <p className="text-error text-xs">{erro}</p>}

          {/* WhatsApp — só no modo edição com paciente */}
          {editando && evento?.paciente_id && (
            <div style={{ background: 'rgba(31,122,77,0.1)', border: '1px solid rgba(31,122,77,0.25)', borderRadius: 8, padding: '0.75rem 1rem' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-offwhite text-xs font-semibold">Confirmação via WhatsApp</p>
                  <p className="text-muted" style={{ fontSize: '0.7rem' }}>
                    {evento.whatsapp_enviado
                      ? evento.whatsapp_confirmado ? '✓ Paciente confirmou' : 'Mensagem enviada — aguardando resposta'
                      : 'Mensagem ainda não enviada'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleEnviarWhatsApp}
                  disabled={enviandoWpp}
                  className="btn-ghost text-xs"
                  style={{ fontSize: '0.7rem', padding: '0.3rem 0.75rem' }}
                >
                  {enviandoWpp ? 'Enviando...' : evento.whatsapp_enviado ? 'Reenviar' : 'Enviar'}
                </button>
              </div>
              {wppMsg && <p className="mt-1 text-xs" style={{ color: wppMsg.startsWith('Erro') ? '#C0392B' : '#1F7A4D' }}>{wppMsg}</p>}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            {editando && onExcluido && (
              <button type="button" onClick={handleExcluir} className="btn-ghost text-error text-xs border-error/30">
                Excluir
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onFechar} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : editando ? 'Salvar' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
