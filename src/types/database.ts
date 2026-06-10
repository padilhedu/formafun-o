import type { Paciente, Anamnese, Evolucao, DocumentoPaciente } from './pacientes';

export type Role = 'admin' | 'recepcao';

export interface Profile {
  id: string;
  nome: string;
  role: Role;
  avatar_url: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  usuario_id: string | null;
  acao: string;
  tabela: string;
  registro_id: string | null;
  detalhes: Record<string, unknown>;
  criado_em: string;
}

type TableDef<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      pacientes: TableDef<Paciente>;
      anamneses: TableDef<Anamnese>;
      evolucoes: TableDef<Evolucao>;
      documentos_paciente: TableDef<DocumentoPaciente>;
      audit_log: TableDef<AuditLog>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role: Role;
    };
  };
};
