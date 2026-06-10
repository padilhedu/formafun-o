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
Tema dark premium, mesmo estilo do dashboard Indaiá Eventos:
- Fundo: #0A0A0B (base), #121214 (cards/superfícies), #1A1A1E (superfícies elevadas)
- Bordas: rgba(255,255,255,0.07), radius 12-16px
- Acento principal: dourado #B89A5A (botões primários, links ativos, destaques)
- Tons de apoio: champanhe #D9C9A3, off-white #F5F2EA para texto principal
- Texto secundário: #8A8A93
- Estados: sucesso #4ADE80, alerta #FBBF24, erro #F87171, info #60A5FA
- Tipografia: Cormorant Garamond (títulos/headings, peso 500-600) + Montserrat (UI/corpo, 400-600)
- Sidebar fixa à esquerda com grupos colapsáveis (COMERCIAL, CLÍNICO, FINANCEIRO, OPERACIONAL)
- Topbar: toggle de tema, notificações, avatar do usuário com role badge
- Banners de status coloridos com borda (verde = travado/assinado, roxo = informativo)
- Tabelas com header em caps pequeno, linhas com hover sutil
- Evitar estética genérica de IA: nada de gradientes roxo/azul, nada de emojis na UI

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
