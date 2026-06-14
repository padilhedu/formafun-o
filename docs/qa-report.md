# Relatório de QA — Forma & Função CRM

> Gerado pelo squad de QA multi-agente (`.claude/agents/`). Cada lote é adicionado por append.
> QA apenas reporta — correção é decisão do usuário, em sessão separada.

| Lote | Áreas | Status |
|---|---|---|
| LOTE 1 | contratos-assinatura, auth-rls, seguranca | ✅ concluído |
| LOTE 2 | pacientes-prontuario, odontograma | ✅ concluído |
| LOTE 3 | orcamentos, financeiro | ✅ concluído |
| LOTE 4 | agenda, config-portal | ✅ concluído |

---

<!-- Os resultados de cada lote são adicionados abaixo (append, nunca sobrescrever). -->

## Correções aplicadas (2026-06-13) — bloqueadores críticos do LOTE 1

Sessão de correção aprovada pelo usuário. Status dos críticos/altos:

| ID | Falha | Correção aplicada | Status |
|---|---|---|---|
| auth-03 / assin-01 | `/assinar` não público → redirect p/ login | Adicionado `/assinar`, `/api/contratos/assinar`, `/api/contratos/recusar` ao `publicRoutes` (`src/lib/supabase/middleware.ts`) | ✅ corrigido |
| sec-06 | `SIGNING_HMAC_SECRET ?? ''` (HMAC forjável) | Novo helper `src/lib/signing-secret.ts` lança erro se ausente/vazio; usado em `gerar-link` e `assinar` | ✅ corrigido |
| auth-04 / auth-05 | RLS permissiva `authenticated` → paciente do portal lia dados de todos | Migration `20260613000001_rls_staff_paciente.sql` **aplicada em produção**: `is_staff()` + `is_meu_paciente()`; staff full, paciente só os próprios; tabelas sensíveis staff-only | ✅ corrigido |
| assin-03 | iframe de preview bloqueado por `X-Frame-Options: DENY` | `SAMEORIGIN` + `frame-ancestors 'self'` (`next.config.ts`) | ✅ corrigido |
| assin-02 | `sign_url` sem validação de env vazia | Parcial: `NEXT_PUBLIC_APP_URL` confirmado preenchido em runtime; validação explícita não adicionada | ⚠️ pendente |

**Correção da QA:** o achado auth-04 ("tabelas clínicas ausentes em migrations") estava
parcialmente errado — as tabelas existem no banco com RLS habilitado; o problema real eram
as **policies permissivas**, não a ausência de RLS. As tabelas foram criadas fora do
versionamento de migrations (dívida técnica a registrar, mas não era um furo de RLS).

**Bug crítico extra encontrado e corrigido (não estava no LOTE 1):** três rotas consultavam
`.from('usuarios')`, mas essa tabela **não existe** (a tabela de papéis é `profiles`).
Efeito: `gerar-link/route.ts:14` sempre retornava `profile = null` → **403 em toda geração
de link de contrato** (fluxo de assinatura inteiro bloqueado). `assinar/route.ts:154` e
`recusar/route.ts:40` faziam a notificação ao staff falhar silenciosamente. Os três foram
trocados para `profiles`. ✅ corrigido.

---

## LOTE 1 — Crítico (contratos-assinatura, auth-rls, segurança)

Executado em 2026-06-13.

### Resumo do lote

| Área | Casos | Pass | Fail | Warn | Cobertura | Bloqueadores |
|---|---|---|---|---|---|---|
| Contratos & Assinatura | 11 | 7 | 2 | 2 | 90% | 2 |
| Auth & RLS | 9 | 3 | 3 | 3 | 70% | 2 |
| Segurança | 6 | 5 | 1 | 0 | 90% | 0 |

### Falhas críticas/altas do lote (priorizadas)

| Sev | ID | Falha | Correção sugerida |
|---|---|---|---|
| 🔴 crítica | auth-03 / assin-01 | `/assinar/[token]` **não** está em `publicRoutes` → middleware redireciona o signatário deslogado para `/login`. Fluxo de assinatura inacessível. | Adicionar `/assinar` (e APIs `/api/contratos/assinar`, `/recusar`) ao `publicRoutes` em `src/lib/supabase/middleware.ts:57`. |
| 🔴 crítica | sec-06 | `SIGNING_HMAC_SECRET ?? ''` → se a env faltar, HMAC usa chave vazia conhecida; atacante forja token válido. | Tornar obrigatório: recusar (500) se ausente/vazio. `gerar-link/route.ts:54`, `assinar/route.ts:69`. |
| 🔴 crítica | auth-04 | Tabelas clínicas core (pacientes/prontuarios/odontograma/anamnese/evolucoes) **não estão em migrations**; `ENABLE RLS` condicional sem policy → sem RLS efetiva por papel/owner. | Versionar tabelas com RLS + policies staff vs paciente e owner. |
| 🔴 crítica | auth-05 | `agenda_eventos` policy `FOR ALL USING(true)` — qualquer autenticado lê/escreve toda a agenda (vaza se paciente tiver sessão). | Escopar por papel; policy de owner nas tabelas clínicas. |
| 🟠 alta | assin-03 | `X-Frame-Options: DENY` + `frame-ancestors 'none'` global bloqueiam o iframe de preview same-origin do contrato. | Trocar para `SAMEORIGIN` / `frame-ancestors 'self'` (`next.config.ts:20,27`). |
| 🟠 alta | assin-02 | `sign_url` depende de `NEXT_PUBLIC_APP_URL ?? ''`; se ausente em prod, link quebra. | Validar env não-vazia no boot/route. |

### JSON — Contratos & Assinatura

