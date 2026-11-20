import { getCatalogue } from "@/lib/catalogue/fetch";

// Regenerate the slimmed catalogue at most once a day.
export const revalidate = 86400;

export async function GET() {
  const catalogue = await getCatalogue();
  return Response.json(catalogue, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "X-Catalogue-Source": catalogue.source,
    },
  });
}
