import "server-only";
import snapshot from "@/data/fonts-snapshot.json";
import { slimDeveloperApi, slimMetadata } from "./slim";
import type { Catalogue } from "./types";

const METADATA_URL = "https://fonts.google.com/metadata/fonts";
const DEVELOPER_API_URL =
  "https://www.googleapis.com/webfonts/v1/webfonts?capability=VF&sort=popularity";
const TTL_MS = 24 * 60 * 60 * 1000;

let memo: { at: number; catalogue: Catalogue } | null = null;

const bundled = snapshot as Catalogue;

/**
 * Returns the slimmed catalogue. The metadata response is about 2.7MB and sent
 * `no-store`, which is over Next's 2MB fetch-cache limit, so the raw response
 * is never cached: only the slimmed copy, in memory here and at the edge via
 * the route's Cache-Control header.
 */
export async function getCatalogue(): Promise<Catalogue> {
  if (process.env.KERN_FONTS_SOURCE === "snapshot") return bundled;
  if (memo && Date.now() - memo.at < TTL_MS) return memo.catalogue;

  const catalogue =
    (await tryMetadata()) ?? (await tryDeveloperApi()) ?? bundled;
  if (catalogue !== bundled) memo = { at: Date.now(), catalogue };
  return catalogue;
}

async function tryMetadata(): Promise<Catalogue | null> {
  try {
    const res = await fetch(METADATA_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`metadata ${res.status}`);
    const catalogue = slimMetadata(await res.json());
    // A shape change upstream could still parse to almost nothing.
    if (catalogue.families.length < 500) throw new Error("metadata looks truncated");
    return catalogue;
  } catch (err) {
    console.warn("[fonts] metadata endpoint failed:", (err as Error).message);
    return null;
  }
}

async function tryDeveloperApi(): Promise<Catalogue | null> {
  const key = process.env.GOOGLE_FONTS_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${DEVELOPER_API_URL}&key=${encodeURIComponent(key)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`developer api ${res.status}`);
    // The Developer API has no axis registry, so names and steps come from the snapshot.
    return slimDeveloperApi(await res.json(), bundled.axisRegistry);
  } catch (err) {
    console.warn("[fonts] developer API failed:", (err as Error).message);
    return null;
  }
}
