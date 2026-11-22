/**
 * Offline tests for the ingestion pipeline and the menu advisor. No API keys, no network.
 *   npm run test:ingest
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "forkcast-test-"));
process.env.FORKCAST_DATA_DIR = tmp;
process.env.MIN_REVIEWS = "1000";
process.env.RADIUS_KM = "6";
process.env.CELL_RADIUS_M = "1500";
process.env.GOOGLE_QPS = "1000";

let passed = 0;
const test = async (name: string, fn: () => void | Promise<void>) => { await fn(); passed++; console.log(`  ok  ${name}`); };

async function main() {
  const { cfg } = await import("./config");
  const geo = await import("./geo");
  const { crawl } = await import("./places");
  const { nameSim, pickMatch } = await import("./swiggy-menus");
  const { parseCount, priceScale, buildCatalog } = await import("./build-catalog");
  const { clean } = await import("./analyze");
  const { writeJson } = await import("./util");
  const { filterAndSort, testCatalog } = await import("../../lib/catalog");
  const { advise } = await import("../../lib/advisor");
  const { DEFAULT_PREFS } = await import("../../lib/store");

  // A seeded random generator so failures reproduce.
  let seed = 42;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
  const C = cfg.center;

  await test("hex cover leaves no gaps inside the radius", () => {
    const cells = geo.hexCover(C, 6000, 1500);
    for (let k = 0; k < 3000; k++) {
      const a = rnd() * 2 * Math.PI, d = Math.sqrt(rnd()) * 6000;
      const p = geo.offset(C, Math.sin(a) * d, Math.cos(a) * d);
      assert.ok(cells.some((c) => geo.distM(c, p) <= c.r + 1), `gap at ${p.lat},${p.lng}`);
    }
  });

  await test("splitting a circle covers the whole parent", () => {
    const parent = { ...C, r: 1000 };
    const kids = geo.split(parent);
    for (let k = 0; k < 2000; k++) {
      const a = rnd() * 2 * Math.PI, d = Math.sqrt(rnd()) * 1000;
      const p = geo.offset(C, Math.sin(a) * d, Math.cos(a) * d);
      assert.ok(kids.some((c) => geo.distM(c, p) <= c.r + 1));
    }
  });

  await test("crawl finds every place over the review threshold (mock Nearby Search)", async () => {
    // 4,000 fake places; review counts long-tailed like real ones.
    const places = Array.from({ length: 4000 }, (_, i) => {
      const a = rnd() * 2 * Math.PI, d = Math.sqrt(rnd()) * 7000;
      const p = geo.offset(C, Math.sin(a) * d, Math.cos(a) * d);
      return { id: `p${i}`, displayName: { text: `Place ${i}` }, location: { latitude: p.lat, longitude: p.lng }, userRatingCount: Math.round(Math.exp(rnd() * 10)), rating: 4, businessStatus: "OPERATIONAL" };
    });
    let calls = 0;
    const search = async (c: { lat: number; lng: number; r: number }) => {
      calls++;
      return places.filter((p) => geo.distM(c, { lat: p.location.latitude, lng: p.location.longitude }) <= c.r)
        .sort((a, b) => b.userRatingCount - a.userRatingCount).slice(0, 20);
    };
    const out = await crawl({ search, force: true });
    const expected = places.filter((p) => p.userRatingCount >= 1000 && geo.distKm(C, { lat: p.location.latitude, lng: p.location.longitude }) <= 6);
    assert.equal(out!.places.length, expected.length, `found ${out!.places.length} of ${expected.length}`);
    assert.ok(out!.places.every((p, i, a) => i === 0 || (a[i - 1].userRatingCount ?? 0) >= (p.userRatingCount ?? 0)), "sorted by reviews");
    console.log(`      ${expected.length} qualifying places found with ${calls} searches`);
    const again = await crawl({ search: async () => { throw new Error("should use the cache"); } });
    assert.equal(again!.places.length, expected.length, "second run reads cached circles");
  });

  await test("Swiggy matching prefers the same name nearby", () => {
    assert.ok(nameSim("Meghana Foods", "Meghana Foods (Koramangala)") >= 0.99);
    assert.ok(nameSim("Truffles", "Truffles Ice & Spice") >= 0.99);
    assert.ok(nameSim("Empire Restaurant", "Empire") >= 0.99);
    assert.ok(nameSim("Toit", "Meghana Foods") === 0);
    const place = { id: "x", displayName: { text: "Meghana Foods" }, formattedAddress: "124, 1st Cross, Koramangala, Bengaluru", location: { latitude: 0, longitude: 0 } };
    const m = pickMatch(place, [
      { id: "1", name: "Meghana Foods", areaName: "Residency Road", distanceKm: 6.2 },
      { id: "2", name: "Meghana Foods", areaName: "Koramangala", distanceKm: 0.2 },
      { id: "3", name: "Biryani Bros", areaName: "Koramangala", distanceKm: 0.1 },
    ]);
    assert.equal(m.match?.id, "2");
    assert.equal(pickMatch(place, [{ id: "3", name: "Biryani Bros", distanceKm: 0.1 }]).match, null);
  });

  await test("count and price parsing", () => {
    assert.equal(parseCount("1.2K+"), 1200);
    assert.equal(parseCount("500+"), 500);
    assert.equal(parseCount("12"), 12);
    assert.equal(parseCount(undefined), undefined);
    assert.equal(priceScale([{ id: "a", name: "a", price: 32000 }, { id: "b", name: "b", price: 45000 }]), 0.01);
    assert.equal(priceScale([{ id: "a", name: "a", price: 320 }, { id: "b", name: "b", price: 450 }]), 1);
  });

  await test("analysis keeps only real menu dishes and valid scores", () => {
    const out = clean({ dishes: [{ name: "Ghee Rice", mentions: 2, taste: 4.5, quantity: 9 }, { name: "Made up dish", taste: 5 }] }, ["Ghee rice", "Neer dosa"]);
    assert.equal(out.length, 1);
    assert.equal(out[0].name, "Ghee rice");
    assert.equal(out[0].quantity, undefined);
  });

  await test("catalog build merges raw files into the app's format", () => {
    const pf = JSON.parse(fs.readFileSync(path.join(tmp, "raw", "places.json"), "utf8"));
    const p = pf.places[0];
    writeJson(path.join(tmp, "raw", "details", `${p.id}.json`), { id: p.id, formattedAddress: "1st Cross, Koramangala", photos: [{ name: `places/${p.id}/photos/abc` }], reviewSummary: { text: { text: "People love the ghee roast." } } });
    writeJson(path.join(tmp, "raw", "swiggy", `${p.id}.json`), {
      placeId: p.id, matchedAt: "", match: { id: "s1", name: p.displayName.text, cuisines: ["Mangalorean"], avgRating: 4.4, totalRatings: "10K+", costForTwo: "₹800 for two", areaName: "Koramangala", deliveryTimeMinutes: 31 },
      candidates: [], complete: true,
      categories: [{ title: "Starters", items: [{ id: "i1", name: "Chicken ghee roast", price: 42000, isVeg: false, isBestseller: true, rating: "4.6", totalRatings: "1.1K+" }, { id: "i2", name: "Neer dosa", price: 9000, isVeg: true }] }],
    });
    writeJson(path.join(tmp, "raw", "analysis", `${p.id}.json`), { placeId: p.id, model: "test", analysedAt: "", dishes: [{ name: "Chicken ghee roast", mentions: 3, taste: 4.8, quality: 4.5 }] });
    const rows = buildCatalog();
    const r = rows.find((x) => x.swiggyMatched)!;
    assert.equal(r.menu.length, 2);
    assert.equal(r.menu[0].price, 420, "paise converted to rupees");
    assert.equal(r.menu[0].votes, 1100);
    assert.deepEqual(r.menu[0].scores, { taste: 4.8, quality: 4.5 });
    assert.equal(r.costForTwo, 800);
    assert.equal(r.photo?.place, `places/${p.id}/photos/abc`);
    const listed = filterAndSort(rows, { q: "ghee roast" }, "live", "Koramangala");
    assert.equal(listed.items[0].id, r.id);
    assert.equal(listed.items[0].topDish?.name, "Chicken ghee roast");
  });

  await test("menu copilot respects the menu, the ask and the rules", () => {
    const cat = testCatalog();
    const karavali = cat.find((r) => r.id === "karavali")!;
    const prefs = DEFAULT_PREFS();
    const veg = advise(karavali, "veg", prefs);
    assert.ok(veg.picks.length > 0 && veg.picks.every((p) => p.item.veg));
    const spicy = advise(karavali, "something spicy", prefs);
    assert.equal(spicy.picks[0].item.name, "Chicken ghee roast");
    const jain = advise(karavali, "", { ...prefs, rules: [...prefs.rules, { id: "j", kind: "diet", value: "jain", action: "hide", on: true, source: "you" }] });
    assert.ok(jain.picks.every((p) => p.item.veg), "Jain hides non-veg");
    assert.ok(jain.hidden.length > 0);
    const tiffin = cat.find((r) => r.id === "tiffin")!;
    assert.ok(!advise(tiffin, "", prefs).picks.some((p) => /coffee|jamun/i.test(p.item.name)), "no drinks or desserts unless asked");
    assert.ok(advise(tiffin, "something sweet", prefs).picks.some((p) => /jamun/i.test(p.item.name)));
  });

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${passed} passed`);
}

main().catch((e) => { console.error(e); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(1); });
