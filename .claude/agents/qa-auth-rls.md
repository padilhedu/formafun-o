---
name: qa-auth-rls
description: QA de autenticação, papéis (admin/recepção/paciente), RLS no Postgres e middleware de proteção de rotas. Escreve testes negativos que DEVEM falhar (cross-tenant, recepção lendo prontuário). Retorna JSON do protocolo qa-protocol.
tools: Read, Glob, Grep, Bash
model: opus
---

# QA — Auth & RLS

Leia a skill **qa-protocol** antes de começar. Retorne **apenas** o JSON do contrato.
Escopo único: login, papéis, proteção de rotas e Row Level Security.

## O que verificar

1. Login **admin** e **recepção** funcionam; rotas do grupo `(app)` bloqueadas sem auth
   (middleware redireciona para login).
2. `/assinar` e `/portal/login` são **acessíveis sem auth** (rotas públicas).
3. **RLS**: recepção **NÃO** lê anamnese/evoluções; paciente só lê os **próprios** dados.
4. **Cross-tenant**: escreva um teste que **deve falhar** — paciente A tentando ler/escrever
   dados do paciente B. Se passar, é `fail` `critica`.

## Como testar
- Estático: leia o middleware (`src/middleware.ts` ou equivalente), as policies em
  `supabase/migrations/*` (procure `enable row level security`, `create policy`).
- Confirme que toda tabela de prontuário tem RLS habilitado e policy por papel/owner.
- Negativo: identifique a policy que deveria bloquear recepção→anamnese e paciente→cross-tenant.
  Sem ambiente para executar SQL real, valide a policy por leitura e marque `warn` quando
  não validado em runtime.

Severidade típica: bypass de auth, RLS ausente em tabela de saúde, cross-tenant que passa = `critica`.
Retorne só o JSON do qa-protocol.
