# Gestão de Crédito

Aplicativo Windows para simular, confirmar e acompanhar operações de crédito, com React/TypeScript, backend Java 21, SQLite e Tauri 2. Sem marca comercial, seeds ou importação de localStorage.

**Versão 0.2.0:** atualizações assinadas pela internet no próprio programa, com confirmação, progresso, backup automático e preservação do SQLite. Consulte [o funcionamento e a publicação de versões](docs/atualizacoes.md). Quem utiliza 0.1.0 precisa instalar 0.2.0 uma vez manualmente para habilitar o recurso.

A [release pública 0.2.0](https://github.com/Roger-dev-eng/Credit_bank/releases/tag/v0.2.0) já foi publicada. O manifesto foi acessado sem autenticação, o SHA256 do pacote remoto coincide com o pacote local assinado, e a consulta pela versão Windows 0.2.0 retornou que ela já está atualizada.

O instalador atual está em [dist/windows/Gestao-de-Credito-0.2.0-x64-instalador.exe](dist/windows/Gestao-de-Credito-0.2.0-x64-instalador.exe), aproximadamente 303 MiB, acompanhado da assinatura e do [SHA256](dist/windows/SHA256SUMS.txt). A pasta contém também `latest.json` e o código-fonte auditável da compilação em `Gestao-de-Credito-0.2.0-fonte.zip`. Os binários são artefatos locais ignorados pelo Git; o código e os scripts permitem recriá-los. Os arquivos 0.1.0 anteriores não têm o mecanismo de atualização.

## Funcionalidades

- Cadastro, edição, busca e exclusão protegida de clientes.
- Vários contratos independentes por cliente, nas modalidades parcela fixa flat e só juros.
- Simulações sem persistência; cálculo de parcela ou prazo; cronograma com vencimentos ancorados e resíduos monetários na última amortização.
- Recebimentos integrais e parciais, multa/mora, saldo por parcela, indicadores e quitação derivados dos registros.
- Estorno com justificativa, histórico preservado e proteção contra recebimentos duplicados.
- Antecipação fixa como pagamento real nas últimas parcelas; alteração planejada de quitação em só juros com eliminação de juros futuros e proteção dos pagamentos anteriores.
- Prévia e confirmação de antecipação; extratos, histórico, impressão e exportação PDF.
- Backup SQLite consistente e restauração validada, com cópia automática anterior à substituição.
- API local em loopback, token por execução e comunicação desktop via IPC.
- Atualizações via GitHub Releases, assinatura verificada antes de instalar, bloqueio temporário de lançamentos e backups anteriores à atualização/migração.

## Estrutura

```text
backend/     Spring Boot, regras financeiras, migração SQLite, testes e OpenAPI
frontend/    React, TypeScript, Vite, Tailwind, componentes shadcn/ui, Router,
             TanStack Query, React Hook Form e Zod
desktop/     Tauri 2, ponte IPC, processo Java auxiliar e instalador NSIS
scripts/     desenvolvimento, preparação jlink, build e validação do runtime
docs/        análise do protótipo, decisões financeiras e arquitetura
```

Leia [a análise e as regras aprovadas](docs/analise-prototipo.md) e [a arquitetura/API](docs/arquitetura.md). O nome temporário está centralizado em `frontend/src/config.ts`; cores estão em `frontend/src/styles.css` e `tailwind.config.js`. Metadados nativos ficam em `desktop/src-tauri/tauri.conf.json` e o cabeçalho PDF no backend.

## Desenvolvimento no Windows

Requer JDK 21, Maven, Node.js e npm. Para desktop, também Rust stable MSVC, Visual Studio Build Tools com C++ desktop e WebView2. A instalação final inclui os runtimes necessários; o usuário final não precisa instalar ferramentas de desenvolvimento.

```powershell
npm --prefix frontend ci
npm --prefix desktop ci
powershell -ExecutionPolicy Bypass -File scripts/dev.ps1
```

O script compila/testa o backend, gera uma credencial aleatória para a sessão e inicia Java e Vite em `http://127.0.0.1:1420`. Ao sair do Vite, encerra o Java. Os dados de desenvolvimento ficam em `.dev/data/`, separados da instalação real.

Para iniciar apenas o backend:

```powershell
$env:CREDITO_TOKEN = [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()
$env:CREDITO_DATA_DIR = Join-Path $env:LOCALAPPDATA 'GestaoCredito'
$env:CREDITO_PORT = '18765'
mvn -f backend/pom.xml package
java -jar backend/target/credito-backend-0.1.0.jar
```

A primeira execução cria o diretório e aplica Flyway automaticamente. O banco começa vazio. Reabrir utiliza os mesmos dados. Nunca grave o banco na pasta de instalação ou em um diretório temporário.

## Compilar o desktop e o instalador

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-windows.ps1
```

Esse processo executa os testes Java, prepara o JAR e um runtime jlink, instala dependências com os lockfiles e gera o instalador NSIS em `desktop/src-tauri/target/release/bundle/nsis/`. Inclui o instalador offline WebView2, por isso o arquivo é maior e a primeira compilação requer downloads. O aplicativo instalado funciona offline.

O runtime existente é reutilizado. Para trocar a versão do JDK, renomeie `desktop/src-tauri/resources/runtime` antes de preparar novamente. `scripts/build-windows.ps1` também reconhece o Rust isolado em `.dev/rust/` utilizado nesta implementação, sem mudar o PATH permanente do Windows.

O instalador e o desinstalador usam o mesmo ícone do aplicativo, com resoluções adicionais de 128 e 256 pixels para as visualizações do Explorador. O visual NSIS é personalizado em `desktop/src-tauri/installer/appearance.nsh`, com Segoe UI e cores do sistema. A lateral contém somente INSTALAÇÃO e o ícone; as imagens são geradas em resolução 3x por `scripts/installer-artwork.ps1`. `scripts/installer-icon.mjs` prepara as resoluções do ICO. Ambos são executados na preparação do desktop.

O template oficial do Tauri 2.12.5 é mantido em `desktop/src-tauri/installer/template.nsi`, com uma única alteração: compressão zlib por arquivo, sem `/SOLID`, para evitar percorrer os runtimes grandes durante a extração dos componentes iniciais da interface. A lógica de instalação, atualização e a verificação de integridade são preservadas. Detalhes da origem e manutenção estão em `desktop/src-tauri/installer/README.md`. A primeira abertura ainda pode variar conforme a verificação do Windows, a sincronização do OneDrive e o disco.

Para depurar Tauri depois de preparar os recursos:

```powershell
npm --prefix desktop run dev
```

O banco desktop fica em `%LOCALAPPDATA%/app.credito.desktop/credito.db`, fora da instalação. Backups de segurança anteriores à restauração ficam na subpasta `backups`. A pasta contém também `backend.log` e os dados locais do WebView2.

## Executar os testes

```powershell
mvn -f backend/pom.xml test
npm --prefix frontend run build
# Requer backend/target/credito-backend-0.1.0.jar e Edge instalado:
npm --prefix frontend run test:e2e
# Requer scripts/prepare-desktop.ps1 executado:
node scripts/runtime-smoke.mjs
```

Os testes Java utilizam bancos temporários exclusivos. Os testes de navegador criam bancos isolados em `.dev/e2e-*`, sem inserir dados na carteira de produção. O servidor de teste usa as portas 1421 e 18766; o teste do runtime usa 18767.

Validações executadas durante a implementação:

- 26 testes Java aprovados: os 24 casos financeiros existentes, mais manutenção da atualização com backup/bloqueio de gravações e migração de esquema preservando registros e backup anterior.
- Build TypeScript/Vite de produção aprovado.
- Cinco testes de navegador Edge aprovados: os dois fluxos financeiros existentes e três cenários da interface de atualização (confirmação, falha de instalação/assinatura, versão atualizada e indisponibilidade da internet). Os comandos nativos do updater são simulados somente nesses três testes de interface.
- Compilação Rust/Tauri aprovada.
- Runtime jlink exercitado com criação de banco vazio, API protegida e OpenAPI.
- Abertura nativa do executável Windows verificada com consulta real ao backend e carteira vazia. Caminhos Windows estendidos são normalizados antes de passar o JAR ao Java.
- Instalador NSIS `.exe` efetivamente gerado, com Java e WebView2 offline incluídos. Conteúdo extraído e conferido; aplicativo extraído abriu com banco vazio. Encerramento normal do Java auxiliar foi verificado.
- O JAR do instalador final foi conferido por SHA256; o executável extraído coincide com a compilação após o marcador de tipo de bundle NSIS aplicado pelo Tauri.

## Limites da versão

- Não há edição/exclusão de contratos ou exclusão física de lançamentos financeiros. Correções de recebimentos utilizam estorno justificado, começando pelo mais recente da parcela.
- Antecipação de só juros altera o planejamento, sem registrar pagamento. O principal é recebido em operação separada.
- A restauração aceita backups desta versão do esquema com checksums Flyway compatíveis. Faça backup antes de atualizar versões futuras.
- Não há assinatura digital do instalador configurada. Validação em uma máquina Windows limpa/VM e testes de instalação/desinstalação nesse ambiente continuam necessários antes de distribuição ampla.
- Testes de navegador verificam os fluxos financeiros; a abertura nativa verifica IPC e ciclo do processo. Não foi realizada uma auditoria independente financeira ou de segurança.

O canal de atualização consulta GitHub Releases por HTTPS e baixa somente pacotes assinados. Clientes, contratos, pagamentos e backups permanecem locais. A troca completa de versão via instalador ainda deve ser validada em Windows limpo/VM antes de distribuição ampla.

