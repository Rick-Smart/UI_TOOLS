$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = 'public/agent-pet/pets'
$imports = 'public/agent-pet/imports/new_pets_sprite_sheets'

# Seagull (json-only -> create placeholder png)
$seagullMedia = Join-Path $root 'seagull/media'
New-Item -ItemType Directory -Force -Path $seagullMedia | Out-Null
Copy-Item (Join-Path $imports 'Seagull/Seagull Sprite Sheet.json') (Join-Path $seagullMedia 'sheet.json') -Force
$obj = Get-Content (Join-Path $seagullMedia 'sheet.json') -Raw | ConvertFrom-Json
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
$g.DrawString('Seagull Placeholder', $font, $brush, 8, 8)
$g.Dispose()
$bmp.Save((Join-Path $seagullMedia 'sheet.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# Wolf (png-only -> create generated json)
$wolfMedia = Join-Path $root 'wolf/media'
New-Item -ItemType Directory -Force -Path $wolfMedia | Out-Null
Copy-Item (Join-Path $imports 'Wolf/Wolf Cub Sprite Sheet.png') (Join-Path $wolfMedia 'sheet.png') -Force
$img = [System.Drawing.Image]::FromFile((Join-Path $wolfMedia 'sheet.png'))
$iw = $img.Width
$ih = $img.Height
$img.Dispose()
$cell = 32
if (($iw % 32 -ne 0) -or ($ih % 32 -ne 0)) { $cell = 64 }
if ($iw % $cell -ne 0) { $cell = 32 }
$cols = [Math]::Max(1, [int]($iw / $cell))
$rows = [Math]::Max(1, [int]($ih / $cell))
$frames = @{}
$idx = 0
for ($r = 0; $r -lt $rows; $r++) {
  for ($c = 0; $c -lt $cols; $c++) {
    $k = "Wolf Sprite Sheet (Idle) $idx.ase"
    $frames[$k] = @{
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
  size = @{ w = $iw; h = $ih }
  scale = '1'
  frameTags = @()
  layers = @()
  slices = @()
}
@{ frames = $frames; meta = $meta } | ConvertTo-Json -Depth 10 | Set-Content -Path (Join-Path $wolfMedia 'sheet.json') -Encoding utf8

Write-Output 'seagull+wolf completed'
