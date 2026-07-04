# Paleta de Cores OKLCH

O ACE adota exclusivamente o modelo de cores **oklch**, que oferece percepção de luminosidade uniforme para olhos humanos e maior fidelidade em telas modernas e de alta gama cromática.

## 1. Cores do Sistema (Modo Escuro)

A tabela abaixo documenta os valores das variáveis CSS de cores registradas no tema do Tailwind:

| Token Tailwind | Variável CSS | Valor oklch | Descrição Visual |
|---|---|---|---|
| `background` | `--background` | `oklch(0.13 0.03 280)` | Fundo principal da página (quase preto azulado) |
| `foreground` | `--foreground` | `oklch(0.97 0.01 270)` | Texto principal (quase branco sutil) |
| `card` | `--card` | `oklch(0.18 0.04 278)` | Fundo de cards e superfícies (cinza azulado escuro) |
| `card-foreground` | `--card-foreground`| `oklch(0.97 0.01 270)` | Texto dentro de cards e superfícies |
| `primary` | `--primary` | `oklch(0.62 0.22 295)` | Cor de destaque primária (roxo elétrico) |
| `primary-foreground`| `--primary-foreground`| `oklch(0.99 0 0)` | Texto sobre cor primária (branco puro) |
| `secondary` | `--secondary` | `oklch(0.24 0.05 278)` | Superfícies secundárias de destaque sutil |
| `muted` | `--muted` | `oklch(0.22 0.04 278)` | Preenchimento sutil de inputs e bordas |
| `muted-foreground` | `--muted-foreground`| `oklch(0.72 0.03 270)` | Textos de ajuda, placeholders e datas secundárias |
| `accent` | `--accent` | `oklch(0.58 0.2 260)` | Cor de hover e elementos de seleção secundários |
| `destructive` | `--destructive` | `oklch(0.62 0.24 27)` | Cor de alerta de erro (vermelho alaranjado) |
| `border` | `--border` | `oklch(1 0 0 / 8%)` | Cor de bordas ultrafinas (branco puro com 8% opacidade) |
| `input` | `--input` | `oklch(1 0 0 / 12%)` | Fundo de inputs (branco puro com 12% opacidade) |

## 2. Cores da Marca e Suporte Semântico

| Nome do Token | Variável CSS | Valor oklch | Significado Semântico |
|---|---|---|---|
| `brand-purple` | `--brand-purple` | `oklch(0.55 0.24 305)` | Roxo de marca oficial (início de gradientes) |
| `brand-blue` | `--brand-blue` | `oklch(0.58 0.2 250)` | Azul de marca oficial (fim de gradientes) |
| `success` | `--success` | `oklch(0.74 0.18 145)` | Indicadores positivos, alta pontuação (verde) |
| `warning` | `--warning` | `oklch(0.82 0.17 85)` | Oportunidade média, avisos (amarelo) |
| `danger` | `--danger` | `oklch(0.65 0.24 27)` | Risco de baixa adesão de vendas (vermelho) |

## 3. Explicação dos Parâmetros oklch

- **Luminance (L)**: Primeiro parâmetro (0 a 1.0 ou 100%). Controla o brilho da cor. Ex: `--background` tem `0.13` (muito escuro) e `--foreground` tem `0.97` (muito claro).
- **Chroma (C)**: Segundo parâmetro (0 a 0.4). Controla o nível de pureza ou saturação da cor. Ex: `--primary` tem `0.22` (altamente saturado/vibrante).
- **Hue (H)**: Terceiro parâmetro (0 a 360). Ângulo de matiz cromática em graus:
  - `25` - Vermelho/Laranja (destructive / danger)
  - `85` - Amarelo (warning)
  - `145` - Verde (success)
  - `250` - Azul (brand-blue)
  - `305` - Roxo (brand-purple)
