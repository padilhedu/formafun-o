# Auditoria do Design System — Forma & Função CRM

Data: 2026-06-17

## Paleta vigente

| Token | Hex | Uso |
|---|---|---|
| Base bg | `#0A0A0B` | Fundo da página |
| Card bg | `#121214` | Cards `.card` |
| Elevated bg | `#1A1A1E` | Modais `.card-elevated`, inputs |
| Gold (accent) | `#B89A5A` | Botão primário, destaques |
| Champagne | `#D9C9A3` | Texto secundário dourado |
| Off-white | `#F5F2EA` | Texto principal |
| Muted | `#8A8A93` | Texto secundário, labels |
| Brand purple | `#59399E` | Sidebar ativo, CTA |
| Purple light | `#7B5DC0` | Hover, btn-primary:hover |
| Success | `#4ADE80` | Estado positivo |
| Warning | `#FBBF24` | Alerta |
| Error | `#F87171` | Erro, destrutivo |
| Info | `#60A5FA` | Informativo |

## Inconsistências encontradas e corrigidas

| Arquivo | Linha | Problema | Correção aplicada |
|---|---|---|---|
| `components/layout/Sidebar.tsx` | 150 | `stroke="#A07FD4"` — roxo não-padrão no logo | → `#B89A5A` (gold) |
| `components/pacientes/AbaOdontograma.tsx` | 35 | `carie: '#EF4444'` — red-500 Tailwind padrão | → `#F87171` (brand error) |
| `components/pacientes/AbaOdontograma.tsx` | 36 | `restaurado: '#3B82F6'` — blue-500 | → `#60A5FA` (brand info) |
| `components/pacientes/AbaOdontograma.tsx` | 37 | `coroa: '#F59E0B'` — amber-500 | → `#B89A5A` (brand gold) |
| `components/pacientes/AbaOdontograma.tsx` | 38 | `extraido: '#4B4B55'` — cinza arbitrário | → `#8A8A93` (brand muted) |
| `components/pacientes/AbaOdontograma.tsx` | 39 | `implante: '#8B5CF6'` — violet-500 | → `#7B5DC0` (brand purple-light) |
| `components/pacientes/AbaOdontograma.tsx` | 41 | `fratura: '#F97316'` — orange-500 | → `#FBBF24` (brand warning) |
| `app/globals.css` | — | Ausência de `.gradient-card`, badge variants | Adicionado (ver abaixo) |

## Classes adicionadas ao globals.css

```css
.gradient-card          /* linear-gradient(145deg, #141416 → #111113) + borda padrão */
.badge-success          /* verde #4ADE80 com bg/border semitransparente */
.badge-warning          /* amarelo #FBBF24 */
.badge-error            /* vermelho #F87171 */
.badge-info             /* azul #60A5FA */
.badge-neutral          /* cinza #8A8A93 */
.badge-gold             /* dourado #B89A5A */
```

## Inconsistências mantidas (aceitas)

| Arquivo | Situação |
|---|---|
| Vários | Inline styles com hex corretos da paleta — corretos em conteúdo, só não usam classes Tailwind. Sem impacto visual. |
| FluxoCaixaChart | Cores Recharts já usam `#B89A5A` e `#F87171` — corretos. |
| RelatoriosClient | `#7B5DC0` hardcoded em stroke Recharts — cor correta da paleta, aceita. |
| AgendaClient | `linear-gradient(145deg, #141416...)` repetido — pode migrar para `.gradient-card` em iteração futura. |
| `endodontia: '#EC4899'` | Rosa não tem equivalente direto na paleta; mantido para distinção clínica. |

## Padrão de opacidades (padronizado)

| Valor | Uso |
|---|---|
| `rgba(255,255,255,0.04)` | Background muito sutil |
| `rgba(255,255,255,0.07)` | Bordas padrão |
| `rgba(255,255,255,0.10)` | Bordas enfatizadas / hover |
| `rgba(255,255,255,0.15)` | Hover de bordas |
| `rgba(cor,0.12)` | Background soft de badge |
| `rgba(cor,0.25)` | Borda de badge |
