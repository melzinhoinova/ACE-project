# Componente AceLogo

O logotipo textual oficial da plataforma ACE.

## Detalhes do Arquivo

- **Caminho**: [src/components/ace/AceLogo.tsx](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/components/ace/AceLogo.tsx)
- **Tipo**: Server Component (sem estado ou hooks React, otimizado para carregamento veloz).

## Propriedades (Props)

```typescript
interface AceLogoProps {
  size?: "sm" | "lg";
}
```

- `size` (opcional): Define o tamanho e a espessura do logotipo. O valor padrão é `"sm"`.

## Variantes Visuais

| Tamanho | Classes CSS Aplicadas | Casos de Uso |
|---|---|---|
| `"sm"` | `text-xl font-bold` | Barra de navegação superior (`TopBar`) |
| `"lg"` | `text-4xl font-extrabold` | Página inicial / Splash screen |

## Design System & Estilização

O texto exibe a marca "ACE" usando a utilidade customizada `.text-gradient-brand` mapeada no arquivo `globals.css`:
- **Gradiente**: Linear de 135 graus partindo de roxo `#7B2FBE` até azul `#2F6FBE`.
- **Efeito**: Aplica `background-clip: text` e `color: transparent` para que o gradiente preencha as letras do texto.

## Exemplos de Uso

```tsx
import { AceLogo } from "@/components/ace/AceLogo";

// Uso padrão na barra de menu:
<AceLogo size="sm" />

// Uso destacado na tela de entrada:
<AceLogo size="lg" />
```
