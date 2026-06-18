# Arquitetura — Forma & Função CRM

**Stack:** Next.js 14 App Router · TypeScript · Supabase · Tailwind CSS  
**Princípio:** cada arquivo tem uma responsabilidade clara. Página orquestra, não implementa.

---

## Estrutura de Pastas

```
src/
├── app/                          # Rotas (App Router)
│   ├── (app)/<modulo>/
│   │   └── page.tsx              # FINO: busca dados via features/, monta componentes
│   └── api/<modulo>/
│       └── route.ts              # Handler HTTP: auth → chama features/ → resposta
│
├── components/
│   ├── ui/                       # Componentes base reutilizáveis (sem lógica de domínio)
│   │   ├── KpiCard.tsx
│   │   ├── DataTable.tsx
│   │   ├── StatusChip.tsx
│   │   └── ...
│   └── <modulo>/                 # Componentes específicos do domínio
│       ├── ComponentePrincipal.tsx
│       └── SubComponente.tsx     # Extraídos do monolito, uso exclusivo do módulo
│
├── features/<modulo>/            # Lógica de negócio isolada por domínio
│   ├── queries.ts                # Leituras do Supabase (tipadas, reutilizáveis)
│   ├── mutations.ts              # Escritas do Supabase / chamadas de API externa
│   ├── schema.ts                 # Validação Zod (formas, inputs de API)
│   └── types.ts                  # Tipos do domínio (se não estiverem em src/types/)
│
├── hooks/                        # Hooks React reutilizáveis entre módulos
│   ├── useUndoRedo.ts
│   ├── useAssinaturaPolling.ts
│   └── useOrcamentoSave.ts
│
├── lib/                          # Utilitários puros e transversais
│   ├── supabase/                 # Clientes (server.ts, client.ts, middleware.ts)
│   ├── fmt.ts                    # formatBRL, formatData, formatCPF (UMA definição)
│   ├── status.ts                 # Mapas de status → cor/label (centralizado)
│   ├── datas.ts                  # Funções de data em BRT (parseISO, formatRange...)
│   ├── orcamento-calc.ts         # Cálculo de totais, desconto, parcelamento
│   └── financeiro-calc.ts        # Status efetivo (pendente→vencido), totais
│
└── types/                        # Tipos compartilhados entre módulos
    ├── orcamentos.ts
    ├── contratos.ts
    └── database.ts               # Tipos gerados pelo Supabase
```

---

## Regras por Camada

### `app/(app)/<modulo>/page.tsx`
- Busca dados: chama `features/<modulo>/queries.ts` (nunca Supabase direto)
- Monta componentes: passa props tipadas
- Sem lógica de negócio, sem formatação, sem cálculos
- Máximo ~100 linhas

### `components/<modulo>/ComponentePrincipal.tsx`
- Recebe dados como props (não busca)
- Pode ter `useState`/`useEffect` para estado local de UI
- Chama mutations via `features/<modulo>/mutations.ts` ou `fetch` para route handlers
- Sem acesso direto ao Supabase no client
- Máximo ~200 linhas; se passar disso, extrair subcomponentes

### `features/<modulo>/queries.ts`
- Funções assíncronas que recebem o cliente Supabase e retornam dados tipados
- Sem UI, sem estado, sem efeitos colaterais além da leitura
- Reutilizável em page.tsx e em route handlers

### `features/<modulo>/mutations.ts`
- Funções que escrevem no banco ou chamam APIs externas
- Sempre server-side (route handlers ou Server Actions) — nunca expor no client
- Retornam `{ data, error }` consistentes

### `lib/fmt.ts` — Formatação (UMA SÓ FONTE)
```typescript
export function formatBRL(v: number): string { ... }
export function formatData(iso: string, opts?: Intl.DateTimeFormatOptions): string { ... }
export function formatCPF(cpf: string): string { ... }
```
**Regra:** se você está escrevendo `toLocaleString('pt-BR', { style: 'currency'...})` inline em um componente, mova para `lib/fmt.ts`.

### `lib/status.ts` — Status (CENTRALIZADO)
Todos os mapas `status → cor/label` ficam aqui. Nenhum componente define cores de status inline.

### `lib/orcamento-calc.ts` — Cálculos de Orçamento
```typescript
export function calcularTotal(itens: ItemOrcamento[], desconto: Desconto): number { ... }
export function calcularParcelas(total: number, modelo: ModeloPagamento): Parcela[] { ... }
```
Funções puras — sem side effects, testáveis com Vitest.

---

## O Que NÃO Fazer

| Anti-padrão | Por quê |
|-------------|---------|
| `fetch('/api/...')` dentro de `page.tsx` (Server Component) | Use Supabase direto via `features/queries.ts` |
| `formatBRL` definida em cada arquivo | Duplicação — use `lib/fmt.ts` |
| Cores de status hardcoded (`'#1F7A4D'`) em componentes | Use tokens CSS ou `lib/status.ts` |
| Lógica de cálculo dentro de `render` | Extraia para função pura em `lib/` |
| Componentes > 300 linhas sem justificativa | Sinal de múltiplas responsabilidades |
| Supabase client no componente client (`'use client'`) | Segurança — use route handlers |

---

## Convenção de Commits de Refatoração

```
refactor(<modulo>): extrai <o quê> para <onde> (sem mudança de comportamento)

Exemplos:
refactor(orcamentos): extrai cálculo de total para lib/orcamento-calc.ts
refactor(agenda): extrai funções de data BRT para lib/datas.ts
refactor(financeiro): extrai PagarClient em queries + mutations + UI separados
```

---

## Testes Unitários (Vitest)

Cobrir obrigatoriamente as funções puras extraídas:
- `lib/orcamento-calc.ts` — total com desconto, parcelamento com juros
- `lib/financeiro-calc.ts` — status efetivo, cálculo de vencimento
- `lib/datas.ts` — conversão BRT, slots de agenda
- `lib/fmt.ts` — formatBRL edge cases (zero, negativo, centavos)

Não cobrir UI — cobertura de UI via teste manual e/ou Playwright (futuro).
