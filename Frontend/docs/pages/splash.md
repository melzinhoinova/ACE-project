# SplashPage (/)

A página inicial do ACE é uma landing/splash screen projetada para capturar o branding do projeto e gerenciar o início da sessão do usuário.

## Detalhes Técnicos

- **Rota**: `/` (mapeada em [src/app/page.tsx](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/app/page.tsx))
- **Tipo**: Client Component (`"use client"`)
- **Layout**: Não compartilha a barra de navegação principal (`TopBar`), fornecendo uma experiência limpa e focada.

## Componentes Utilizados

- [AceLogo](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/components/ace/AceLogo.tsx): Renderizado em tamanho grande (`size="lg"`).
- **Ícones**: `Mail`, `Loader2`, `Sparkles` (de `lucide-react`).
- **GoogleIcon**: Ícone SVG inline personalizado para o botão de autenticação social.

## Estado Local

- `loading`: Controla qual botão de login disparou a animação de carregamento.
  - Tipo: `null | "google" | "email"`

## Fluxo de Interação

1. **Montagem da página**: Renderiza os elementos com animações de fade-in sequenciais.
2. **Clique em "Entrar com Google"** ou **"Acessar com e-mail"**:
   - Atualiza `loading` correspondente para exibir um spinner do `Loader2` girando.
   - Dispara um temporizador simulado de `900ms`.
   - Navega para a rota `/radar` usando o hook `useRouter` do `next/navigation`.

## CSS e Animações Específicas

- **Blobs de Fundo**: Divs com posições absolutas, efeitos de desfocagem (`blur-[120px]`), opacidade reduzida e a animação `pulse` do Tailwind para criar um fundo dinâmico e moderno.
- **Entrada de Conteúdo**: Uso de classes customizadas `.animate-float-up` combinadas com propriedades inline `animationDelay` escalonadas para fazer os textos e botões aparecerem suavemente de baixo para cima.
