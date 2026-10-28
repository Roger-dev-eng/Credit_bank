# Template do instalador

`template.nsi` vem do template oficial do Tauri `tauri-v2.12.5`:
https://github.com/tauri-apps/tauri/blob/tauri-v2.12.5/crates/tauri-bundler/src/bundle/windows/nsis/installer.nsi

A única alteração no template é a remoção de `/SOLID` de `SetCompressor`. Assim, o NSIS comprime cada arquivo separadamente e pode extrair os componentes da interface sem percorrer os runtimes grandes antes de mostrar a primeira página. A verificação de integridade permanece habilitada. Ao atualizar o Tauri, comparar o template oficial da nova versão antes de substituí-lo e reaplicar somente essa alteração.

O visual fica em `appearance.nsh`. As imagens são geradas por `scripts/installer-artwork.ps1` em resolução 3x. A lateral contém apenas INSTALAÇÃO e o ícone do aplicativo.
