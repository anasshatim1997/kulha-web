# KULHA Morocco basemap build

Install the frontend dependencies, then run the worker preparation and basemap scripts from Windows PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
pnpm add maplibre-gl@6.17.0 pmtiles@4.5.0 @protomaps/basemaps@5.7.2
.\scripts\maps\prepare-map-assets.ps1
.\scripts\maps\build-morocco-basemap.ps1
```

The builder requires Git, Java 21+, Maven and network access to GitHub and the source-data provider. It creates `public/maps/morocco.pmtiles`, local glyph fonts, sprites and a same-origin MapLibre worker. The resulting map is served through `/api/maps/morocco` using HTTP byte-range responses.

### Source data and offline-friendly downloads

The Protomaps builder needs OSM water and land polygon archives. Its built-in downloader uses `osmdata.openstreetmap.de`, which is often slow or times out. The script therefore downloads them itself with resumable `curl` (mirrors: `www.osmdata.org`, the dated FAU mirror, then the primary host), validates the ZIP contents and passes them to the builder with `osm_water_path` / `osm_land_path`. When these files already exist, the builder skips its own download of them.

Working files live in `%TEMP%\kulha-morocco-map-build`. The polygon archives are expected at:

```text
%TEMP%\kulha-morocco-map-build\basemaps\tiles\data\sources\water-polygons-split-3857.zip
%TEMP%\kulha-morocco-map-build\basemaps\tiles\data\sources\land-polygons-split-3857.zip
```

If your network cannot reach any mirror, download both ZIP files in a browser, save them at those paths and rerun the script. Use `-ForceRebuild` to regenerate an existing `morocco.pmtiles`.

The large PMTiles file and generated assets are build artifacts. Keep them out of Git and include them in the runtime deployment artifact.


## Self-hosted driving directions

To draw a real road path after a customer selects a store, run the local OSRM route engine:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\scripts\maps\prepare-morocco-routing.ps1
```

Then add this to `.env.local` and restart Next.js:

```dotenv
KULHA_ROUTING_URL=http://127.0.0.1:5000/route/v1/driving
```

Store pins and ranked offer cards are rendered from the map page's server-loaded offers before the customer grants location access. Selecting a store asks for location only when needed, draws the OSRM driving route and adds a Google Maps directions link. The Google link is an external navigation handoff; Google Maps is not embedded and does not require a Google Maps API key.
