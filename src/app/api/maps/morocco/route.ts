import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { parseSingleByteRange } from "@/lib/maps/byte-range";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const archivePath = () => join(process.cwd(), "public", "maps", "morocco.pmtiles");

function baseHeaders(size: number, modifiedAt: number): Headers {
  const headers = new Headers();
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Type", "application/vnd.pmtiles");
  headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  headers.set("ETag", `W/\"${size.toString(16)}-${Math.trunc(modifiedAt).toString(16)}\"`);
  headers.set("Vary", "Range");
  return headers;
}

async function archiveInfo() {
  try {
    const info = await stat(archivePath());
    return info.isFile() && info.size > 0 ? info : null;
  } catch {
    return null;
  }
}

export async function HEAD() {
  const info = await archiveInfo();
  if (!info?.isFile()) return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  const headers = baseHeaders(info.size, info.mtimeMs);
  headers.set("Content-Length", String(info.size));
  return new Response(null, { status: 200, headers });
}

export async function GET(request: Request) {
  const info = await archiveInfo();
  if (!info?.isFile()) {
    return Response.json({ error: "basemap_not_built", message: "Run scripts/maps/build-morocco-basemap.ps1 to create the self-hosted map archive." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const headers = baseHeaders(info.size, info.mtimeMs);
  const parsedRange = parseSingleByteRange(request.headers.get("range"), info.size);
  if (parsedRange && "invalid" in parsedRange) {
    headers.set("Content-Range", `bytes */${info.size}`);
    return new Response(null, { status: 416, headers });
  }

  const start = parsedRange?.start ?? 0;
  const end = parsedRange?.end ?? info.size - 1;
  const status = parsedRange ? 206 : 200;
  if (parsedRange) headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`);

  headers.set("Content-Length", String(end - start + 1));
  const stream = createReadStream(archivePath(), { start, end });
  return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, { status, headers });
}
