# Plano de Refatoração — Forma & Função CRM

**Data:** 2026-06-18  
**Estado de partida:** build limpo (43 rotas, 0 erros TS)  
**Princípio:** zero mudança de comportamento. Commit por extração. Build verde obrigatório entre commits.

---

## Mapa de Monolitos

| Arquivo | Linhas | Responsabilidades misturadas | Risco | Prioridade |
|---------|--------|------------------------------|-------|------------|
| `src/components/pacientes/AbaOdontograma.tsx` | 639 | UI SVG + lógica undo/redo + fetch + formatação + mapeamento de enums | Médio | 3 |
| `src/components/agenda/AgendaClient.tsx` | 609 | DnD + cálculo BRT + fetch + polling WhatsApp + UI semanal + formatação datas | Médio | 4 |
| `src/components/financeiro/ReceberClient.tsx` | 440 | Cálculo totais + UI tabela/modal + fetch Vindi + validação + formatação | Alto | 7 |
| `src/lib/pdf-generator.ts` | 426 | Geração PDF + fetch Supabase + transformação docx + formatação | Alto | 8 |
| `src/components/orcamentos/OrcamentoBuilder.tsx` | 389 | UI tabela + cálculo preços + fetch catálogo + fetch save + validação | Médio | 2 |
| `src/components/orcamentos/OrcamentoBuilderV2.tsx` | 358 | Orquestração seções + cálculo total + fetch PATCH/POST + estado + debounce | Médio | 1 |
| `src/components/configuracoes/tabs/TabDocumentos.tsx` | 339 | CRUD templates + matriz proc-doc + fetch + UI editor + validação | Médio | 5 |
| `src/components/contratos/PainelAssinatura.tsx` | 306 | Fluxo assinatura + polling + fetch token/pdf + timeline UI + formatação | Alto | 9 |
| `src/components/orcamentos/sections/ProcedimentosSection.tsx` | 307 | UI seleção + fetch catálogo + formatação (callbacks delegam persistência) | Baixo | 1 |
| `src/components/leads/LeadsKanban.tsx` | 295 | DnD + KPIs + fetch CRUD + otimismo UI + formatação | Baixo | 0 |
| `src/components/orcamentos/sections/PagamentoSection.tsx` | 269 | Cálculo parcelamento + UI + fetch POST parcelas + fórmula amortização | Alto | 10 |
| `src/components/financeiro/PagarClient.tsx` | 254 | Cálculo totais + UI filtros/modal + fetch PATCH/DELETE/POST + validação | Alto | 6 |

---

## Ordem de Execução Proposta

### Fase 1 — Baixo risco, ganho rápido (começar aqui)

**M1 — `OrcamentoBuilderV2.tsx` (358 linhas, Médio)**  
Orquestrador — extrai: tipos → `types/orcamentos.ts` (já existe, ampliar); cálculos financeiros → `lib/orcamento-calc.ts`; função de save/debounce → hook `useOrcamentoSave.ts`.  
*Por que primeiro:* maior ganho de legibilidade, sem lógica crítica de pagamento, cálculos são funções puras testáveis.

**M2 — `OrcamentoBuilder.tsx` (389 linhas, Médio)**  
Extrai: lógica de cálculo de totais (já vai pra `lib/orcamento-calc.ts` do M1); fetch de catálogo → `features/orcamentos/queries.ts`; subcomponentes de linha de item → `components/orcamentos/ItemRow.tsx`.

**M3 — `ProcedimentosSection.tsx` (307 linhas, Baixo)**  
Extrai: fetch de catálogo → reutiliza `features/orcamentos/queries.ts` do M2; subcomponente de linha de procedimento → `components/orcamentos/ProcedimentoRow.tsx`.

### Fase 2 — Médio risco

**M4 — `AbaOdontograma.tsx` (639 linhas, Médio)**  
Extrai: constantes e mapas de condições → `lib/odontograma-constants.ts`; lógica de undo/redo → hook `useUndoRedo.ts`; fetch de save → `features/pacientes/mutations.ts`; subcomponente de dente → `components/pacientes/DenteSVG.tsx`.  
*Verificação extra:* testar renderização de todos os dentes + save após cada extração.

