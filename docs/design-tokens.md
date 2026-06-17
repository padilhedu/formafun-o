# Design Tokens — Forma & Função

Paleta aprovada em jun/2026 (baseada na Lovable vision).  
Tema único: light off-white com acento **verde** `#1F7A4D`.

## Fundos

| Token CSS         | Valor     | Tailwind class | Uso                              |
|-------------------|-----------|----------------|----------------------------------|
| `--background`    | `#F5F3EF` | `bg-background`| Fundo geral da aplicação         |
| `--surface`       | `#FAF8F4` | —              | Header de tabela, rodapés        |
| `--card`          | `#FFFFFF` | `bg-card`      | Cards e painéis                  |
| `--muted-shad`    | `#EFEDE7` | `bg-muted-shad`| Fundos sutis, chips neutros      |
| `--sand`          | `#E8E0D0` | `bg-sand`      | Card bege/areia da clínica       |

## Texto

| Token CSS              | Valor     | Tailwind class         | Uso                          |
|------------------------|-----------|------------------------|------------------------------|
| `--foreground`         | `#1C1C1C` | `text-foreground`      | Títulos e dados principais   |
| `--muted-foreground`   | `#6B6B66` | `text-muted-foreground`| Labels, metadados            |
| `--card-foreground`    | `#1C1C1C` | `text-card-foreground` | Texto dentro de cards        |
| `--sand-foreground`    | `#3A352B` | —                      | Texto sobre card areia       |

## Primária (Verde)

| Token             | Valor     | Tailwind class    | Uso                               |
|-------------------|-----------|-------------------|-----------------------------------|
| `--primary`       | `#1F7A4D` | `bg-primary`      | Botões principais, links ativos   |
| `--primary-hover` | `#1A6A43` | —                 | Hover dos botões primários        |
| primary/10        | —         | `bg-primary/10`   | Fundos suaves de badge e avatar   |

## Sidebar

| Token                    | Valor                   | Uso                            |
|--------------------------|-------------------------|--------------------------------|
| `--sidebar`              | `#1C1C1C`               | Fundo da sidebar preta         |
| `--sidebar-foreground`   | `#FFFFFF`               | Texto na sidebar               |
| `--sidebar-primary`      | `#1F7A4D`               | Ícone do item ativo            |
| `--sidebar-accent`       | `rgba(255,255,255,0.08)`| Fundo do item ativo            |
| `--sidebar-border`       | `rgba(255,255,255,0.06)`| Borda da sidebar               |

## Estados (chips de status)

| Estado     | Cor do texto | Background          | Borda                   |
|------------|-------------|---------------------|-------------------------|
| rascunho   | `#6B6B66`   | `rgba(107,107,102,0.10)` | `rgba(107,107,102,0.20)` |
| enviado    | `#3A3A3A`   | `rgba(28,28,28,0.07)`    | `rgba(28,28,28,0.15)`    |
| negociacao | `#C98A1E`   | `rgba(201,138,30,0.12)`  | `rgba(201,138,30,0.25)`  |
| aprovado   | `#1F7A4D`   | `rgba(31,122,77,0.10)`   | `rgba(31,122,77,0.25)`   |
| recusado   | `#C0392B`   | `rgba(192,57,43,0.10)`   | `rgba(192,57,43,0.20)`   |
| expirado   | `#9B9BA0`   | `rgba(107,107,102,0.06)` | `rgba(107,107,102,0.15)` |

## Forma

| Token           | Valor    | Uso                        |
|-----------------|----------|----------------------------|
| `--radius-card` | `14px`   | Cards, painéis             |
| `--radius-md`   | `10px`   | Botões, inputs             |
| `--radius-full` | `9999px` | Chips, avatares            |

## Sombras

| Token          | Valor                            | Uso              |
|----------------|----------------------------------|------------------|
| `shadow-card`  | `0 1px 2px rgba(0,0,0,0.04)`    | Cards padrão     |
| `shadow-soft`  | `0 4px 12px rgba(0,0,0,0.06)`   | Hover / elevado  |

## Tipografia

| Fonte              | Família                    | Uso                                  |
|--------------------|----------------------------|--------------------------------------|
| Cormorant Garamond | `var(--font-cormorant)`    | Títulos H1/H2, números KPI grandes   |
| Montserrat         | `var(--font-montserrat)`   | UI, corpo, botões, labels            |

Usar `font-variant-numeric: tabular-nums` em todos os valores numéricos.

## Componentes de referência

| Componente        | Arquivo                                      |
|-------------------|----------------------------------------------|
| `<Sparkline>`     | `src/components/ui/Sparkline.tsx`            |
| `<StatusChip>`    | `src/components/ui/StatusChip.tsx`           |
| `<StatusTimeline>`| `src/components/ui/StatusTimeline.tsx`       |
| `<KpiCard>`       | `src/components/dashboard/KpiCard.tsx`       |
| `<MiniCalDash>`   | `src/components/dashboard/MiniCalDash.tsx`   |
| `<CardClinica>`   | `src/components/dashboard/CardClinica.tsx`   |
| `<AgendaHoje>`    | `src/components/dashboard/AgendaHoje.tsx`    |
| Status maps       | `src/lib/status.ts`                          |