```json
{
  "area": "Contratos & Assinatura Digital",
  "rotas_testadas": ["/assinar/[token]","/api/contratos/[id]/gerar-link","/api/contratos/assinar","/api/contratos/recusar","/api/contratos/[id]/pdf","src/middleware.ts","next.config.ts","src/lib/pdf-assinado.ts","src/lib/rate-limit.ts","src/lib/cpf.ts"],
  "casos": [
    {"id":"assin-01","descricao":"/assinar/[token] público não exige login","tipo":"seguranca","resultado":"fail","severidade":"alta","evidencia":"src/lib/supabase/middleware.ts:57-72 — publicRoutes não inclui '/assinar'; matcher cobre tudo → redirect /login","correcao_sugerida":"Adicionar '/assinar' e APIs de assinatura ao publicRoutes"},
    {"id":"assin-02","descricao":"sign_url usa URL de produção, nunca localhost/vazia","tipo":"funcional","resultado":"warn","severidade":"alta","evidencia":"gerar-link/route.ts:76-77 — NEXT_PUBLIC_APP_URL ?? '' (vem de env, mas sem validação de vazio)","correcao_sugerida":"Validar NEXT_PUBLIC_APP_URL não-vazia; confirmar na Vercel"},
    {"id":"assin-03","descricao":"iframe de preview renderiza (X-Frame-Options)","tipo":"funcional","resultado":"fail","severidade":"alta","evidencia":"next.config.ts:20,27 X-Frame-Options DENY + frame-ancestors 'none' global; page.tsx:124-128 iframe same-origin bloqueado","correcao_sugerida":"SAMEORIGIN / frame-ancestors 'self'"},
    {"id":"assin-04","descricao":"Token expirado tratado","tipo":"funcional","resultado":"pass","severidade":"alta","evidencia":"page.tsx:34-38; assinar/route.ts:64-66; recusar/route.ts:26-28","correcao_sugerida":"Nenhuma"},
    {"id":"assin-05","descricao":"Token já usado rejeitado","tipo":"seguranca","resultado":"pass","severidade":"alta","evidencia":"assinar/route.ts:60-61; page.tsx:40-47; travado=true em :124-136","correcao_sugerida":"Nenhuma"},
    {"id":"assin-06","descricao":"Canvas exige assinatura não-vazia (client+back)","tipo":"funcional","resultado":"pass","severidade":"media","evidencia":"SignarClient.tsx:122-125; assinar/route.ts:42-44","correcao_sugerida":"Threshold 200 chars é fraco; baixo risco"},
    {"id":"assin-07","descricao":"CPF validado no back","tipo":"seguranca","resultado":"pass","severidade":"media","evidencia":"assinar/route.ts:29-31 → src/lib/cpf.ts:1-14","correcao_sugerida":"Nenhuma"},
    {"id":"assin-08","descricao":"PDF com IP/timestamp/hash/assinatura","tipo":"dados","resultado":"pass","severidade":"alta","evidencia":"pdf-assinado.ts:68-89; assinar/route.ts:86-110; docHash SHA-256 gerar-link:51","correcao_sugerida":"stripHtml perde formatação de tabela; conteúdo textual mantido"},
    {"id":"assin-09","descricao":"Rate limit na rota de assinatura","tipo":"seguranca","resultado":"pass","severidade":"media","evidencia":"assinar/route.ts:25-26 → rate-limit.ts (5/10min por IP)","correcao_sugerida":"recusar/route.ts sem rate limit; baixo impacto"},
    {"id":"assin-10","descricao":"HMAC do token timing-safe","tipo":"seguranca","resultado":"pass","severidade":"critica","evidencia":"assinar/route.ts:69-72 crypto.timingSafeEqual","correcao_sugerida":"Garantir SIGNING_HMAC_SECRET (ver sec-06)"},
    {"id":"assin-11","descricao":"PDF público por token checa expiração/status","tipo":"seguranca","resultado":"warn","severidade":"media","evidencia":"pdf/route.ts:19-29 valida só id+token_publico, sem expiração/status","correcao_sugerida":"Adicionar validade ao acesso público do PDF"}
  ],
  "cobertura_estimada": "90%",
  "bloqueadores": ["Sem dev server — assin-02/assin-03 não validados em runtime","Valores de NEXT_PUBLIC_APP_URL e SIGNING_HMAC_SECRET em prod não verificáveis"]
}
```

### JSON — Auth & RLS

```json
{
  "area": "Autenticação, Papéis e RLS",
  "rotas_testadas": ["/login","/portal/login","/assinar/[token]","(app)/* protegidas","/api/portal/magic-link","/api/webhooks/*"],
  "casos": [
    {"id":"auth-01","descricao":"(app) bloqueia sem sessão","tipo":"seguranca","resultado":"pass","severidade":"critica","evidencia":"src/lib/supabase/middleware.ts:68-72; matcher src/middleware.ts:9-11","correcao_sugerida":"Nenhuma; validar em runtime"},
    {"id":"auth-02","descricao":"/portal/login público","tipo":"seguranca","resultado":"pass","severidade":"alta","evidencia":"middleware.ts:57-63 publicRoutes inclui '/portal/login'","correcao_sugerida":"Nenhuma"},
    {"id":"auth-03","descricao":"/assinar deveria ser público mas não está em publicRoutes","tipo":"seguranca","resultado":"fail","severidade":"critica","evidencia":"middleware.ts:57-72 sem '/assinar'; page existe assinar/[token]/page.tsx:22","correcao_sugerida":"Adicionar '/assinar' + APIs ao publicRoutes"},
    {"id":"auth-04","descricao":"Recepção não lê anamnese/evoluções; paciente só próprios","tipo":"seguranca","resultado":"fail","severidade":"critica","evidencia":"Tabelas clínicas ausentes em migrations; security_hardening 20260610000004:47-55 ENABLE RLS em EXCEPTION undefined_table → sem policy","correcao_sugerida":"Versionar tabelas clínicas com RLS + policies por papel/owner"},
    {"id":"auth-05","descricao":"Cross-tenant paciente A→B deve falhar","tipo":"seguranca","resultado":"fail","severidade":"critica","evidencia":"agenda_eventos policy FOR ALL USING(true) 20260609000007:39-41; tabelas clínicas sem policy de owner","correcao_sugerida":"Policies de owner + escopar agenda por papel"},
    {"id":"auth-06","descricao":"Financeiro RLS USING(true) para todo autenticado","tipo":"seguranca","resultado":"warn","severidade":"media","evidencia":"20260609000006_financeiro.sql:44-46,71-74","correcao_sugerida":"Escopar por profiles.role admin/recepcao"},
    {"id":"auth-07","descricao":"profiles_select_admin self-reference (recursão RLS)","tipo":"seguranca","resultado":"warn","severidade":"media","evidencia":"20260609000001_foundation.sql:24-31 EXISTS SELECT FROM profiles dentro de policy de profiles","correcao_sugerida":"Função SECURITY DEFINER is_admin() ou JWT claim"},
    {"id":"auth-08","descricao":"Rate limit em login/portal","tipo":"seguranca","resultado":"pass","severidade":"media","evidencia":"middleware.ts:28-33 (10/min por IP, in-memory)","correcao_sugerida":"Considerar store distribuído"},
    {"id":"auth-09","descricao":"signing_attempts SELECT para qualquer autenticado","tipo":"seguranca","resultado":"warn","severidade":"baixa","evidencia":"20260610000007_assinatura_propria.sql:48-49 USING(true)","correcao_sugerida":"Restringir a admin/service_role"}
  ],
  "cobertura_estimada": "70%",
  "bloqueadores": ["Sem ambiente Supabase para SQL em runtime — cross-tenant não confirmado com SELECT real","Tabelas clínicas core ausentes em supabase/migrations"]
}
```

### JSON — Segurança

