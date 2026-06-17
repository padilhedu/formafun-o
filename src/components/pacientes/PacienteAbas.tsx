'use client';

import Link from 'next/link';
import type { Paciente, Anamnese, Evolucao, DocumentoPaciente } from '@/types/pacientes';
import { AbaVisaoGeral } from './AbaVisaoGeral';
import { AbaAnamnese } from './AbaAnamnese';
import { AbaEvolucoes } from './AbaEvolucoes';
import { AbaDocumentos } from './AbaDocumentos';
import { AbaOdontograma } from './AbaOdontograma';
import type { OdontogramaData } from './AbaOdontograma';
import { AbaOrcamentos } from './AbaOrcamentos';
import type { Orcamento } from '@/types/orcamentos';

const ABAS = [
  { id: 'visao-geral', label: 'Visão Geral' },
  { id: 'anamnese', label: 'Anamnese' },
  { id: 'odontograma', label: 'Odontograma' },
  { id: 'evolucoes', label: 'Evoluções' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'orcamentos', label: 'Orçamentos' },
];

interface Props {
  pacienteId: string;
  abaAtiva: string;
  paciente: Paciente;
  anamnese: Anamnese | null;
  evolucoes: Evolucao[];
  documentos: DocumentoPaciente[];
  odontograma: OdontogramaData | null;
  orcamentos: Orcamento[];
}

export function PacienteAbas({ pacienteId, abaAtiva, paciente, anamnese, evolucoes, documentos, odontograma, orcamentos }: Props) {
  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: 0 }}>
        {ABAS.map(aba => {
          const active = aba.id === abaAtiva;
          const isPlaceholder = ['financeiro'].includes(aba.id);
          return (
            <Link
              key={aba.id}
              href={`/pacientes/${pacienteId}?aba=${aba.id}`}
              className="relative px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0"
              style={{
                color: active ? '#1F7A4D' : '#6B6B66',
                fontFamily: 'var(--font-montserrat)',
              }}
            >
              {aba.label}
              {isPlaceholder && !active && (
                <span className="ml-1 text-[0.55rem] opacity-50">·</span>
              )}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Conteúdo */}
      {abaAtiva === 'visao-geral' && (
        <AbaVisaoGeral paciente={paciente} anamnese={anamnese} evolucoes={evolucoes} />
      )}
      {abaAtiva === 'anamnese' && (
        <AbaAnamnese pacienteId={pacienteId} anamnese={anamnese} />
      )}
      {abaAtiva === 'evolucoes' && (
        <AbaEvolucoes pacienteId={pacienteId} evolucoes={evolucoes} />
      )}
      {abaAtiva === 'documentos' && (
        <AbaDocumentos pacienteId={pacienteId} documentos={documentos} />
      )}
      {abaAtiva === 'odontograma' && (
        <AbaOdontograma pacienteId={pacienteId} odontograma={odontograma} />
      )}
      {abaAtiva === 'financeiro' && (
        <PlaceholderAba titulo="Financeiro" descricao="Extrato do paciente, saldo devedor e histórico de pagamentos." fase="Fase 6" />
      )}
      {abaAtiva === 'orcamentos' && (
        <AbaOrcamentos pacienteId={pacienteId} orcamentos={orcamentos} />
      )}
    </div>
  );
}

function PlaceholderAba({ titulo, descricao, fase }: { titulo: string; descricao: string; fase: string }) {
  return (
    <div className="card p-12 text-center" style={{ borderStyle: 'dashed', borderColor: 'rgba(31,122,77,0.2)' }}>
      <div className="heading text-xl text-offwhite mb-2" style={{ fontFamily: 'var(--font-cormorant)' }}>{titulo}</div>
      <p className="text-muted text-sm mb-4">{descricao}</p>
      <span className="badge" style={{ background: 'rgba(31,122,77,0.08)', color: '#1F7A4D', border: '1px solid rgba(31,122,77,0.2)' }}>
        {fase} — Em desenvolvimento
      </span>
    </div>
  );
}
