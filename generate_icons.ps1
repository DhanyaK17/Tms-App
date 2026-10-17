Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\DHANYA\.gemini\antigravity-ide\brain\8c351ddb-e33c-4bbf-8be5-e056d9ab42b0\.user_uploaded\media_1792176805457.png'
$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function SaveResized($src, $targetPath, $targetWidth, $targetHeight, $innerScale, $bgColor) {
    $bmp = New-Object System.Drawing.Bitmap $targetWidth, $targetHeight
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gfx.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($bgColor -ne $null) {
        $brush = New-Object System.Drawing.SolidBrush $bgColor
        $gfx.FillRectangle($brush, 0, 0, $targetWidth, $targetHeight)
        $brush.Dispose()
    }

    $destW = [int]($targetWidth * $innerScale)
    $destH = [int]($targetHeight * $innerScale)
    $destX = [int](($targetWidth - $destW) / 2)
    $destY = [int](($targetHeight - $destH) / 2)

    $gfx.DrawImage($src, $destX, $destY, $destW, $destH)
    $gfx.Dispose()

    # Ensure parent dir exists
    $parent = Split-Path $targetPath -Parent
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Saved: $targetPath ($targetWidth x $targetHeight)"
}

$white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)

# App Mobile Assets
SaveResized $srcImg 'frontend\src\assets\logo.png' 1024 1024 1.0 $white
SaveResized $srcImg 'frontend\src\assets\icon.png' 1024 1024 1.0 $white
SaveResized $srcImg 'frontend\src\assets\adaptive-icon.png' 1024 1024 0.72 $white
SaveResized $srcImg 'frontend\src\assets\splash.png' 1024 1024 0.65 $white
SaveResized $srcImg 'frontend\src\assets\favicon.png' 192 192 1.0 $white

# Web Public Assets
SaveResized $srcImg 'frontend\public\favicon.png' 192 192 1.0 $white
SaveResized $srcImg 'frontend\public\apple-touch-icon.png' 180 180 1.0 $white
SaveResized $srcImg 'frontend\public\logo.png' 512 512 1.0 $white

# Also save original image copy as logo.jpg
Copy-Item $srcPath 'frontend\src\assets\logo.jpg' -Force
Copy-Item $srcPath 'frontend\public\logo.jpg' -Force

$srcImg.Dispose()
Write-Host "All logo and icon assets for both App and Web created successfully!"
