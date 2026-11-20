/**
 * Refreshes data/fonts-snapshot.json, the last-resort catalogue used when both
 * the metadata endpoint and the Developer API are unavailable.
 *   npx tsx scripts/build-snapshot.ts [path-to-saved-metadata.json]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { slimMetadata } from "../lib/catalogue/slim";

async function main() {
  const file = process.argv[2];
  const raw = file
    ? JSON.parse(readFileSync(file, "utf8"))
    : await fetch("https://fonts.google.com/metadata/fonts").then((r) => r.json());
  const catalogue = { ...slimMetadata(raw), source: "snapshot" as const };
  const json = JSON.stringify(catalogue);
  writeFileSync("data/fonts-snapshot.json", json + "\n");
  console.log(`${catalogue.families.length} families, ${(json.length / 1024).toFixed(0)}KB`);
}

main();
