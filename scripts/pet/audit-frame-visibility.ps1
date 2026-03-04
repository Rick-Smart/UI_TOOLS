$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Get-Location
$petsRoot = Join-Path $root 'public/agent-pet/pets'
$petDirs = Get-ChildItem $petsRoot -Directory

Write-Output '=== FRAME VISIBILITY AUDIT ==='

$totalFrames = 0
$totalBlank = 0

foreach ($dir in $petDirs) {
  $sheetPng = Join-Path $dir.FullName 'media/sheet.png'
  $sheetJson = Join-Path $dir.FullName 'media/sheet.json'

  if ((-not (Test-Path $sheetPng)) -or (-not (Test-Path $sheetJson))) {
    Write-Output "$($dir.Name): skipped (missing sheet assets)"
    continue
  }

  $jsonRaw = Get-Content $sheetJson -Raw
  if ($jsonRaw.Length -gt 0 -and [int]$jsonRaw[0] -eq 65279) {
    $jsonRaw = $jsonRaw.Substring(1)
  }

  $data = $jsonRaw | ConvertFrom-Json
  $framesObj = $data.frames
  if (-not $framesObj) {
    Write-Output "$($dir.Name): skipped (no frames in json)"
    continue
  }

  $bitmap = New-Object System.Drawing.Bitmap($sheetPng)
  $petFrameCount = 0
  $petBlankCount = 0
  $blankFrameNames = @()

  foreach ($prop in $framesObj.PSObject.Properties) {
    $frame = $prop.Value.frame
    if (-not $frame) {
      continue
    }

    $x = [int]$frame.x
    $y = [int]$frame.y
    $w = [int]$frame.w
    $h = [int]$frame.h

    if ($w -le 0 -or $h -le 0) {
      $petBlankCount++
      $petFrameCount++
      $blankFrameNames += $prop.Name
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

    if (-not $hasVisiblePixel) {
      $petBlankCount++
      $blankFrameNames += $prop.Name
    }

    $petFrameCount++
  }

  $bitmap.Dispose()

  $totalFrames += $petFrameCount
  $totalBlank += $petBlankCount

  Write-Output "$($dir.Name): frames=$petFrameCount blank=$petBlankCount"
  if ($blankFrameNames.Count -gt 0) {
    foreach ($blankName in $blankFrameNames) {
      Write-Output "  blank: $blankName"
    }
  }
}

Write-Output "TOTAL: frames=$totalFrames blank=$totalBlank"

if ($totalBlank -gt 0) {
  exit 1
}
