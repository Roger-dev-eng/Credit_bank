# Atomic Design

A interface organiza os componentes compartilhados por responsabilidade:

| Camada | Componentes | Responsabilidade |
|---|---|---|
| Átomos | `Button`, `Input`, `Card`, `StatusBadge` | Elementos básicos, aparência, acessibilidade e estados interativos. Sem acesso à API. |
| Moléculas | `SearchField`, `PageHeading`, `ContractRow`, `Modal`, `Feedback` | Composição de elementos básicos para uma interação ou informação. Recebem dados por propriedades. |
| Organismos | `Sidebar`, `AppHeader`, `ContractList`, `Financeiro` | Blocos completos de navegação, listagem e informação financeira. |
| Templates | `WorkspaceLayout` | Estrutura da área administrativa com menu, cabeçalho e conteúdo. |
| Páginas e features | `pages/` e `features/` | Rotas, formulários, consultas, mutações e composição dos blocos com dados reais. |

Os componentes ficam em `frontend/src/components/{atoms,molecules,organisms,templates}`. Regras de negócio e requisições ficam nas features; cálculos financeiros continuam no backend. Atomic Design não significa criar um componente para cada tag HTML: a extração acompanha responsabilidade e reutilização.

As cores de interação e duração das transições são tokens CSS (`--interactive-hover`, `--interactive-focus`, `--transition-interactive`). Links de contratos compartilham o mesmo componente e os mesmos estados de hover/foco, inclusive na página do cliente. Os componentes de formulário preservam navegação por teclado e nomes acessíveis.

O instalador é nativo NSIS e utiliza os mesmos elementos visuais básicos (ícone, cores e tipografia), com imagens produzidas em resolução 3x. A lateral contém somente INSTALAÇÃO e o ícone, agrupados no centro horizontal e vertical.

Na versão 0.3.0, o backend acrescenta `cliente_nome` à representação do contrato sem alterar o esquema SQLite. A busca da carteira filtra os contratos carregados, por nome, UUID, modalidade e status, com normalização de caixa e acentos. O cadastro novo retorna o UUID persistido para navegar à simulação; a edição do cliente mantém a rota atual. A área de atualização utiliza `/atualizacoes`, independente de `/configuracoes`.

Validação: build React/TypeScript e Tauri aprovados, 27 testes Java e 7 testes Edge aprovados. A listagem foi inspecionada visualmente com fixtures isoladas; a imagem lateral gerada também foi inspecionada. A release 0.3.0 foi assinada e publicada, e o manifesto público e o hash do pacote remoto foram conferidos.
