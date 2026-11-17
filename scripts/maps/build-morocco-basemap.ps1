param(
  [ValidateRange(3, 32)]
  [int]$HeapSizeGb = 4,
  [switch]$ForceRebuild
)

$ErrorActionPreference = "Stop"

function Get-JavaVersionInfo {
  param([Parameter(Mandatory = $true)][string]$JavaPath)

  $StartInfo = New-Object System.Diagnostics.ProcessStartInfo
  $StartInfo.FileName = $JavaPath
  $StartInfo.Arguments = "-version"
  $StartInfo.UseShellExecute = $false
  $StartInfo.RedirectStandardError = $true
  $StartInfo.RedirectStandardOutput = $true
  $StartInfo.CreateNoWindow = $true

  $Process = New-Object System.Diagnostics.Process
  $Process.StartInfo = $StartInfo
  [void]$Process.Start()
  $StdErrTask = $Process.StandardError.ReadToEndAsync()
  $StdOutTask = $Process.StandardOutput.ReadToEndAsync()
  $Process.WaitForExit()
  $Output = ($StdErrTask.Result + "`n" + $StdOutTask.Result).Trim()

  if ($Process.ExitCode -ne 0) {
    return [pscustomobject]@{ Path = $JavaPath; Major = 0; Output = $Output }
  }

  $Match = [regex]::Match($Output, 'version\s+"1\.(\d+)')
  if ($Match.Success) {
    $Major = [int]$Match.Groups[1].Value
  }
  else {
    $Match = [regex]::Match($Output, '(?:version\s+"?|openjdk\s+)(\d+)')
    if (-not $Match.Success) {
      return [pscustomobject]@{ Path = $JavaPath; Major = 0; Output = $Output }
    }
    $Major = [int]$Match.Groups[1].Value
  }

  return [pscustomobject]@{ Path = $JavaPath; Major = $Major; Output = $Output }
}

function Invoke-NativeChecked {
  param(
    [Parameter(Mandatory = $true)][string]$Executable,
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [Parameter(Mandatory = $true)][string]$FailureMessage
  )

  $PreviousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    & $Executable @Arguments
    $ExitCode = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $PreviousPreference
  }

  if ($ExitCode -ne 0) {
    throw "$FailureMessage Exit code: $ExitCode"
  }
}