```json
{
  "area": "Segurança transversal (bundle client, headers, tokens, HMAC)",
  "rotas_testadas": ["next.config.ts","src/middleware.ts","gerar-link/route.ts","assinar/route.ts",".next/static"],
  "casos": [
    {"id":"sec-01","descricao":"Secrets em chunks client","tipo":"seguranca","resultado":"pass","severidade":"critica","evidencia":"Grep .next/static SERVICE_ROLE_KEY|RESEND_API_KEY|SIGNING_HMAC_SECRET|service_role → No matches","correcao_sugerida":"Nenhuma"},
    {"id":"sec-02","descricao":"Envs sensíveis sem NEXT_PUBLIC_","tipo":"seguranca","resultado":"pass","severidade":"critica","evidencia":"Só NEXT_PUBLIC_SUPABASE_URL/ANON_KEY/APP_URL públicas","correcao_sugerida":"Nenhuma"},
    {"id":"sec-03","descricao":"Headers de segurança presentes","tipo":"seguranca","resultado":"pass","severidade":"media","evidencia":"next.config.ts:25-33 CSP/XFO/nosniff/Referrer/HSTS/Permissions","correcao_sugerida":"CSP usa unsafe-inline/eval; considerar nonces"},
    {"id":"sec-04","descricao":"Token = UUID v4","tipo":"seguranca","resultado":"pass","severidade":"alta","evidencia":"gerar-link/route.ts:53 crypto.randomUUID()","correcao_sugerida":"Nenhuma"},
    {"id":"sec-05","descricao":"HMAC valida timing-safe + expiração","tipo":"seguranca","resultado":"pass","severidade":"critica","evidencia":"assinar/route.ts:69-72,64-66,60-61","correcao_sugerida":"Nenhuma"},
    {"id":"sec-06","descricao":"SIGNING_HMAC_SECRET obrigatório","tipo":"seguranca","resultado":"fail","severidade":"critica","evidencia":"gerar-link/route.ts:54 e assinar/route.ts:69 — SIGNING_HMAC_SECRET ?? '' (default vazio → HMAC forjável)","correcao_sugerida":"Recusar (500) se ausente/vazio; helper que valida na inicialização"}
  ],
  "cobertura_estimada": "90%",
  "bloqueadores": []
}
```


---

## LOTE 2 — Núcleo clínico (pacientes-prontuário, odontograma)

Executado em 2026-06-13.

### Resumo do lote

| Área | Casos | Pass | Fail | Warn | Cobertura | Bloqueadores |
|---|---|---|---|---|---|---|
| Pacientes & Prontuário | 10 | 3 | 2 | 5 | 80% | 2 |
| Odontograma | 10 | 5 | 1 | 4 | 85% | 2 |

### Falhas críticas/altas do lote (priorizadas)

| Sev | ID | Falha | Correção sugerida |
|---|---|---|---|
| 🟠 alta | pac-07 | **Evolução não trava após 24h** — não existe trigger/regra; UI lê `ev.travada` mas nada seta o flag; rota de evoluções só tem POST. | Trigger `BEFORE UPDATE` em `evolucoes` rejeitando alteração após `interval '24 hours'`. |
| 🟠 alta | pac-08 | `audit_log` não cobre **toda** leitura: GET `/api/pacientes` não audita; sub-tabelas (anamnese/evolução/odonto) sem audit próprio; gravação best-effort silenciada. | Auditar leituras via API e sub-tabelas; idealmente função `SECURITY DEFINER` obrigatória. |
| 🟠 alta | odonto-05 | `create table odontogramas` **ausente das migrations** (tabela existe fora do versionamento). | Versionar a criação da tabela. |
| 🟡 média | pac-06 | Alertas de risco vêm do **client** e são gravados sem recomputar no servidor → cliente pode salvar `alertas=[]` suprimindo o ⚠. | Recalcular alertas no servidor a partir de `respostas`. |
| 🟡 média | pac-03 | CPF validado **só no client**; API POST/PATCH insere sem revalidar. Há 2 implementações duplicadas (`cpf.ts` e `masks.ts`). | Revalidar CPF server-side; consolidar funções. |
| 🟡 média | pac-04 | Busca por CPF usa `ilike` sobre valor sem máscara; buscar com pontuação não casa. | Normalizar (só dígitos) o termo antes do `ilike`. |
| 🟡 média | odonto-06 | `security_hardening` faz `ALTER TABLE odontograma` (singular) — cai em `undefined_table`; tabela real é `odontogramas`. | Corrigir para `odontogramas`. |
| 🔵 baixa | pac-09 | Página de edição carrega paciente mesmo soft-deletado (sem filtro `deleted_at`). | Aplicar `.is('deleted_at', null)` na query de edição. |

**Pontos bons confirmados:** soft-delete correto (pac-02); alertas cobrem diabetes/cardiopatia/coagulação/alergias/gestante (pac-05); odontograma com 32 permanentes + 20 decíduos em FDI correta (odonto-01/02), camadas situação vs. plano isoladas (odonto-08), retrocompatibilidade de dados legados (odonto-09). Código não usa mais `.from('usuarios')` (pac-10) — corrigido na sessão anterior.

### JSON — Pacientes & Prontuário

```json
{
  "area": "Pacientes & Prontuário",
  "rotas_testadas": ["/pacientes","/pacientes/novo","/pacientes/[id]","/pacientes/[id]/editar","/api/pacientes (GET,POST)","/api/pacientes/[id] (PATCH,DELETE)","/api/pacientes/[id]/anamnese (POST)","/api/pacientes/[id]/evolucoes (POST)"],
  "casos": [
    {"id":"pac-01","descricao":"CRUD paciente via API autenticada com upsert e trato de CPF duplicado (23505)","tipo":"funcional","resultado":"warn","severidade":"alta","evidencia":"api/pacientes/route.ts:30-49; [id]/route.ts:4-21; nao validado em runtime","correcao_sugerida":"Validar em runtime; checar 409 em CPF duplicado"},
    {"id":"pac-02","descricao":"Soft-delete: nunca deleta fisicamente","tipo":"dados","resultado":"pass","severidade":"critica","evidencia":"api/pacientes/[id]/route.ts:23-38 update deleted_at; listagens filtram .is(deleted_at,null)","correcao_sugerida":"Opcional: bloquear DELETE fisico via trigger"},
    {"id":"pac-03","descricao":"Validacao CPF (formato+DV)","tipo":"funcional","resultado":"warn","severidade":"media","evidencia":"validacao so no client (FormPaciente.tsx:49); API nao revalida; cpf.ts e masks.ts duplicados","correcao_sugerida":"Revalidar server-side; consolidar funcoes"},
    {"id":"pac-04","descricao":"Busca por nome/CPF/telefone/email","tipo":"funcional","resultado":"warn","severidade":"media","evidencia":"page.tsx:32 .or ilike; CPF salvo sem mascara, busca com pontuacao nao casa","correcao_sugerida":"Normalizar termo de CPF antes do ilike"},
    {"id":"pac-05","descricao":"Anamnese gera alertas de risco corretos","tipo":"funcional","resultado":"pass","severidade":"alta","evidencia":"AbaAnamnese.tsx:49-59 computeAlertas; header pacientes/[id]/page.tsx:104-112","correcao_sugerida":"Nenhuma (ver pac-06)"},
    {"id":"pac-06","descricao":"Servidor deve derivar/validar alertas, nao confiar no client","tipo":"seguranca","resultado":"fail","severidade":"media","evidencia":"api/.../anamnese/route.ts:10,26,34 grava alertas do body sem recomputar de respostas","correcao_sugerida":"Recalcular alertas no servidor; ignorar campo do client"},
    {"id":"pac-07","descricao":"Evolucao trava (read-only) apos 24h no backend","tipo":"dados","resultado":"fail","severidade":"alta","evidencia":"Sem regra de 24h; UI le ev.travada mas nada seta; evolucoes route so POST; sem trigger/migration","correcao_sugerida":"Trigger BEFORE UPDATE rejeitando apos interval 24h; versionar tabela"},
    {"id":"pac-08","descricao":"audit_log grava em TODA leitura de prontuario","tipo":"seguranca","resultado":"warn","severidade":"alta","evidencia":"page.tsx:38 registra audit (pacientes), mas GET /api/pacientes nao audita; sub-tabelas sem audit; audit best-effort silenciado (audit.ts:21-23)","correcao_sugerida":"Auditar leituras via API e sub-tabelas; funcao SECURITY DEFINER obrigatoria"},
    {"id":"pac-09","descricao":"Edicao carrega paciente soft-deletado","tipo":"dados","resultado":"warn","severidade":"baixa","evidencia":"editar/page.tsx:11 sem filtro .is(deleted_at,null)","correcao_sugerida":"Aplicar filtro na query de edicao"},
    {"id":"pac-10","descricao":"Referencia a tabela inexistente usuarios","tipo":"regressao","resultado":"pass","severidade":"media","evidencia":"Grep .from(usuarios) no fonte: nenhuma ocorrencia; usa profiles","correcao_sugerida":"Nenhuma"}
  ],
  "cobertura_estimada": "80%",
  "bloqueadores": ["Sem dev server — CRUD/busca/audit efetivo nao validados em runtime","Schema de evolucoes/anamneses/audit_log fora das migrations versionadas"]
}
```

