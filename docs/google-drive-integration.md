# Integração Google Drive — Forma & Função

Integração via Google Apps Script (100% gratuito, sem Google Cloud Console).

## Arquitetura

```
Sistema (contrato assinado / upload de documento)
  ↓ POST { paciente_nome, cpf, arquivo_base64, subpasta, secret }
Apps Script Web App (script.google.com/.../exec)
  ↓ roda na conta Google da clínica
  → cria "{cpf} - {nome}" na pasta raiz se não existir
  → cria subpastas 01–05 se não existirem
  → salva o arquivo na subpasta correta
  → retorna { sucesso, file_id, file_url, folder_url }
Sistema salva URLs no banco
```

## Variáveis de ambiente (Vercel + .env.local)

| Variável | Descrição |
|---|---|
| `GOOGLE_APPS_SCRIPT_URL` | URL `.../exec` gerada após o deploy do script |
| `DRIVE_ROOT_FOLDER_ID` | ID da pasta raiz no Google Drive |
| `DRIVE_WEBHOOK_SECRET` | Segredo compartilhado entre o servidor e o Apps Script |
| `CRON_SECRET` | Segredo usado pelo Vercel Cron para autenticar chamadas ao `/api/cron/*` |

> Os valores reais ficam apenas no Vercel Dashboard e no `.env.local` (não commitado).

## Deploy do Apps Script (passo único manual)

1. Acesse [script.google.com](https://script.google.com) → **Novo projeto**
2. Apague o conteúdo padrão e cole o conteúdo de `scripts/google-apps-script/Code.gs`
3. **Implantar → Nova implantação → App da Web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
4. Autorizar as permissões de acesso ao Drive
5. Copiar a URL `.../exec` gerada → colar em `GOOGLE_APPS_SCRIPT_URL` no Vercel
6. Em **Configurações do projeto → Propriedades do script**, adicionar:
   - `WEBHOOK_SECRET` = valor de `DRIVE_WEBHOOK_SECRET`
   - `ROOT_FOLDER_ID` = valor de `DRIVE_ROOT_FOLDER_ID`

## Estrutura de pastas no Drive

```
Pacientes — Forma e Função/          ← DRIVE_ROOT_FOLDER_ID
  12345678900 - Ana Paula Ferreira/
    01-Documentos/
    02-Radiografias/
    03-Fotos/
    04-Exames/
    05-Contratos/
      CTR-2026-00001-assinado.pdf
```

## Pontos de integração no sistema

| Ponto | Subpasta | Comportamento em falha |
|---|---|---|
| Contrato assinado | `05-Contratos` | Cai na fila; PDF já está no Supabase Storage |
| Upload de documento (futuro) | `01`–`04` conforme tipo | Cai na fila |

## Fila de reenvio (`drive_upload_queue`)

Quando o envio ao Drive falha (rede, cold start, cota), o registro vai para a tabela `drive_upload_queue` com `status = 'pendente'`. O cron `/api/cron/drive-retry` roda a cada hora e tenta reenviar até 5 vezes. Após 5 falhas: `status = 'erro'` + notificação para admins.

## Limites do plano gratuito

| Limite | Valor | Impacto para a clínica |
|---|---|---|
| Execuções por dia | ~10.000 | Suficiente para centenas de uploads/dia |
| Tempo por execução | 6 minutos | Suficiente para qualquer arquivo de paciente |
| Tamanho do payload | ~50 MB | Cobre PDFs e radiografias JPEG; vídeos precisariam de outra estratégia |
| Chamadas de API Drive | 20.000/dia | Bem acima do volume de uma clínica pequena |

Se o volume crescer (múltiplas unidades), migrar para a API oficial do Drive com service account — mas não é necessário neste estágio.

## Teste manual

```bash
# Verificar se o script está no ar (GET retorna texto simples)
curl $GOOGLE_APPS_SCRIPT_URL

# Teste de POST com arquivo de exemplo
curl -X POST $GOOGLE_APPS_SCRIPT_URL \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "<DRIVE_WEBHOOK_SECRET>",
    "paciente_nome": "Teste Silva",
    "paciente_cpf": "00000000000",
    "arquivo_base64": "SGVsbG8gV29ybGQ=",
    "nome_arquivo": "teste.txt",
    "subpasta": "01-Documentos",
    "mime_type": "text/plain"
  }'

# Rodar cron manualmente
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://sua-url.vercel.app/api/cron/drive-retry
```

## Checklist de segurança

- [x] `DRIVE_WEBHOOK_SECRET` nunca exposto no client (só server-side)
- [x] Apps Script rejeita requisições sem o secret correto
- [x] Falha no Drive não bloqueia o fluxo de assinatura
- [x] PDF sempre salvo no Supabase Storage como fonte garantida
- [x] Fila de reenvio com máximo de 5 tentativas
- [x] Cron horário configurado em `vercel.json`
- [x] Notificação para admin após 5 falhas consecutivas
