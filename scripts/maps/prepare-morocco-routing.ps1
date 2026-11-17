param(
    [switch]$SkipDownload,
    [switch]$ForceRebuild
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$DataDirectory = Join-Path $ProjectRoot 'infra/routing/data'
$PbfPath = Join-Path $DataDirectory 'morocco-latest.osm.pbf'
$PbfUrl = 'https://download.geofabrik.de/africa/morocco-latest.osm.pbf'
$Image = 'ghcr.io/project-osrm/osrm-backend:26.10-debian'
$ComposeFile = Join-Path $ProjectRoot 'infra/routing/docker-compose.yml'
$BaseFile = Join-Path $DataDirectory 'morocco-latest.osrm'
$ComposeDirectory = Split-Path -Parent $ComposeFile

function Invoke-DockerChecked {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$DockerArguments,
        [Parameter(Mandatory = $true)]
        [string]$FailureMessage
    )

    & docker @DockerArguments
    if ($LASTEXITCODE -ne 0) {
        throw $FailureMessage
    }
}

New-Item -ItemType Directory -Force -Path $DataDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $ComposeDirectory | Out-Null

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker Desktop is required. Install and start Docker Desktop, then rerun this script.'
}

Invoke-DockerChecked -DockerArguments @('info') -FailureMessage 'Docker Desktop is not running.'

if (-not (Test-Path -LiteralPath $PbfPath)) {
    if ($SkipDownload) {
        throw "Morocco OSM extract is missing: $PbfPath"
    }

    Write-Host 'Downloading the Morocco road network extract (approximately 230-250 MB)...' -ForegroundColor Cyan
    Invoke-WebRequest -Uri $PbfUrl -OutFile $PbfPath -UseBasicParsing
}

if (-not (Test-Path -LiteralPath $PbfPath)) {
    throw 'The Morocco OSM extract was not created. Check the download and try again.'
}

$ComposeContent = @"
services:
  osrm:
    image: $Image
    container_name: kulha-osrm-morocco
    command: ["osrm-routed", "--algorithm", "mld", "--ip", "0.0.0.0", "--port", "5000", "/data/morocco-latest.osrm"]
    volumes:
      - ./data:/data:ro
    ports:
      - "127.0.0.1:5000:5000"
    restart: unless-stopped
"@

$Utf8WithBom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText($ComposeFile, $ComposeContent, $Utf8WithBom)
Write-Host "Updated Docker Compose to use $Image" -ForegroundColor Green

Write-Host "Pulling OSRM image $Image..." -ForegroundColor Cyan
Invoke-DockerChecked -DockerArguments @('pull', $Image) -FailureMessage "Could not pull $Image from GitHub Container Registry. Check your internet connection."

$GraphExists = (Test-Path -LiteralPath "$BaseFile.partition") -and (Test-Path -LiteralPath "$BaseFile.cells") -and (Test-Path -LiteralPath "$BaseFile.mldgr")
if ($ForceRebuild -or -not $GraphExists) {
    $DockerDataDirectory = $DataDirectory -replace '\\', '/'
    $VolumeMount = "type=bind,source=$DockerDataDirectory,target=/data"

    Write-Host 'Extracting the driving network...' -ForegroundColor Cyan
    Invoke-DockerChecked -DockerArguments @('run', '--rm', '--mount', $VolumeMount, $Image, 'osrm-extract', '-p', '/opt/car.lua', '/data/morocco-latest.osm.pbf') -FailureMessage 'OSRM extract failed.'

    Write-Host 'Partitioning the network...' -ForegroundColor Cyan
    Invoke-DockerChecked -DockerArguments @('run', '--rm', '--mount', $VolumeMount, $Image, 'osrm-partition', '/data/morocco-latest.osrm') -FailureMessage 'OSRM partition failed.'

    Write-Host 'Customizing the network...' -ForegroundColor Cyan
    Invoke-DockerChecked -DockerArguments @('run', '--rm', '--mount', $VolumeMount, $Image, 'osrm-customize', '/data/morocco-latest.osrm') -FailureMessage 'OSRM customize failed.'
}
else {
    Write-Host 'An OSRM graph already exists. Skipping graph extraction.' -ForegroundColor Green
    Write-Host 'Use -ForceRebuild to rebuild it from the downloaded PBF.' -ForegroundColor DarkGray
}

Write-Host 'Pulling the compose service image...' -ForegroundColor Cyan
Invoke-DockerChecked -DockerArguments @('compose', '-f', $ComposeFile, '--project-directory', $ComposeDirectory, 'pull') -FailureMessage 'Docker Compose could not pull the configured OSRM image.'

Write-Host 'Starting the local OSRM service...' -ForegroundColor Cyan
Invoke-DockerChecked -DockerArguments @('compose', '-f', $ComposeFile, '--project-directory', $ComposeDirectory, 'up', '-d', '--force-recreate') -FailureMessage 'Could not start the local OSRM service.'

$RunningImage = (& docker inspect --format '{{.Config.Image}}' kulha-osrm-morocco 2>$null | Select-Object -First 1)
if ($LASTEXITCODE -ne 0 -or $RunningImage.Trim() -ne $Image) {
    throw "The running OSRM container is not using the expected image. Expected '$Image'; found '$RunningImage'."
}

Write-Host 'Waiting for the routing endpoint...' -ForegroundColor Cyan
$CoordinateSeparator = [string][char]59
$CoordinatePair = '-7.5898,33.5731' + $CoordinateSeparator + '-7.6000,33.5800'
$ProbeUrl = 'http://127.0.0.1:5000/route/v1/driving/{0}?overview=false' -f $CoordinatePair
$Ready = $false
$LastRouteError = 'No response yet.'

for ($Attempt = 0; $Attempt -lt 30; $Attempt++) {
    try {
        $Response = Invoke-RestMethod -Uri $ProbeUrl -TimeoutSec 5 -ErrorAction Stop
        if ($Response.code -eq 'Ok' -and $Response.routes.Count -gt 0) {
            $Ready = $true
            break
        }
        $LastRouteError = "OSRM returned code '$($Response.code)'."
    }
    catch {
        $LastRouteError = $_.Exception.Message
        Start-Sleep -Seconds 2
    }
}

if (-not $Ready) {
    Write-Host 'OSRM container logs:' -ForegroundColor Yellow
    & docker logs kulha-osrm-morocco
    throw "OSRM started but did not return a driving route. Last error: $LastRouteError"
}

Write-Host 'KULHA Morocco driving routes are ready at http://127.0.0.1:5000' -ForegroundColor Green
Write-Host 'Add this to kulha-web/.env.local:' -ForegroundColor Yellow
Write-Host 'KULHA_ROUTING_URL=http://127.0.0.1:5000/route/v1/driving' -ForegroundColor Yellow
