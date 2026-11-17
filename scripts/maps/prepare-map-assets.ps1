$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$MapLibreDist = Join-Path $ProjectRoot "node_modules/maplibre-gl/dist"
$PublicDirectory = Join-Path $ProjectRoot "public"

$Assets = @(
  @{
    Name = "MapLibre worker"
    Source = Join-Path $MapLibreDist "maplibre-gl-worker.mjs"
    Target = Join-Path $PublicDirectory "maplibre-gl-worker.mjs"
  },
  @{
    Name = "MapLibre shared worker module"
    Source = Join-Path $MapLibreDist "maplibre-gl-shared.mjs"
    Target = Join-Path $PublicDirectory "maplibre-gl-shared.mjs"
  }
)

if (-not (Test-Path $MapLibreDist -PathType Container)) {
  throw "MapLibre is not installed. From the kulha-web folder run: pnpm add maplibre-gl@6.17.0 pmtiles@4.5.0 @protomaps/basemaps@5.7.2"
}

$MissingSources = @($Assets | Where-Object { -not (Test-Path $_.Source -PathType Leaf) })
if ($MissingSources.Count -gt 0) {
  $MissingNames = ($MissingSources | ForEach-Object { $_.Name + " (" + $_.Source + ")" }) -join "; "
  throw "Required MapLibre distribution files are missing: $MissingNames. Reinstall maplibre-gl@6.17.0 with pnpm install, then run this script again."
}

New-Item -ItemType Directory -Force -Path $PublicDirectory | Out-Null

foreach ($Asset in $Assets) {
  Copy-Item -LiteralPath $Asset.Source -Destination $Asset.Target -Force
  if (-not (Test-Path $Asset.Target -PathType Leaf)) {
    throw "Could not install $($Asset.Name) at $($Asset.Target)."
  }
  $SizeKb = [math]::Round((Get-Item -LiteralPath $Asset.Target).Length / 1KB, 1)
  Write-Host ("Installed {0}: public/{1} ({2} KB)" -f $Asset.Name, (Split-Path $Asset.Target -Leaf), $SizeKb) -ForegroundColor Green
}

Write-Host "MapLibre browser assets are ready. Refresh /offers/map." -ForegroundColor Green
