$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
$taskJdk=Split-Path (Split-Path (Get-Command javac.exe).Source -Parent) -Parent
Push-Location (Join-Path $taskRoot 'backend')
try { & mvn.cmd -B -ntp "-Dmaven.repo.local=$taskRoot/.dev/m2" clean package; if($LASTEXITCODE -ne 0){throw 'Falha no backend.'} } finally {Pop-Location}
$taskResources=Join-Path $taskRoot 'desktop/src-tauri/resources'
New-Item -ItemType Directory -Force -Path $taskResources | Out-Null
Copy-Item -LiteralPath (Join-Path $taskRoot 'backend/target/credito-backend-0.1.0.jar') -Destination (Join-Path $taskResources 'backend.jar')
$taskRuntime=Join-Path $taskResources 'runtime'
if(-not(Test-Path -LiteralPath $taskRuntime)){
 & (Join-Path $taskJdk 'bin/jlink.exe') --add-modules java.base,java.compiler,java.desktop,java.instrument,java.logging,java.management,java.naming,java.net.http,java.prefs,java.security.jgss,java.sql,java.transaction.xa,java.xml,jdk.charsets,jdk.crypto.ec,jdk.unsupported,jdk.zipfs,jdk.management,jdk.attach --strip-debug --no-header-files --no-man-pages --output $taskRuntime
 if($LASTEXITCODE -ne 0){throw 'Falha na geração do runtime.'}
}else{Write-Host 'Reutilizando runtime existente. Renomeie resources/runtime para recriar com outro JDK.'}
Write-Host 'Backend e runtime preparados para o Tauri.'
