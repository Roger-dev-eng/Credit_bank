$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
. (Join-Path $PSScriptRoot 'signing-env.ps1')
Enable-CreditoSigning -ProjectRoot $taskRoot
$taskLocalCargo=Join-Path $taskRoot '.dev/rust/cargo/bin/cargo.exe'
if(Test-Path -LiteralPath $taskLocalCargo){$env:CARGO_HOME=Join-Path $taskRoot '.dev/rust/cargo';$env:RUSTUP_HOME=Join-Path $taskRoot '.dev/rust/rustup';$env:PATH=(Split-Path $taskLocalCargo -Parent)+';'+$env:PATH}
if(-not(Get-Command cargo.exe -ErrorAction SilentlyContinue)){throw 'Instale Rust stable MSVC e Visual Studio Build Tools (C++ desktop) antes de gerar o instalador.'}
& (Join-Path $PSScriptRoot 'prepare-desktop.ps1')
Push-Location (Join-Path $taskRoot 'frontend')
try {& npm.cmd ci --cache ../.dev/npm; if($LASTEXITCODE -ne 0){throw 'Falha nas dependências frontend.'}} finally {Pop-Location}
Push-Location (Join-Path $taskRoot 'desktop')
try {& npm.cmd ci --cache ../.dev/npm; if($LASTEXITCODE -ne 0){throw 'Falha nas dependências desktop.'}; & npm.cmd run build; if($LASTEXITCODE -ne 0){throw 'Falha no build Tauri.'}} finally {Pop-Location}
Write-Host 'Instalador: desktop/src-tauri/target/release/bundle/nsis/'
& (Join-Path $PSScriptRoot 'prepare-release.ps1')
