param(
  [string]$SourcePath = "icons/icon512.png",
  [string]$OutputPath = "src/assets/msix"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$resolvedSourcePath = (Resolve-Path $SourcePath).Path
$resolvedOutputPath = (Resolve-Path $OutputPath).Path

$sourceImage = [System.Drawing.Bitmap]::new($resolvedSourcePath)
$background = $sourceImage.GetPixel(0, 0)

$assets = @(
  @{ Name = 'icon.png'; Width = 50; Height = 50 },
  @{ Name = 'StoreLogo.png'; Width = 50; Height = 50 },
  @{ Name = 'LockScreenLogo.scale-200.png'; Width = 48; Height = 48 },
  @{ Name = 'Square44x44Logo.targetsize-24_altform-unplated.png'; Width = 24; Height = 24 },
  @{ Name = 'Square44x44Logo.png'; Width = 88; Height = 88 },
  @{ Name = 'Square44x44Logo.scale-200.png'; Width = 88; Height = 88 },
  @{ Name = 'Square150x150Logo.png'; Width = 300; Height = 300 },
  @{ Name = 'Square150x150Logo.scale-200.png'; Width = 300; Height = 300 },
  @{ Name = 'Wide310x150Logo.png'; Width = 620; Height = 300 },
  @{ Name = 'Wide310x150Logo.scale-200.png'; Width = 620; Height = 300 },
  @{ Name = 'SplashScreen.scale-200.png'; Width = 1240; Height = 600 }
)

try {
  foreach ($asset in $assets) {
    $bitmap = [System.Drawing.Bitmap]::new($asset.Width, $asset.Height)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.Clear($background)
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

        $scale = [Math]::Min(
          $asset.Width / [double]$sourceImage.Width,
          $asset.Height / [double]$sourceImage.Height
        )
        $drawWidth = [int][Math]::Round($sourceImage.Width * $scale)
        $drawHeight = [int][Math]::Round($sourceImage.Height * $scale)
        $drawX = [int][Math]::Floor(($asset.Width - $drawWidth) / 2)
        $drawY = [int][Math]::Floor(($asset.Height - $drawHeight) / 2)

        $graphics.DrawImage($sourceImage, $drawX, $drawY, $drawWidth, $drawHeight)
      }
      finally {
        $graphics.Dispose()
      }

      $outputFile = Join-Path $resolvedOutputPath $asset.Name
      $bitmap.Save($outputFile, [System.Drawing.Imaging.ImageFormat]::Png)
      Write-Output "Generated $($asset.Name)"
    }
    finally {
      $bitmap.Dispose()
    }
  }
}
finally {
  $sourceImage.Dispose()
}