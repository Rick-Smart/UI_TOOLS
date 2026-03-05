$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$importsRoot = 'public/agent-pet/imports'
$sheetsRoot = Join-Path $importsRoot 'new_pets_sprite_sheets'
$standaloneRoot = Join-Path $importsRoot 'standalone_assets'

New-Item -ItemType Directory -Force -Path $standaloneRoot | Out-Null

function Convert-ToTitleCase([string]$value) {
  $clean = [regex]::Replace([string]$value, '[^A-Za-z0-9]+', ' ').Trim()
  if (-not $clean) { return 'Asset' }
  $parts = $clean -split '\s+'
  return ($parts | ForEach-Object {
    if ($_.Length -le 1) { $_.ToUpperInvariant() }
    else { $_.Substring(0, 1).ToUpperInvariant() + $_.Substring(1).ToLowerInvariant() }
  }) -join ' '
}

function Resolve-CellSize([int]$width, [int]$height) {
  $candidates = @(64, 56, 48, 40, 32, 24, 20, 16, 8)
  foreach ($candidate in $candidates) {
    if ($candidate -le 0) { continue }
    if (($width % $candidate -eq 0) -and ($height % $candidate -eq 0)) {
      $frameCount = [int](($width / $candidate) * ($height / $candidate))
      if ($frameCount -ge 1 -and $frameCount -le 600) {
        return $candidate
      }
    }
  }

  if (($width % 32 -eq 0) -and ($height % 32 -eq 0)) {
    return 32
  }

  if (($width % 16 -eq 0) -and ($height % 16 -eq 0)) {
    return 16
  }

  return 32
}

function Test-IsAtlasJson([string]$jsonPath) {
  try {
    $raw = Get-Content -Path $jsonPath -Raw
    $obj = $raw | ConvertFrom-Json
    if ($null -eq $obj) { return $false }

    if ($obj -is [System.Collections.IEnumerable] -and -not ($obj -is [string])) {
      return $false
    }

    return ($null -ne $obj.frames -and $obj.frames.PSObject.Properties.Count -gt 0)
  }
  catch {
    return $false
  }
}

function Resolve-FrameTraversalMode([string]$packName, [int]$width, [int]$height) {
  $normalized = [string]$packName
  if ($normalized -match '(?i)^crow$') {
    return 'vertical'
  }

  if ($height -ge ($width * 2)) {
    return 'vertical'
  }

  return 'horizontal'
}

function New-AtlasJsonFromPng([string]$pngPath, [string]$jsonPath, [string]$packName) {
  $img = [System.Drawing.Image]::FromFile($pngPath)
  $width = $img.Width
  $height = $img.Height
  $img.Dispose()

  $cell = Resolve-CellSize -width $width -height $height
  $cols = [Math]::Max(1, [int]($width / $cell))
  $rows = [Math]::Max(1, [int]($height / $cell))

  $frames = [ordered]@{}
  $index = 0
  $traversalMode = Resolve-FrameTraversalMode -packName $packName -width $width -height $height

  if ($traversalMode -eq 'vertical') {
    for ($col = 0; $col -lt $cols; $col++) {
      for ($row = 0; $row -lt $rows; $row++) {
        $key = "${packName} Sprite Sheet (Idle) $index.ase"
        $frames[$key] = @{
          frame = @{ x = $col * $cell; y = $row * $cell; w = $cell; h = $cell }
          rotated = $false
          trimmed = $false
          spriteSourceSize = @{ x = 0; y = 0; w = $cell; h = $cell }
          sourceSize = @{ w = $cell; h = $cell }
          duration = 100
        }
        $index++
      }
    }
  }
  else {
    for ($row = 0; $row -lt $rows; $row++) {
      for ($col = 0; $col -lt $cols; $col++) {
        $key = "${packName} Sprite Sheet (Idle) $index.ase"
        $frames[$key] = @{
          frame = @{ x = $col * $cell; y = $row * $cell; w = $cell; h = $cell }
          rotated = $false
          trimmed = $false
          spriteSourceSize = @{ x = 0; y = 0; w = $cell; h = $cell }
          sourceSize = @{ w = $cell; h = $cell }
          duration = 100
        }
        $index++
      }
    }
  }

  $json = @{
    frames = $frames
    meta = @{
      app = 'generated-import-crawler'
      version = '1.0'
      image = [System.IO.Path]::GetFileName($pngPath)
      format = 'RGBA8888'
      size = @{ w = $width; h = $height }
      scale = '1'
      traversal = $traversalMode
      frameTags = @()
      layers = @()
      slices = @()
    }
  }

  $json | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonPath -Encoding utf8
}

