import { getCatalogue } from "@/lib/catalogue/fetch";

// Cached in memory and at the CDN (Cache-Control below) rather than by ISR,
// so a stopgap snapshot answer is never frozen in for a day.
export const dynamic = "force-dynamic";

export async function GET() {
  const catalogue = await getCatalogue();
  // A snapshot answer is a stopgap: let caches drop it quickly.
  const maxAge = catalogue.source === "snapshot" ? 60 : 86400;
  return Response.json(catalogue, {
    headers: {
      "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=604800`,
      "X-Catalogue-Source": catalogue.source,
    },
  });
}
