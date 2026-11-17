# KULHA self-hosted driving routes

The map tiles and the road router are separate services. MapLibre/PMTiles continue to render the basemap. OSRM calculates a real driving route only after a customer selects a shop.

## Local Windows setup

From `kulha-web`:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\scripts\maps\prepare-morocco-routing.ps1
```

The script downloads the current Geofabrik Morocco OSM PBF, builds an OSRM MLD driving graph in Docker, starts the router on `127.0.0.1:5000`, and checks that a route can be calculated. The PBF is around 230–250 MB; generated `.osrm*` graph files require additional disk space and memory. Keep `infra/routing/data/` out of Git and backups unless you intend to retain the generated graph.

Add this to `kulha-web/.env.local` and restart Next.js:

```dotenv
KULHA_ROUTING_URL=http://127.0.0.1:5000/route/v1/driving
```

The browser calls only the same-origin `/api/bff/map/route` endpoint. The Next.js server contacts OSRM, so no CORS policy or public routing API key is required. In production, deploy OSRM on the private application network and set `KULHA_ROUTING_URL` to its private service URL, for example `http://osrm:5000/route/v1/driving`.

## Customer interaction

- All eligible store markers and ranked list entries are loaded with the map page; location permission is not needed just to browse stores.
- Clicking a store asks for browser location when not already available.
- The server returns a driving route geometry, distance and duration. MapLibre draws the road line and fits both endpoints into view.
- The Google Maps link is a user-initiated external handoff. It includes the origin when location permission was granted; otherwise Google Maps can use the device's location. KULHA does not embed Google Maps or require a Google API key.

## Updating the road graph

Rerun `prepare-morocco-routing.ps1` periodically to download and rebuild from the latest Geofabrik extract. The Geofabrik extract is OpenStreetMap data; comply with ODbL attribution requirements. The app's public basemap still displays its OpenStreetMap and Protomaps attributions.
