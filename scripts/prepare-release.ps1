$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskConfig = Get-Content (Join-Path $taskRoot 'desktop/src-tauri/tauri.conf.json') -Raw | ConvertFrom-Json
$taskVersion = $taskConfig.version
$taskName = "Gestao-de-Credito-$taskVersion-x64-instalador.exe"
$taskBundle = Join-Path $taskRoot ("desktop/src-tauri/target/release/bundle/nsis/"+$taskConfig.productName+"_"+$taskVersion+"_x64-setup.exe")
$taskOutput = Join-Path $taskRoot 'dist/windows'
$taskResources = Join-Path $taskRoot 'desktop/src-tauri/resources'
if (Get-ChildItem -LiteralPath $taskResources -Recurse -File | Where-Object {$_.Name -match '\.(db|sqlite|sqlite3)(-|$)'}) {
    throw 'Pacote recusado: existe um banco de dados nos recursos de instalação.'
}
if (-not (Test-Path -LiteralPath ($taskBundle+'.sig'))) { throw 'Assinatura da versão ausente. Gere o instalador com a chave de atualização original.' }
New-Item -ItemType Directory -Force -Path $taskOutput | Out-Null
Copy-Item -LiteralPath $taskBundle -Destination (Join-Path $taskOutput $taskName)
Copy-Item -LiteralPath ($taskBundle+'.sig') -Destination (Join-Path $taskOutput ($taskName+'.sig'))
$taskNotes = Get-Content (Join-Path $taskRoot "docs/releases/$taskVersion.md") -Raw
$taskManifest = @{
    version=$taskVersion; notes=$taskNotes; pub_date=[DateTimeOffset]::UtcNow.ToString('o');
    platforms=@{'windows-x86_64'=@{
        signature=(Get-Content -LiteralPath ($taskBundle+'.sig') -Raw).Trim();
        url="https://github.com/Roger-dev-eng/Credit_bank/releases/download/v$taskVersion/$taskName"
    }}
}
[IO.File]::WriteAllText((Join-Path $taskOutput 'latest.json'),($taskManifest | ConvertTo-Json -Depth 10),[Text.UTF8Encoding]::new($false))
$taskSourceName="Gestao-de-Credito-$taskVersion-fonte.zip"
Add-Type -AssemblyName System.IO.Compression
$taskTemporaryZip=Join-Path $taskOutput ([guid]::NewGuid().ToString()+'.zip')
$taskZipStream=[IO.File]::Open($taskTemporaryZip,[IO.FileMode]::CreateNew)
$taskZip=[IO.Compression.ZipArchive]::new($taskZipStream,[IO.Compression.ZipArchiveMode]::Create)
try {
    $taskFiles=& git -C $taskRoot ls-files --cached --others --exclude-standard
    foreach($taskRelative in $taskFiles){
        if($taskRelative -notmatch '^(backend/|frontend/|desktop/|docs/|scripts/|README\.md$|LICENSE$|\.gitignore$|\.gitattributes$)'){continue}
        if($taskRelative -match '(^|/)(node_modules|target|dist|\.signing|\.dev)(/|$)|^desktop/src-tauri/resources/|(^|/)\.env($|\.)|\.tsbuildinfo$|\.(db|sqlite|key)(-|$)'){continue}
        $taskFull=Join-Path $taskRoot $taskRelative
        if(-not(Test-Path -LiteralPath $taskFull -PathType Leaf)){continue}
        $taskEntry=$taskZip.CreateEntry($taskRelative,[IO.Compression.CompressionLevel]::Optimal)
        $taskEntryStream=$taskEntry.Open();$taskFileStream=[IO.File]::OpenRead($taskFull)
        try{$taskFileStream.CopyTo($taskEntryStream)}finally{$taskFileStream.Dispose();$taskEntryStream.Dispose()}
    }
} finally {$taskZip.Dispose();$taskZipStream.Dispose()}
Move-Item -LiteralPath $taskTemporaryZip -Destination (Join-Path $taskOutput $taskSourceName) -Force
$taskSums = @($taskName,($taskName+'.sig'),'latest.json') | ForEach-Object {((Get-FileHash -LiteralPath (Join-Path $taskOutput $_)).Hash.ToLower()+'  '+$_)}
[IO.File]::WriteAllLines((Join-Path $taskOutput 'SHA256SUMS.txt'),[string[]]$taskSums)
& node (Join-Path $PSScriptRoot 'verify-release.mjs')
if($LASTEXITCODE -ne 0){throw 'A assinatura da release não passou na verificação.'}
Write-Host "Release $taskVersion preparada em dist/windows. Nenhum banco de dados é incluído."
