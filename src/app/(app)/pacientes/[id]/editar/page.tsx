import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FormPaciente } from '@/components/pacientes/FormPaciente';
import type { Paciente } from '@/types/pacientes';

export const dynamic = 'force-dynamic';

export default async function EditarPacientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('pacientes').select('*').eq('id', id).single();
  if (!data) notFound();

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading text-3xl text-offwhite mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Editar Paciente
        </h1>
        <p className="text-muted text-sm">{(data as Paciente).nome}</p>
      </div>
      <FormPaciente paciente={data as Paciente} />
    </div>
  );
}
