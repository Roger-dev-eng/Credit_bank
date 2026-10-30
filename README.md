# Gestão de Crédito

Este projeto é um aplicativo desktop para **Windows**, desenvolvido com **React e TypeScript**, backend em **Java 21 com Spring Boot** e integração nativa com **Tauri 2 e Rust**. Ele permite cadastrar clientes, simular operações de crédito, acompanhar contratos e registrar recebimentos. Os dados ficam em **SQLite no próprio computador**, e o aplicativo instalado funciona offline.

Para baixar o aplicativo: [Instaladores no GitHub Releases](https://github.com/Roger-dev-eng/Credit_bank/releases/latest).

## Conteúdo

- [Descrição](#descrição)
- [Funcionalidades](#funcionalidades)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Explicação dos principais componentes](#explicação-dos-principais-componentes)
- [Como instalar o aplicativo](#como-instalar-o-aplicativo)
- [Como executar localmente](#como-executar-localmente)
- [Como usar](#como-usar)
- [Dados, backups e cache](#dados-backups-e-cache)
- [Atualizações e publicação](#atualizações-e-publicação)
- [Testes automatizados](#testes-automatizados)
- [Privacidade e limites](#privacidade-e-limites)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [O que foi aprendido](#o-que-foi-aprendido)
- [Documentação complementar](#documentação-complementar)
- [Licença](#licença)

## Descrição

O sistema organiza o acompanhamento de operações de crédito em um fluxo de clientes, simulações, contratos e recebimentos. Cada cliente pode ter vários contratos independentes, com cronograma de vencimentos, saldo, encargos e histórico próprios.

As modalidades disponíveis são **parcela fixa flat** e **só juros**. Uma simulação não grava uma operação financeira: o contrato e suas parcelas são criados somente após a confirmação. Os cálculos e a persistência ficam no backend; a interface apresenta os resultados e permite registrar as operações.

## Funcionalidades

- Cadastro, edição, pesquisa e exclusão protegida de clientes.
- Abertura automática da simulação após cadastrar um cliente, já com ele selecionado.
- Simulação nas modalidades parcela fixa flat e só juros, com cálculo de parcela ou prazo e cronograma de vencimentos.
- Vários contratos por cliente, com identificação pelo nome e pesquisa por cliente, identificador, modalidade ou status.
- Registro de recebimentos integrais e parciais, com multa, mora e atualização do saldo por parcela.
- Estorno com justificativa, histórico preservado e proteção contra pagamentos duplicados.
- Prévia e confirmação de antecipação nas duas modalidades, conforme suas regras específicas.
- Extratos, histórico das operações, impressão e exportação em PDF.
- Exportação do banco com aviso de download iniciado e restauração validada de backups.
- Cache local das listas de clientes e dos resumos de contratos para agilizar a reabertura.
- Interface organizada com Atomic Design, componentes compartilhados e estados de foco e hover.
- Atualizações pelo próprio aplicativo, com assinatura verificada e backups anteriores à atualização e à migração.
- Instalador Windows com Java e WebView2 incluídos, compactação LZMA por arquivo e instalação offline.

As regras de pagamentos, encargos e antecipações estão detalhadas na [análise do protótipo e nas decisões financeiras](docs/analise-prototipo.md).

## Estrutura do projeto

```text
Credit_bank/
│
├── backend/
│   ├── src/main/java/app/credito/
│   │   ├── calculo/          # Fórmulas e cronogramas das simulações
│   │   ├── cliente/          # Cadastro e consulta de clientes
│   │   ├── contrato/         # Contratos, recebimentos e antecipações
│   │   ├── relatorio/        # Geração de relatórios
│   │   ├── config/           # Configuração e proteção da API local
│   │   └── shared/           # Recursos compartilhados
│   ├── src/main/resources/   # Configurações e migrações do banco
│   ├── src/test/             # Testes Java
│   └── pom.xml
│
├── frontend/
│   ├── src/components/       # Átomos, moléculas, organismos e templates
│   ├── src/features/         # Clientes, simulações, contratos e atualizações
│   ├── src/pages/            # Páginas e navegação
│   ├── src/services/         # Comunicação com a API e cache de consultas
│   ├── src/types/            # Tipos compartilhados
│   └── e2e/                 # Testes de navegador
│
├── desktop/src-tauri/
│   ├── src/                 # Host Rust, ponte IPC e atualizador
│   ├── installer/           # Template, imagens e aparência do NSIS
│   └── tauri.conf.json      # Configuração do aplicativo e do instalador
│
├── scripts/                 # Desenvolvimento, preparação e empacotamento
├── docs/                    # Arquitetura, regras, cache e atualizações
├── .github/workflows/       # Testes e publicação pelo GitHub Actions
├── LICENSE
└── README.md
```

## Explicação dos principais componentes

### `backend/`

Concentra os cálculos, as validações e as transações financeiras. O cadastro de clientes utiliza Spring Data JPA e Hibernate; os registros financeiros utilizam JdbcTemplate na mesma transação Spring. Valores monetários são armazenados em centavos inteiros, e o Flyway mantém as migrações do esquema.

Saldos e indicadores são calculados a partir dos registros de pagamentos, alocações, estornos e antecipações. A exclusão de clientes com contratos vinculados é protegida pelo sistema.

### `frontend/`

Contém a interface React, os formulários, a navegação e a apresentação dos resultados. Os componentes seguem a organização de Atomic Design, e o TanStack Query administra as consultas ao backend e o cache das listas.

O nome e a versão exibidos ficam em `frontend/src/config.ts`. Os estilos estão em `frontend/src/styles.css` e `frontend/tailwind.config.js`.

### `desktop/src-tauri/`

Integra a interface ao Windows, inicia o Java auxiliar e encerra esse processo ao fechar o aplicativo. A comunicação utiliza comandos IPC, com uma credencial gerada a cada execução. Esse componente também verifica atualizações e coordena a instalação dos pacotes assinados.

### `scripts/` e `.github/workflows/`

Preparam o backend, o runtime Java e os recursos do instalador. O GitHub Actions executa a validação automática e, quando uma versão é solicitada e identificada por tag, gera e publica os arquivos da atualização.

## Como instalar o aplicativo

1. Acesse a [página de Releases](https://github.com/Roger-dev-eng/Credit_bank/releases/latest).
2. Baixe o arquivo `Gestao-de-Credito-X.Y.Z-x64-instalador.exe` da versão desejada.
3. Execute o instalador e conclua a instalação.
4. Abra **Gestão de Crédito** pelo atalho criado e cadastre o primeiro cliente.

A instalação é por usuário, para Windows x64, e inclui Java e WebView2. Não é necessário instalar ferramentas de desenvolvimento para usar o aplicativo. O banco começa vazio em uma instalação sem dados anteriores.

Para compartilhar o sistema, envie o instalador ou o link da release. O banco do seu computador não faz parte do instalador.

## Como executar localmente

O desenvolvimento utiliza **Windows x64, JDK 21, Maven, Node.js e npm**. Para executar a versão nativa, também são necessários Rust stable com MSVC, Visual Studio Build Tools com C++ desktop e WebView2.

1. Clone o repositório:

```powershell
git clone https://github.com/Roger-dev-eng/Credit_bank.git
cd Credit_bank
```

2. Instale as dependências e compile o backend sem executar a suíte de testes local:

```powershell
npm --prefix frontend ci
npm --prefix desktop ci
mvn -B -ntp -f backend/pom.xml -DskipTests package
```

3. No mesmo terminal PowerShell, configure a sessão de desenvolvimento e inicie os serviços:

```powershell
$env:CREDITO_TOKEN = [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()
$env:CREDITO_DATA_DIR = Join-Path (Get-Location).Path '.dev/data'
$env:CREDITO_PORT = '18765'

$creditoBackend = Start-Process -FilePath 'java' -ArgumentList '-jar backend/target/credito-backend-0.1.0.jar' -WindowStyle Hidden -PassThru -ErrorAction Stop
try {
    npm --prefix frontend run dev
} finally {
    if (-not $creditoBackend.HasExited) {
        Stop-Process -Id $creditoBackend.Id
    }
}
```

Abra `http://127.0.0.1:1420`. Ao encerrar o Vite com `Ctrl+C`, o bloco de finalização encerra o Java iniciado para essa sessão. Os dados ficam em `.dev/data/`, separados da instalação real.

O JAR mantém o nome `credito-backend-0.1.0.jar` conforme a versão do módulo Maven; a versão do aplicativo desktop é definida separadamente.

Para desenvolvimento nativo, depois de preparar os recursos do Tauri, utilize `npm --prefix desktop run dev`. A preparação e a geração do instalador estão descritas na [documentação de build e publicação](docs/github-actions.md).

## Como usar

1. Em **Clientes**, clique em **Novo cliente** e preencha o cadastro. Ao salvar, a simulação abre com o cliente selecionado.
2. Em **Simulador**, escolha a modalidade e informe os valores da operação. Calcule e revise o cronograma antes de confirmar o contrato.
3. Em **Contratos**, pesquise pelo nome do cliente, identificador, modalidade ou status e abra a operação desejada.
4. No detalhe do contrato, consulte vencimentos e saldos, registre recebimentos ou utilize a prévia de antecipação. Para corrigir um recebimento, use estorno com justificativa.
5. Utilize a impressão ou o botão **PDF** para obter o extrato.
6. Em **Dados e segurança**, exporte o banco ou selecione um backup para restauração.
7. Em **Atualizações**, consulte a disponibilidade de uma nova versão.

Na modalidade parcela fixa, a antecipação registra um pagamento real nas últimas parcelas, sem desconto de juros. Em só juros, a antecipação altera o planejamento da quitação e elimina juros futuros; o recebimento do principal é registrado separadamente.

## Dados, backups e cache

O banco da versão instalada fica em:

```text
%LOCALAPPDATA%/app.credito.desktop/credito.db
```

Esse diretório é separado dos arquivos de instalação. Ele também contém os backups de segurança, o log do backend e os dados locais do WebView2.

Em **Dados e segurança → Exportar backup**, o sistema gera uma cópia consistente do SQLite e informa quando o download é iniciado. A restauração valida o arquivo e preserva uma cópia do banco anterior antes de substituí-lo.

As listas consultadas são guardadas no cache local por até 24 horas e atualizadas pelo backend ao reabrir. Histórico de pagamentos, extratos individuais e mutações pendentes não entram nesse cache. O SQLite continua sendo a fonte dos dados. Consulte [o funcionamento do cache](docs/cache.md).

## Atualizações e publicação

O aplicativo consulta o GitHub Releases ao iniciar e pela página **Atualizações**, no menu lateral. Quando existe uma versão mais nova, apresenta o aviso e as notas; o download e a instalação exigem confirmação.

Antes da instalação, o sistema verifica a assinatura, prepara a manutenção e gera um backup do banco. O diretório de dados é preservado durante a atualização. As instalações 0.1.0 precisam de uma atualização manual inicial, pois ainda não incluem o atualizador.

A distribuição utiliza [GitHub Releases](https://github.com/Roger-dev-eng/Credit_bank/releases). Para publicar uma nova versão, atualize os metadados e lockfiles, crie `docs/releases/X.Y.Z.md`, envie o código e a tag `vX.Y.Z`. O workflow **Versão Windows** valida a versão, executa os testes, compila, assina e verifica o pacote antes de publicar instalador, assinatura, manifesto e checksums.

O workflow também permite execução manual: por padrão gera artefatos; com a opção **Criar release rascunho**, prepara um rascunho para uma versão inédita. Releases existentes não são sobrescritas.

Geração de instalador, commits, envio ao GitHub e publicação são realizados somente quando solicitados. Alterações comuns ficam nos arquivos locais. Consulte [o processo do GitHub Actions](docs/github-actions.md), [a proteção das atualizações](docs/atualizacoes.md) e [o template do instalador](desktop/src-tauri/installer/README.md).

## Testes automatizados

Os testes são executados automaticamente no [GitHub Actions](https://github.com/Roger-dev-eng/Credit_bank/actions) a cada push na `main` e em pull requests. O fluxo de publicação também depende dessa validação.

A suíte Java cobre cálculos, operações financeiras, persistência e proteção de dados. Os testes de navegador utilizam Playwright e Edge para verificar os fluxos de clientes, contratos, pagamentos, backups, cache e atualização da interface. O pipeline também compila React e TypeScript; o fluxo de distribuição verifica a assinatura e o runtime Java incluído.

Os testes trabalham com bancos isolados no runner. Os relatórios ficam nos artefatos das execuções. Não é necessário executar a suíte neste computador para o fluxo normal do projeto.

## Privacidade e limites

- Clientes, contratos, pagamentos e backups permanecem no computador. A consulta de atualizações não envia esses registros ao GitHub.
- A API escuta apenas em loopback e utiliza uma credencial aleatória por execução, mantida fora do bundle JavaScript.
- O cache das listas fica no perfil local do WebView e não substitui o banco nem um backup exportado.
- Não há edição ou exclusão de contratos nem exclusão física de lançamentos financeiros. Correções de recebimentos utilizam estorno justificado, começando pelo mais recente da parcela.
- A restauração aceita backups com estrutura e checksums de migração compatíveis. Antes de substituir os dados, o sistema preserva uma cópia de segurança.
- As assinaturas do atualizador não substituem um certificado Authenticode. O instalador não possui assinatura digital de publicador do Windows configurada.
- A validação da instalação, desinstalação e troca completa de versões em Windows limpo continua necessária antes de distribuição ampla. Não foi realizada uma auditoria independente financeira ou de segurança.

## Tecnologias utilizadas

| Tecnologia | Função |
| --- | --- |
| **Java 21 e Spring Boot** | API local, validações e regras financeiras |
| **Spring Data JPA, Hibernate e JdbcTemplate** | Cadastro, consultas e transações no banco |
| **SQLite e Flyway** | Persistência local e migrações do esquema |
| **Apache PDFBox** | Geração de extratos em PDF |
| **Springdoc OpenAPI** | Documentação da API |
| **React e TypeScript** | Interface e tipagem do frontend |
| **Vite e Tailwind CSS** | Desenvolvimento, build e estilos |
| **Radix UI e componentes baseados em shadcn/ui** | Elementos de interface organizados com Atomic Design |
| **React Router e TanStack Query** | Navegação, consultas e cache |
| **React Hook Form e Zod** | Formulários e validação de dados |
| **Tauri 2 e Rust** | Host desktop, comunicação IPC e atualização |
| **jlink e WebView2** | Runtimes incluídos na distribuição Windows |
| **NSIS e LZMA** | Instalação e compactação do pacote |
| **JUnit, Spring Boot Test e Playwright** | Testes automatizados de backend e interface |
| **GitHub Actions e Releases** | Validação e distribuição das versões |

## Documentação complementar

- [Análise do protótipo e regras financeiras](docs/analise-prototipo.md)
- [Arquitetura, segurança e API](docs/arquitetura.md)
- [Organização com Atomic Design](docs/atomic-design.md)
- [Cache das listas](docs/cache.md)
- [Atualizações e preservação do banco](docs/atualizacoes.md)
- [GitHub Actions e publicação](docs/github-actions.md)
- [Template e compactação do instalador](desktop/src-tauri/installer/README.md)
- [Notas das versões](docs/releases/)

## Licença

O código deste projeto utiliza a [licença MIT](LICENSE). As bibliotecas e os runtimes utilizados possuem suas próprias licenças.