**M5 — `AgendaClient.tsx` (609 linhas, Médio)**  
Extrai: cálculo de posição/tempo BRT → `lib/agenda-calc.ts`; fetch → `features/agenda/queries.ts` e `mutations.ts`; hook de polling WhatsApp → `hooks/useWhatsAppStatus.ts`; subcomponentes → `components/agenda/EventoCard.tsx`, `SlotHora.tsx`.

**M6 — `TabDocumentos.tsx` (339 linhas, Médio)**  
Extrai: fetch CRUD templates → `features/configuracoes/queries.ts` e `mutations.ts`; subcomponente de editor → `components/configuracoes/TemplateEditor.tsx`.

### Fase 3 — Alto risco (verificação dobrada)

**M7 — `PagarClient.tsx` (254 linhas, Alto)**  
Extrai: cálculo de totais/status efetivo → `features/financeiro/calc.ts`; fetch → `features/financeiro/mutations.ts`.  
*Verificação:* testar fluxo completo de marcar pago antes e depois.

**M8 — `ReceberClient.tsx` (440 linhas, Alto)**  
Extrai: mesma estrutura do M7 (reutiliza `features/financeiro/`); subcomponente modal → `components/financeiro/BaixaModal.tsx`.  
*Verificação:* testar integração Vindi antes e depois.

**M9 — `pdf-generator.ts` (426 linhas, Alto)**  
Extrai: fetch Supabase → `features/contratos/queries.ts`; layout de PDF → arquivo separado; transformação HTML/docx → funções em `lib/docx-generator.ts` (já existe).  
*Não tocar na lógica de geração — só separar fetch de render.*

**M10 — `PainelAssinatura.tsx` (306 linhas, Alto)**  
Extrai: lógica de polling → hook `useAssinaturaPolling.ts`; fetch token/pdf → `features/contratos/mutations.ts`; subcomponentes da timeline → `components/contratos/StatusTimeline.tsx` (já existe parcialmente).  
*Deixar por último — fluxo mais crítico do sistema.*

---

## Duplicações a Eliminar (DRY — junto com as extrações)

| Lógica duplicada | Onde está | Centralizar em |
|-----------------|-----------|----------------|
| `formatBRL()` | ~8 arquivos | `src/lib/fmt.ts` |
| Cálculo de total de orçamento | Builder + BuilderV2 + API route | `src/lib/orcamento-calc.ts` |
| Status efetivo (pendente→vencido) | ReceberClient + PagarClient | `src/lib/financeiro-calc.ts` |
| Mapa de status com cores | múltiplos componentes | `src/lib/status.ts` (ampliar) |
| Funções de data BRT | Agenda + Dashboard + outros | `src/lib/datas.ts` |

---

## Bugs Encontrados Durante Diagnóstico (NÃO corrigir na refatoração)

- `OrcamentoBuilderV2.tsx`: existem dois builders (V1 e V2) — parece que V1 pode estar obsoleto. Confirmar e deprecar em sessão separada.
- `AgendaClient.tsx`: polling de WhatsApp hardcoded a cada X segundos sem cleanup verificável.
- `pdf-generator.ts`: contém fetch direto ao Supabase dentro da função de render — inversão de responsabilidade, mas manter comportamento intacto na refatoração.

---

## Critério de Conclusão

- [ ] Todos os Mx concluídos com build verde
- [ ] Nenhum arquivo > 300 linhas sem justificativa
- [ ] `formatBRL`, cálculo de total, status efetivo centralizados
- [ ] Testes unitários para: `orcamento-calc.ts`, `financeiro-calc.ts`, `datas.ts`
- [ ] Rotas principais testadas: dashboard, orçamentos, pacientes, agenda, contratos, financeiro, assinatura
- [ ] CLAUDE.md atualizado com convenção de arquitetura

---

## Status

| Módulo | Status |
|--------|--------|
| M1 — OrcamentoBuilderV2 | Pendente |
| M2 — OrcamentoBuilder | Pendente |
| M3 — ProcedimentosSection | Pendente |
| M4 — AbaOdontograma | Pendente |
| M5 — AgendaClient | Pendente |
| M6 — TabDocumentos | Pendente |
| M7 — PagarClient | Pendente |
| M8 — ReceberClient | Pendente |
| M9 — pdf-generator | Pendente |
| M10 — PainelAssinatura | Pendente |
