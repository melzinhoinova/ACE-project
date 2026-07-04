# Utilitários e Animações Customizadas

Esta seção cataloga as classes utilitárias e as animações declaradas na camada de infraestrutura CSS do ACE.

## 1. Classes Utilitárias Customizadas (`@layer utilities`)

As classes abaixo abstraem composições de estilos complexas para facilitar a reutilização rápida.

| Classe CSS | Propriedades Aplicadas | Comportamento Visual |
|---|---|---|
| `.text-gradient-brand` | `background: var(--gradient-brand); background-clip: text; color: transparent;` | Aplica o gradiente roxo→azul sobre o preenchimento das letras do texto |
| `.bg-gradient-brand` | `background: var(--gradient-brand);` | Aplica o gradiente roxo→azul como cor sólida de fundo |
| `.border-gradient-brand`| `border: 1px solid transparent; background: linear-gradient(var(--card), var(--card)) padding-box, var(--gradient-brand) border-box;` | Cria uma borda de 1px preenchida pelo gradiente da marca, mantendo o fundo do card opaco |
| `.glow-brand` | `box-shadow: var(--shadow-glow);` | Aplica a sombra de brilho luminoso roxo ao redor do elemento |
| `.shadow-card` | `box-shadow: var(--shadow-card);` | Aplica a sombra preta difusa profunda de elevação de card |
| `.card-surface` | `background: var(--card); border: 1px solid oklch(1 0 0 / 0.06); box-shadow: var(--shadow-card);` | Atalho para criar um card escuro completo com borda sutil e sombra |
| `.bg-gradient-brand-soft` | `background: var(--gradient-brand-soft);` | Aplica o gradiente suave como cor de fundo |

---

## 2. Animações Customizadas

O ACE possui 4 animações fluidas para dar dinamismo às interações.

### Anel de Pulso (`pulse-ring`)
Cria um anel circular luminoso de roxo que se expande a partir do elemento e desaparece, simulando atividade constante.
- **Classe**: `.animate-pulse-ring`
- **Duração**: `2s` (infinito, curva bezier customizada).
- **Caso de Uso**: Sinal de atividade em tempo real na tela de Feed.

### Efeito Shimmer (`shimmer`)
Desloca uma luz sutil horizontalmente ao longo de uma superfície escura.
- **Classe**: `.shimmer`
- **Duração**: `1.6s` (infinito, linear).
- **Caso de Uso**: Placeholders de carregamento de dados (Skeleton Loading) nas telas de Radar e Gerador.

### Entrada Suave (`float-up`)
Faz com que o elemento comece levemente translúcido e 12px abaixo de sua posição final, subindo suavemente enquanto ganha opacidade.
- **Classe**: `.animate-float-up`
- **Duração**: `0.5s` (ease-out).
- **Caso de Uso**: Efeito de entrada de cards, títulos e telas inteiras de forma escalonada.

### Deslocamento de Gradiente (`gradient-shift`)
Desloca suavemente as coordenadas de um gradiente grande (200% de largura) para criar uma sensação de fundo fluido e vivo.
- **Classe**: `.animate-gradient-shift`
- **Duração**: `8s` (infinito, ease).
- **Caso de Uso**: Fundos de cards selecionados, modais e botões destacados de publicação.
