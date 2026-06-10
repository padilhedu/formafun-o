import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { registrarAudit } from '@/lib/audit';
import { calcAge, formatDate } from '@/lib/masks';
import type { Paciente, Anamnese, Evolucao, DocumentoPaciente } from '@/types/pacientes';
import type { OdontogramaData } from '@/components/pacientes/AbaOdontograma';
import type { Orcamento } from '@/types/orcamentos';
import { PacienteAbas } from '@/components/pacientes/PacienteAbas';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string }>;
}

export default async function PacientePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { aba = 'visao-geral' } = await searchParams;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <div className="text-muted p-8">Configure o Supabase para usar este módulo.</div>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!paciente) notFound();

  await registrarAudit('leitura', 'pacientes', id, { aba });

  // Carregar dados conforme a aba
  let anamnese: Anamnese | null = null;
  let evolucoes: Evolucao[] = [];
  let documentos: DocumentoPaciente[] = [];
  let odontograma: OdontogramaData | null = null;
  let orcamentos: Orcamento[] = [];

  if (aba === 'anamnese' || aba === 'visao-geral') {
    const { data } = await supabase.from('anamneses').select('*').eq('paciente_id', id).order('created_at', { ascending: false }).limit(1);
    anamnese = (data?.[0] as unknown as Anamnese) ?? null;
  }

  if (aba === 'evolucoes' || aba === 'visao-geral') {
    const { data } = await supabase.from('evolucoes').select('*').eq('paciente_id', id).order('data', { ascending: false }).limit(10);
    evolucoes = (data as Evolucao[]) ?? [];
  }

  if (aba === 'documentos') {
    const { data } = await supabase.from('documentos_paciente').select('*').eq('paciente_id', id).order('criado_em', { ascending: false });
    documentos = (data as DocumentoPaciente[]) ?? [];
  }

  if (aba === 'odontograma') {
    const { data } = await supabase.from('odontogramas').select('*').eq('paciente_id', id).single();
    odontograma = data ? { dentes: (data as { dentes: OdontogramaData['dentes'] }).dentes, observacoes: (data as { observacoes?: string }).observacoes } : null;
  }

  if (aba === 'orcamentos') {
    const { data } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('paciente_id', id)
      .order('criado_em', { ascending: false });
    orcamentos = (data as Orcamento[]) ?? [];
  }

  return (
    <div>
      {/* Header do paciente */}
      <div className="flex items-start gap-5 mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
          style={{ background: 'rgba(184,154,90,0.12)', border: '1px solid rgba(184,154,90,0.3)', color: '#B89A5A', fontFamily: 'var(--font-montserrat)' }}>
          {(paciente as Paciente).nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="heading text-3xl text-offwhite" style={{ fontFamily: 'var(--font-cormorant)' }}>
              {(paciente as Paciente).nome}
            </h1>
            <span className="badge" style={{
              background: (paciente as Paciente).status === 'ativo' ? 'rgba(74,222,128,0.1)' : 'rgba(138,138,147,0.1)',
              color: (paciente as Paciente).status === 'ativo' ? '#4ADE80' : '#8A8A93',
              border: `1px solid ${(paciente as Paciente).status === 'ativo' ? 'rgba(74,222,128,0.25)' : 'rgba(138,138,147,0.15)'}`,
            }}>{(paciente as Paciente).status}</span>
          </div>
          <div className="flex items-center gap-4 text-muted text-sm flex-wrap">
            {(paciente as Paciente).cpf && <span>CPF {(paciente as Paciente).cpf}</span>}
            {(paciente as Paciente).data_nascimento && (
              <span>{calcAge((paciente as Paciente).data_nascimento)} anos · {formatDate((paciente as Paciente).data_nascimento)}</span>
            )}
            {(paciente as Paciente).telefone && <span>{(paciente as Paciente).telefone}</span>}
            {(paciente as Paciente).email && <span>{(paciente as Paciente).email}</span>}
          </div>
          {/* Alertas clínicos da anamnese */}
          {anamnese?.alertas && anamnese.alertas.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {anamnese.alertas.map((alerta: string) => (
                <span key={alerta} className="badge"
                  style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171', border: '1px solid rgba(248,113,113,0.25)' }}>
                  ⚠ {alerta}
                </span>
              ))}
            </div>
          )}
        </div>
        <a href={`/pacientes/${id}/editar`} className="btn-ghost text-xs">Editar</a>
      </div>

      {/* Abas */}
      <PacienteAbas
        pacienteId={id}
        abaAtiva={aba}
        paciente={paciente as Paciente}
        anamnese={anamnese}
        evolucoes={evolucoes}
        documentos={documentos}
        odontograma={odontograma}
        orcamentos={orcamentos}
      />
    </div>
  );
}
