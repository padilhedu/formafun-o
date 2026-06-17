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

## Identidade visual (obrigatória) — Paleta Lovable / Verde
Tema LIGHT premium (portado da Forma & Função Vision na Lovable):

### Fundos
- Geral:    #F5F3EF (off-white quente)
- Superfície: #FAF8F4 (cabeçalhos de tabela, rodapés)
- Card:     #FFFFFF
- Muted:    #EFEDE7 (chips neutros, hover)
- Areia:    #E8E0D0 (card clínica)

### Sidebar (preta — separada do tema claro)
- Fundo: #1C1C1C  |  texto: #FFFFFF
- Item ativo: rgba(255,255,255,0.08) bg + barra esquerda #1F7A4D (verde)
- Hover: rgba(255,255,255,0.05)
- Largura: 248px; navegação PLANA (sem grupos colapsáveis)

### Acento principal — VERDE (substituiu roxo/dourado)
- Primary:  #1F7A4D  (botões, links ativos, indicadores)
- Hover:    #1A6A43
- Foreground: #FFFFFF (sobre primary)

### Texto
- Principal:  #1C1C1C
- Secundário: #6B6B66
- Muted:      #6B6B66

### Bordas & forma
- Borda: rgba(0,0,0,0.08)  |  radius card: 14px  |  radius btn/input: 10px
- Sombra card: 0 1px 2px rgba(0,0,0,0.04)
- Sombra hover: 0 4px 12px rgba(0,0,0,0.06)

### Estados
- Sucesso:  #1F7A4D  |  bg: rgba(31,122,77,0.10)
- Alerta:   #C98A1E  |  bg: rgba(201,138,30,0.10)
- Erro:     #C0392B  |  bg: rgba(192,57,43,0.10)
- Info:     #2D6AA3  |  bg: rgba(45,106,163,0.10)

### Tipografia
- Display (títulos): Cormorant Garamond (var(--font-display)), 500-700
  → números grandes em tabular-nums
- Corpo/UI:    Montserrat (var(--font-body)), 400-600

### Componentes-chave
- StatusChip: chip com dot + label — centralizado em src/lib/status.ts
- KpiCard: label caps-small + valor display serif + chip delta + sparkline opcional
- DataTable: header surface (#FAF8F4), caps-small muted, hover rgba(0,0,0,0.025)
- MiniCalendar: hoje = círculo verde; evento = ponto verde; fuso BRT
- ClinicaCard: fundo areia (#E8E0D0), contadores reais
- StatusTimeline: checks verdes preenchidos (concluído) / círculos vazios (pendente)

### Regras
- ZERO emojis na UI
- ZERO gradientes roxo/azul
- ZERO hardcoded hex fora dos tokens — usar CSS vars ou Tailwind tokens
- SEM toggle dark/light (identidade light definida)

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
