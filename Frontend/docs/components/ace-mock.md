# Módulos de Dados (ace-mock e holidays)

Esta seção documenta a lógica de geração de campanhas, conjuntos de dados mock e manipulação de datas sazonais estruturada nas bibliotecas auxiliares do projeto.

## 1. Módulo ace-mock

- **Caminho**: [src/lib/ace-mock.ts](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/lib/ace-mock.ts)
- **Propósito**: Armazena as definições estáticas do usuário logado, temas específicos de campanhas e funções utilitárias para geração de campanhas.

### Estruturas de Dados Exportadas

#### `ACE_USER`
Objeto estático contendo os dados do usuário logado demonstrativo para preenchimento de perfil no TopBar e mockups de chat.
- Propriedades: `name`, `firstName`, `company`, `today`.

#### `OPPORTUNITIES`
Vetor com os 3 principais feriados recomendados exibidos em destaque no sistema (Dia dos Namorados, Dia dos Pais e Black Friday).

#### `DEFAULT_HOLIDAY`
Objeto de feriado de fallback utilizado para preenchimento de estados quando nenhuma seleção foi feita na tela de Radar. Representa o feriado do Dia dos Namorados.

#### `HOLIDAY_THEMES`
Um dicionário (`Record<string, HolidayTheme>`) indexado pelo nome do feriado brasileiro. Cada entrada define a identidade visual e o conteúdo textual padrão que a IA deve assumir ao gerar a campanha.

```typescript
type HolidayTheme = {
  icon: string;       // Emoji temático representativo (ex: "🎄" para Natal)
  bg: string;         // Gradiente CSS linear (ex: linear-gradient(135deg, ...))
  tag: string;        // Texto de etiqueta promocional (ex: "Magia de Natal")
  headlines: string[];// Lista com as 3 opções de títulos geradas pela IA
  copies: string[];   // Lista com as 3 opções de textos de legenda contendo placeholders
  coupon: string;     // Código padrão de cupom (ex: "NATAL25")
  discount: string;   // Porcentagem de desconto (ex: "25% OFF")
}
```

### Funções Exportadas

#### `generateCampaignVariants(currentHoliday)`
Função utilitária que gera uma lista de variações criativas para a campanha com base no feriado fornecido.
- **Entrada**: Objeto de feriado.
- **Processamento**:
  - Obtém o tema correspondente em `HOLIDAY_THEMES`. Caso não exista, utiliza as configurações genéricas de `FALLBACK_THEME`.
  - Mapeia a lista de headlines do tema.
  - Para cada headline, processa o texto do copy correspondente, substituindo placeholders especiais (`{name}`, `{date}`, `{coupon}`, `{discount}`) pelos valores reais do feriado ativo.
- **Retorno**: Um array contendo objetos estruturados com `id`, `headline`, `copy`, `art` (bg, icon, tag), `discount` e `coupon` prontos para renderização em `ArtPreview` e mockups.

---

## 2. Módulo holidays

- **Caminho**: [src/lib/holidays.ts](file:///c:/Users/enzom/Documents/GitHub/ace-inova/frontend-next/src/lib/holidays.ts)
- **Propósito**: Gerencia a modelagem dos tipos de dados de feriados brasileiros e a integração de busca externa.

### Estruturas de Dados Exportadas

#### `Holiday`
Interface de modelagem oficial para representação de feriados no sistema.

```typescript
type Holiday = {
  id: string;
  data: string;  // Data no formato nacional "dd/mm/yyyy"
  nome: string;  // Nome por extenso
  tipo: string;  // Classificação geral
  escopo: "nacional" | "estadual" | "municipal";
  local?: string;// String opcional representando o local (Ex: "SP" ou "Curitiba/PR")
}
```

#### `UF_LIST` e `CITIES_BY_UF`
Dicionários de mapeamento estáticos contendo as principais Unidades Federativas do Brasil e suas respectivas cidades de maior relevância comercial. Usado para preencher filtros geográficos secundários.

### Funções Exportadas

#### `getHolidays(params)`
Função assíncrona executada no lado do servidor que faz o resgate de feriados.
- **Parâmetros**: `{ ano: number, uf?: string, city?: string }`
- **Fluxo de Execução**:
  1. Dispara uma requisição HTTP via `fetch` para a API Nager (`https://date.nager.at/api/v3/PublicHolidays/{ano}/BR`).
  2. A requisição utiliza a opção de revalidação de cache do Next.js configurada para `3600 segundos` (1 hora) para máxima eficiência e desempenho.
  3. Se a API estiver ativa, os feriados são filtrados e convertidos para o formato `Holiday`.
  4. Se a API falhar, o sistema ativa a lista interna de contingência `FALLBACK_NACIONAIS`.
  5. Se houver `uf` ou `city` passados como argumentos, mescla as respectivas datas das coleções estaduais e municipais do mock estático no retorno final.
- **Retorno**: Um objeto contendo `{ holidays: Holiday[], error: string | null }`.
