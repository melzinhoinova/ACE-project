# AprovarPage (/aprovar)

O checkpoint final antes da publicação. Permite revisar os detalhes da campanha, configurar o agendamento de data/hora e ativar o modo de publicação autônomo.

## Detalhes Técnicos

- **Rota**: `/aprovar` (mapeada em [src/app/aprovar/page.tsx](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/app/aprovar/page.tsx))
- **Tipo**: Client Component (`"use client"`)
- **Layout**: Inclui o [TopBar](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/components/ace/TopBar.tsx).

## Componentes Internos e Locais

- **SummaryRow**: Uma linha estilizada que exibe um ícone à esquerda, o label da informação no centro e o valor configurado à direita. Usado para organizar os dados da campanha de forma escaneável.

## Estado Local e Computado

- `autonomous`: Estado booleano que define se a publicação será executada sem validação manual adicional.
- `loading`: Controla a animação de carregamento ao disparar a ativação da campanha.
- `holiday`: O feriado ativo recuperado de `"ace.selectedHoliday"`.
- `variantIndex`: O índice da variante selecionada recuperado de `"ace.variant"`.
- `activeVariant` (computado): A variante textual/visual correspondente extraída de `generateCampaignVariants(holiday)`.
- `preHolidayDate` (computado): Calcula automaticamente uma data 2 dias antes do feriado de campanha, convertendo o formato brasileiro `dd/mm/yyyy` para manipulação em um objeto Date e formatando-o de volta.

## Fluxo de Interação

1. **Modo Autônomo**: Quando ativado (`autonomous === true`), o card de agendamento adquire uma borda animada com o gradiente da marca do ACE. Quando desativado, a borda torna-se cinza fosca neutra.
2. **Inputs de Agendamento**: O usuário pode preencher a data sugerida (padrão de 2 dias antes do feriado) e a hora desejada.
3. **Botão de Ativação**:
   - Ao clicar em "Publicar Campanha", o estado `loading` torna-se `true`, mudando o texto do botão e exibindo um spinner.
   - Após `1100ms`, o usuário é redirecionado para a rota `/feed`.
