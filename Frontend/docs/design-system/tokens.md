# Tokens do Design System

Os tokens de design do ACE são definidos usando variáveis CSS no arquivo [globals.css](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/app/globals.css) e mapeados na diretiva `@theme inline` do Tailwind CSS v4.

## 1. Tokens de Tipografia e Fontes

O sistema utiliza fontes modernas e limpas importadas do Google Fonts:
- **Font Family**: `"Plus Jakarta Sans", "Inter", system-ui, sans-serif`
  - Mapeado no Tailwind como `font-sans`.
- **Pesos de Fonte Disponíveis**: `400` (Regular), `500` (Medium), `600` (Semi-Bold), `700` (Bold), `800` (Extra-Bold).

## 2. Tokens de Arredondamento (Border Radius)

O raio de borda base do design system é de `1rem` (`16px`). Todos os sub-tokens são calculados dinamicamente em relação ao valor base `--radius`:

| Token Tailwind | Variável CSS | Cálculo / Valor | Aplicação Típica |
|---|---|---|---|
| `rounded-sm` | `--radius-sm` | `calc(var(--radius) - 4px)` (12px) | Botões pequenos, tags, badges |
| `rounded-md` | `--radius-md` | `calc(var(--radius) - 2px)` (14px) | Inputs de formulários, botões |
| `rounded-lg` | `--radius-lg` | `var(--radius)` (16px) | Componentes de UI menores, cards internos |
| `rounded-xl` | `--radius-xl` | `calc(var(--radius) + 4px)` (20px) | Cards médios, blocos flutuantes |
| `rounded-2xl` | `--radius-2xl` | `calc(var(--radius) + 8px)` (24px) | Botões grandes, containers internos |
| `rounded-3xl` | `--radius-3xl` | `calc(var(--radius) + 12px)` (28px) | Cards principais de dashboards |
| `rounded-4xl` | `--radius-4xl` | `calc(var(--radius) + 16px)` (32px) | Modais grandes, frames de celular |

## 3. Configuração do Tailwind CSS v4

Os tokens são vinculados no `@theme inline` para que possam ser utilizados diretamente com as classes nativas do Tailwind:

```css
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
  /* Mapeamento de cores segue no arquivo de paleta */
}
```
