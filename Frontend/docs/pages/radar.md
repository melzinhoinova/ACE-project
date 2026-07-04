# RadarPage (/radar)

O painel de controle principal do ACE. Exibe um calendário interativo e as próximas oportunidades sazonais baseadas em feriados oficiais, permitindo iniciar a geração de campanhas.

## Detalhes Técnicos

- **Rota**: `/radar` (mapeada em [src/app/radar/page.tsx](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/app/radar/page.tsx))
- **Tipo**: Client Component (`"use client"`)
- **Layout**: Inclui o [TopBar](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/components/ace/TopBar.tsx) no topo da página.

## Componentes Internos e Locais

- **FeaturedCard**: Componente em destaque no topo que renderiza os dados da oportunidade atualmente selecionada (nome, data, escopo, dias restantes).
- **CalendarGrid**: Grade de calendário do mês atual. As células são coloridas e estilizadas com base no nível de pontuação (`score`) de cada feriado. Contém controles para navegar entre os meses.
- **UpcomingList**: Uma lista vertical à direita que exibe as próximas 10 datas sazonais futuras ordenadas de forma iminente.

## Lógica de Estado e Dados

- `holidays`: Lista de feriados obtidos por meio da rota `/api/holidays`.
- `loading`: Estado booleano de carregamento da API.
- `error`: Mensagem de erro caso a API de feriados falhe.
- `selectedId`: ID do feriado selecionado. Se for `null`, o feriado mais próximo (`hot`) é exibido por padrão.
- `monthOffset`: Indica o mês de visualização em relação ao mês atual (controlado por botões anterior/próximo).

### Enriquecimento de Dados (`enrich`)

A função local `enrich` combina os dados crus retornados pela API com metadados estáticos (`META`) definindo:
- **Pontuação (Score)**: Grau de relevância da oportunidade sazonal (ex: Dia dos Namorados = 94).
- **Alcance estimado**: Quantidade estimada de contatos impactados.
- **Ticket médio**: Valor médio do produto/serviço.
- **Canais sugeridos**: Redes onde a publicação terá maior impacto (ex: Instagram, WhatsApp).

Se um feriado não possuir metadados pré-configurados, a função gera valores pseudorandômicos determinísticos usando uma função hash baseada no nome e data do feriado, garantindo consistência na interface.

## Navegação

Ao clicar em **"Gerar campanha agora"**:
1. O feriado selecionado é salvo como string JSON em `sessionStorage` sob a chave `"ace.selectedHoliday"`.
2. O usuário é redirecionado para a rota `/gerador`.
