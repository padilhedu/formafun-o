-- QA Críticos: trava 24h em evoluções + view lancamentos + audit granular

-- ============================================================
-- QA-1: Trigger de trava de evolução após 24h (defesa em profundidade)
-- A rota PATCH já verifica no servidor; o trigger garante mesmo via SQL direto
-- ============================================================

CREATE OR REPLACE FUNCTION check_evolucao_editavel()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.data < NOW() - INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'Evolução só pode ser editada em até 24 horas após o registro (CFO).';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_evolucao_trava_24h ON evolucoes;
CREATE TRIGGER tg_evolucao_trava_24h
  BEFORE UPDATE ON evolucoes
  FOR EACH ROW
  EXECUTE FUNCTION check_evolucao_editavel();

-- ============================================================
-- QA-3: View lancamentos → mapeia contas_receber para o portal
-- O portal do paciente espera: id, descricao, valor, tipo, data_vencimento,
-- data_pagamento, status, forma_pagamento, link_fatura, paciente_id
-- ============================================================

CREATE OR REPLACE VIEW lancamentos
WITH (security_invoker = true)   -- herda RLS das tabelas subjacentes
AS
SELECT
  cr.id,
  cr.descricao,
  cr.valor,
  'receita'::text                          AS tipo,
  cr.vencimento                            AS data_vencimento,
  cr.pago_em                               AS data_pagamento,
  cr.status,
  cr.forma_pagamento,
  -- link de fatura Vindi (se disponível)
  CASE
    WHEN cr.vindi_bill_id IS NOT NULL
    THEN 'https://app.vindi.com.br/customer/bills/' || cr.vindi_bill_id
    ELSE NULL
  END                                      AS link_fatura,
  cr.paciente_id
FROM contas_receber cr
WHERE cr.status <> 'cancelado';

-- RLS note: a view usa security_invoker, então as políticas RLS de
-- contas_receber se aplicam automaticamente. Nenhuma política adicional necessária.
