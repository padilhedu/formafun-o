# Projeto: Sistema de Gestão Odontológica — Forma & Função

## Contexto
Sistema completo de gestão para clínica odontológica (estilo Simples Dental),
de uso interno da clínica Forma & Função (Balneário Camboriú/SC, Brasil).
Usuários: dentista (admin) e recepção/secretária (operacional).
Idioma de toda a interface: português brasileiro. Moeda: BRL. Fuso: America/Sao_Paulo.

## Stack (obrigatória — não substituir)
- Next.js 14+ (App Router) + TypeScript
- Supabase: Postgres (dados), Auth (login com roles), Storage (cache de arquivos), Edge Functions (webhooks)
- Deploy: Vercel
- Estilo: Tailwind CSS + componentes próprios (sem biblioteca de UI pesada)
- Gráficos: Recharts

## Identidade visual (obrigatória)
Tema light premium — off-white quente com acento VERDE (paleta Lovable aprovada):

### Tokens de cor
| Token CSS              | Valor hex  | Uso                                     |
|------------------------|------------|-----------------------------------------|
| `--background`         | #F5F3EF    | Fundo geral                             |
| `--surface`            | #FAF8F4    | Header de tabela, rodapés               |
| `--card`               | #FFFFFF    | Cards e painéis                         |
| `--foreground`         | #1C1C1C    | Títulos e dados                         |
| `--muted-foreground`   | #6B6B66    | Labels, metadados, texto secundário     |
| `--primary`            | #1F7A4D    | Verde — botões, ativo, links            |
| `--primary-hover`      | #1A6A43    | Verde hover                             |
| `--sidebar`            | #1C1C1C    | Sidebar preta                           |
| `--sidebar-accent`     | rgba(255,255,255,0.08) | Item ativo na sidebar         |
| `--sand`               | #E8E0D0    | Card bege/areia da clínica              |
| `--success`            | #1F7A4D    | Aprovado, confirmado                    |
| `--warning`            | #C98A1E    | Visualizado, aguardando                 |
| `--destructive`        | #C0392B    | Recusado, erro                          |
| `--info`               | #2D6AA3    | Informativo                             |
| `--border`             | rgba(0,0,0,0.08) | Bordas sutis                       |

### Forma
- Border-radius: 14px (cards), 10px (botões/inputs), 9999px (chips/avatares)
- Sombra: `0 1px 2px rgba(0,0,0,0.04)` (padrão), `0 4px 12px rgba(0,0,0,0.06)` (hover)

### Tipografia
- Cormorant Garamond: títulos/headings, números KPI grandes (serif elegante)
- Montserrat: UI, corpo, botões (sans-serif)
- `tabular-nums` em todos os valores numéricos

### Layout
- Sidebar fixa à esquerda (#1C1C1C), 224px, grupos colapsáveis (COMERCIAL, CLÍNICO, FINANCEIRO, OPERACIONAL)
- Item ativo: fundo branco 8%, texto branco, ícone verde (#1F7A4D)
- Configurações fixo na base da sidebar
- Header de página dentro do conteúdo (não barra separada): título serif + subtítulo muted + busca + botão verde
- SEM toggle dark/light — tema único light

### Status de orçamentos (chips)
- rascunho  → cinza muted
- enviado   → cinza-escuro foreground
- negociacao→ âmbar #C98A1E
- aprovado  → verde #1F7A4D
- recusado  → vermelho #C0392B
- expirado  → cinza (line-through)

### Regras
- Nenhum componente com cor hardcoded fora dos tokens acima
- Nada de gradientes roxo/azul, nada de emojis na UI
- Tabelas: header em `#FAF8F4` caps pequeno cinza; linhas com hover `rgba(0,0,0,0.025)`
- Banners de status: verde para travado/assinado, âmbar para pendente

## Integrações externas
- Vindi (pagamentos): API v1, chave em VINDI_API_KEY
- ZapSign (assinatura digital): API, chave em ZAPSIGN_API_TOKEN
- Google Drive (arquivos de pacientes): service account, credenciais em GOOGLE_SERVICE_ACCOUNT_JSON, pasta raiz em DRIVE_ROOT_FOLDER_ID
- WhatsApp (Z-API ou Evolution API): credenciais em WHATSAPP_API_URL / WHATSAPP_API_TOKEN
Todas as chamadas a APIs externas passam por rotas server-side (route handlers ou Edge Functions). Nunca expor chaves no client.

## Regras de domínio (LGPD e CFO)
- Prontuário é dado sensível de saúde: toda tabela tem RLS habilitado; acesso só autenticado
- Tabela audit_log registra toda leitura/edição de prontuário (quem, quando, o quê)
- Prontuário nunca é deletado fisicamente (soft delete + retenção; CFO exige guarda prolongada)
- Orçamento aprovado + contrato assinado = registro travado (read-only); alterações só via aditivo
- Termo de consentimento LGPD vinculado ao cadastro do paciente

## Convenções
- Nomes de tabelas e colunas em snake_case, em português (pacientes, orcamentos, agenda_eventos)
- Datas sempre timestamptz; valores monetários em numeric(12,2)
- Migrations versionadas via supabase/migrations
- Componentes em src/components/<modulo>/
- Cada módulo tem sua pasta em src/app/(app)/<modulo>/
