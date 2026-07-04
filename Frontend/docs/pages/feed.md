# FeedPage (/feed)

Esta página simula a campanha já em execução e renderiza mockups visuais detalhados de como as publicações aparecem nas plataformas finais (Instagram e WhatsApp) dentro de um chassi de celular.

## Detalhes Técnicos

- **Rota**: `/feed` (mapeada em [src/app/feed/page.tsx](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/app/feed/page.tsx))
- **Tipo**: Client Component (`"use client"`)
- **Layout**: Inclui o [TopBar](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/components/ace/TopBar.tsx).

## Componentes Internos e Locais

- **PhoneFrame**: Moldura de smartphone com cantos arredondados (`rounded-[44px]`), bordas pretas grossas e sombra acentuada. Serve como container para os mockups.
- **InstagramMock**: Renderiza uma réplica exata de uma postagem patrocinada no Instagram. Exibe avatar do Grupo Nexus, localização "Patrocinado", o criativo (gradiente ou imagem do usuário), legenda com o copy gerado e as interações típicas de mídia social (curtidas, comentários).
- **WhatsappMock**: Renderiza um balão de conversa simulado do WhatsApp. Exibe a mensagem de texto com emojis, um card interno formatado contendo o cupom promocional e o símbolo de leitura com os dois tracinhos azuis.
- **TabBtn**: Botões de abas para alternar entre Instagram e WhatsApp.
- **Stat**: Card que exibe dados de performance imediatos da campanha (status, curtidas, cliques).

## Estado Local

- `tab`: Controla qual canal está ativo no celular (`"ig"` ou `"wa"`).
- `variantIdx`: Índice da variante resgatada de `"ace.variant"`.
- `uploaded`: Imagem personalizada resgatada de `"ace.uploadedImage"`.

## Fluxo de Interação

1. **Montagem da página**: O celular e os cards de estatísticas entram em cena com uma animação `.animate-float-up`.
2. **Abas**: O usuário pode clicar nas abas para alternar o mockup renderizado dentro do `PhoneFrame`.
3. **Métricas dinâmicas**: O card de cliques no cupom exibe uma bolinha de notificação pulsante para indicar atualização em tempo real.
4. **Navegação**: O botão no canto superior direito leva à tela de resultados detalhados (`/sucesso`).
