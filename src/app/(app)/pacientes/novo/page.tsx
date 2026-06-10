import { FormPaciente } from '@/components/pacientes/FormPaciente';

export default function NovoPacientePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading text-3xl text-offwhite mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Novo Paciente
        </h1>
        <p className="text-muted text-sm">Preencha os dados para cadastrar um novo paciente.</p>
      </div>
      <FormPaciente />
    </div>
  );
}
