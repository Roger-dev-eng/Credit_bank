$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskOutput = Join-Path $taskRoot 'desktop/src-tauri/installer'
$taskIconPath = Join-Path $taskRoot 'desktop/src-tauri/icons/icon.png'

function New-InstallerBitmap([int]$Width, [int]$Height, [string]$Name, [scriptblock]$Draw) {
    # Supply a 3x source so the native DPI-aware wizard can resize cleanly.
    $taskBitmap = [Drawing.Bitmap]::new(($Width * 3), ($Height * 3), [Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $taskGraphics = [Drawing.Graphics]::FromImage($taskBitmap)
    $taskGraphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $taskGraphics.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $taskGraphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $taskGraphics.ScaleTransform(3, 3)
    try {
        & $Draw $taskGraphics
        $taskBitmap.Save((Join-Path $taskOutput $Name), [Drawing.Imaging.ImageFormat]::Bmp)
    } finally { $taskGraphics.Dispose(); $taskBitmap.Dispose() }
}

$taskIconBitmap = [Drawing.Bitmap]::new($taskIconPath)
$taskMuted = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#B9C8E3'))
$taskInk = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#1A2035'))
$taskLabel = [Drawing.Font]::new('Segoe UI', 11, [Drawing.FontStyle]::Bold, [Drawing.GraphicsUnit]::Pixel)
$taskHeaderFont = [Drawing.Font]::new('Segoe UI', 12, [Drawing.FontStyle]::Bold, [Drawing.GraphicsUnit]::Pixel)
try {
    New-InstallerBitmap 164 314 'sidebar.bmp' {
        param($g)
        $taskGradient = [Drawing.Drawing2D.LinearGradientBrush]::new([Drawing.Point]::new(0,0), [Drawing.Point]::new(164,314), [Drawing.ColorTranslator]::FromHtml('#1A2035'), [Drawing.ColorTranslator]::FromHtml('#2E4673'))
        $g.FillRectangle($taskGradient, 0, 0, 164, 314); $taskGradient.Dispose()
        $g.DrawString('INSTALAÇÃO', $taskLabel, $taskMuted, 24, 28)
        $g.DrawImage($taskIconBitmap, 24, 66, 80, 80)
    }
    New-InstallerBitmap 150 57 'header.bmp' {
        param($g)
        $g.Clear([Drawing.Color]::White)
        $g.DrawImage($taskIconBitmap, 5, 11, 36, 36)
        $g.DrawString("Gestão de`nCrédito", $taskHeaderFont, $taskInk, 49, 11)
    }
} finally {
    $taskIconBitmap.Dispose()
    $taskMuted.Dispose(); $taskInk.Dispose()
    $taskLabel.Dispose(); $taskHeaderFont.Dispose()
}
