# Incidente: Erros Server-Side em /orcamentos/novo e /dashboard

**Data:** 2026-06-18  
**Severidade:** Alta (páginas inacessíveis em produção)  
**Status:** Resolvido

## Sintomas

- `/orcamentos/novo` → erro 500 genérico da Vercel (Digest 279225396)
- `/dashboard` → erro genérico intermitente
- Build local falhava com `Module not found: Can't resolve 'pizzip'`

## Causa Raiz

### 1. Função PostgreSQL ausente (`gerar_codigo_orcamento`)

`src/app/api/orcamentos/route.ts` chamava `supabase.rpc('gerar_codigo_orcamento')` mas a função nunca havia sido criada em nenhuma migration. O RPC retornava erro → `codigo = null` → INSERT violava NOT NULL → 500.

Nenhuma migration anterior (`20250601_*` a `20260616_*`) continha a função. A função irmã `gerar_codigo_contrato()` existia mas `gerar_codigo_orcamento()` ficou de fora.

### 2. Drift de `npm install` após merge

Durante resolução de conflito entre duas branches Claude (tema verde vs roxo), `package.json` recebeu `pizzip` e `docxtemplater` da branch remota, mas `node_modules` não foi atualizado. Build falhava localmente e qualquer deploy via `vercel deploy --prod` propagaria o erro.

## Correções Aplicadas

| Ação | Arquivo | Commit |
|------|---------|--------|
| Criação da migration com `gerar_codigo_orcamento()` | `supabase/migrations/20260618000001_gerar_codigo_orcamento.sql` | Aplicada via MCP ao projeto `bzsztgcxskeizkcgxgws` |
| Tratamento de erro no RPC | `src/app/api/orcamentos/route.ts` | Retorna 500 com mensagem clara se RPC falhar |
| Execução de `npm install` | `node_modules/` | Resolveu `pizzip` e `docxtemplater` |

## Verificação Pós-Correção

- `npm run build` passa com 43 rotas compiladas sem erros TypeScript
- Função `gerar_codigo_orcamento()` confirmada no Supabase via `GRANT EXECUTE TO authenticated`
- Dashboard não tem risco de throw: todas queries em `try/catch`, valores padrão mantidos

## Prevenção

1. **Toda nova RPC** usada em route handlers deve ter migration correspondente testada localmente antes do push
2. **Após qualquer merge** que altere `package.json`, rodar `npm install` antes de `npm run build`
3. **CI local recomendado:** `npm install && npm run build` como checklist pré-push
4. **Vercel auto-deploy quebrado:** deploy manual via `vercel deploy --prod` enquanto integração GitHub→Vercel não for restaurada (transferência de time `posvendasindaia23-archs-projects` → `formaefuncao` quebrou webhook)
