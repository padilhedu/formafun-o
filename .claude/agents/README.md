# Squad de QA Multi-Agente — Forma & Função CRM

Estrutura de QA onde um **orquestrador** decompõe e delega testes de cada área a
sub-agentes de **escopo único**, que retornam relatório JSON estrito. O orquestrador
não testa: coordena, faz append em `docs/qa-report.md` e sintetiza.

## Estrutura

```
.claude/
  agents/
    orquestrador-qa.md          coordena, não testa
    qa-auth-rls.md              auth, papéis, RLS, middleware
    qa-pacientes-prontuario.md  pacientes, anamnese, evoluções, audit_log
    qa-odontograma.md           FDI, faces, camadas, marcação
    qa-orcamentos.md            builder, cálculos, status, link público
    qa-contratos-assinatura.md  gerar-link, /assinar, canvas, PDF, e-mail (CRÍTICO)
    qa-financeiro.md            contas, honorários, parcelamento
    qa-agenda.md                slots, status, confirmação
    qa-config-portal.md         configurações, portal paciente
    qa-seguranca.md             rate limit, headers, tokens, secrets no bundle
  skills/
    qa-protocol/SKILL.md        como testar: caso, severidade, formato JSON
```

## Como rodar

A QA roda em **4 lotes**, um por invocação do orquestrador (stateless: cada lote lê o
repositório e o `docs/qa-report.md` acumulado).

- **LOTE 1 (crítico):** contratos-assinatura, auth-rls, seguranca
- **LOTE 2 (clínico):** pacientes-prontuario, odontograma
- **LOTE 3 (comercial/financeiro):** orcamentos, financeiro
- **LOTE 4 (operacional):** agenda, config-portal

Peça ao Claude Code, por exemplo:

> "Rode o LOTE 1 da QA" → o orquestrador delega os 3 sub-agentes críticos, valida os JSON,
> faz append em `docs/qa-report.md` e dá um resumo. Repita para os lotes 2–4.

Ao final do LOTE 4, o orquestrador consolida a tabela geral e a lista priorizada de falhas.

## Contrato de saída (resumo)

Todo sub-agente retorna **apenas** um JSON: `area`, `rotas_testadas[]`, `casos[]`
(id, descricao, tipo, resultado, severidade, evidencia, correcao_sugerida),
`cobertura_estimada`, `bloqueadores[]`. Detalhe em `.claude/skills/qa-protocol/SKILL.md`.

## Regras

- Orquestrador não executa testes; sub-agentes não corrigem código.
- QA **só reporta** — correção é decisão do usuário, em sessão separada.
- Append no relatório, nunca sobrescrever.
- Pausar entre lotes se surgir bloqueador crítico que invalide os testes seguintes.