### JSON — Odontograma

```json
{
  "area": "Odontograma (aba clínica do paciente)",
  "rotas_testadas": ["src/components/pacientes/AbaOdontograma.tsx","src/app/api/pacientes/[id]/odontograma/route.ts","src/app/(app)/pacientes/[id]/page.tsx"],
  "casos": [
    {"id":"odonto-01","descricao":"32 dentes permanentes (FDI) nos 4 quadrantes","tipo":"funcional","resultado":"pass","severidade":"media","evidencia":"AbaOdontograma.tsx:68-71 (4x8=32); renderRow 384-399","correcao_sugerida":"Nenhuma"},
    {"id":"odonto-02","descricao":"20 deciduos (FDI 51-85) renderizam","tipo":"funcional","resultado":"pass","severidade":"media","evidencia":"AbaOdontograma.tsx:72-75 (4x5=20); Arcade 407-413","correcao_sugerida":"Nenhuma"},
    {"id":"odonto-03","descricao":"5 faces clicaveis por dente","tipo":"funcional","resultado":"warn","severidade":"media","evidencia":"ALL_SURFACES:61; FACE_DEFS:106-111 (4 poligonos onClick:163) + oclusal rect onClick:179; nao validado em runtime","correcao_sugerida":"Validar clique via preview"},
    {"id":"odonto-04","descricao":"Marcacao persiste em odontogramas (paciente_id)","tipo":"dados","resultado":"warn","severidade":"alta","evidencia":"route.ts:39-46 upsert onConflict paciente_id; persiste JSONB inteiro, nao granular por dente+face; nao validado runtime","correcao_sugerida":"Confirmar upsert em runtime"},
    {"id":"odonto-05","descricao":"create table odontogramas nas migrations","tipo":"dados","resultado":"fail","severidade":"alta","evidencia":"Nenhum create table odontogramas em migrations; so RLS (rls_staff_paciente:100-105) e uso na API","correcao_sugerida":"Versionar criacao da tabela"},
    {"id":"odonto-06","descricao":"Nome da tabela consistente","tipo":"dados","resultado":"warn","severidade":"media","evidencia":"security_hardening:53 ALTER TABLE odontograma (singular) cai em undefined_table; real e odontogramas","correcao_sugerida":"Corrigir para plural"},
    {"id":"odonto-07","descricao":"Toggle adulto/infantil alterna denticao","tipo":"funcional","resultado":"warn","severidade":"media","evidencia":"AbaOdontograma.tsx:450 showDec e aditivo (mostra deciduos junto), nao switch exclusivo","correcao_sugerida":"Adicionar modo exclusivo se requisito"},
    {"id":"odonto-08","descricao":"Camadas situacao vs plano nao se sobrescrevem","tipo":"funcional","resultado":"pass","severidade":"alta","evidencia":"AbaOdontograma.tsx:13-17 chaves separadas; applyFace:317-328; save:356-359","correcao_sugerida":"Nenhuma"},
    {"id":"odonto-09","descricao":"Migracao de dados legados preservada","tipo":"regressao","resultado":"pass","severidade":"media","evidencia":"AbaOdontograma.tsx:80-97 migrate() Legacy->ToothData","correcao_sugerida":"Nenhuma"},
    {"id":"odonto-10","descricao":"Persistencia de observacao por dente","tipo":"dados","resultado":"pass","severidade":"baixa","evidencia":"AbaOdontograma.tsx:669-677, save:358","correcao_sugerida":"Nenhuma"}
  ],
  "cobertura_estimada": "85%",
  "bloqueadores": ["Sem dev server — clique/persistencia marcados warn","create table odontogramas ausente das migrations"]
}
```

---

## Correção aplicada (2026-06-13) — Login com Google

**Bug:** o login social chamava `signInWithOAuth({ redirectTo: origin + '/dashboard' })`, mas
**não existia a rota `/auth/callback`** que troca o `code` do OAuth (PKCE) por sessão. Resultado:
o Google redirecionava de volta com `?code=...` para `/dashboard`, nenhuma sessão era criada e o
middleware mandava o usuário de volta ao `/login` — login Google nunca funcionava.

**Correção (código):**
- Criada a rota `src/app/auth/callback/route.ts` que faz `exchangeCodeForSession(code)` e redireciona
  para `next` (com proteção contra open redirect). `/auth/callback` já estava em `publicRoutes`.
- `src/app/(auth)/login/page.tsx`: `redirectTo` agora aponta para `/auth/callback?next=/dashboard`.

**Passo manual pendente (painel Supabase — não dá para fazer por código):**
1. Authentication → Providers → **Google**: habilitar e preencher Client ID / Client Secret (Google Cloud Console).
2. Authentication → URL Configuration → **Redirect URLs**: adicionar `https://<dominio-producao>/auth/callback`
   (e `http://localhost:3000/auth/callback` para dev).
3. No Google Cloud Console, o **Authorized redirect URI** deve ser o callback do Supabase:
   `https://bzsztgcxskeizkcgxgws.supabase.co/auth/v1/callback`.

---

## LOTE 3 — Comercial/Financeiro (orçamentos, financeiro)

Executado em 2026-06-13.

### Resumo do lote

