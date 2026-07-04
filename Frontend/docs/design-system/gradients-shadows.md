# Gradientes e Sombras do Design System

Esta seção detalha a composição visual dos elementos gráficos que dão a identidade moderna, futurista e dark-first da interface do ACE.

## 1. Gradientes de Cores

O ACE utiliza uma combinação de gradientes lineares e radiais para ressaltar a marca e criar profundidade visual nas telas pretas.

### Gradiente da Marca (Brand Gradient)
O gradiente principal do ACE é composto por um roxo elétrico e um azul vibrante.
- **Variável CSS**: `--gradient-brand`
- **Valores**: `linear-gradient(135deg, #7B2FBE 0%, #2F6FBE 100%)`
- **Utilização**:
  - Logotipos textuais (`AceLogo`).
  - Botões primários calls-to-action (CTA).
  - Toggles e elementos de seleção ativos.

### Gradiente Suave da Marca (Soft Brand Gradient)
Uma versão diluída do gradiente principal, com opacidade reduzida para preenchimento de fundos de componentes sem comprometer o contraste.
- **Variável CSS**: `--gradient-brand-soft`
- **Valores**: `linear-gradient(135deg, oklch(0.55 0.24 305 / 0.18), oklch(0.58 0.2 250 / 0.18))`
- **Utilização**:
  - Fundo de abas ativas e cards secundários.
  - Indicadores e badges.

### Gradiente de Fundo (Background Gradient)
Composição complexa que envolve três camadas sobrepostas para criar efeitos de luz e profundidade no fundo de todo o site.
- **Variável CSS**: `--gradient-bg`
- **Camadas**:
  1. `radial-gradient(ellipse 80% 60% at 20% 0%, oklch(0.55 0.24 305 / 0.15), transparent 60%)`: Halo de luz roxa vindo do canto superior esquerdo.
  2. `radial-gradient(ellipse 70% 50% at 90% 30%, oklch(0.58 0.2 250 / 0.12), transparent 60%)`: Halo de luz azul vindo do lado superior direito.
  3. `oklch(0.09 0.03 280)`: Cor sólida quase preta de base profunda.
- **Utilização**: Fundo padrão do elemento `body`.

---

## 2. Sombras (Shadows)

As sombras no ACE são usadas tanto para criar elevação física quanto para emitir luminosidade (efeito Glow).

### Glow da Marca (Glow Brand)
Uma sombra que emite um brilho colorido roxo ao redor de elementos importantes.
- **Variável CSS**: `--shadow-glow`
- **Valores**: `0 0 0 1px oklch(0.62 0.22 295 / 0.4), 0 20px 60px -10px oklch(0.55 0.24 305 / 0.35)`
- **Utilização**:
  - Botões de disparo e publicação de campanhas.
  - Cards selecionados de feriados do radar.

### Sombra de Card (Card Shadow)
Uma sombra suave e profunda para destacar superfícies sobre o fundo gradiente escuro.
- **Variável CSS**: `--shadow-card`
- **Valores**: `0 8px 32px -8px oklch(0 0 0 / 0.5)` (Sombra preta com 50% de opacidade).
- **Utilização**: Todos os cards e wrappers da interface.
