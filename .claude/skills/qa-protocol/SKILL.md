---
name: qa-protocol
description: Protocolo de QA do CRM Forma & Função — como estruturar casos de teste, classificar severidade e retornar relatório JSON estrito. Usado por todos os sub-agentes de QA.
---

# QA Protocol — Forma & Função CRM

Este protocolo define **como** cada sub-agente de QA testa e reporta. É procedural:
o agente lê isto, executa a verificação no escopo dele e devolve o JSON no contrato abaixo.

## Princípios

1. **Não corrigir.** QA apenas observa e reporta. Correção é decisão do usuário, em sessão separada.
2. **Evidência obrigatória.** Todo caso `fail`/`warn` precisa de evidência concreta:
   `arquivo:linha`, trecho de output, query SQL, ou caminho de screenshot.
3. **Teste o caminho negativo.** Segurança/RLS exige escrever testes que **devem falhar**
   (ex.: recepção tentando ler anamnese). Se "falhou ao falhar", é `fail` crítico.
4. **Estático + dinâmico.** Prefira ler o código-fonte (estático) para confirmar a lógica.
   Quando houver dev server disponível, valide em runtime (preview_*). Sem runtime, marque
   o caso como `warn` com nota "não validado em runtime" em vez de assumir `pass`.
5. **Sem invenção.** Se uma rota/tabela não existe, o caso é `skip` com evidência do que faltou,
   nunca um `pass` fabricado.

## Como montar um caso de teste

Cada caso tem:
- **id**: `<area>-<n>` (ex.: `auth-01`)
- **descricao**: o que está sendo verificado, em uma frase
- **tipo**: `funcional` | `seguranca` | `dados` | `ux` | `regressao`
- **resultado**: `pass` | `fail` | `warn` | `skip`
- **severidade**: ver tabela abaixo
- **evidencia**: âncora concreta (arquivo:linha / output / query / screenshot)
- **correcao_sugerida**: o que fazer (sem aplicar)

## Tabela de severidade

| Severidade | Critério |
|---|---|
| `critica` | Vazamento de dado sensível de saúde, bypass de auth/RLS, assinatura inválida aceita, perda de dado, chave secreta exposta no bundle client |
| `alta` | Cálculo financeiro/orçamento errado, fluxo principal quebrado, token de assinatura aceito após uso/expiração, audit_log não grava |
| `media` | Validação ausente (CPF, campos), estado inconsistente de UI, rate limit ausente em rota não-crítica |
| `baixa` | UX/cosmético, mensagem pouco clara, falta de loading state |

Severidade vale mesmo quando `resultado` é `pass` (indica o peso da área).
Para `pass`, use a severidade que o caso *teria* se falhasse.

## Contrato de saída (JSON estrito — único bloco, sem texto em volta)

```json
{
  "area": "string",
  "rotas_testadas": ["string"],
  "casos": [
    {
      "id": "string",
      "descricao": "string",
      "tipo": "funcional|seguranca|dados|ux|regressao",
      "resultado": "pass|fail|warn|skip",
      "severidade": "critica|alta|media|baixa",
      "evidencia": "string (arquivo:linha, output, ou screenshot path)",
      "correcao_sugerida": "string"
    }
  ],
  "cobertura_estimada": "0-100%",
  "bloqueadores": ["string"]
}
```

## Regras de retorno

- O sub-agente retorna **apenas** o JSON acima (o orquestrador faz o append em `docs/qa-report.md`).
- `cobertura_estimada`: percentual honesto do escopo da área coberto pelos casos.
- `bloqueadores`: condições que impediram testar (ex.: "sem dev server", "tabela X ausente",
  "credencial de teste indisponível"). Bloqueador crítico → o orquestrador pode parar o lote.
