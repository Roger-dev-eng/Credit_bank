# GitHub Actions

O processo oficial de validação e distribuição passa a ocorrer no GitHub, sem testes ou publicação manual neste computador.

## Testes

O trabalho cotidiano fica nos arquivos locais. Commits, envio ao GitHub, disparo manual e acompanhamento das execuções só devem ocorrer quando o usuário pedir. Quando houver um envio autorizado, o workflow de testes inicia automaticamente.

`.github/workflows/ci.yml` executa em pushes na `main`, pull requests e quando chamado pelo workflow de release. Usa Windows, Java 21, Node 24 e Edge. Executa os testes Java, o build React/TypeScript e os testes de navegador. Os relatórios ficam nos artefatos da execução por sete dias. Esse workflow não recebe a chave de assinatura.

## Nova versão

Gerar instalador ou publicar uma release exige pedido explícito do usuário. Alterações comuns executam somente o workflow **Testes**; não criar tags nem disparar **Versão Windows** automaticamente após cada alteração.

1. Atualizar as versões do Tauri, Cargo, pacotes/lockfiles e interface; criar `docs/releases/X.Y.Z.md`.
2. Enviar o código ao GitHub e criar/enviar a tag `vX.Y.Z` no commit correspondente.
3. O workflow **Versão Windows** valida a tag, executa os testes na nuvem, compila o backend/runtime e o Tauri, assina e verifica o pacote e testa o runtime incluído.
4. Somente após essas etapas passarem, publica instalador, `.sig`, `latest.json` e checksums no GitHub Releases. O programa encontra a nova versão pelo canal já configurado.

Também é possível abrir **Actions → Versão Windows → Run workflow** na branch principal. Essa opção gera somente artefatos por padrão. Ao marcar **Criar release rascunho**, para uma versão inédita, também produz uma release **rascunho** para revisão; publicar esse rascunho pela interface do GitHub passa a disponibilizar a atualização. Releases existentes nunca são sobrescritas; para corrigir uma versão publicada, criar outra versão.

Não é mais utilizado `scripts/publish-release.mjs`: ele foi removido. Os scripts de preparação do backend/runtime, artefatos e verificação de assinatura continuam como ferramentas internas do runner. Não foi removida a suíte de testes: sua execução foi transferida para o GitHub Actions.

## Secrets

O job de build utiliza os Secrets de repositório `TAURI_SIGNING_PRIVATE_KEY` e `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, contendo a **mesma** chave de atualização usada nas versões já instaladas. Eles não entram no código, nos artefatos ou nos logs. A publicação usa o `GITHUB_TOKEN` temporário do runner, com `contents: write` somente no job de publicação; não utiliza a credencial Git pessoal.

Preservar o backup local seguro de `.signing/` para recuperação. A senha protegida por DPAPI funciona somente na conta Windows original; o runner recebe a senha por GitHub Secrets. Não trocar a chave pública ou gerar uma nova chave durante um build normal.

Os testes trabalham com dados isolados no runner. O banco real dos usuários permanece em seus computadores e não participa do CI nem da release. O upload de distribuição usa uma lista explícita de quatro arquivos e não envia o ZIP do código-fonte nem a pasta `.signing`.
