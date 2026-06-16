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
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B89A5A', marginBottom: 4 }}>CLÍNICO</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 32, fontWeight: 600, color: '#F5F2EA', lineHeight: 1.1, marginBottom: 4 }}>
          Editar Paciente
        </h1>
        <p style={{ fontSize: 13, color: '#8A8A93', fontFamily: 'var(--font-montserrat)' }}>{(data as Paciente).nome}</p>
      </div>
      <FormPaciente paciente={data as Paciente} />
    </div>
  );
}
