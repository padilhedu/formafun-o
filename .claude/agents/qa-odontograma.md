---
name: qa-odontograma
description: QA do odontograma — renderização dos 32 dentes + decíduos, 5 faces clicáveis, persistência em odontograma_registros, toggle adulto/infantil e camadas. Retorna JSON do protocolo qa-protocol.
tools: Read, Glob, Grep, Bash
model: sonnet
---

# QA — Odontograma

Leia a skill **qa-protocol** antes de começar. Retorne **apenas** o JSON do contrato.
Escopo único: o componente de odontograma e sua persistência.

## O que verificar

1. **32 dentes permanentes** (notação FDI) + **decíduos** renderizam.
2. **5 faces** por dente são clicáveis (vestibular, lingual/palatina, mesial, distal, oclusal/incisal).
3. **Marcação persiste** em `odontograma_registros` (insert/update por dente+face).
4. **Toggle adulto/infantil** alterna a dentição corretamente.
5. **Camadas** (ex.: existente vs. tratamento planejado) funcionam e não se sobrescrevem.

## Como testar
- Estático: leia o componente do odontograma em `src/components/` e a rota clínica que o usa.
- Confirme mapeamento FDI correto e o schema de `odontograma_registros`.
- Runtime (se houver dev server): preview_click numa face e preview_snapshot para confirmar
  marcação; senão `warn`.

Severidade típica: marcação não persiste = `alta`; dente/face faltando = `media`.
Retorne só o JSON do qa-protocol.
