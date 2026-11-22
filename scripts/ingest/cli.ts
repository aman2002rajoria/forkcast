/**
 * Forkcast ingestion. One entry point for every stage:
 *
 *   npm run ingest:places     Google Places: restaurants around the centre with MIN_REVIEWS+ reviews
 *   npm run ingest:details    Google Places: reviews, photos, review summary per place
 *   npm run swiggy:login      Swiggy MCP sign-in (browser, phone + OTP), once
 *   npm run ingest:swiggy     Swiggy MCP: match each place, fetch its menu
 *   npm run ingest:analyze    Gemini: score dishes reviewers mention (optional)
 *   npm run ingest:build      Merge everything into data/catalog/restaurants.json
 *   npm run ingest:all        All of the above except login, in order
 *
 * Flags: --dry-run (places only), --force (ignore caches), --limit N, --only matched (build only)
 */
import { args, cfg } from "./config";
import { crawl } from "./places";
import { fetchDetails } from "./details";
import { connectSwiggy, SwiggySignedOut } from "./swiggy-mcp";
import { fetchMenus } from "./swiggy-menus";
import { analyze } from "./analyze";
import { buildCatalog } from "./build-catalog";
import { log } from "./util";

async function main() {
  const stage = process.argv[2];
  const a = args();
  switch (stage) {
    case "places": await crawl({ force: a.force, dryRun: a.dryRun }); break;
    case "details": await fetchDetails({ force: a.force, limit: a.limit }); break;
    case "login": {
      const client = await connectSwiggy(true);
      const { tools } = await client.listTools();
      log(`Signed in to Swiggy. ${tools.length} tools: ${tools.map((t) => t.name).join(", ")}`);
      await client.close();
      break;
    }
    case "swiggy": await fetchMenus({ force: a.force, limit: a.limit }); break;
    case "analyze": await analyze({ force: a.force, limit: a.limit }); break;
    case "build": buildCatalog({ onlyMatched: a.only === "matched" }); break;
    case "all":
      await crawl({ force: a.force });
      await fetchDetails({ force: a.force });
      try { await fetchMenus({ force: a.force, limit: a.limit }); } catch (e) { if (e instanceof SwiggySignedOut) log(`Skipping Swiggy: ${e.message}`); else throw e; }
      if (cfg.geminiKey) await analyze({ force: a.force, limit: a.limit }); else log("Skipping analysis: no GEMINI_API_KEY.");
      buildCatalog();
      break;
    default:
      console.log("Usage: tsx scripts/ingest/cli.ts <places|details|login|swiggy|analyze|build|all> [--dry-run] [--force] [--limit N]");
      process.exit(stage ? 1 : 0);
  }
}

main().catch((e) => { console.error(`\n${(e as Error).message ?? e}`); process.exit(1); });