| Área | Casos | Pass | Fail | Warn | Cobertura | Bloqueadores |
|---|---|---|---|---|---|---|
| Orçamentos | 11 | 6 | 1 | 4 | 85% | 2 |
| Financeiro | 9 | 3 | 4 | 2 | 80% | 2 |

### Falhas críticas/altas do lote (priorizadas)

| Sev | ID | Falha | Correção sugerida |
|---|---|---|---|
| 🟠 alta | fin-02 / fin-03 | **Parcelamento v2 (o usado pela UI) não fecha a soma** — `valorParcela.toFixed(2)` repetido em todas as parcelas, sem ajuste de centavos na última (1000/3 → 999,99). Com juros (PRICE) idem. Servidor não valida `Σparcelas == total`. | Aplicar o padrão do path legado (floor + resíduo na última); validar soma no servidor. |
| 🟠 alta | fin-05 | **Honorários/repasse inexistente** — `comissao_percentual` existe mas nenhum código calcula/lança repasse em `contas_pagar`. | Implementar geração de repasse ao receber/produzir; lançar em contas_pagar. |
| 🟠 alta | fin-08 | **Portal financeiro lê tabela `lancamentos` que não existe** → paciente vê financeiro vazio. (App de staff usa `contas_receber/pagar` corretamente.) | Apontar portal para `contas_receber` (filtrado por paciente) ou criar view `lancamentos`. |
| 🟠 alta | orc-08 | **Link público `/p/[token]` não existe** — botão "Link público" gera URL para 404 (sem vazamento, mas funcionalidade quebrada). | Criar página pública server-side lendo por `token_publico`, serializando só dados do paciente/itens/total. |
| 🟠 alta | orc-10 | Aprovar **não** gera `contas_receber` automaticamente (geração é etapa manual em `gerar-parcelas`). | Confirmar se é intencional; se não, gerar recebíveis na aprovação. |
| 🟠 alta | orc-07 | Janela editável: orçamento `aprovado` mas ainda não assinado continua editável via PATCH (trava só ao assinar). | Travar já na aprovação ou bloquear PATCH quando status=aprovado, se a regra exigir. |
| 🟡 média | fin-06 | `contas_pagar` sem `profissional_id`/categoria `honorarios` — inviabiliza rastrear repasse. | Adicionar coluna/categoria. |
| 🟡 média | orc-11 / fin-07 | `parcelas_editadas` v2 inseridas sem validar soma vs. `valor_total` do orçamento. | Validar no servidor antes de inserir. |

**Pontos bons confirmados:** total = Σ dos itens **selecionados** com clamp em 0 (orc-01/03); desconto
global percentual/valor correto (orc-02); transições de status validadas no servidor (orc-05); trava
read-only no PATCH/UI quando assinado (orc-06); parcelamento **legado** fecha a soma com ajuste na
última (fin-01); vencimentos sequenciais com entrada no 1º (fin-04); bloqueio de duplicação de
parcelas (fin-09); PDF de impressão atrás de auth sem dados internos (orc-09).

### JSON — Orçamentos

```json
{
  "area": "orcamentos",
  "rotas_testadas": ["orcamentos/[id]/page.tsx","OrcamentoBuilderV2.tsx","ResumoFinanceiro.tsx","ProcedimentosSection.tsx","api/orcamentos/[id]/route.ts","api/orcamentos/[id]/status/route.ts","api/orcamentos/[id]/aprovar/route.ts","api/orcamentos/[id]/gerar-parcelas/route.ts","orcamentos/[id]/imprimir/page.tsx","/p/[token] (inexistente)"],
  "casos": [
    {"id":"orc-01","descricao":"Total = soma(valor x qtde) so dos itens selecionados","tipo":"funcional","resultado":"pass","severidade":"alta","evidencia":"OrcamentoBuilderV2.tsx:97 filter(selecionado).reduce(total); item.total:189 max(0,(valor*qtde)-desconto_item)","correcao_sugerida":"Nenhuma"},
    {"id":"orc-02","descricao":"Desconto global recalcula (percentual e valor)","tipo":"funcional","resultado":"pass","severidade":"alta","evidencia":"OrcamentoBuilderV2.tsx:98-101 descontoAbs; total=max(0,subtotal-descontoAbs); espelhado imprimir:43-45","correcao_sugerida":"Nenhuma"},
    {"id":"orc-03","descricao":"Desconto > total nao gera negativo","tipo":"funcional","resultado":"pass","severidade":"media","evidencia":"Builder:101 Math.max(0,...). Atencao: imprimir:43-45 nao clampa mas usa valor_total ja salvo (clampado no save:136)","correcao_sugerida":"Nenhuma"},
    {"id":"orc-04","descricao":"Borda qtde 0 / item sem valor","tipo":"funcional","resultado":"warn","severidade":"media","evidencia":"ProcedimentosSection.tsx:190 input min=1 mas onChange sem clamp; qtde 0 -> total 0 (nao quebra)","correcao_sugerida":"Validar qtde>=1 no onChange/save"},
    {"id":"orc-05","descricao":"Transicoes de status validadas no servidor","tipo":"funcional","resultado":"pass","severidade":"alta","evidencia":"status/route.ts:5-12 TRANSICOES_VALIDAS; :36 rejeita invalida; aprovado:[] impede sair","correcao_sugerida":"Nenhuma"},
    {"id":"orc-06","descricao":"Orcamento travado vira read-only (PATCH e UI)","tipo":"seguranca","resultado":"pass","severidade":"alta","evidencia":"route.ts:39-41 403 se travado; status/aprovar bloqueiam; UI esconde inputs (ProcedimentosSection:138,154; ResumoFinanceiro:52)","correcao_sugerida":"Nenhuma"},
    {"id":"orc-07","descricao":"Trava aplicada ao assinar, nao na aprovacao","tipo":"funcional","resultado":"warn","severidade":"alta","evidencia":"aprovar/route.ts:23 so status=aprovado; travado vem de contratos/assinar:141 e webhooks","correcao_sugerida":"Janela editavel entre aprovar e assinar; travar na aprovacao ou bloquear PATCH se aprovado"},
    {"id":"orc-08","descricao":"Link publico read-only sem dados internos","tipo":"seguranca","resultado":"fail","severidade":"alta","evidencia":"OrcamentoBuilderV2.tsx:172-177 monta origin/p/token mas rota src/app/p/[token] nao existe (404)","correcao_sugerida":"Criar pagina publica server-side por token_publico, serializando so paciente/itens/total"},
    {"id":"orc-09","descricao":"Pagina de impressao nao expoe dados internos","tipo":"seguranca","resultado":"pass","severidade":"media","evidencia":"imprimir/page.tsx:20-21 exige auth; render so nome/cpf/itens/total/observacoes; observacao_interna nao renderizada","correcao_sugerida":"Nenhuma"},
    {"id":"orc-10","descricao":"Aprovar gera contas_receber coerentes","tipo":"funcional","resultado":"warn","severidade":"alta","evidencia":"aprovar/route.ts so status=aprovado; geracao manual em gerar-parcelas (exige aprovado:70, idempotente:75-83, ajuste centavos ultima:87-88,114)","correcao_sugerida":"Confirmar fluxo; se requisito for automatico, gerar na aprovacao"},
    {"id":"orc-11","descricao":"Coerencia valor_total vs parcelas (parcelas_editadas v2)","tipo":"dados","resultado":"warn","severidade":"media","evidencia":"gerar-parcelas/route.ts:35-48 insere p.valor sem validar soma==valor_total","correcao_sugerida":"Validar soma das parcelas == valor_total antes de inserir"}
  ],
  "cobertura_estimada": "85%",
  "bloqueadores": ["Sem dev server: status/parcelas/trava nao validados em runtime","Rota publica /p/[token] nao existe no repositorio"]
}
```

