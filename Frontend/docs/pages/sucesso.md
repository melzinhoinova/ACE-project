# SucessoPage (/sucesso)

O dashboard final de celebração e métricas de resultados de vendas da campanha.

## Detalhes Técnicos

- **Rota**: `/sucesso` (mapeada em [src/app/sucesso/page.tsx](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/app/sucesso/page.tsx))
- **Tipo**: Client Component (`"use client"`)
- **Layout**: Inclui o [TopBar](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/components/ace/TopBar.tsx).

## Componentes Internos e Locais

- **Metric**: Card individual de métrica (Alcance, Cliques, Conversões).
  - A métrica de conversão destacada (`highlight`) ganha uma borda gradiente animada via classe `.animate-gradient-shift`.
- **Compartilhamento**: Um modal flutuante que oferece opções rápidas de compartilhamento (Slack, E-mail, Link de snapshot).

## Custom Hook: `useCounter`

Para proporcionar um efeito visual premium, a contagem dos dados inicia em 0 e cresce gradualmente até o valor final. Isso é gerenciado pelo hook customizado `useCounter(target, duration)`:

- **Funcionamento**: Usa a API nativa do browser `requestAnimationFrame` para calcular a evolução temporal com base em uma curva de atenuação cúbica (easing cúbico: `1 - Math.pow(1 - p, 3)`), garantindo que os números desacelerem elegantemente à medida que se aproximam do valor final.
- **Duração**: É parametrizada de forma que as métricas concluam o carregamento em tempos ligeiramente diferentes (Alcance: 1400ms, Cliques: 1800ms, Conversões: 2000ms), gerando um fluxo de animação muito mais agradável e natural.

## Lógica de Conversão e Cálculo

As métricas são calculadas de forma dinâmica e proporcional com base no público do feriado ativo (`sessionStorage("ace.selectedHoliday")`):
- **Alcance**: É igual ao tamanho da audiência (`audience`).
- **Cliques**: Simula uma taxa de clique (CTR) de `7%` sobre o alcance.
- **Conversões**: Simula uma taxa de conversão final de `1.8%` sobre o alcance.
- **Receita estimada**: Multiplica a quantidade de conversões pelo valor numérico do ticket médio do feriado (extraído usando expressão regular para remover símbolos monetários não-numéricos).
