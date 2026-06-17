'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  pacienteId: string;
  pacienteNome: string;
  profissionalId: string;
  profissionais: { id: string; nome: string }[];
  convenio: string;
  dataAvaliacao: string;
  validade: string;
  sessoesPrevistas: string;
  atendenteNome: string;
  isAdmin: boolean;
  travado: boolean;
  onChange: {
    setPacienteId: (v: string) => void;
    setPacienteNome: (v: string) => void;
    setProfissionalId: (v: string) => void;
    setConvenio: (v: string) => void;
    setDataAvaliacao: (v: string) => void;
    setValidade: (v: string) => void;
    setSessoesPrevistas: (v: string) => void;
  };
  labelStyle: React.CSSProperties;
}

interface PacienteSugestao {
  id: string;
  nome: string;
  cpf: string | null;
}

const CONVENIOS = ['Particular', 'Unimed', 'Amil', 'SulAmérica', 'Bradesco Saúde', 'Porto Seguro', 'Outro'];

export function DadosAtendimento({ pacienteId, pacienteNome, profissionalId, profissionais, convenio, dataAvaliacao, validade, sessoesPrevistas, atendenteNome, travado, onChange, labelStyle }: Props) {
  const [busca, setBusca] = useState(pacienteNome);
  const [sugestoes, setSugestoes] = useState<PacienteSugestao[]>([]);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const buscaRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (buscaRef.current) clearTimeout(buscaRef.current);
    if (busca.length < 2) { setSugestoes([]); return; }
    buscaRef.current = setTimeout(async () => {
      const res = await fetch(`/api/pacientes?q=${encodeURIComponent(busca)}&limit=8`);
      if (res.ok) setSugestoes(await res.json() as PacienteSugestao[]);
    }, 300);
  }, [busca]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setShowSugestoes(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selecionarPaciente = (p: PacienteSugestao) => {
    onChange.setPacienteId(p.id);
    onChange.setPacienteNome(p.nome);
    setBusca(p.nome);
    setShowSugestoes(false);
  };

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 12, padding: '18px 20px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#FAF8F4', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '8px 12px', color: '#1C1C1C',
    fontSize: 13, fontFamily: 'var(--font-montserrat)',
    outline: 'none',
  };

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1F7A4D', fontFamily: 'var(--font-montserrat)', marginBottom: 16 }}>
        Dados do Atendimento
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coluna esquerda */}
        <div className="space-y-3">
          {/* Paciente */}
          <div ref={containerRef} style={{ position: 'relative' }}>
            <label style={labelStyle}>Paciente</label>
            <input
              style={inputStyle}
              value={busca}
              disabled={travado}
              placeholder="Nome ou CPF…"
              onChange={e => { setBusca(e.target.value); setShowSugestoes(true); }}
              onFocus={() => busca.length >= 2 && setShowSugestoes(true)}
              aria-label="Buscar paciente"
            />
            {showSugestoes && sugestoes.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: '#FAF8F4', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, overflow: 'hidden', marginTop: 4,
              }}>
                {sugestoes.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selecionarPaciente(p)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '9px 12px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                      color: '#1C1C1C', fontSize: 13, fontFamily: 'var(--font-montserrat)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(31,122,77,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    {p.nome}
                    {p.cpf && <span style={{ color: '#6B6B66', fontSize: 11, marginLeft: 8 }}>{p.cpf}</span>}
                  </button>
                ))}
              </div>
            )}
            {!travado && pacienteId && (
              <a href={`/pacientes/${pacienteId}`} style={{ fontSize: 11, color: '#1F7A4D', display: 'block', marginTop: 4 }}>
                Ver cadastro →
              </a>
            )}
          </div>

          {/* Dentista */}
          <div>
            <label style={labelStyle}>Dentista responsável</label>
            <select
              style={inputStyle}
              value={profissionalId}
              disabled={travado}
              onChange={e => onChange.setProfissionalId(e.target.value)}
              aria-label="Dentista responsável"
            >
              <option value="">— Selecionar —</option>
              {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          {/* Convênio */}
          <div>
            <label style={labelStyle}>Convênio</label>
            <select
              style={inputStyle}
              value={convenio}
              disabled={travado}
              onChange={e => onChange.setConvenio(e.target.value)}
              aria-label="Convênio"
            >
              {CONVENIOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Coluna direita */}
        <div className="space-y-3">
          {/* Atendente */}
          <div>
            <label style={labelStyle}>Atendente / Criador</label>
            <input
              style={{ ...inputStyle, opacity: 0.6 }}
              value={atendenteNome}
              disabled
              aria-label="Atendente"
            />
          </div>

          {/* Data avaliação */}
          <div>
            <label style={labelStyle}>Data da avaliação</label>
            <input
              type="date"
              style={inputStyle}
              value={dataAvaliacao}
              disabled={travado}
              onChange={e => onChange.setDataAvaliacao(e.target.value)}
              aria-label="Data da avaliação"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Validade */}
            <div>
              <label style={labelStyle}>Válido até</label>
              <input
                type="date"
                style={inputStyle}
                value={validade}
                disabled={travado}
                onChange={e => onChange.setValidade(e.target.value)}
                aria-label="Validade do orçamento"
              />
            </div>

            {/* Sessões previstas */}
            <div>
              <label style={labelStyle}>Sessões previstas</label>
              <input
                type="number"
                min="1"
                style={inputStyle}
                value={sessoesPrevistas}
                disabled={travado}
                placeholder="—"
                onChange={e => onChange.setSessoesPrevistas(e.target.value)}
                aria-label="Número de sessões previstas"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
