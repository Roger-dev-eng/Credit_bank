# Atualizações pela internet

A partir da versão 0.2.0, o aplicativo consulta o manifesto público em:

`https://github.com/Roger-dev-eng/Credit_bank/releases/latest/download/latest.json`

Há consulta ao iniciar o aplicativo e um botão em **Dados e segurança → Atualizações do sistema**. Quando existe uma versão mais nova, o programa mostra um aviso e as notas. Baixar e instalar exige confirmação; indisponibilidade da internet não bloqueia o trabalho offline. Nenhum cliente, contrato, pagamento ou backup é enviado ao GitHub.

## Preservação do banco

O identificador `app.credito.desktop` e o diretório de dados não mudam entre versões. O SQLite continua em `%LOCALAPPDATA%/app.credito.desktop/credito.db`. O pacote distribui somente executáveis, JAR, runtime e recursos. O script de release recusa recursos que contenham arquivos de banco.

Sequência de instalação:

1. Baixar o pacote por HTTPS e verificar sua assinatura com a chave pública embutida.
2. Bloquear novas gravações no host desktop e preparar a manutenção no backend.
3. Criar um backup consistente em `backups/antes-atualizacao-*.db`. Se o backup falhar, cancelar a instalação e liberar a manutenção.
4. Encerrar e aguardar o processo Java antes de o Windows executar o instalador.
5. Executar o instalador em modo de atualização, com progresso, e reabrir o aplicativo.
6. Se houver migrações pendentes sobre banco existente, criar `backups/antes-migracao-*.db` antes de aplicar as migrações Flyway.

O NSIS utiliza `/UPDATE`; o trecho de remoção opcional de dados na desinstalação é condicionado a **não** estar atualizando. Não há cópia de banco vazio, importação automática ou restauração automática durante a atualização. Migrações preservam dados e precisam ser testadas antes de publicar; o sistema não promete recuperar sozinho uma migração de negócio incorreta. Downgrade do instalador é recusado.

## Assinatura e chave privada

A chave pública é distribuída no `tauri.conf.json`. A chave privada cifrada fica somente em `.signing/signing.key`, e sua senha é protegida pela conta Windows via DPAPI em `.signing/signing.password.dpapi`. `.signing/` está no `.gitignore` e não entra nos recursos do aplicativo.

**Preserve essa pasta em backup seguro.** Não gere outra chave ao publicar atualizações deste aplicativo. O DPAPI depende da conta/máquina Windows: para preparar outra máquina de publicação, será necessário transferir a chave cifrada e sua senha por um canal seguro e configurar `TAURI_SIGNING_PRIVATE_KEY` e `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. Não coloque credenciais, a chave privada ou sua senha no GitHub público ou dentro do instalador.

Essas assinaturas são para o mecanismo de atualização e não substituem um certificado Authenticode do Windows.

## Publicação manual de novas versões

1. Alterar a versão de forma consistente em `desktop/src-tauri/tauri.conf.json`, `desktop/src-tauri/Cargo.toml`, `desktop/package.json`, `frontend/package.json` e `frontend/src/config.ts`; atualizar os lockfiles.
2. Criar as notas em `docs/releases/VERSAO.md`. Criar/testar migrações aditivas, quando necessárias. Versionar o código correspondente no repositório antes de publicar uma release para distribuição.
3. Executar `scripts/build-windows.ps1`. Ele testa o backend, gera o runtime/pacote assinado e prepara `dist/windows/latest.json`, instalador, `.sig` e checksums.
4. `node scripts/verify-release.mjs` verifica a assinatura do pacote, a dos metadados e testa a rejeição de adulteração.
5. `node scripts/publish-release.mjs` cria uma release **rascunho**, com os arquivos. `node scripts/publish-release.mjs --publish` cria e publica diretamente depois das verificações. Usa `GH_TOKEN`/`GITHUB_TOKEN` do ambiente ou a credencial GitHub já configurada no Git Credential Manager, somente no computador de publicação.

O script recusa repositório privado e não substitui pacotes de uma versão já publicada. Uma credencial de publicação nunca é embutida no aplicativo. O arquivo `*-fonte.zip` gerado na preparação captura o código local, excluindo banco, runtimes, chave privada e credenciais; ele permanece apenas local e não é enviado pelo script de publicação. O canal público recebe somente instalador, assinatura, manifesto e checksums. O ZIP automático do GitHub corresponde ao commit/tag do repositório. Para promover um rascunho criado anteriormente, publique-o pela interface do GitHub após revisão.

As instalações 0.1.0 precisam receber o instalador 0.2.0 uma vez manualmente, pois ainda não tinham o updater. A partir daí, versões futuras podem ser instaladas pelo próprio programa.

## Validação da primeira publicação

Release 0.2.0 publicada em 28/10/2026. O manifesto é acessível publicamente sem credencial; a assinatura e a versão assinada foram verificadas localmente, um pacote adulterado foi rejeitado e o SHA256 informado pelo GitHub coincide com o instalador local. O aplicativo Windows 0.2.0 abriu com o diretório de dados existente e consultou o canal real, indicando versão atualizada. Foram aprovados 26 testes Java e 5 testes de navegador; os três testes da UI do updater usam IPC simulado. Não foi executada uma troca completa de versão em Windows limpo/VM nesta sessão.

Referências: [Updater oficial do Tauri](https://v2.tauri.app/plugin/updater/), [formato de assinaturas Minisign](https://github.com/jedisct1/minisign/blob/master/src/minisign.c).
