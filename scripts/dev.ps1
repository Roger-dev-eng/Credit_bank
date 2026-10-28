$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
$env:CREDITO_TOKEN=[guid]::NewGuid().ToString()+[guid]::NewGuid().ToString()
$env:CREDITO_DATA_DIR=Join-Path $taskRoot '.dev/data'
$env:CREDITO_PORT='18765'
New-Item -ItemType Directory -Force -Path $env:CREDITO_DATA_DIR | Out-Null
Push-Location (Join-Path $taskRoot 'backend')
try {& mvn.cmd -B -ntp "-Dmaven.repo.local=$taskRoot/.dev/m2" package; if($LASTEXITCODE -ne 0){throw 'Falha ao compilar backend.'}} finally {Pop-Location}
$taskBackend=Start-Process -FilePath (Get-Command java.exe).Source -ArgumentList @('-jar',('"'+(Join-Path $taskRoot 'backend/target/credito-backend-0.1.0.jar')+'"')) -WindowStyle Hidden -PassThru
try {Push-Location (Join-Path $taskRoot 'frontend');& npm.cmd run dev} finally {Pop-Location; if(-not $taskBackend.HasExited){Stop-Process -Id $taskBackend.Id}}