function Test-WaterPolygonArchive {
  param([Parameter(Mandatory = $true)][string]$Path)

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
  if ((Get-Item -LiteralPath $Path).Length -lt 1MB) { return $false }

  $Archive = $null
  try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $Archive = [System.IO.Compression.ZipFile]::OpenRead($Path)
    $EntryNames = @($Archive.Entries | ForEach-Object { $_.FullName.Replace('\', '/').ToLowerInvariant() })
    foreach ($Extension in @('shp', 'shx', 'dbf', 'prj')) {
      $Suffix = '/water_polygons.' + $Extension
      if (-not ($EntryNames | Where-Object { $_.EndsWith($Suffix) })) { return $false }
    }
    return $true
  }
  catch {
    return $false
  }
  finally {
    if ($Archive) { $Archive.Dispose() }
  }
}

function Get-FauWaterPolygonUrls {
  $ListingUrl = "https://ftp.fau.de/mirrors/openstreetmapdata.com-archive/"
  try {
    Write-Host "Checking the FAU dated mirror for a recent water-polygons snapshot..." -ForegroundColor Cyan
    $Listing = Invoke-WebRequest -Uri $ListingUrl -UseBasicParsing -TimeoutSec 45
    $DateMatches = [regex]::Matches([string]$Listing.Content, '(20\d{2}-\d{2}-\d{2})/')
    $Dates = @($DateMatches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Descending -Unique | Select-Object -First 5)
    foreach ($Date in $Dates) {
      [pscustomobject]@{
        Name = "fau-$Date"
        Url = "https://ftp.fau.de/mirrors/openstreetmapdata.com-archive/$Date/water-polygons-split-3857.zip"
      }
    }
  }
  catch {
    Write-Warning "Could not read the FAU mirror listing. Other water polygon sources will still be tried."
  }
}

function Get-WaterPolygonArchive {
  param(
    [Parameter(Mandatory = $true)][string]$DestinationPath,
    [Parameter(Mandatory = $true)][string]$SourcesDirectory
  )

  if (Test-WaterPolygonArchive -Path $DestinationPath) {
    Write-Host "Reusing the validated water-polygons archive: $DestinationPath" -ForegroundColor Green
    return $DestinationPath
  }

  if (Test-Path -LiteralPath $DestinationPath) {
    Remove-Item -LiteralPath $DestinationPath -Force
  }

  $CurlCommand = Get-Command curl.exe -ErrorAction SilentlyContinue
  if (-not $CurlCommand) {
    throw "curl.exe was not found. Install a current Windows curl or use Windows 10/11 built-in curl."
  }

  $Sources = New-Object System.Collections.Generic.List[object]
  $Sources.Add([pscustomobject]@{
    Name = "osmdata-mirror"
    Url = "https://www.osmdata.org/download/water-polygons-split-3857.zip"
  })

  foreach ($Mirror in (Get-FauWaterPolygonUrls)) {
    if ($Mirror) { $Sources.Add($Mirror) }
  }

  $Sources.Add([pscustomobject]@{
    Name = "osmdata-primary"
    Url = "https://osmdata.openstreetmap.de/download/water-polygons-split-3857.zip"
  })

  foreach ($Source in $Sources) {
    $PartialPath = Join-Path $SourcesDirectory ("water-polygons-" + $Source.Name + ".zip.part")
    Write-Host "Downloading water polygons from $($Source.Url)" -ForegroundColor Cyan
    Write-Host "This dataset is large. Downloads resume from a partial file and retry transient failures." -ForegroundColor DarkGray

    try {
      $CurlArguments = @(
        "--fail",
        "--location",
        "--show-error",
        "--retry", "8",
        "--retry-all-errors",
        "--retry-delay", "8",
        "--connect-timeout", "45",
        "--max-time", "10800",
        "--continue-at", "-",
        "--output", $PartialPath,
        $Source.Url
      )

      Invoke-NativeChecked -Executable $CurlCommand.Source -Arguments $CurlArguments -FailureMessage "Water polygon download failed from $($Source.Name)."

      if (-not (Test-WaterPolygonArchive -Path $PartialPath)) {
        throw "The downloaded file is not a complete water-polygons ZIP archive."
      }

      Move-Item -LiteralPath $PartialPath -Destination $DestinationPath -Force
      Write-Host "Water polygons downloaded and validated." -ForegroundColor Green
      return $DestinationPath
    }
    catch {
      Write-Warning "Source $($Source.Name) failed: $($_.Exception.Message)"
    }
  }

  throw @"
Could not download a valid water-polygons archive from any configured source.
The main osmdata.openstreetmap.de endpoint is often slow or times out.
Check your network/proxy, then rerun this script. Valid partial downloads are retained for resume.
Alternatively download water-polygons-split-3857.zip in a browser and save it to:
  $DestinationPath
then rerun the script; it validates and reuses a valid file.
"@
}


function Test-LandPolygonArchive {
  param([Parameter(Mandatory = $true)][string]$Path)

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
  if ((Get-Item -LiteralPath $Path).Length -lt 1MB) { return $false }

  $Archive = $null
  try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $Archive = [System.IO.Compression.ZipFile]::OpenRead($Path)
    $EntryNames = @($Archive.Entries | ForEach-Object { $_.FullName.Replace('\', '/').ToLowerInvariant() })
    foreach ($Extension in @('shp', 'shx', 'dbf', 'prj')) {
      $Suffix = '/land_polygons.' + $Extension
      if (-not ($EntryNames | Where-Object { $_.EndsWith($Suffix) })) { return $false }
    }
    return $true
  }
  catch {
    return $false
  }
  finally {
    if ($Archive) { $Archive.Dispose() }
  }
}

function Get-FauLandPolygonUrls {
  $ListingUrl = "https://ftp.fau.de/mirrors/openstreetmapdata.com-archive/"
  try {
    Write-Host "Checking the FAU dated mirror for a recent land-polygons snapshot..." -ForegroundColor Cyan
    $Listing = Invoke-WebRequest -Uri $ListingUrl -UseBasicParsing -TimeoutSec 45
    $DateMatches = [regex]::Matches([string]$Listing.Content, '(20\d{2}-\d{2}-\d{2})/')
    $Dates = @($DateMatches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Descending -Unique | Select-Object -First 5)
    foreach ($Date in $Dates) {
      [pscustomobject]@{
        Name = "fau-$Date"
        Url = "https://ftp.fau.de/mirrors/openstreetmapdata.com-archive/$Date/land-polygons-split-3857.zip"
      }
    }
  }
  catch {
    Write-Warning "Could not read the FAU mirror listing. Other land polygon sources will still be tried."
  }
}

function Get-LandPolygonArchive {
  param(
    [Parameter(Mandatory = $true)][string]$DestinationPath,
    [Parameter(Mandatory = $true)][string]$SourcesDirectory
  )

  if (Test-LandPolygonArchive -Path $DestinationPath) {
    Write-Host "Reusing the validated land-polygons archive: $DestinationPath" -ForegroundColor Green
    return $DestinationPath
  }

  if (Test-Path -LiteralPath $DestinationPath) {
    Remove-Item -LiteralPath $DestinationPath -Force
  }

  $CurlCommand = Get-Command curl.exe -ErrorAction SilentlyContinue
  if (-not $CurlCommand) {
    throw "curl.exe was not found. Install a current Windows curl or use Windows 10/11 built-in curl."
  }

  $Sources = New-Object System.Collections.Generic.List[object]
  $Sources.Add([pscustomobject]@{
    Name = "osmdata-mirror"
    Url = "https://www.osmdata.org/download/land-polygons-split-3857.zip"
  })

  foreach ($Mirror in (Get-FauLandPolygonUrls)) {
    if ($Mirror) { $Sources.Add($Mirror) }
  }

  $Sources.Add([pscustomobject]@{
    Name = "osmdata-primary"
    Url = "https://osmdata.openstreetmap.de/download/land-polygons-split-3857.zip"
  })

  foreach ($Source in $Sources) {
    $PartialPath = Join-Path $SourcesDirectory ("land-polygons-" + $Source.Name + ".zip.part")
    Write-Host "Downloading land polygons from $($Source.Url)" -ForegroundColor Cyan
    try {
      $CurlArguments = @(
        "--fail", "--location", "--show-error", "--retry", "8", "--retry-all-errors",
        "--retry-delay", "8", "--connect-timeout", "45", "--max-time", "10800",
        "--continue-at", "-", "--output", $PartialPath, $Source.Url
      )
      Invoke-NativeChecked -Executable $CurlCommand.Source -Arguments $CurlArguments -FailureMessage "Land polygon download failed from $($Source.Name)."
      if (-not (Test-LandPolygonArchive -Path $PartialPath)) {
        throw "The downloaded file is not a complete land-polygons ZIP archive."
      }
      Move-Item -LiteralPath $PartialPath -Destination $DestinationPath -Force
      Write-Host "Land polygons downloaded and validated." -ForegroundColor Green
      return $DestinationPath
    }
    catch {
      Write-Warning "Source $($Source.Name) failed: $($_.Exception.Message)"
    }
  }

  throw "Could not download a valid land-polygons archive. Check your network/proxy and rerun this script. Valid partial downloads are retained. You can also download land-polygons-split-3857.zip in a browser and save it to: $DestinationPath"
}

function Patch-BasemapWaterLayer {
  param([Parameter(Mandatory = $true)][string]$BasemapsDirectory)

  $WaterJavaPath = Join-Path $BasemapsDirectory "tiles/src/main/java/com/protomaps/basemap/layers/Water.java"
  if (-not (Test-Path -LiteralPath $WaterJavaPath -PathType Leaf)) {
    throw "Could not find the Protomaps Water.java source file at $WaterJavaPath"
  }

  $Source = [System.IO.File]::ReadAllText($WaterJavaPath)
  if ($Source.Contains('sf.setTag("name", nameOverride);')) {
    $MutationPattern = '(?s)\s*if\s*\(nameOverride\s*!=\s*null\)\s*\{\s*sf\.setTag\("name",\s*nameOverride\);\s*\}'
    $MutationMatches = [regex]::Matches($Source, $MutationPattern)
    if ($MutationMatches.Count -ne 1) {
      throw "The upstream Water.java mutation was found but could not be patched safely."
    }
    $Source = [regex]::Replace($Source, $MutationPattern, "`r`n")
    $Source = $Source.Replace('OsmNames.setOsmNames(feat, sf, 0);', 'setOsmNamesWithOverride(feat, sf, 0, nameOverride);')
    $Source = $Source.Replace('OsmNames.setOsmNames(waterLabelPosition, sf, 0);', 'setOsmNamesWithOverride(waterLabelPosition, sf, 0, nameOverride);')
    $Helper = @'
  private static FeatureCollector.Feature setOsmNamesWithOverride(FeatureCollector.Feature feature, SourceFeature sf,
    int minZoom, String nameOverride) {
    OsmNames.setOsmNames(feature, sf, minZoom);
    if (nameOverride != null) {
      feature.setAttrWithMinzoom("name", nameOverride, minZoom);
    }
    return feature;
  }
'@
    $Anchor = '  public void processOsm(SourceFeature sf, FeatureCollector features) {'
    if (-not $Source.Contains($Anchor)) {
      throw "Could not find the Water.processOsm insertion point."
    }
    $Source = $Source.Replace($Anchor, $Helper + "`r`n`r`n" + $Anchor)
    if ($Source.Contains('sf.setTag("name", nameOverride);')) {
      throw "The unsafe SourceFeature tag mutation remains after patching."
    }
    [System.IO.File]::WriteAllText($WaterJavaPath, $Source, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "Patched the Protomaps water-name override to avoid mutating immutable OSM tags." -ForegroundColor Green
    return
  }

  if ($Source.Contains('setOsmNamesWithOverride(')) {
    Write-Host "Protomaps water-name compatibility patch is already applied." -ForegroundColor Green
    return
  }

  Write-Host "No unsafe Water.java name mutation was found; no source patch was needed." -ForegroundColor Green
}

function Test-PMTilesArchive {
  param([Parameter(Mandatory = $true)][string]$Path)

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
  if ((Get-Item -LiteralPath $Path).Length -lt 127) { return $false }

  $Stream = $null
  try {
    $Stream = [System.IO.File]::OpenRead($Path)
    $Bytes = New-Object byte[] 7
    $Read = $Stream.Read($Bytes, 0, 7)
    if ($Read -ne 7) { return $false }
    return ([System.Text.Encoding]::ASCII.GetString($Bytes) -eq "PMTiles")
  }
  catch {
    return $false
  }
  finally {
    if ($Stream) { $Stream.Dispose() }
  }
}

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$OutputDirectory = Join-Path $ProjectRoot "public/maps"
$OutputArchive = Join-Path $OutputDirectory "morocco.pmtiles"
$WorkDirectory = Join-Path $env:TEMP "kulha-morocco-map-build"
$BasemapsDirectory = Join-Path $WorkDirectory "basemaps"
$AssetsDirectory = Join-Path $WorkDirectory "basemaps-assets"
$SourcesDirectory = Join-Path $WorkDirectory "external-sources"
$TilesDirectory = Join-Path $BasemapsDirectory "tiles"
$TileSourcesDirectory = Join-Path $TilesDirectory "data/sources"
$WaterArchive = Join-Path $TileSourcesDirectory "water-polygons-split-3857.zip"
$LandArchive = Join-Path $TileSourcesDirectory "land-polygons-split-3857.zip"
$PlanetilerTempDirectory = Join-Path $WorkDirectory "planetiler-temp"
$BuildConfigPath = Join-Path $WorkDirectory "kulha-basemap.properties"

New-Item -ItemType Directory -Force -Path $OutputDirectory, $WorkDirectory, $SourcesDirectory, $PlanetilerTempDirectory | Out-Null

$JavaCandidates = New-Object System.Collections.Generic.List[string]
if ($env:JAVA_HOME) {
  $JavaHomeCandidate = Join-Path $env:JAVA_HOME "bin/java.exe"
  if (Test-Path $JavaHomeCandidate) { $JavaCandidates.Add($JavaHomeCandidate) }
}

$PathJava = Get-Command java.exe -ErrorAction SilentlyContinue
if ($PathJava -and $PathJava.Source) { $JavaCandidates.Add($PathJava.Source) }

$JavaRoots = @(
  (Join-Path $env:ProgramFiles "Eclipse Adoptium"),
  (Join-Path $env:ProgramFiles "Java"),
  (Join-Path $env:ProgramFiles "Microsoft"),
  (Join-Path $env:ProgramFiles "Amazon Corretto"),
  (Join-Path $env:ProgramFiles "Zulu"),
  (Join-Path $env:LOCALAPPDATA "Programs/Eclipse Adoptium")
)

foreach ($Root in $JavaRoots) {
  if (Test-Path $Root) {
    Get-ChildItem -Path $Root -Directory -ErrorAction SilentlyContinue | ForEach-Object {
      $Candidate = Join-Path $_.FullName "bin/java.exe"
      if (Test-Path $Candidate) { $JavaCandidates.Add($Candidate) }
    }
  }
}

$JavaInfos = @()
$SeenJavaPaths = @{}
foreach ($Candidate in $JavaCandidates) {
  try { $NormalizedCandidate = [System.IO.Path]::GetFullPath($Candidate) } catch { continue }
  if ($SeenJavaPaths.ContainsKey($NormalizedCandidate)) { continue }
  $SeenJavaPaths[$NormalizedCandidate] = $true
  $JavaInfos += Get-JavaVersionInfo -JavaPath $NormalizedCandidate
}

$SelectedJava = $JavaInfos | Where-Object { $_.Major -ge 21 } | Select-Object -First 1
if (-not $SelectedJava) {
  $Detected = if ($JavaInfos.Count -gt 0) {
    ($JavaInfos | ForEach-Object { "$($_.Path) => Java $($_.Major)" }) -join [Environment]::NewLine
  }
  else {
    "No Java executable was found."
  }

  throw @"
Protomaps basemap generation requires JDK 21 or newer.
Install JDK 21 with:
  winget install --id EclipseAdoptium.Temurin.21.JDK --exact

Detected Java installations:
$Detected
"@
}

$SelectedJavaHome = Split-Path -Parent (Split-Path -Parent $SelectedJava.Path)
$env:JAVA_HOME = $SelectedJavaHome
$env:Path = (Join-Path $SelectedJavaHome "bin") + ";" + $env:Path
Write-Host "Using JDK $($SelectedJava.Major): $($SelectedJava.Path)" -ForegroundColor Green

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git is required. Install Git for Windows and rerun this script."
}
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
  throw "Maven is required. Install Maven and rerun this script."
}

if (-not (Test-Path (Join-Path $BasemapsDirectory ".git"))) {
  if (Test-Path $BasemapsDirectory) { Remove-Item $BasemapsDirectory -Recurse -Force }
  Invoke-NativeChecked -Executable (Get-Command git).Source -Arguments @("clone", "--depth", "1", "https://github.com/protomaps/basemaps.git", $BasemapsDirectory) -FailureMessage "Could not clone the Protomaps basemap builder repository."
}

New-Item -ItemType Directory -Force -Path $TileSourcesDirectory | Out-Null
Patch-BasemapWaterLayer -BasemapsDirectory $BasemapsDirectory

$NeedsBuild = $ForceRebuild -or -not (Test-PMTilesArchive -Path $OutputArchive)
if ($NeedsBuild) {
  if (Test-Path -LiteralPath $OutputArchive) {
    Write-Warning "An incomplete or invalid PMTiles file exists and will be replaced."
    Remove-Item -LiteralPath $OutputArchive -Force
  }

  $LegacyWaterArchive = Join-Path $SourcesDirectory "water-polygons-split-3857.zip"
  $LegacyLandArchive = Join-Path $SourcesDirectory "land-polygons-split-3857.zip"

  if (-not (Test-WaterPolygonArchive -Path $WaterArchive) -and (Test-WaterPolygonArchive -Path $LegacyWaterArchive)) {
    Write-Host "Migrating the previously downloaded water archive into the exact Protomaps source directory..." -ForegroundColor Cyan
    Copy-Item -LiteralPath $LegacyWaterArchive -Destination $WaterArchive -Force
  }
  if (-not (Test-LandPolygonArchive -Path $LandArchive) -and (Test-LandPolygonArchive -Path $LegacyLandArchive)) {
    Write-Host "Migrating the previously downloaded land archive into the exact Protomaps source directory..." -ForegroundColor Cyan
    Copy-Item -LiteralPath $LegacyLandArchive -Destination $LandArchive -Force
  }

  $WaterArchive = Get-WaterPolygonArchive -DestinationPath $WaterArchive -SourcesDirectory $SourcesDirectory
  $LandArchive = Get-LandPolygonArchive -DestinationPath $LandArchive -SourcesDirectory $SourcesDirectory

  if (-not (Test-WaterPolygonArchive -Path $WaterArchive)) {
    throw "Validated water polygons are not present at the Protomaps source path: $WaterArchive"
  }
  if (-not (Test-LandPolygonArchive -Path $LandArchive)) {
    throw "Validated land polygons are not present at the Protomaps source path: $LandArchive"
  }

  Write-Host "Verified local source files used by Protomaps:" -ForegroundColor Green
  Write-Host "  osm_water => $WaterArchive" -ForegroundColor Green
  Write-Host "  osm_land  => $LandArchive" -ForegroundColor Green

  $WaterPathForProperties = $WaterArchive.Replace("\", "/")
  $LandPathForProperties = $LandArchive.Replace("\", "/")
  $TempPathForProperties = $PlanetilerTempDirectory.Replace("\", "/")
  if (Test-Path -LiteralPath $PlanetilerTempDirectory) {
    Get-ChildItem -LiteralPath $PlanetilerTempDirectory -Force | Remove-Item -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $PlanetilerTempDirectory | Out-Null

  $BuildConfig = @(
    "osm_water_path=$WaterPathForProperties",
    "osm_land_path=$LandPathForProperties",
    "temp_nodes=$TempPathForProperties/node.db",
    "temp_multipolygons=$TempPathForProperties/multipolygon.db",
    "temp_features=$TempPathForProperties/features.db",
    "http_timeout=300s",
    "download_threads=2",
    "threads=4"
  )

  $OsmPath = Join-Path $TileSourcesDirectory "morocco.osm.pbf"
  if (Test-Path -LiteralPath $OsmPath -PathType Leaf) {
    $BuildConfig += "osm_path=$($OsmPath.Replace('\', '/'))"
  }
  $NaturalEarthCandidates = @(
    (Join-Path $TileSourcesDirectory "natural_earth_vector.sqlite.zip"),
    (Join-Path $TileSourcesDirectory "natural_earth_vector.gpkg.zip")
  )
  $NaturalEarthPath = $NaturalEarthCandidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
  if ($NaturalEarthPath) {
    $BuildConfig += "ne_path=$($NaturalEarthPath.Replace('\', '/'))"
  }
  $LandcoverPath = Join-Path $TileSourcesDirectory "daylight-landcover.gpkg"
  if (Test-Path -LiteralPath $LandcoverPath -PathType Leaf) {
    $BuildConfig += "landcover_path=$($LandcoverPath.Replace('\', '/'))"
  }

  Set-Content -LiteralPath $BuildConfigPath -Value $BuildConfig -Encoding ASCII
  Write-Host "Planetiler config uses source-specific local paths: osm_water_path and osm_land_path." -ForegroundColor Green
  Write-Host "Planetiler temporary databases: $PlanetilerTempDirectory" -ForegroundColor DarkGray

  Push-Location $TilesDirectory
  try {
    Invoke-NativeChecked -Executable (Get-Command mvn).Source -Arguments @("clean", "package", "-DskipTests") -FailureMessage "The Protomaps tile builder did not compile."

    $BuilderJar = Get-ChildItem (Join-Path (Get-Location) "target") -Filter "*-with-deps.jar" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $BuilderJar) { throw "Could not locate the compiled basemap builder JAR." }

    $BuilderArguments = @(
      "-Xmx${HeapSizeGb}g",
      "-jar", $BuilderJar.FullName,
      "--config=$BuildConfigPath",
      "--osm_water_path=$WaterPathForProperties",
      "--osm_land_path=$LandPathForProperties",
      "--download",
      "--force",
      "--area=morocco",
      "--output=$OutputArchive"
    )

    Invoke-NativeChecked -Executable $SelectedJava.Path -Arguments $BuilderArguments -FailureMessage "Morocco vector tile generation failed."
  }
  finally {
    Pop-Location
  }
}
else {
  Write-Host "A valid Morocco PMTiles archive already exists. Skipping the expensive tile build." -ForegroundColor Green
  Write-Host "Use -ForceRebuild to regenerate it from current source data."
}

if (-not (Test-PMTilesArchive -Path $OutputArchive)) {
  throw "The Morocco PMTiles archive is missing or invalid. The build did not complete successfully."
}

if (-not (Test-Path (Join-Path $AssetsDirectory ".git"))) {
  if (Test-Path $AssetsDirectory) { Remove-Item $AssetsDirectory -Recurse -Force }
  Invoke-NativeChecked -Executable (Get-Command git).Source -Arguments @("clone", "--depth", "1", "https://github.com/protomaps/basemaps-assets.git", $AssetsDirectory) -FailureMessage "Could not clone the basemap font and sprite assets."
}

$FontsSource = Join-Path $AssetsDirectory "fonts"
$SpritesV4 = Join-Path $AssetsDirectory "sprites/v4"
$SpritesV3 = Join-Path $AssetsDirectory "sprites/v3"
if (Test-Path $SpritesV4) {
  $SpritesSource = $SpritesV4
}
elseif (Test-Path $SpritesV3) {
  $SpritesSource = $SpritesV3
}
else {
  throw "No supported basemap sprite directory was found."
}

$FontsTarget = Join-Path $OutputDirectory "assets/fonts"
$SpritesTarget = Join-Path $OutputDirectory "assets/sprites"
New-Item -ItemType Directory -Force -Path $FontsTarget, $SpritesTarget | Out-Null
Get-ChildItem $FontsTarget -Force | Remove-Item -Recurse -Force
Get-ChildItem $SpritesTarget -Force | Remove-Item -Recurse -Force
Copy-Item (Join-Path $FontsSource "*") $FontsTarget -Recurse -Force
$SpriteVersion = Split-Path $SpritesSource -Leaf
Copy-Item $SpritesSource (Join-Path $SpritesTarget $SpriteVersion) -Recurse -Force
Set-Content -Path (Join-Path $OutputDirectory "assets/sprite-version.txt") -Value $SpriteVersion -Encoding ascii

$WorkerSource = Join-Path $ProjectRoot "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs"
if (Test-Path $WorkerSource) {
  Copy-Item $WorkerSource (Join-Path $ProjectRoot "public/maplibre-gl-worker.mjs") -Force
}
else {
  Write-Warning "MapLibre worker was not found. Run pnpm add first, then scripts/maps/prepare-map-assets.ps1."
}

Write-Host "Morocco self-hosted basemap created: $OutputArchive" -ForegroundColor Green
Write-Host "Basemap size: $([math]::Round((Get-Item $OutputArchive).Length / 1MB, 1)) MB"
Write-Host "Fonts and sprites copied into public/maps/assets."
Write-Host "OSRM routing is separate and was not rebuilt by this script."
Write-Host "Restart the frontend and open /offers/map to verify the map."