function Get-ActionGroupsFromAtlas([string]$jsonPath) {
  try {
    $obj = Get-Content -Path $jsonPath -Raw | ConvertFrom-Json
    if ($null -eq $obj -or $null -eq $obj.frames) { return @() }

    $actions = New-Object System.Collections.Generic.HashSet[string]
    foreach ($prop in $obj.frames.PSObject.Properties) {
      $name = [string]$prop.Name
      $match = [regex]::Match($name, '\(([^)]+)\)')
      if ($match.Success) {
        [void]$actions.Add($match.Groups[1].Value.Trim())
      }
    }

    return @($actions.ToArray() | Sort-Object)
  }
  catch {
    return @()
  }
}

function Get-AtlasFrameEntries($atlas) {
  if ($null -eq $atlas -or $null -eq $atlas.frames) {
    return @()
  }

  return @(
    $atlas.frames.PSObject.Properties |
      Where-Object {
        $null -ne $_.Value -and
        $null -ne $_.Value.PSObject -and
        ($_.Value.PSObject.Properties.Name -contains 'frame')
      }
  )
}

function Get-ImageSize([string]$pngPath) {
  $img = [System.Drawing.Image]::FromFile($pngPath)
  $width = $img.Width
  $height = $img.Height
  $img.Dispose()
  return @{ width = $width; height = $height }
}

$looseFiles = Get-ChildItem -Path $sheetsRoot -File -ErrorAction SilentlyContinue
$grouped = @{}

foreach ($file in $looseFiles) {
  $stem = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
  if (-not $grouped.ContainsKey($stem)) {
    $grouped[$stem] = @()
  }
  $grouped[$stem] += $file
}

foreach ($entry in $grouped.GetEnumerator()) {
  $stem = [string]$entry.Key
  $files = @($entry.Value)
  if (-not $files.Count) { continue }

  $normalizedStem = $stem
  if ($normalizedStem -match '(?i)[_-]sprite$') {
    $normalizedStem = $normalizedStem -replace '(?i)[_-]sprite$', ''
  }

  $isStandalone = $normalizedStem -match '(?i)oyster|clam'
  if ($isStandalone) {
    foreach ($source in $files) {
      $target = Join-Path $standaloneRoot $source.Name
      Move-Item -Path $source.FullName -Destination $target -Force
    }
    continue
  }

  $packName = Convert-ToTitleCase $normalizedStem
  $folderName = ($packName -replace '\s+', '_')
  $packDir = Join-Path $sheetsRoot $folderName
  New-Item -ItemType Directory -Force -Path $packDir | Out-Null

  $png = $files | Where-Object { $_.Extension -ieq '.png' } | Select-Object -First 1
  $json = $files | Where-Object { $_.Extension -ieq '.json' } | Select-Object -First 1

  if ($png) {
    $targetPng = Join-Path $packDir "$packName Sprite Sheet.png"
    Move-Item -Path $png.FullName -Destination $targetPng -Force
  }

  if ($json) {
    if (Test-IsAtlasJson $json.FullName) {
      $targetJson = Join-Path $packDir "$packName Sprite Sheet.json"
      Move-Item -Path $json.FullName -Destination $targetJson -Force
    }
    else {
      $metadataTarget = Join-Path $packDir "$packName Source Metadata.json"
      Move-Item -Path $json.FullName -Destination $metadataTarget -Force
    }
  }
}

$packDirs = Get-ChildItem -Path $sheetsRoot -Directory -ErrorAction SilentlyContinue

foreach ($packDir in $packDirs) {
  $packName = Convert-ToTitleCase $packDir.Name
  $png = Get-ChildItem -Path $packDir.FullName -File -Filter '*.png' | Where-Object { $_.Name -match '(?i)sprite\s*sheet' } | Select-Object -First 1
  if (-not $png) {
    $png = Get-ChildItem -Path $packDir.FullName -File -Filter '*.png' | Select-Object -First 1
  }

  $atlasJson = Get-ChildItem -Path $packDir.FullName -File -Filter '*.json' |
    Where-Object { $_.Name -match '(?i)sprite\s*sheet' -and (Test-IsAtlasJson $_.FullName) } |
    Select-Object -First 1

  if ($png -and -not $atlasJson) {
    $generatedJsonPath = Join-Path $packDir.FullName "$packName Sprite Sheet.json"
    New-AtlasJsonFromPng -pngPath $png.FullName -jsonPath $generatedJsonPath -packName $packName
  }
}

$packRows = @()
$readyCount = 0
$partialCount = 0

