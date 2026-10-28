function Enable-CreditoSigning {
    param([string]$ProjectRoot)
    $ErrorActionPreference = 'Stop'
    if ($env:TAURI_SIGNING_PRIVATE_KEY) { return }
    $taskKey = Join-Path $ProjectRoot '.signing/signing.key'
    $taskPasswordPath = Join-Path $ProjectRoot '.signing/signing.password.dpapi'
    if (-not (Test-Path -LiteralPath $taskKey) -or -not (Test-Path -LiteralPath $taskPasswordPath)) {
        throw 'Chave de assinatura ausente. Configure TAURI_SIGNING_PRIVATE_KEY e TAURI_SIGNING_PRIVATE_KEY_PASSWORD com a chave original deste aplicativo. Não gere outra chave para atualizações existentes.'
    }
    $taskSecure = (Get-Content -LiteralPath $taskPasswordPath -Raw).Trim() | ConvertTo-SecureString
    $taskPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($taskSecure)
    try {
        $env:TAURI_SIGNING_PRIVATE_KEY = $taskKey
        $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($taskPointer)
    } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($taskPointer) }
}
