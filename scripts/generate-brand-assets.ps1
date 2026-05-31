param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

Add-Type -AssemblyName System.Drawing

$brandRed = [System.Drawing.ColorTranslator]::FromHtml("#FF173F")
$brandBright = [System.Drawing.ColorTranslator]::FromHtml("#FF2A4F")
$brandInk = [System.Drawing.ColorTranslator]::FromHtml("#8F001B")
$brandSoft = [System.Drawing.ColorTranslator]::FromHtml("#FFF1F4")
$white = [System.Drawing.Color]::White
$logoLetter = [string]::Concat([char[]](0xB3C4))
$brandName = [string]::Concat([char[]](0xD560, 0xC778, 0xB3C4, 0xC0AC))
$featureLine1 = [string]::Concat([char[]](0xC624, 0xB298, 0x0020, 0xBC1B, 0xC744, 0x0020, 0xD61C, 0xD0DD, 0x002C))
$featureLine2 = [string]::Concat([char[]](0xB193, 0xCE58, 0xC9C0, 0x0020, 0xB9C8, 0xC138, 0xC694))

function New-DirectoryIfMissing([string]$Path) {
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function New-RoundedRect([float]$X, [float]$Y, [float]$W, [float]$H, [float]$R) {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $d = $R * 2
  $path.AddArc($X, $Y, $d, $d, 180, 90)
  $path.AddArc($X + $W - $d, $Y, $d, $d, 270, 90)
  $path.AddArc($X + $W - $d, $Y + $H - $d, $d, $d, 0, 90)
  $path.AddArc($X, $Y + $H - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-BrandIcon([string]$Path, [int]$Size) {
  New-DirectoryIfMissing (Split-Path $Path)
  $bmp = [System.Drawing.Bitmap]::new($Size, $Size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $bg = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Rectangle]::new(0, 0, $Size, $Size),
    $brandBright,
    $brandRed,
    35
  )
  $g.FillRectangle($bg, 0, 0, $Size, $Size)

  $pad = [int]($Size * 0.11)
  $card = New-RoundedRect $pad $pad ($Size - $pad * 2) ($Size - $pad * 2) ([int]($Size * 0.18))
  $g.FillPath(([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(36, 255, 255, 255))), $card)

  $circleSize = [int]($Size * 0.42)
  $circleX = [int]($Size * 0.16)
  $circleY = [int]($Size * 0.18)
  $g.FillEllipse(([System.Drawing.SolidBrush]::new($white)), $circleX, $circleY, $circleSize, $circleSize)

  $fontD = [System.Drawing.Font]::new("Malgun Gothic", [int]($Size * 0.23), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $textFormat = [System.Drawing.StringFormat]::new()
  $textFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $textFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString($logoLetter, $fontD, ([System.Drawing.SolidBrush]::new($brandRed)), [System.Drawing.RectangleF]::new($circleX, $circleY - ($Size * 0.01), $circleSize, $circleSize), $textFormat)

  $ticketX = [int]($Size * 0.39)
  $ticketY = [int]($Size * 0.48)
  $ticketW = [int]($Size * 0.45)
  $ticketH = [int]($Size * 0.24)
  $ticket = New-RoundedRect $ticketX $ticketY $ticketW $ticketH ([int]($Size * 0.045))
  $matrix = [System.Drawing.Drawing2D.Matrix]::new()
  $matrix.RotateAt(-12, [System.Drawing.PointF]::new($ticketX + $ticketW / 2, $ticketY + $ticketH / 2))
  $ticket.Transform($matrix)
  $g.FillPath(([System.Drawing.SolidBrush]::new($white)), $ticket)

  $fontSale = [System.Drawing.Font]::new("Arial", [int]($Size * 0.115), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $saleFormat = [System.Drawing.StringFormat]::new()
  $saleFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $saleFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.TranslateTransform($ticketX + $ticketW / 2, $ticketY + $ticketH / 2)
  $g.RotateTransform(-12)
  $g.DrawString("SALE", $fontSale, ([System.Drawing.SolidBrush]::new($brandInk)), [System.Drawing.RectangleF]::new(-$ticketW / 2, -$ticketH / 2, $ticketW, $ticketH), $saleFormat)
  $g.ResetTransform()

  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

function New-FeatureGraphic([string]$Path) {
  New-DirectoryIfMissing (Split-Path $Path)
  $width = 1024
  $height = 500
  $bmp = [System.Drawing.Bitmap]::new($width, $height)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $bg = [System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.Rectangle]::new(0, 0, $width, $height), $brandBright, $brandRed, 0)
  $g.FillRectangle($bg, 0, 0, $width, $height)
  $g.FillEllipse(([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(30, 255, 255, 255))), 620, -130, 380, 380)
  $g.FillEllipse(([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(22, 255, 255, 255))), 760, 260, 260, 260)

  $fontSmall = [System.Drawing.Font]::new("Malgun Gothic", 34, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $fontTitle = [System.Drawing.Font]::new("Malgun Gothic", 74, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $fontBody = [System.Drawing.Font]::new("Malgun Gothic", 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString($brandName, $fontSmall, ([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(230, 255, 255, 255))), 70, 70)
  $g.DrawString($featureLine1, $fontTitle, ([System.Drawing.SolidBrush]::new($white)), 66, 130)
  $g.DrawString($featureLine2, $fontTitle, ([System.Drawing.SolidBrush]::new($white)), 66, 205)
  $g.DrawString("Free benefits / Coupons / Points / Deals", $fontBody, ([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(235, 255, 255, 255))), 70, 315)

  $phone = New-RoundedRect 710 82 210 336 36
  $g.FillPath(([System.Drawing.SolidBrush]::new($white)), $phone)
  $g.FillRectangle(([System.Drawing.SolidBrush]::new($brandSoft)), 735, 138, 160, 52)
  $g.FillRectangle(([System.Drawing.SolidBrush]::new($brandSoft)), 735, 214, 160, 52)
  $g.FillRectangle(([System.Drawing.SolidBrush]::new($brandSoft)), 735, 290, 160, 52)
  $g.FillEllipse(([System.Drawing.SolidBrush]::new($brandRed)), 750, 153, 24, 24)
  $g.FillEllipse(([System.Drawing.SolidBrush]::new($brandRed)), 750, 229, 24, 24)
  $g.FillEllipse(([System.Drawing.SolidBrush]::new($brandRed)), 750, 305, 24, 24)

  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

$iconTargets = @(
  @{ Path = "assets/store/play-store-icon-512.png"; Size = 512 },
  @{ Path = "public/halindosa-icon-512.png"; Size = 512 },
  @{ Path = "public/halindosa-icon-192.png"; Size = 192 },
  @{ Path = "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"; Size = 1024 },
  @{ Path = "android/app/src/main/res/mipmap-mdpi/ic_launcher.png"; Size = 48 },
  @{ Path = "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png"; Size = 48 },
  @{ Path = "android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png"; Size = 48 },
  @{ Path = "android/app/src/main/res/mipmap-hdpi/ic_launcher.png"; Size = 72 },
  @{ Path = "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png"; Size = 72 },
  @{ Path = "android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png"; Size = 72 },
  @{ Path = "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png"; Size = 96 },
  @{ Path = "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png"; Size = 96 },
  @{ Path = "android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png"; Size = 96 },
  @{ Path = "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png"; Size = 144 },
  @{ Path = "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png"; Size = 144 },
  @{ Path = "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png"; Size = 144 },
  @{ Path = "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"; Size = 192 },
  @{ Path = "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png"; Size = 192 },
  @{ Path = "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png"; Size = 192 }
)

foreach ($target in $iconTargets) {
  New-BrandIcon (Join-Path $Root $target.Path) $target.Size
}

New-FeatureGraphic (Join-Path $Root "assets/store/feature-graphic-1024x500.png")
New-BrandIcon (Join-Path $Root "android/app/src/main/res/drawable/halindosa_logo.png") 512
New-BrandIcon (Join-Path $Root "android/app/src/main/res/drawable/splash.png") 512
New-BrandIcon (Join-Path $Root "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png") 2732
New-BrandIcon (Join-Path $Root "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png") 2732
New-BrandIcon (Join-Path $Root "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png") 2732

Write-Host "Generated bright red Halindosa brand assets."
