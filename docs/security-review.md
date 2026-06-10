# Revisão de Segurança — Sistema Forma & Função

> **Data:** 2026-06-10  
> **Fase:** 13 — Hardening pré-produção  
> **Responsável:** Equipe de desenvolvimento

---

## 1. Cabeçalhos HTTP

Configurados em `next.config.ts` para todas as rotas (`/(.*)`):

| Header | Valor | Proteção |
|--------|-------|----------|
| `Content-Security-Policy` | script-src self + supabase | XSS |
| `X-Frame-Options` | DENY | Clickjacking |
| `X-Content-Type-Options` | nosniff | MIME sniffing |
| `Referrer-Policy` | strict-origin-when-cross-origin | Leak de URL |
| `Permissions-Policy` | camera/mic/geo desabilitados | Privacidade |
| `Strict-Transport-Security` | max-age=63072000; includeSubDomains; preload | HTTPS forçado |
| `X-DNS-Prefetch-Control` | off | Prevenção de leak DNS |

**Ação pendente:** Remover `'unsafe-eval'` da CSP após confirmar que não é usado pelo Supabase JS SDK em produção.

---

## 2. Autenticação e Sessões

- **Auth provider:** Supabase Auth (JWT, RS256)
- **Portal paciente:** magic link via OTP (`shouldCreateUser: false`) + convite com código+CPF
- **Staff app:** email/senha com roles no tabela `profiles`
- **Middleware:** `src/lib/supabase/middleware.ts` intercepta todas as rotas; rotas `/portal/*` redirecionam para `/portal/login` se não autenticado
- **Separação de sessões:** portal e app interno usam a mesma instância Supabase, separados por RLS via `portal_acessos.user_id`

**Ação pendente:**
- [ ] Habilitar MFA/TOTP para usuários com role `admin` no Supabase Dashboard (Auth > Settings > MFA)
- [ ] Configurar session expiry: JWT expiry 1h, refresh token rotation habilitado (Supabase Dashboard > Auth > Settings)

---

## 3. Rate Limiting

Implementado no middleware (`src/lib/supabase/middleware.ts`):

- Endpoints protegidos: `/api/portal/magic-link`, `/api/portal/primeiro-acesso`, `/login`
- Limite: 10 requisições por IP por minuto
- Resposta: HTTP 429 com mensagem em português
- **Limitação:** rate limit em memória — resetado em cold start (Edge Function). Para produção de alta escala, usar Upstash Redis ou Vercel KV.

---

## 4. Validação de Webhooks

### ZapSign (`/api/webhooks/zapsign`)
- Valida `X-ZapSign-Signature` ou `X-Hub-Signature-256` com HMAC-SHA256
- Secret: variável `ZAPSIGN_WEBHOOK_SECRET`
- Usa `timingSafeEqual` para comparação constante (sem timing attack)
- Sem secret configurado: aceita (modo dev). **Em produção: obrigatório.**

### Vindi (`/api/webhooks/vindi`)
- Valida `X-Vindi-Signature` com HMAC-SHA256
- Secret: variável `VINDI_WEBHOOK_SECRET`
- Mesmo padrão de comparação segura

**Ação pendente:** Configurar os secrets reais na Vindi e ZapSign e adicionar ao `.env` de produção.

---

## 5. Proteção de Dados (LGPD/CFO)

### Banco de dados
- **RLS habilitado** em todas as tabelas de dados clínicos
- **Soft delete obrigatório:** trigger `no_delete_pacientes` bloqueia `DELETE` físico em `pacientes`
- **Prontuário:** trigger `no_delete_prontuarios` bloqueia delete físico (CFO exige retenção)
- **Audit log append-only:** `REVOKE UPDATE, DELETE ON audit_log FROM authenticated, anon`
- Função `inserir_audit_log()` é `SECURITY DEFINER` — permite INSERT sem bypass geral de RLS

### Dados sensíveis no frontend
- CPF mostrado mascarado na interface do portal (`***.***.-XXXXX`)
- Chaves de API nunca expostas no client — todas as chamadas externas passam por route handlers

---

## 6. XSS — Templates HTML

Templates de contratos/TCLE são renderizados com `dangerouslySetInnerHTML` em:
- `TabDocumentos.tsx` (preview do template)
- Futura página de visualização de contrato

**Risco:** conteúdo malicioso inserido por admin poderia executar JS no browser de outro usuário.

**Mitigação implementada:**
- Apenas usuários com role `admin` podem criar/editar templates (verificado no servidor)
- CSP bloqueia `script-src` inline de origens externas

**Mitigação recomendada (pendente):**
- [ ] Instalar `dompurify` + `isomorphic-dompurify` e sanitizar HTML antes de salvar no banco:
  ```bash
  npm install isomorphic-dompurify
  ```
  ```typescript
  import DOMPurify from 'isomorphic-dompurify';
  const htmlSanitizado = DOMPurify.sanitize(htmlBruto, { FORBID_TAGS: ['script', 'iframe', 'object'] });
  ```

---

## 7. Injeção SQL

- 100% via Supabase client (queries parametrizadas) — sem concatenação de string SQL
- Sem `rpc()` com interpolação de parâmetros inseguros

---

## 8. Chaves e Variáveis de Ambiente

| Variável | Uso | Exposta no client? |
|----------|-----|--------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Sim (necessário) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | RLS anon key | Sim (necessário) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations | Não — server only |
| `VINDI_API_KEY` | Vindi API | Não |
| `ZAPSIGN_API_TOKEN` | ZapSign API | Não |
| `ZAPSIGN_WEBHOOK_SECRET` | Validação HMAC | Não |
| `VINDI_WEBHOOK_SECRET` | Validação HMAC | Não |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Drive | Não |
| `WHATSAPP_API_TOKEN` | Z-API/Evolution | Não |

**Verificar:** `.gitignore` inclui `.env.local` e `.env.production`. Nunca commitar secrets.

---

## 9. Dependências

```bash
# Executar antes do deploy
npm audit
npm audit fix
```

Manter em dia com `dependabot` ou `renovate`.

---

## 10. Checklist Pré-Produção

- [ ] Configurar `ZAPSIGN_WEBHOOK_SECRET` e `VINDI_WEBHOOK_SECRET` nos providers
- [ ] Habilitar MFA para usuários admin no Supabase Dashboard
- [ ] Configurar session expiry (JWT 1h, refresh rotation)
- [ ] Remover `'unsafe-eval'` da CSP após testes
- [ ] Instalar e integrar DOMPurify para sanitização de templates HTML
- [ ] Executar `npm audit` e corrigir vulnerabilidades críticas
- [ ] Verificar que todas as migrations estão aplicadas no banco de produção
- [ ] Confirmar que RLS está habilitado em todas as tabelas (Supabase Dashboard > Table Editor)
- [ ] Revisar templates de contrato/TCLE com jurídico antes do uso em produção
- [ ] Configurar alertas de audit_log no Supabase (ex: ação `portal_acesso` em horário incomum)
- [ ] Habilitar PITR (Point-in-Time Recovery) no Supabase para o projeto de produção
- [ ] Configurar backup externo dos documentos assinados (Supabase Storage)