$packDirs = Get-ChildItem -Path $sheetsRoot -Directory -ErrorAction SilentlyContinue
foreach ($packDir in $packDirs) {
  $packName = $packDir.Name
  $png = Get-ChildItem -Path $packDir.FullName -File -Filter '*.png' | Where-Object { $_.Name -match '(?i)sprite\s*sheet' } | Select-Object -First 1
  if (-not $png) {
    $png = Get-ChildItem -Path $packDir.FullName -File -Filter '*.png' | Select-Object -First 1
  }

  $atlasJson = Get-ChildItem -Path $packDir.FullName -File -Filter '*.json' |
    Where-Object { $_.Name -match '(?i)sprite\s*sheet' -and (Test-IsAtlasJson $_.FullName) } |
    Select-Object -First 1

  $sheetSize = $null
  $frameCount = 0
  $cellSize = $null
  $actions = @()

  if ($png) {
    $size = Get-ImageSize $png.FullName
    $sheetSize = "$($size.width)x$($size.height)"
  }

  if ($atlasJson) {
    $atlas = Get-Content -Path $atlasJson.FullName -Raw | ConvertFrom-Json
    $frameEntries = Get-AtlasFrameEntries $atlas
    $frameCount = @($frameEntries).Count
    if ($frameCount -gt 0) {
      $firstFrame = $frameEntries[0].Value
      $cellSize = "$($firstFrame.frame.w)x$($firstFrame.frame.h)"
    }
    $actions = Get-ActionGroupsFromAtlas $atlasJson.FullName
  }

  $status = if ($png -and $atlasJson) { 'ready' } else { 'partial' }
  if ($status -eq 'ready') { $readyCount++ } else { $partialCount++ }

  $packRows += [ordered]@{
    name = $packName
    png = if ($png) { $png.Name } else { $null }
    json = if ($atlasJson) { $atlasJson.Name } else { $null }
    sheetSize = $sheetSize
    frameCount = $frameCount
    cellSize = $cellSize
    actions = $actions
    status = $status
  }
}

$manifest = [ordered]@{
  generatedAt = (Get-Date).ToString('yyyy-MM-dd')
  basePath = 'public/agent-pet/imports/new_pets_sprite_sheets'
  packs = $packRows
  standaloneAssets = Get-ChildItem -Path $standaloneRoot -File -ErrorAction SilentlyContinue | ForEach-Object { $_.Name }
}

$manifestPath = Join-Path $importsRoot 'sprite_import_manifest.json'
$manifest | ConvertTo-Json -Depth 10 | Set-Content -Path $manifestPath -Encoding utf8

$totalCount = $packRows.Count
$reportLines = @()
$reportLines += '# Sprite Import Report'
$reportLines += ''
$reportLines += 'Generated from: `public/agent-pet/imports/new_pets_sprite_sheets`'
$reportLines += ''
$reportLines += '## Summary'
$reportLines += ''
$reportLines += "- Ready packs (PNG + JSON): **$readyCount**"
$reportLines += "- Partial packs (missing PNG or JSON): **$partialCount**"
$reportLines += "- Total packs discovered: **$totalCount**"
$reportLines += ''
$reportLines += '## Pack Status'
$reportLines += ''
$reportLines += '| Pack | PNG | JSON | Sheet | Frames | Cell | Status |'
$reportLines += '| ---- | --- | ---- | ----- | -----: | ---- | ------ |'

foreach ($row in ($packRows | Sort-Object -Property name)) {
  $hasPng = if ($row.png) { '✅' } else { '❌' }
  $hasJson = if ($row.json) { '✅' } else { '❌' }
  $sheet = if ($row.sheetSize) { $row.sheetSize } else { 'n/a' }
  $cell = if ($row.cellSize) { $row.cellSize } else { 'n/a' }
  $reportLines += "| $($row.name) | $hasPng | $hasJson | $sheet | $($row.frameCount) | $cell | $($row.status) |"
}

$reportLines += ''
$reportLines += '## Standalone Assets'
$reportLines += ''
$standaloneFiles = @($manifest.standaloneAssets)
if ($standaloneFiles.Count) {
  foreach ($name in ($standaloneFiles | Sort-Object)) {
    $reportLines += "- $name"
  }
}
else {
  $reportLines += '- None'
}

$reportPath = Join-Path $importsRoot 'SPRITE_IMPORT_REPORT.md'
$reportLines -join "`n" | Set-Content -Path $reportPath -Encoding utf8

Write-Output "import crawl complete: $totalCount packs, $readyCount ready, $partialCount partial"
