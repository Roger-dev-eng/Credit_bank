# Gestão de Crédito

Aplicativo Windows para simular, confirmar e acompanhar operações de crédito, com React/TypeScript, backend Java 21, SQLite e Tauri 2. Sem marca comercial, seeds ou importação de localStorage.

**Versão 0.4.1:** compactação LZMA por arquivo para reduzir o instalador, mantendo os componentes offline. Mantém as melhorias da 0.4.0: confirmação de exportação do banco, cache das listas na reabertura e navegação sem os textos “Armazenamento local” e “Uso local · BRL”. Consulte [o funcionamento do cache](docs/cache.md). Mantém a interface organizada com [Atomic Design](docs/atomic-design.md), cadastro direcionado à simulação, identificação e busca de contratos, estados de hover/foco e página Atualizações no menu lateral. Mantém as atualizações assinadas com backup e preservação do SQLite. Consulte [o funcionamento e a publicação de versões](docs/atualizacoes.md). A versão 0.2.0 já pode receber esta versão pelo próprio aplicativo; a 0.1.0 requer instalação manual.

A [release pública 0.2.0](https://github.com/Roger-dev-eng/Credit_bank/releases/tag/v0.2.0) já foi publicada. O manifesto foi acessado sem autenticação, o SHA256 do pacote remoto coincide com o pacote local assinado, e a consulta pela versão Windows 0.2.0 retornou que ela já está atualizada.

A [release pública 0.3.0](https://github.com/Roger-dev-eng/Credit_bank/releases/tag/v0.3.0) contém os ajustes de interface e navegação. Seu manifesto público e o SHA256 do instalador publicado foram conferidos. A assinatura é da mesma chave de atualização da 0.2.0; bancos e código-fonte não foram enviados na publicação.

O instalador atual está em [dist/windows/Gestao-de-Credito-0.3.0-x64-instalador.exe](dist/windows/Gestao-de-Credito-0.3.0-x64-instalador.exe), acompanhado da assinatura e do [SHA256](dist/windows/SHA256SUMS.txt). A pasta contém também `latest.json` e o código-fonte local em `Gestao-de-Credito-0.3.0-fonte.zip`. Os binários são artefatos locais ignorados pelo Git; o código e os scripts permitem recriá-los. Os arquivos de versões anteriores são mantidos como histórico.

## Funcionalidades

- Cadastro, edição, busca e exclusão protegida de clientes.
- Após o cadastro, simulação aberta automaticamente com o cliente selecionado; edição mantém a página de clientes.
- Vários contratos independentes por cliente, nas modalidades parcela fixa flat e só juros.
- Nome do cliente na listagem de contratos e pesquisa por nome, identificador, modalidade ou status, ignorando acentos e caixa.
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

## Build local opcional para desenvolvimento

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-windows.ps1
```

Esse processo executa os testes Java, prepara o JAR e um runtime jlink, instala dependências com os lockfiles e gera o instalador NSIS em `desktop/src-tauri/target/release/bundle/nsis/`. Inclui o instalador offline WebView2, por isso o arquivo é maior e a primeira compilação requer downloads. O aplicativo instalado funciona offline.

O runtime existente é reutilizado. Para trocar a versão do JDK, renomeie `desktop/src-tauri/resources/runtime` antes de preparar novamente. `scripts/build-windows.ps1` também reconhece o Rust isolado em `.dev/rust/` utilizado nesta implementação, sem mudar o PATH permanente do Windows.

O instalador e o desinstalador usam o mesmo ícone do aplicativo, com resoluções adicionais de 128 e 256 pixels para as visualizações do Explorador. O visual NSIS é personalizado em `desktop/src-tauri/installer/appearance.nsh`, com Segoe UI e cores do sistema. A lateral contém somente INSTALAÇÃO e o ícone; as imagens são geradas em resolução 3x por `scripts/installer-artwork.ps1`. `scripts/installer-icon.mjs` prepara as resoluções do ICO. Ambos são executados na preparação do desktop.

O template oficial do Tauri 2.12.5 é mantido em `desktop/src-tauri/installer/template.nsi`, com uma única alteração: compactação LZMA por arquivo, sem `/SOLID`, para evitar percorrer os runtimes grandes durante a extração dos componentes iniciais da interface. A lógica de instalação, atualização e a verificação de integridade são preservadas. Detalhes da origem e manutenção estão em `desktop/src-tauri/installer/README.md`. A primeira abertura ainda pode variar conforme a verificação do Windows, a sincronização do OneDrive e o disco.

Para depurar Tauri depois de preparar os recursos:

```powershell
npm --prefix desktop run dev
```

O banco desktop fica em `%LOCALAPPDATA%/app.credito.desktop/credito.db`, fora da instalação. Backups de segurança anteriores à restauração ficam na subpasta `backups`. A pasta contém também `backend.log` e os dados locais do WebView2.

## Testes e publicação no GitHub Actions

Os testes Java, React/TypeScript e de navegador são executados no GitHub a cada push na main e em pull requests. Não é necessário executá-los neste computador. Os relatórios ficam na execução do Actions.

Para distribuir uma nova versão, atualize os metadados e notas, envie o código e a tag vX.Y.Z. O workflow testa, compila e assina o instalador Windows, verifica a assinatura e publica os quatro arquivos da atualização no GitHub Releases. O script local de publicação foi removido. A execução manual pode gerar apenas artefatos ou, para versão inédita, um rascunho de release.

Consulte [a configuração, os Secrets e o processo de release](docs/github-actions.md) e acompanhe [as execuções no GitHub](https://github.com/Roger-dev-eng/Credit_bank/actions). Os scripts de build permanecem como ferramentas internas do runner e para desenvolvimento opcional.

## Limites da versão

- Não há edição/exclusão de contratos ou exclusão física de lançamentos financeiros. Correções de recebimentos utilizam estorno justificado, começando pelo mais recente da parcela.
- Antecipação de só juros altera o planejamento, sem registrar pagamento. O principal é recebido em operação separada.
- A restauração aceita backups desta versão do esquema com checksums Flyway compatíveis. Faça backup antes de atualizar versões futuras.
- Não há assinatura digital do instalador configurada. Validação em uma máquina Windows limpa/VM e testes de instalação/desinstalação nesse ambiente continuam necessários antes de distribuição ampla.
- Testes de navegador verificam os fluxos financeiros; a abertura nativa verifica IPC e ciclo do processo. Não foi realizada uma auditoria independente financeira ou de segurança.

O canal de atualização consulta GitHub Releases por HTTPS e baixa somente pacotes assinados. Clientes, contratos, pagamentos e backups permanecem locais. A troca completa de versão via instalador ainda deve ser validada em Windows limpo/VM antes de distribuição ampla.
