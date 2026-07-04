# GeradorPage (/gerador)

O estúdio de criação inteligente. Esta página simula a geração por IA dos elementos da campanha e permite que o usuário faça o upload de imagens personalizadas e selecione os canais de postagem.

## Detalhes Técnicos

- **Rota**: `/gerador` (mapeada em [src/app/gerador/page.tsx](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/app/gerador/page.tsx))
- **Tipo**: Client Component (`"use client"`)
- **Layout**: Inclui o [TopBar](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/components/ace/TopBar.tsx).

## Componentes Internos e Locais

- **ArtPreview**: Simula o criativo gerado pela IA. Aplica um gradiente correspondente ao feriado e exibe um emoji simbólico, tag de promoção, headline e cupom de desconto. Caso o usuário envie uma imagem própria, ela sobrepõe o gradiente mantendo os elementos de texto.
- **ChannelToggle**: Um interruptor liga/desliga estilizado com transições suaves que gerencia se um canal (Instagram ou WhatsApp) deve ser incluído na publicação.

## Estado Local

- `stage`: `"loading"` (durante a simulação de geração da IA) ou `"ready"` (quando a UI está pronta para interação). A transição ocorre automaticamente após `2000ms`.
- `variant`: Índice da variante textual e criativa da campanha exibida no preview.
- `regenerating`: Booleano para simular um tempo de recálculo (900ms) ao clicar em "Gerar nova variante".
- `igOn` / `waOn`: Estados dos interruptores dos canais.
- `uploaded`: URL em formato Base64 da imagem enviada pelo usuário.

## Lógica de Persistência e Upload

- **Carregamento inicial**: Lê o feriado selecionado do `sessionStorage` sob a chave `"ace.selectedHoliday"`. Se estiver vazio, usa o `DEFAULT_HOLIDAY` (Dia dos Namorados).
- **Recuperação de imagem**: Se o usuário já tiver enviado uma imagem anteriormente, ela é recuperada do `sessionStorage` sob a chave `"ace.uploadedImage"`.
- **Upload de arquivo**: Usa uma referência de input (`useRef<HTMLInputElement>`) para abrir o seletor nativo do sistema operacional. O arquivo é lido como uma string DataURL via `FileReader` e armazenado tanto no estado `uploaded` quanto no `sessionStorage`.

## Navegação

Ao clicar em **"Aprovar e publicar"**:
1. O índice da variante ativa é salvo em `sessionStorage` sob a chave `"ace.variant"`.
2. O usuário é redirecionado para a rota `/aprovar`.
