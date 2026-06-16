# QA Report — Lote 1
**Data:** 2026-06-16  
**Repositório:** forma-funcao-crm  
**Branch:** main (pós-commit Bloco 1)

---

## Tabela Resumo

| Agente | Total | Pass | Fail | Warn | Bloqueadores Críticos |
|--------|-------|------|------|------|-----------------------|
| qa-contratos-assinatura | 12 | 11 | 0 | 1 | 0 |
| qa-auth-rls | 8 | 5 | 1 | 2 | 1 |
| qa-seguranca | 8 | 7 | 0 | 1 | 0 |
| **TOTAL** | **28** | **23** | **1** | **4** | **1** |

---

## Bloqueadores para Produção

### ❌ AR-03 — RLS ausente em `anamneses` e `evolucoes` (CRÍTICO)

**Tipo:** segurança | **Severidade:** crítica  
**Evidência:** Nenhuma migration em `supabase/migrations/` define `CREATE TABLE`, `ENABLE ROW LEVEL SECURITY` nem `CREATE POLICY` para as tabelas `anamneses` ou `evolucoes`. Sem RLS, o Supabase permite que qualquer usuário autenticado (incluindo `recepcao`) leia todos os registros diretamente via PostgREST. As route handlers verificam autenticação mas não role.

**Correção:** Criar migration com `ENABLE ROW LEVEL SECURITY` e policies que restrinjam SELECT/INSERT/UPDATE a `role IN ('admin', 'dentista')` para anamneses. Recepcao pode ter leitura de evoluções se necessário, nunca de anamneses.

---

## Casos FAIL

| ID | Descrição | Tipo | Severidade | Evidência |
|----|-----------|------|------------|-----------|
| AR-03 | RLS ausente em anamneses/evolucoes | segurança | crítica | Nenhuma migration define tabela ou policy; acesso irrestrito via PostgREST |

---

## Casos WARN

### ⚠ CA-01 — `NEXT_PUBLIC_APP_URL` sem guard (CRÍTICO-WARN)
**Tipo:** funcional | **Severidade:** crítica  
**Evidência:** `gerar-link/route.ts` linha 113: `const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''` — se a variável não estiver definida, `sign_url` retorna `/assinar/${token}` (path relativo sem host). Não há guard que rejeite a requisição quando `NEXT_PUBLIC_APP_URL` estiver ausente.  
**Correção:** Adicionar no início da rota:
```typescript
if (!process.env.NEXT_PUBLIC_APP_URL) {
  return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL não configurada' }, { status: 500 });
}
```

---

### ⚠ AR-04 — RLS do portal do paciente com dependência não verificada (CRÍTICO-WARN)
**Tipo:** segurança | **Severidade:** crítica  
**Evidência:** `20260610000003_portal_paciente.sql`: a view `portal_consultas` usa `security_invoker = TRUE` e depende do RLS de `agenda_eventos`, mas não foi verificado se `agenda_eventos` tem policy por `paciente_id`. Se não tiver, a view pode expor consultas de outros pacientes.  
**Correção:** Verificar RLS de `agenda_eventos`. Adicionar `WHERE pa.user_id = auth.uid()` explicitamente na view como defesa em profundidade.

---

### ⚠ SE-05 — Webhooks aceitam payload sem autenticação se secret não configurada (ALTA-WARN)
**Tipo:** segurança | **Severidade:** alta  
**Evidência:** `src/app/api/webhooks/vindi/route.ts` e `zapsign/route.ts`: a validação HMAC é condicional (`if (webhookSecret)`). Se `VINDI_WEBHOOK_SECRET` / `ZAPSIGN_WEBHOOK_SECRET` não estiverem no ambiente, o endpoint aceita qualquer payload sem autenticação.  
**Correção:** Tornar obrigatório: se a variável não estiver definida, retornar HTTP 503 em vez de aceitar o payload.

---

### ⚠ AR-08 — Route handlers clínicas não verificam role server-side (MÉDIA-WARN)
**Tipo:** segurança | **Severidade:** média  
**Evidência:** `src/app/api/pacientes/[id]/anamnese/route.ts` e `evolucoes/route.ts` verificam apenas autenticação (`!user`), não role. Qualquer usuário autenticado (incluindo `recepcao`) pode inserir/editar anamneses e evoluções.  
**Correção:** Após `getUser()`, buscar `profile.role` de `profiles` e retornar 403 se role não for `admin` ou `dentista`.

---

## Casos PASS (todos)

| ID | Descrição | Tipo | Resultado |
|----|-----------|------|-----------|
| CA-02 | /assinar acessível sem auth (startsWith no middleware) | funcional | ✅ pass |
| CA-03 | Token expirado exibe mensagem correta | funcional | ✅ pass |
| CA-04 | Token já usado exibe "já assinado" | funcional | ✅ pass |
| CA-05 | Link exibido imediatamente após gerar (fix Bloco 1) | ux | ✅ pass |
| CA-06 | Canvas vazio bloqueado no frontend e backend | funcional | ✅ pass |
| CA-07 | PDF contém conteúdo + assinatura + tabela de evidências | dados | ✅ pass |
| CA-08 | Rate limiting 5 tentativas/10min por IP, persistente no DB | segurança | ✅ pass |
| CA-09 | Ordem dos headers no next.config.ts está correta (PDF por último) | funcional | ✅ pass |
| CA-10 | corpo_html_final regravado atomicamente com o token | dados | ✅ pass |
| CA-11 | SIGNING_HMAC_SECRET: guard explícito no início da rota | segurança | ✅ pass |
| CA-12 | Upload do bucket contratos-html é não-bloqueante | funcional | ✅ pass |
| AR-01 | Rotas (app) bloqueadas para não autenticado → /login | segurança | ✅ pass |
| AR-02 | publicRoutes completo: /login, /auth/callback, /api/webhooks, /portal/login, /api/portal/magic-link, /api/portal/primeiro-acesso, /assinar | segurança | ✅ pass |
| AR-05 | audit_log append-only: REVOKE UPDATE/DELETE em migrations | segurança | ✅ pass |
| AR-06 | Login com signInWithPassword + tratamento de erro | funcional | ✅ pass |
| AR-07 | Magic link com signInWithOtp, shouldCreateUser: false | funcional | ✅ pass |
| SE-01 | Chaves secretas ausentes do bundle client | segurança | ✅ pass |
| SE-02 | Apenas 3 vars NEXT_PUBLIC_ (URL, anon key, app URL) | segurança | ✅ pass |
| SE-03 | Headers de segurança completos no wildcard | segurança | ✅ pass |
| SE-04 | sign_token gerado com crypto.randomUUID() + HMAC | segurança | ✅ pass |
| SE-06 | PDF servido via URL assinada temporária (1h, Supabase Storage) | segurança | ✅ pass |
| SE-07 | HTML sanitizado com DOMPurify + allowlist no SignarClient | segurança | ✅ pass |
| SE-08 | CPF mascarado via mascararCPF() no PainelAssinatura | segurança | ✅ pass |
