$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = 'public/agent-pet/pets'
$petDirs = Get-ChildItem $root -Directory

foreach ($dir in $petDirs) {
  $media = Join-Path $dir.FullName 'media'
  if (-not (Test-Path $media)) {
    continue
  }

  $sheetPng = Join-Path $media 'sheet.png'
  $sheetJson = Join-Path $media 'sheet.json'

  if ((-not (Test-Path $sheetJson)) -and (Test-Path $sheetPng)) {
    $img = [System.Drawing.Image]::FromFile($sheetPng)
    $w = $img.Width
    $h = $img.Height
    $img.Dispose()

    $cell = 32
    if (($w % 32 -ne 0) -or ($h % 32 -ne 0)) { $cell = 64 }
    if ($w % $cell -ne 0) { $cell = 32 }

    $cols = [Math]::Max(1, [int]($w / $cell))
    $rows = [Math]::Max(1, [int]($h / $cell))

    $frames = @{}
    $idx = 0
    for ($r = 0; $r -lt $rows; $r++) {
      for ($c = 0; $c -lt $cols; $c++) {
        $key = "$($dir.Name) Sprite Sheet (Idle) $idx.ase"
        $frames[$key] = @{
          frame = @{ x = $c * $cell; y = $r * $cell; w = $cell; h = $cell }
          rotated = $false
          trimmed = $false
          spriteSourceSize = @{ x = 0; y = 0; w = $cell; h = $cell }
          sourceSize = @{ w = $cell; h = $cell }
          duration = 100
        }
        $idx++
      }
    }

    $meta = @{
      app = 'generated'
      version = '1.0'
      image = 'sheet.png'
      format = 'RGBA8888'
      size = @{ w = $w; h = $h }
      scale = '1'
      frameTags = @()
      layers = @()
      slices = @()
    }

    @{ frames = $frames; meta = $meta } | ConvertTo-Json -Depth 10 | Set-Content -Path $sheetJson -Encoding utf8
  }

  if ((-not (Test-Path $sheetPng)) -and (Test-Path $sheetJson)) {
    $obj = Get-Content $sheetJson -Raw | ConvertFrom-Json
    $w = [int]$obj.meta.size.w
    $h = [int]$obj.meta.size.h
    if ($w -le 0) { $w = 256 }
    if ($h -le 0) { $h = 224 }

    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(170, 148, 163, 184), 2)
    $g.DrawRectangle($pen, 2, 2, $w - 4, $h - 4)
    $font = New-Object System.Drawing.Font('Arial', 12, [System.Drawing.FontStyle]::Bold)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 203, 213, 225))
    $g.DrawString("$($dir.Name) Placeholder", $font, $brush, 8, 8)
    $g.Dispose()
    $bmp.Save($sheetPng, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
  }
}

Write-Output 'normalized pet media complete'
