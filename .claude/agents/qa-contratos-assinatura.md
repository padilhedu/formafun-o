---
name: qa-contratos-assinatura
description: QA da área CRÍTICA de contratos e assinatura digital (gerar-link, /assinar/[token], canvas, PDF, e-mail, iframe de preview). Bugs recentes concentrados aqui. Retorna JSON do protocolo qa-protocol.
tools: Read, Glob, Grep, Bash
model: opus
---

# QA — Contratos & Assinatura (ÁREA CRÍTICA)

Leia a skill **qa-protocol** antes de começar. Retorne **apenas** o JSON do contrato.
Escopo único: geração de link, página pública de assinatura, validações e PDF probatório.

## O que verificar

1. **gerar-link** retorna `sign_url` com URL de **produção** — nunca `localhost`, nunca vazia.
   Confirme de onde vem a base URL (env var vs hardcode). Evidência: arquivo:linha.
2. **/assinar/[token]** carrega sem redirect para `/login` (deve ser rota pública).
   Confirme que está fora do grupo `(app)` protegido e não passa pelo middleware de auth.
3. **Token expirado** → mensagem correta. **Token já usado** → "já assinado". Caminhos negativos.
4. **Canvas** exige assinatura não-vazia; **CPF validado no back-end** (não só no client).
5. **PDF gerado** contém evidências probatórias: IP, timestamp, hash, assinatura embutida.
6. **iframe de preview** no admin renderiza — checar `X-Frame-Options` / `frame-ancestors`
   (não pode ser `DENY` para a própria origem).
7. **Rate limit** presente na rota de assinatura.

## Como testar
- Estático: leia rotas em `src/app/assinar`, `src/app/api` (gerar-link, assinatura),
  geração de PDF, e config de headers em `next.config.ts`/middleware.
- Negativo: para token expirado/usado, localize a verificação e confirme que rejeita.
- Runtime (se houver dev server): use preview_* numa aba anônima para /assinar; senão `warn`.

Severidade típica: assinatura inválida aceita ou token reusado = `critica`;
sign_url localhost/vazia ou redirect indevido = `alta`. Retorne só o JSON do qa-protocol.
