$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskOutput = Join-Path $taskRoot 'desktop/src-tauri/installer'
$taskIconPath = Join-Path $taskRoot 'desktop/src-tauri/icons/icon.ico'

function New-InstallerBitmap([int]$Width, [int]$Height, [string]$Name, [scriptblock]$Draw) {
    $taskBitmap = [Drawing.Bitmap]::new($Width, $Height, [Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $taskGraphics = [Drawing.Graphics]::FromImage($taskBitmap)
    $taskGraphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $taskGraphics.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    try {
        & $Draw $taskGraphics
        $taskBitmap.Save((Join-Path $taskOutput $Name), [Drawing.Imaging.ImageFormat]::Bmp)
    } finally { $taskGraphics.Dispose(); $taskBitmap.Dispose() }
}

$taskIcon = [Drawing.Icon]::new($taskIconPath, 64, 64)
$taskIconBitmap = $taskIcon.ToBitmap()
$taskWhite = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#FFFFFF'))
$taskMuted = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#B9C8E3'))
$taskInk = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#1A2035'))
$taskLabel = [Drawing.Font]::new('Segoe UI', 8, [Drawing.FontStyle]::Bold, [Drawing.GraphicsUnit]::Pixel)
$taskTitle = [Drawing.Font]::new('Segoe UI', 20, [Drawing.FontStyle]::Bold, [Drawing.GraphicsUnit]::Pixel)
$taskBody = [Drawing.Font]::new('Segoe UI', 11, [Drawing.FontStyle]::Regular, [Drawing.GraphicsUnit]::Pixel)
$taskHeaderFont = [Drawing.Font]::new('Segoe UI', 12, [Drawing.FontStyle]::Bold, [Drawing.GraphicsUnit]::Pixel)
try {
    New-InstallerBitmap 164 314 'sidebar.bmp' {
        param($g)
        $taskGradient = [Drawing.Drawing2D.LinearGradientBrush]::new([Drawing.Point]::new(0,0), [Drawing.Point]::new(164,314), [Drawing.ColorTranslator]::FromHtml('#1A2035'), [Drawing.ColorTranslator]::FromHtml('#2E4673'))
        $g.FillRectangle($taskGradient, 0, 0, 164, 314); $taskGradient.Dispose()
        $g.DrawString('INSTALAÇÃO', $taskLabel, $taskMuted, 22, 24)
        $g.DrawImage($taskIconBitmap, 18, 55, 64, 64)
        $g.DrawString("Gestão`nde Crédito", $taskTitle, $taskWhite, 20, 133)
        $taskLine = [Drawing.Pen]::new([Drawing.ColorTranslator]::FromHtml('#60769B'))
        $g.DrawLine($taskLine, 22, 207, 140, 207); $taskLine.Dispose()
        $g.DrawString("Suas operações.`nTudo em um só lugar.", $taskBody, $taskMuted, 21, 225)
        $g.DrawString('LOCAL  /  OFFLINE', $taskLabel, $taskMuted, 22, 283)
    }
    New-InstallerBitmap 150 57 'header.bmp' {
        param($g)
        $g.Clear([Drawing.Color]::White)
        $g.DrawImage($taskIconBitmap, 5, 11, 36, 36)
        $g.DrawString("Gestão de`nCrédito", $taskHeaderFont, $taskInk, 49, 11)
    }
} finally {
    $taskIconBitmap.Dispose(); $taskIcon.Dispose()
    $taskWhite.Dispose(); $taskMuted.Dispose(); $taskInk.Dispose()
    $taskLabel.Dispose(); $taskTitle.Dispose(); $taskBody.Dispose(); $taskHeaderFont.Dispose()
}
