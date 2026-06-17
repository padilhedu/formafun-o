# Design Tokens — Forma & Função (Paleta Verde / Lovable)

> Extraídos das telas Dashboard, Lista de Orçamentos e Detalhe do Orçamento da
> Forma & Função Vision (Lovable). Esta é a identidade aprovada. Não regredir.

## Fundos

| Token CSS              | Valor      | Tailwind        | Uso                            |
|------------------------|------------|-----------------|--------------------------------|
| `--background`         | `#F5F3EF`  | `bg-base`       | Fundo geral da aplicação       |
| `--surface`            | `#FAF8F4`  | `bg-surface`    | Cabeçalho de tabelas, rodapés  |
| `--card`               | `#FFFFFF`  | `bg-white`      | Cards e painéis                |
| `--muted-shad`         | `#EFEDE7`  | `bg-elevated`   | Chips neutros, hover, inputs   |
| `--sand`               | `#E8E0D0`  | `bg-sand`       | Card Clínica (bege)            |

## Texto

| Token                  | Valor      | Tailwind            | Uso                    |
|------------------------|------------|---------------------|------------------------|
| `--foreground`         | `#1C1C1C`  | `text-foreground`   | Títulos, dados         |
| `--muted-foreground`   | `#6B6B66`  | `text-muted`        | Labels, metadados      |
| `--sand-foreground`    | `#3A352B`  | `text-[#3A352B]`    | Texto sobre sand card  |

## Primária — Verde

| Token                  | Valor      | Tailwind              | Uso                           |
|------------------------|------------|-----------------------|-------------------------------|
| `--primary`            | `#1F7A4D`  | `bg-primary`          | Botões, links ativos, ícones  |
| `--primary` (hover)    | `#1A6A43`  | `bg-primary/hover`    | Estado hover do botão         |
| `--primary-foreground` | `#FFFFFF`  | `text-primary-foreground` | Texto sobre primary       |

## Sidebar (preta — separada do tema)

| Variável CSS             | Valor                     | Uso                          |
|--------------------------|---------------------------|------------------------------|
| `--sidebar-bg`           | `#1C1C1C`                 | Fundo da sidebar             |
| `--sidebar-fg`           | `#FFFFFF`                 | Texto dos itens              |
| `--sidebar-active-bg`    | `rgba(255,255,255,0.08)`  | Item ativo                   |
| `--sidebar-hover-bg`     | `rgba(255,255,255,0.05)`  | Item em hover                |
| `--sidebar-primary`      | `#1F7A4D`                 | Barra e ícone do item ativo  |
| `--sidebar-muted`        | `rgba(255,255,255,0.40)`  | Texto inativo                |

## Estados / Chips

| Estado      | Cor texto  | Cor fundo (alpha 10%) | Borda (alpha 20%) |
|-------------|------------|-----------------------|-------------------|
| Sucesso     | `#1F7A4D`  | `rgba(31,122,77,.10)` | `rgba(31,122,77,.20)` |
| Alerta      | `#C98A1E`  | `rgba(201,138,30,.10)`| `rgba(201,138,30,.20)` |
| Erro        | `#C0392B`  | `rgba(192,57,43,.10)` | `rgba(192,57,43,.20)` |
| Info        | `#2D6AA3`  | `rgba(45,106,163,.10)`| `rgba(45,106,163,.20)` |
| Neutro      | `#6B6B66`  | `rgba(107,107,102,.10)` | `rgba(107,107,102,.15)` |

## Bordas e Forma

| Token          | Valor                   | Uso                         |
|----------------|-------------------------|-----------------------------|
| Borda padrão   | `rgba(0,0,0,0.08)`      | Cards, inputs, tabelas      |
| Radius card    | `14px`                  | Cards e painéis             |
| Radius btn/input| `10px`                 | Botões e campos             |
| Radius chip    | `9999px`                | Badges e chips de status    |

## Sombras

| Token            | Valor                         | Uso              |
|------------------|-------------------------------|------------------|
| `--shadow-card`  | `0 1px 2px rgba(0,0,0,0.04)` | Card em repouso  |
| `--shadow-soft`  | `0 4px 12px rgba(0,0,0,0.06)`| Card em hover    |
| Focus ring       | `0 0 0 3px rgba(31,122,77,0.12)` | Input focus  |

## Tipografia

| Variável            | Família                              | Uso                          |
|---------------------|--------------------------------------|------------------------------|
| `--font-display`    | Cormorant Garamond, Georgia, serif   | Títulos, KPIs grandes        |
| `--font-body`       | Montserrat, system-ui, sans-serif    | UI, corpo, labels            |

**Regras:**
- Números de KPI e valores monetários: `font-variant-numeric: tabular-nums`
- Peso de heading display: 500-700
- Peso de corpo UI: 400-600

## Classes utilitárias globais (globals.css)

| Classe           | Equivale a                                     |
|------------------|------------------------------------------------|
| `.card`          | bg white, border rgba(0,0,0,.08), radius 14px  |
| `.card-sand`     | bg #E8E0D0, border, radius 14px                |
| `.btn-primary`   | bg #1F7A4D, text white, radius 10px            |
| `.btn-ghost`     | transparent, border, text muted                |
| `.input-field`   | bg white, border, focus verde                  |
| `.badge-success` | verde claro                                    |
| `.badge-warning` | âmbar claro                                    |
| `.badge-error`   | vermelho claro                                 |
| `.badge-info`    | azul claro                                     |
| `.badge-neutral` | cinza claro                                    |
| `.table-header`  | bg surface, caps-small, muted text             |
| `.table-row-hover` | hover rgba(0,0,0,.025)                       |
