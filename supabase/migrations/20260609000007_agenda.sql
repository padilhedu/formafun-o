-- Fase 7: Agenda + WhatsApp

CREATE TABLE agenda_eventos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id     uuid REFERENCES pacientes(id) ON DELETE SET NULL,
  dentista_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  titulo          text NOT NULL,
  descricao       text,
  tipo            text NOT NULL DEFAULT 'consulta'
                    CHECK (tipo IN ('consulta','retorno','avaliacao','emergencia','bloqueio')),
  status          text NOT NULL DEFAULT 'agendado'
                    CHECK (status IN ('agendado','confirmado','realizado','cancelado','faltou')),
  inicio          timestamptz NOT NULL,
  fim             timestamptz NOT NULL,
  cor             text DEFAULT '#59399E',
  whatsapp_enviado    boolean NOT NULL DEFAULT false,
  whatsapp_confirmado boolean NOT NULL DEFAULT false,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  atualizado_em   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fim_apos_inicio CHECK (fim > inicio)
);

CREATE INDEX idx_agenda_eventos_inicio     ON agenda_eventos(inicio);
CREATE INDEX idx_agenda_eventos_paciente   ON agenda_eventos(paciente_id);
CREATE INDEX idx_agenda_eventos_dentista   ON agenda_eventos(dentista_id);
CREATE INDEX idx_agenda_eventos_status     ON agenda_eventos(status);

CREATE OR REPLACE FUNCTION atualizar_agenda_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_agenda_atualizado_em
  BEFORE UPDATE ON agenda_eventos
  FOR EACH ROW EXECUTE FUNCTION atualizar_agenda_atualizado_em();

ALTER TABLE agenda_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agenda_autenticado"
  ON agenda_eventos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
