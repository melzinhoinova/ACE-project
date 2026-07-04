# Componente TopBar

A barra de navegação global que orienta o usuário através das etapas de criação da campanha.

## Detalhes do Arquivo

- **Caminho**: [src/components/ace/TopBar.tsx](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/components/ace/TopBar.tsx)
- **Tipo**: Client Component (`"use client"`)

## Estrutura Visual e Funcional

A barra de cabeçalho é fixada no topo da tela (`sticky top-0`) com fundo semi-transparente e efeito de desfoque de vidro (`backdrop-blur-xl`), contendo:
1. **Logo**: Link para a página de radar contendo o componente `<AceLogo size="sm" />`.
2. **Navegação principal (Desktop)**: Menu em forma de pílula contendo as 5 rotas sequenciais da campanha.
3. **Barra de Ações**: Botões decorativos para Busca e Central de Notificações (com indicador de atividade em gradiente).
4. **Identificação do Usuário**: Card exibindo o avatar, primeiro nome e empresa do usuário (dados obtidos de `ACE_USER`).
5. **Menu Hambúrguer (Mobile)**: Botão de alternância exibindo ícones `Menu` ou `X` de acordo com o estado do painel móvel.

## Estado Local

- `open` (boolean): Controla se o menu de links verticais para smartphones/viewports pequenos está visível.

## Responsividade

- **Telas Desktop (`md:` e maiores)**: Exibe a lista horizontal de pílulas de navegação e as informações completas do perfil do usuário. O menu hambúrguer é ocultado.
- **Telas Mobile (`md:` menores)**: O menu horizontal é ocultado, dando lugar ao botão hambúrguer. Ao ser clicado, abre um painel móvel logo abaixo do cabeçalho cobrindo a largura da viewport com os links verticais.

## Mapeamento de Rotas

```typescript
const STEPS = [
  { to: "/radar", label: "Radar" },
  { to: "/gerador", label: "Estúdio de Criação" },
  { to: "/aprovar", label: "Automação" },
  { to: "/feed", label: "Feed" },
  { to: "/sucesso", label: "Resultados" },
];
```

## Notas de Migração (TanStack para Next.js)

Durante a refatoração, o componente foi adaptado das dependências do TanStack para as APIs nativas do Next.js:
- **Detecção de rota ativa**: A lógica original baseada em `useRouterState()` foi substituída pelo hook `usePathname()` de `next/navigation`.
- **Hiperlinks**: O componente `<Link>` do `@tanstack/react-router` foi substituído pelo `<Link>` nativo de `next/link` para manter os comportamentos corretos de pré-carregamento e roteamento do Next.js.