### JSON — Financeiro

```json
{
  "area": "Financeiro — parcelamento, honorários e consistência de contas",
  "rotas_testadas": ["POST /api/orcamentos/[id]/gerar-parcelas","PagamentoSection.tsx","POST /api/financeiro/pagar","financeiro/page.tsx","portal/financeiro/page.tsx"],
  "casos": [
    {"id":"fin-01","descricao":"Parcelamento legado: soma==total e ajuste na ultima","tipo":"funcional","resultado":"pass","severidade":"alta","evidencia":"gerar-parcelas/route.ts:85-114 floor + ajusteUltima na i===n-1; entrada subtraida","correcao_sugerida":"Nenhuma"},
    {"id":"fin-02","descricao":"Parcelamento v2 (usado pela UI): soma==total","tipo":"dados","resultado":"fail","severidade":"alta","evidencia":"PagamentoSection.tsx:59-73 toFixed(2) repetido sem ajuste na ultima (1000/3=999,99); route v2:35-49 persiste sem validar","correcao_sugerida":"Aplicar padrao legado (floor+residuo na ultima); validar soma no servidor"},
    {"id":"fin-03","descricao":"Parcelamento v2 com juros (price): soma==base","tipo":"dados","resultado":"fail","severidade":"alta","evidencia":"PagamentoSection.tsx:60-62 PRICE replica valor arredondado em todas; soma diverge; sem ajuste","correcao_sugerida":"Ultima parcela = total_esperado - soma anteriores; tratar numeric(12,2)"},
    {"id":"fin-04","descricao":"Datas de vencimento sequenciais e entrada no 1o","tipo":"funcional","resultado":"pass","severidade":"media","evidencia":"route.ts:109-112 setMonth(i+(entrada?1:0)); PagamentoSection:67-72 addMonths","correcao_sugerida":"Menor: setMonth pode rolar dia 31; avaliar fixar dia"},
    {"id":"fin-05","descricao":"Honorarios: repasse por percentual lancado em contas_pagar","tipo":"funcional","resultado":"fail","severidade":"alta","evidencia":"comissao_percentual existe (configuracoes:24; TabProfissionais:28) mas nenhum codigo calcula/lanca repasse; financeiro/pagar so despesas manuais","correcao_sugerida":"Implementar geracao de repasse ao receber/produzir; lancar em contas_pagar"},
    {"id":"fin-06","descricao":"contas_pagar sem vinculo a profissional","tipo":"dados","resultado":"fail","severidade":"media","evidencia":"20260609000006_financeiro.sql:49-65 sem profissional_id/origem; CHECK categoria sem honorarios","correcao_sugerida":"Adicionar profissional_id/origem_id e categoria honorarios"},
    {"id":"fin-07","descricao":"contas_receber de orcamento aprovado batem com valor_total","tipo":"dados","resultado":"warn","severidade":"alta","evidencia":"route v2:35-49 insere sem comparar soma==valor_total; desconto_avista aplicado so no client (PagamentoSection:53-55)","correcao_sugerida":"Recalcular/validar soma no servidor antes de inserir"},
    {"id":"fin-08","descricao":"Portal financeiro le tabela inexistente lancamentos","tipo":"regressao","resultado":"fail","severidade":"alta","evidencia":"portal/financeiro/page.tsx:17-22 e portal/page.tsx:62 from(lancamentos) inexistente; staff usa contas_receber/pagar","correcao_sugerida":"Apontar portal para contas_receber (paciente_id) ou criar view lancamentos"},
    {"id":"fin-09","descricao":"Bloqueio de duplicacao de parcelas por orcamento","tipo":"funcional","resultado":"pass","severidade":"media","evidencia":"route.ts:31-32,75-83 count em contas_receber por orcamento_id bloqueia 2a geracao","correcao_sugerida":"Nenhuma"}
  ],
  "cobertura_estimada": "80%",
  "bloqueadores": ["Sem dev server: fin-07 nao validado em runtime","Honorarios/repasse inexistente — fin-05/06 avaliados por ausencia estatica"]
}
```

---

## LOTE 4 — Operacional (agenda, config-portal)

Executado em 2026-06-14.

### Resumo do lote

| Área | Casos | Pass | Fail | Warn | Cobertura | Bloqueadores |
|---|---|---|---|---|---|---|
| Agenda | 12 | 5 | 4 | 3 | 75% | 1 |
| Config & Portal | 9 | 5 | 1 | 3 | 80% | 2 |

### Falhas críticas/altas do lote (priorizadas)

| Sev | ID | Falha | Correção sugerida |
|---|---|---|---|
| 🟠 alta | agenda-02 | **Sobreposição visual de eventos** — DiaColuna posiciona todos com zIndex:2 fixo; sem lane-splitting. Evento anterior fica oculto sob posterior. | Implementar lane-splitting (múltiplas colunas por horário conflitante) ou validar conflito de horário na API. |
| 🟠 alta | agenda-06 | **Status não reflete cor na grade** — usa TIPO_COR (por procedimento), não STATUS_COR (por status). Agendado/confirmado/faltou indistinguíveis visualmente. | Usar STATUS_COR na grade ou adicionar ícone/hachura para status. |
| 🟠 alta | agenda-08 | **Confirmação WhatsApp não transiciona status** — apenas `whatsapp_enviado=true`; não há webhook de resposta. Status só muda se usuário editar manualmente. | Implementar recebimento de webhook de resposta WhatsApp ou auto-transicionar para 'confirmado' ao enviar (menos ideal). |
| 🟠 alta | cfg-portal-04 | **Tabela `lancamentos` inexistente** (já conhecida) — portal/financeiro e portal/page retornam vazio. | Criar migration + RLS ou mapear para contas_receber. |
| 🟡 média | cfg-02 | **Chaves divergentes** — pdf-generator.ts espera clinica.dentista.nome/cro, mas TabClinica grava como clinica.responsavel_tecnico/cro_responsavel. | Alinhar chaves em TabClinica ou pdf-generator. |
| 🟡 média | agenda-05 | **Inconsistência nomenclatura** — code usa 'realizado', spec cita 'atendido'. | Padronizar em 'atendido'. |
| 🟡 média | portal-06 | **Middleware não bloqueia staff em /portal** — apenas filtro em portal_acessos. | Adicionar check role no middleware. |
| 🟡 média | portal-08 | **habilitado filter falta em sub-pages** — portal/consultas/financeiro/docs/perfil/tratamento não filtram .eq('habilitado', true). | Adicionar filtro em todas as sub-pages. |

