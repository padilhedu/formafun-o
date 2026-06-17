import { FormPaciente } from '@/components/pacientes/FormPaciente';

export default function NovoPacientePage() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontFamily: 'var(--font-montserrat)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1F7A4D', marginBottom: 4 }}>CLÍNICO</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 32, fontWeight: 600, color: '#1C1C1C', lineHeight: 1.1, marginBottom: 4 }}>
          Novo Paciente
        </h1>
        <p style={{ fontSize: 13, color: '#6B6B66', fontFamily: 'var(--font-montserrat)' }}>Preencha os dados para cadastrar um novo paciente.</p>
      </div>
      <FormPaciente />
    </div>
  );
}
