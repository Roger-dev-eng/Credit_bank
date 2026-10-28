# Template do instalador

`template.nsi` vem do template oficial do Tauri `tauri-v2.12.5`:
https://github.com/tauri-apps/tauri/blob/tauri-v2.12.5/crates/tauri-bundler/src/bundle/windows/nsis/installer.nsi

A única alteração no template é a remoção de `/SOLID` de `SetCompressor`. Assim, o NSIS comprime cada arquivo separadamente e pode extrair os componentes da interface sem percorrer os runtimes grandes antes de mostrar a primeira página. A verificação de integridade permanece habilitada. Ao atualizar o Tauri, comparar o template oficial da nova versão antes de substituí-lo e reaplicar somente essa alteração.

A configuração `bundle.windows.nsis.compression` usa `lzma` para melhorar a compactação em relação ao zlib. Manter o template sem `/SOLID`: isso permite extrair arquivos individualmente, preservando a estratégia usada para agilizar a abertura da interface. A geração pode demorar mais; não há alteração no código do aplicativo, nos runtimes incluídos ou no banco. O WebView2 continua incluído para instalação offline. Na comparação local com o código da 0.4.0, o instalador LZMA ficou em 291,77 MiB, contra 302,25 MiB do pacote zlib publicado: redução de 10,48 MiB (3,47%). A assinatura do pacote foi verificada. O tamanho do próximo pacote publicado pode variar conforme o ambiente de build; tempos de abertura e extração não foram medidos nessa comparação.

Referência: https://nsis.sourceforge.io/Reference/SetCompressor

O visual fica em `appearance.nsh`. As imagens são geradas por `scripts/installer-artwork.ps1` em resolução 3x. A lateral contém apenas INSTALAÇÃO e o ícone do aplicativo.