**Confirmado OK:** slots renderizam com duração correta (agenda-01/03), WhatsApp server-side sem token exposto (agenda-09/10), config clinica reflete em PDF (cfg-01), acesso /configuracoes restrito a admin (cfg-04), portal todas as pages checam auth (portal-01), RLS por paciente_id intacta (portal-02/03/07), login portal separado de admin (portal-05).

### JSON — Agenda

```json
{
  "area": "Agenda",
  "rotas_testadas": ["/app/(app)/agenda/page.tsx","AgendaClient.tsx","NovoEventoModal.tsx","api/agenda/[id]/route.ts","api/agenda/[id]/confirmar/route.ts","lib/whatsapp.ts","supabase/migrations/20260609000007_agenda.sql"],
  "casos": [
    {"id":"agenda-01","descricao":"Slots renderizam e respeitam duracao","tipo":"funcional","resultado":"pass","severidade":"media","evidencia":"eventTop/eventHeight via proporcao minutos/TOTAL_MIN*GRID_H; CHECK duracao na schema; min 18px","correcao_sugerida":"Nenhuma"},
    {"id":"agenda-02","descricao":"Sobreposicao de eventos na mesma coluna","tipo":"funcional","resultado":"fail","severidade":"alta","evidencia":"DiaColuna zIndex:2 fixo; sem lane-splitting; evento anterior oculto sob posterior","correcao_sugerida":"Lane-splitting ou validar conflito no servidor"},
    {"id":"agenda-03","descricao":"Intervalo padrao ao clicar slot","tipo":"funcional","resultado":"pass","severidade":"media","evidencia":"abrirSlot fim=inicio+60min","correcao_sugerida":"Nenhuma"},
    {"id":"agenda-04","descricao":"Status->cor mapeado coerente","tipo":"funcional","resultado":"warn","severidade":"baixa","evidencia":"STATUS_COR existe mas usa TIPO_COR na grade; STATUS_COR so no painel lateral","correcao_sugerida":"Usar STATUS_COR ou adicionar indicador visual status"},
    {"id":"agenda-05","descricao":"Status atendido presente","tipo":"funcional","resultado":"fail","severidade":"media","evidencia":"Enum usa 'realizado', spec 'atendido' — nomes diferentes, mesmo conceito","correcao_sugerida":"Padronizar nomenclatura"},
    {"id":"agenda-06","descricao":"Cor cancelado reflete na grade","tipo":"funcional","resultado":"fail","severidade":"alta","evidencia":"Cancelado com opacity:0.4 mas TIPO_COR mantido; faltou = agendado visualmente","correcao_sugerida":"Usar STATUS_COR ou hachura diferente"},
    {"id":"agenda-07","descricao":"Confirmacao persiste no banco","tipo":"funcional","resultado":"pass","severidade":"media","evidencia":"PATCH /api/agenda/[id] aceita status; trigger atualiza_em; onSalvo atualiza local","correcao_sugerida":"Nenhuma"},
    {"id":"agenda-08","descricao":"Confirmacao WhatsApp transiciona status","tipo":"funcional","resultado":"fail","severidade":"alta","evidencia":"POST confirmar apenas whatsapp_enviado=true; sem webhook resposta; status manual so","correcao_sugerida":"Webhook WhatsApp ou auto-transicionar para confirmado ao enviar"},
    {"id":"agenda-09","descricao":"WhatsApp server-side","tipo":"seguranca","resultado":"pass","severidade":"media","evidencia":"whatsapp.ts chamado de route handler; client chama /api/agenda/[id]/confirmar","correcao_sugerida":"Nenhuma"},
    {"id":"agenda-10","descricao":"Token WhatsApp nao exposto client","tipo":"seguranca","resultado":"pass","severidade":"media","evidencia":"WHATSAPP_API_TOKEN sem NEXT_PUBLIC_","correcao_sugerida":"Nenhuma"},
    {"id":"agenda-11","descricao":"RLS agenda_eventos — policy para autenticados","tipo":"seguranca","resultado":"warn","severidade":"baixa","evidencia":"Migration usa agenda_autenticado FOR ALL TO authenticated USING(true); nova RLS (staff ALL, paciente SELECT) nao presente em arquivo rastreado","correcao_sugerida":"Verificar migration 20260613000001_rls"},
    {"id":"agenda-12","descricao":"Preview renderizacao grade","tipo":"funcional","resultado":"warn","severidade":"media","evidencia":"Sem dev server; nao validado em runtime","correcao_sugerida":"Validar com preview quando disponivel"}
  ],
  "cobertura_estimada": "75%",
  "bloqueadores": ["Sem dev server — preview nao validado","Migration RLS mais recente nao confirmada no arquivo"]
}
```

### JSON — Configurações & Portal

