export interface Paciente {
  id: string;
  nome: string;
  cpf: string | null;
  rg: string | null;
  data_nascimento: string | null;
  sexo: 'M' | 'F' | 'outro' | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  endereco: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
  convenio: string | null;
  indicacao_origem: string | null;
  foto_url: string | null;
  drive_folder_id: string | null;
  consentimento_lgpd_em: string | null;
  status: 'ativo' | 'inativo';
  observacoes: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface Anamnese {
  id: string;
  paciente_id: string;
  respostas: Record<string, string | boolean | null>;
  alertas: string[];
  assinada_em: string | null;
  criada_por: string | null;
  created_at: string;
}

export interface Evolucao {
  id: string;
  paciente_id: string;
  profissional_id: string | null;
  data: string;
  dente: string | null;
  procedimento: string;
  descricao: string | null;
  anexos: { nome: string; link: string }[];
  travada: boolean;
  created_at: string;
}

export interface DocumentoPaciente {
  id: string;
  paciente_id: string;
  tipo: 'radiografia' | 'foto' | 'exame' | 'contrato' | 'outro';
  nome: string;
  drive_file_id: string | null;
  drive_link: string | null;
  mime_type: string | null;
  criado_em: string;
  criado_por: string | null;
}
