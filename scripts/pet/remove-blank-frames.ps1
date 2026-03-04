$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$petsRoot = 'public/agent-pet/pets'
$petDirs = Get-ChildItem $petsRoot -Directory

foreach ($dir in $petDirs) {
  $mediaDir = Join-Path $dir.FullName 'media'
  $sheetPng = Join-Path $mediaDir 'sheet.png'
  $sheetJson = Join-Path $mediaDir 'sheet.json'

  if ((-not (Test-Path $sheetPng)) -or (-not (Test-Path $sheetJson))) {
    continue
  }

  $jsonRaw = Get-Content $sheetJson -Raw
  if ($jsonRaw.Length -gt 0 -and [int]$jsonRaw[0] -eq 65279) {
    $jsonRaw = $jsonRaw.Substring(1)
  }

  $data = $jsonRaw | ConvertFrom-Json
  $framesObj = $data.frames
  if (-not $framesObj) {
    continue
  }

  $bitmap = New-Object System.Drawing.Bitmap($sheetPng)
  $kept = [ordered]@{}

  foreach ($prop in $framesObj.PSObject.Properties) {
    $name = $prop.Name
    $frame = $prop.Value.frame
    if (-not $frame) {
      continue
    }

    $x = [int]$frame.x
    $y = [int]$frame.y
    $w = [int]$frame.w
    $h = [int]$frame.h

    if ($w -le 0 -or $h -le 0) {
      continue
    }

    $maxX = [Math]::Min($bitmap.Width, $x + $w)
    $maxY = [Math]::Min($bitmap.Height, $y + $h)
    $hasVisiblePixel = $false

    for ($py = [Math]::Max(0, $y); $py -lt $maxY -and -not $hasVisiblePixel; $py++) {
      for ($px = [Math]::Max(0, $x); $px -lt $maxX; $px++) {
        $pixel = $bitmap.GetPixel($px, $py)
        if ($pixel.A -gt 5) {
          $hasVisiblePixel = $true
          break
        }
      }
    }

    if ($hasVisiblePixel) {
      $kept[$name] = $prop.Value
    }
  }

  $bitmap.Dispose()

  if ($kept.Count -eq 0) {
    continue
  }

  $newData = [ordered]@{
    frames = $kept
    meta = $data.meta
  }

  $newData | ConvertTo-Json -Depth 12 | Set-Content -Path $sheetJson -Encoding utf8
}

Write-Output 'blank frame cleanup complete'