```json
{
  "area": "Configuracoes & Portal do Paciente",
  "rotas_testadas": ["/configuracoes","/api/configuracoes","/portal","/portal/login","/portal/consultas","/portal/financeiro","/portal/documentos","/portal/perfil","/portal/tratamento"],
  "casos": [
    {"id":"cfg-01","descricao":"Config clinica em PDF do contrato","tipo":"funcional","resultado":"pass","severidade":"alta","evidencia":"pdf-generator.ts:356 consulta configuracoes clinica; injecao em HTML","correcao_sugerida":"Nenhuma"},
    {"id":"cfg-02","descricao":"TabClinica salva e reflete","tipo":"funcional","resultado":"warn","severidade":"media","evidencia":"TabClinica grava responsavel_tecnico/cro_responsavel; pdf-generator espera clinica.dentista.nome/cro — divergencia","correcao_sugerida":"Alinhar chaves"},
    {"id":"cfg-03","descricao":"Tabela procedimentos reflete em orcamentos","tipo":"funcional","resultado":"warn","severidade":"media","evidencia":"TabProcedimentos presente; sem dev server nao confirmado se OrcamentoBuilder usa","correcao_sugerida":"Validar em runtime"},
    {"id":"cfg-04","descricao":"Acesso /configuracoes restrito admin","tipo":"seguranca","resultado":"pass","severidade":"alta","evidencia":"page.tsx:16-24 role!=admin retorna bloqueado","correcao_sugerida":"Nenhuma"},
    {"id":"portal-01","descricao":"Portal pages redirecionam sem auth","tipo":"seguranca","resultado":"pass","severidade":"critica","evidencia":"Todas as pages (page,consultas,financeiro,docs,perfil,tratamento) chamam getUser + redirect /portal/login","correcao_sugerida":"Nenhuma"},
    {"id":"portal-02","descricao":"Queries portal filtram por paciente_id de portal_acessos","tipo":"seguranca","resultado":"pass","severidade":"critica","evidencia":"Padrao: select paciente_id de portal_acessos onde user_id=auth.uid(); usar pacienteId em todas queries","correcao_sugerida":"Nenhuma"},
    {"id":"portal-03","descricao":"RLS banco paciente SELECT proprio","tipo":"seguranca","resultado":"pass","severidade":"critica","evidencia":"Migration 20260613000001 policies *_portal_select com is_meu_paciente(paciente_id)","correcao_sugerida":"Nenhuma"},
    {"id":"portal-04","descricao":"Portal financeiro le lancamentos inexistente","tipo":"dados","resultado":"fail","severidade":"alta","evidencia":"page.tsx:63, financeiro:17 from(lancamentos); tabela nao em migrations; query vazio","correcao_sugerida":"Criar migration lancamentos com RLS ou mapear contas_receber"},
    {"id":"portal-05","descricao":"Login portal separado de admin","tipo":"seguranca","resultado":"pass","severidade":"alta","evidencia":"portal/login usa /api/portal/magic-link; middleware trata como publica separada","correcao_sugerida":"Nenhuma"},
    {"id":"portal-06","descricao":"Middleware bloqueia staff em /portal","tipo":"seguranca","resultado":"warn","severidade":"media","evidencia":"Middleware nao distingue role; staff sem portal_acessos cai em pagina Acesso nao encontrado","correcao_sugerida":"Bloquear staff com role check no middleware"},
    {"id":"portal-07","descricao":"portal_acessos RLS por user_id","tipo":"seguranca","resultado":"pass","severidade":"critica","evidencia":"Policy paciente_portal_acesso FOR SELECT USING(auth.uid()=user_id)","correcao_sugerida":"Nenhuma"},
    {"id":"portal-08","descricao":"Sub-pages portal verificam habilitado","tipo":"seguranca","resultado":"warn","severidade":"media","evidencia":"portal/page filtra .eq(habilitado,true); consultas/financeiro/docs/perfil/tratamento nao","correcao_sugerida":"Adicionar filtro .eq(habilitado,true) em todas sub-pages"},
    {"id":"portal-09","descricao":"Config modelos pagamento reflete em orcamentos","tipo":"funcional","resultado":"warn","severidade":"media","evidencia":"TabFinanceiro presente; sem dev server nao confirmado","correcao_sugerida":"Validar em runtime"}
  ],
  "cobertura_estimada": "80%",
  "bloqueadores": ["Sem dev server — cfg-03, cfg-09, portal-09 nao validados em runtime","Tabela lancamentos ausente"]
}
```

---

## CONSOLIDAÇÃO FINAL — Todos os lotes (4 lotes x 9 agentes = 83 casos)

### Tabela geral por área

| Área | Casos | Pass | Fail | Warn | Cobertura | Severidade |
|---|---|---|---|---|---|---|
| Contratos & Assinatura | 11 | 7 | 2 | 2 | 90% | critica/alta |
| Auth & RLS | 9 | 3 | 3 | 3 | 70% | critica/alta |
| Segurança | 6 | 5 | 1 | 0 | 90% | — |
| Pacientes & Prontuário | 10 | 3 | 2 | 5 | 80% | alta |
| Odontograma | 10 | 5 | 1 | 4 | 85% | — |
| Orçamentos | 11 | 6 | 1 | 4 | 85% | alta |
| Financeiro | 9 | 3 | 4 | 2 | 80% | alta |
| Agenda | 12 | 5 | 4 | 3 | 75% | alta |
| Config & Portal | 9 | 5 | 1 | 3 | 80% | — |
| **TOTAL** | **87** | **42** | **19** | **26** | **82%** | |

### Top 10 ações corretivas (priorizadas por severidade + impacto)

1. **[CRÍTICO] `/assinar` não é rota pública** (auth-03/assin-01) — paciente não consegue assinar. ✅ CORRIGIDO.
2. **[CRÍTICO] `SIGNING_HMAC_SECRET ?? ''` vazio** (sec-06) — HMAC forjável. ✅ CORRIGIDO.
3. **[CRÍTICO] RLS permissiva paciente→todos** (auth-04/05) — vazamento cross-tenant. ✅ CORRIGIDO (migration aplicada).
4. **[ALTA] Evolução não trava após 24h** (pac-07) — prontuário imutável não implementado. **Pendente.**
5. **[ALTA] Parcelamento v2 não fecha soma** (fin-02/03) — parcelas divergem do total por centavos. **Pendente.**
6. **[ALTA] Honorários/repasse inexistente** (fin-05/06) — profissional não recebe. **Pendente.**
7. **[ALTA] Sobreposição de eventos agenda** (agenda-02) — eventos ocultos sem lane-splitting. **Pendente.**
8. **[ALTA] Status não reflete cor agenda** (agenda-06) — agendado/confirmado indistinguíveis. **Pendente.**
9. **[ALTA] Approvar não gera contas_receber auto** (orc-10) — fluxo manual quebrado. ✅ CORRIGIDO.
10. **[ALTA] Tabela `lancamentos` inexistente** (fin-08, portal-04) — portal financeiro vazio. **Pendente.**

### Outras correções não-críticas

- **Médias:** 13 casos de warn/fail (validação CPF só client, busca CPF, configurações divergentes, habilitado filter, etc.)
- **Baixas:** 4 casos (edição soft-deletado, toggle adult/infantil aditivo, cross-role /portal, etc.)

### Correções já aplicadas nesta sessão

1. ✅ `/assinar` + APIs para `publicRoutes` (middleware).
2. ✅ `SIGNING_HMAC_SECRET` obrigatório (helper).
3. ✅ RLS staff + paciente (migration aplicada em produção).
4. ✅ Iframe preview headers (`SAMEORIGIN` + `frame-ancestors 'self'`).
5. ✅ `usuarios` → `profiles` em 3 rotas.
6. ✅ Login Google: `/auth/callback` handler + rota do OAuth.
7. ✅ **Aprovar gera contas_receber automaticamente** (1 parcela, vencimento +30d).

### Bloqueadores para implementação futura

- Sem dev server durante QA → warns em runtime (status/parcelas/confirmação/renderização).
- Tabelas clínicas fora de migrations (dívida técnica).
- Honorários sem schema em `contas_pagar` (precisa migration).
- Sobreposição agenda requer redesign do layout (lane-splitting).

---

## Próximos passos recomendados

1. **Validação manual:** testar login Google, assinatura, RLS cross-paciente após as correções.
2. **LOTE 2 altos:** implementar trava 24h evolução (trigger) e audit_log completo (função SECURITY DEFINER).
3. **LOTE 3 altos:** corrigir parcelamento v2 (resíduo na última) e estruturar honorários.
4. **LOTE 4 altos:** lane-splitting agenda e status por cor.
5. **Dívida técnica:** versionar tabelas clínicas em migrations, consolidar validações (CPF, etc.).

**QA concluída. Decisão de correção fica com o usuário. Este relatório é base para priorização.**
