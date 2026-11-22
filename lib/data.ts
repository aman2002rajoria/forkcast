import type { Dish, Restaurant, Order } from "./types";

/**
 * Test data. Restaurant names are made up; the localities are real Bengaluru areas.
 * In live mode these come from the Swiggy MCP (menus, prices, dish ratings),
 * Google Places (reviews, photos) and the vision pipeline (photo-to-dish matches).
 */
export const HOME = { area: "Indiranagar", city: "Bengaluru" };

export const SHARED_KITCHEN_BRANDS = [
  "Biryani Bros", "Dumpling Depot", "Tandoor Tales", "Wrap Republic", "Pasta Point", "Rolls & Bowls", "The Chinese Box",
  "Burger Bay", "Khichdi Co.", "Shake Lab", "Mughlai Mehfil", "Paratha Planet", "Dessert Dept.", "Healthy Habit",
];

export const RESTAURANTS: Record<string, Restaurant> = {
  smoke: { id: "smoke", name: "Smoke Theory", area: "Indiranagar", km: 1.2, eta: 28, type: "dinein", g: 4.4, gN: 21480, sw: 4.3, swN: "10K+", addr: "12th Main, HAL 2nd Stage", since: 2019 },
  karavali: { id: "karavali", name: "Karavali Table", area: "Domlur", km: 2.4, eta: 32, type: "dinein", g: 4.3, gN: 12850, sw: 4.2, swN: "5K+", addr: "Old Airport Road", since: 2016 },
  hoysala: { id: "hoysala", name: "Hoysala Military Hotel", area: "Basavanagudi", km: 7.8, eta: 44, type: "dinein", g: 4.5, gN: 26900, sw: 4.5, swN: "25K+", addr: "Bull Temple Road", since: 1972 },
  tiffin: { id: "tiffin", name: "Malleshwaram Tiffin Room", area: "Malleshwaram", km: 9.1, eta: 47, type: "dinein", g: 4.6, gN: 24300, sw: 4.6, swN: "20K+", addr: "8th Cross, Malleshwaram", since: 1958 },
  corner: { id: "corner", name: "Corner Chai Co.", area: "Indiranagar", km: 0.8, eta: 22, type: "dinein", g: 4.2, gN: 8940, sw: 4.1, swN: "5K+", addr: "100 Feet Road", since: 2021 },
  leaf: { id: "leaf", name: "Leaf & Ladle", area: "Indiranagar", km: 1.6, eta: 26, type: "dinein", g: 4.3, gN: 5210, sw: 4.2, swN: "1K+", addr: "CMH Road", since: 2022 },
  donne: { id: "donne", name: "Donne Biryani Mane", area: "Jayanagar", km: 6.1, eta: 39, type: "dinein", g: 4.4, gN: 31200, sw: 4.4, swN: "25K+", addr: "11th Main, 4th Block", since: 1996 },
  kesar: { id: "kesar", name: "Kesar Dhaba", area: "Koramangala", km: 4.3, eta: 34, type: "dinein", g: 4.3, gN: 18700, sw: 4.3, swN: "10K+", addr: "80 Feet Road, 4th Block", since: 2008 },
  wok: { id: "wok", name: "Wok Street", area: "Indiranagar", km: 1.9, eta: 27, type: "dinein", g: 4.1, gN: 6420, sw: 4.2, swN: "5K+", addr: "Double Road", since: 2018 },
  bros: { id: "bros", name: "Biryani Bros", area: "HSR Layout", km: 6.5, eta: 38, type: "cloud", brands: 14, kitchenId: "hsr-27", sw: 4.5, swN: "5K+", addr: "27th Main, Sector 2, HSR Layout" },
  depot: { id: "depot", name: "Dumpling Depot", area: "HSR Layout", km: 6.5, eta: 36, type: "cloud", brands: 14, kitchenId: "hsr-27", sw: 4.4, swN: "1K+", addr: "27th Main, Sector 2, HSR Layout" },
  tales: { id: "tales", name: "Tandoor Tales", area: "HSR Layout", km: 6.5, eta: 37, type: "cloud", brands: 14, kitchenId: "hsr-27", sw: 4.4, swN: "5K+", addr: "27th Main, Sector 2, HSR Layout" },
};

const d = (x: Dish) => x;

export const DISHES: Dish[] = [
  d({
    id: "paneer-tikka", name: "Paneer tikka", r: "smoke", price: 320, dine: 280, diet: "veg", spice: 2,
    moods: ["savory", "smoky", "sharing"], kw: ["paneer", "tikka", "tandoor", "starter"],
    s: { taste: 4.6, quantity: 3.9, quality: 4.7, packaging: 4.2, value: 3.8 }, rev: 1240, ph: 312, del: 41,
    portion: "8 pieces", portionSub: "about 250 g", serves: 1, art: "pieces",
    ing: [
      { name: "onion", form: "raw", seen: [7, 9], note: "rings, on top" },
      { name: "mint chutney", form: "side", seen: [9, 9] },
      { name: "capsicum", form: "cooked", seen: [6, 9] },
      { name: "paneer", form: "cooked", seen: [9, 9] },
    ],
    allergens: ["dairy"], travels: "well", listing: { kind: "own" },
    take: "Smoky and soft. Ask for no onion; the kitchen follows it.",
    why: ["Reviewers call it smoky 318 times.", "Best quality score here. 8 pieces is enough for one."],
    q: [
      { aspect: "taste", text: "Soft paneer, proper char, the marinade has real smoke.", hl: "proper char", source: "Google review", date: "12 Nov", channel: "dine-in" },
      { aspect: "quantity", text: "Eight pieces. Fine for one, not for two.", hl: "Fine for one", source: "Delivery review", date: "3 Nov", channel: "delivery" },
      { aspect: "packaging", text: "Sealed box, still warm after 30 minutes. Loads of raw onion on top though.", hl: "Loads of raw onion", source: "Delivery review", date: "28 Oct", channel: "delivery" },
    ],
    cap: "Got the paneer tikka delivered. Smoky and soft, but a lot of raw onion on top.", capHl: "paneer tikka",
  }),
  d({
    id: "ghee-roast", name: "Chicken ghee roast", r: "karavali", price: 420, dine: 380, diet: "nonveg", spice: 3,
    moods: ["savory", "spicy"], kw: ["chicken", "ghee", "roast", "mangalorean"],
    s: { taste: 4.8, quantity: 3.6, quality: 4.6, packaging: 4.0, value: 3.9 }, rev: 860, ph: 204, del: 38,
    portion: "7 pieces", portionSub: "in thick masala, 300 g", serves: 1, art: "gravy",
    ing: [
      { name: "curry leaves", form: "fried", seen: [8, 9] },
      { name: "onion", form: "cooked", seen: [2, 9] },
      { name: "garlic", form: "cooked", seen: [0, 9], note: "in the masala, per reviews" },
    ],
    allergens: ["dairy"], travels: "well", listing: { kind: "own" },
    take: "Best taste near you tonight. Very spicy; have it with neer dosa.",
    why: ["Top taste score near you: 4.8 from 860 reviews.", "212 reviews say very spicy."],
    q: [
      { aspect: "taste", text: "Tangy, buttery, fiery. The reason to come here.", hl: "Tangy, buttery, fiery", source: "Google review", date: "9 Nov", channel: "dine-in" },
      { aspect: "quantity", text: "Seven pieces for ₹420 feels a bit light.", hl: "a bit light", source: "Delivery review", date: "2 Nov", channel: "delivery" },
      { aspect: "quality", text: "Tender chicken, nothing reheated about it.", hl: "nothing reheated", source: "Delivery review", date: "20 Oct", channel: "delivery" },
    ],
    cap: "Chicken ghee roast, delivered. Very spicy, very good.", capHl: "Chicken ghee roast",
  }),
  d({
    id: "mutton-biryani", name: "Mutton biryani", r: "hoysala", price: 390, dine: 330, diet: "nonveg", spice: 2,
    moods: ["savory", "comfort", "sharing"], kw: ["mutton", "biryani", "rice"],
    s: { taste: 4.7, quantity: 4.4, quality: 4.5, packaging: 4.1, value: 4.3 }, rev: 3920, ph: 1140, del: 186,
    portion: "3 pieces", portionSub: "650 g rice, a big meal", serves: 2, art: "rice",
    ing: [
      { name: "onion", form: "fried", seen: [9, 9], note: "crisp, on top" },
      { name: "egg", form: "cooked", seen: [4, 9], note: "on some orders" },
      { name: "garlic", form: "cooked", seen: [0, 9] },
    ],
    allergens: [], travels: "well", listing: { kind: "own" },
    take: "Big, honest plate. It's 44 minutes away, so order early.",
    why: ["1,140 photos agree on the portion.", "Only loses points on distance."],
    q: [
      { aspect: "taste", text: "Seeraga samba rice, mutton falls off the bone.", hl: "falls off the bone", source: "Google review", date: "14 Nov", channel: "dine-in" },
      { aspect: "quantity", text: "One plate filled two of us for lunch.", hl: "filled two of us", source: "Delivery review", date: "6 Nov", channel: "delivery" },
      { aspect: "packaging", text: "Arrived hot in a sealed foil box.", hl: "Arrived hot", source: "Delivery review", date: "1 Nov", channel: "delivery" },
    ],
    cap: "Mutton biryani from last night, huge portion.", capHl: "Mutton biryani",
  }),
  d({
    id: "donne-biryani", name: "Chicken donne biryani", r: "donne", price: 260, dine: 220, diet: "nonveg", spice: 2,
    moods: ["savory", "comfort"], kw: ["chicken", "donne", "biryani", "rice"],
    s: { taste: 4.6, quantity: 4.0, quality: 4.4, packaging: 3.8, value: 4.6 }, rev: 6120, ph: 2410, del: 312,
    portion: "2 pieces", portionSub: "450 g rice in a leaf cup", serves: 1, art: "rice",
    ing: [
      { name: "onion", form: "raw", seen: [3, 9], note: "on the side" },
      { name: "mint", form: "cooked", seen: [7, 9] },
      { name: "garlic", form: "cooked", seen: [0, 9] },
    ],
    allergens: [], travels: "ok", listing: { kind: "own" },
    take: "The best-value biryani here. Green, herby and lighter than Hyderabadi.",
    why: ["Value 4.6 at ₹260.", "6,120 reviews mention it, the most on this list."],
    q: [
      { aspect: "taste", text: "Green masala, jeerakasala rice, very Bengaluru.", hl: "very Bengaluru", source: "Google review", date: "15 Nov", channel: "dine-in" },
      { aspect: "packaging", text: "The leaf cup leaked a little in the bag.", hl: "leaked a little", source: "Delivery review", date: "10 Nov", channel: "delivery" },
    ],
    cap: "Donne biryani for lunch, still the best for the price.", capHl: "Donne biryani",
  }),
  d({
    id: "chicken-biryani", name: "Chicken biryani (full)", r: "bros", price: 349, dine: null, diet: "nonveg", spice: 2,
    moods: ["savory", "comfort", "sharing"], kw: ["chicken", "biryani", "rice"],
    s: { taste: 3.4, quantity: 4.7, quality: 3.1, packaging: 3.9, value: 4.2 }, rev: 312, ph: 58, del: 58,
    portion: "Big box", portionSub: "about 900 g, feeds two", serves: 2, conf: "low", art: "rice",
    ing: [
      { name: "onion", form: "fried", seen: [8, 9] },
      { name: "food colour", form: "cooked", seen: [7, 9], note: "bright orange rice" },
    ],
    allergens: [], travels: "well", listing: { kind: "stock", reuse: 9 },
    take: "Lots of food for ₹349, but reviews say oily rice and dry chicken.",
    why: ["Its 4.5 on Swiggy comes from portion size, not cooking.", "Shares one kitchen with 13 other brands."],
    q: [
      { aspect: "quantity", text: "Huge box, easily feeds two.", hl: "easily feeds two", source: "Delivery review", date: "17 Nov", channel: "delivery" },
      { aspect: "quality", text: "Rice was oily and the chicken was dry.", hl: "oily", source: "Reddit r/bangalore", date: "9 Nov", channel: "delivery" },
      { aspect: "taste", text: "Mostly food colour, very little masala.", hl: "food colour", source: "Delivery review", date: "4 Nov", channel: "delivery" },
    ],
    cap: "Biryani Bros, lots of rice, chicken was dry.", capHl: "Biryani Bros",
  }),
  d({
    id: "masala-dosa", name: "Masala dosa", r: "tiffin", price: 110, dine: 90, diet: "veg", spice: 1,
    moods: ["savory", "light", "crispy", "comfort"], kw: ["dosa", "masala", "breakfast", "south indian"],
    s: { taste: 4.8, quantity: 3.7, quality: 4.8, packaging: 3.1, value: 4.6 }, rev: 5210, ph: 1980, del: 142,
    portion: "1 dosa", portionSub: "with sambar and chutney", serves: 1, art: "dosa",
    ing: [
      { name: "onion", form: "cooked", seen: [6, 9], note: "in the potato" },
      { name: "coconut", form: "side", seen: [9, 9] },
      { name: "potato", form: "cooked", seen: [9, 9] },
    ],
    allergens: ["dairy"], travels: "badly", listing: { kind: "own" },
    take: "Superb in person. Over 9 km it usually arrives soft.",
    why: ["Highest quality score, and ₹110.", "31% of delivery reviews say it went soggy."],
    q: [
      { aspect: "taste", text: "Crisp, buttery, the potato palya is perfect.", hl: "Crisp, buttery", source: "Google review", date: "16 Nov", channel: "dine-in" },
      { aspect: "packaging", text: "Limp by the time it reached Indiranagar.", hl: "Limp", source: "Delivery review", date: "11 Nov", channel: "delivery" },
      { aspect: "value", text: "Still the best ₹110 you can spend.", hl: "best ₹110", source: "Google review", date: "2 Nov", channel: "dine-in" },
    ],
    cap: "Masala dosa, delivered. Soft by the time it came.", capHl: "Masala dosa",
  }),
  d({
    id: "chilli-cheese-toast", name: "Chilli cheese toast", r: "corner", price: 180, dine: 150, diet: "veg", spice: 2,
    moods: ["savory", "light", "cheesy", "crispy"], kw: ["toast", "cheese", "snack", "sandwich"],
    s: { taste: 4.3, quantity: 3.8, quality: 4.1, packaging: 4.2, value: 4.0 }, rev: 540, ph: 132, del: 30,
    portion: "4 slices", portionSub: "a snack for one", serves: 1, art: "toast",
    ing: [{ name: "green chilli", form: "raw", seen: [9, 9] }, { name: "cheese", form: "cooked", seen: [9, 9] }],
    allergens: ["dairy", "gluten"], travels: "ok", listing: { kind: "own" },
    take: "Quick and light. Here in 22 minutes, still crisp.",
    why: ["Closest place on the list.", "Vented box keeps it crisp, say 24 reviews."],
    q: [
      { aspect: "taste", text: "Cheese pull, sharp chilli, good bread.", hl: "sharp chilli", source: "Google review", date: "13 Nov", channel: "dine-in" },
      { aspect: "packaging", text: "Still crisp when it came.", hl: "Still crisp", source: "Delivery review", date: "8 Nov", channel: "delivery" },
    ],
    cap: "Chilli cheese toast with chai, delivered crisp.", capHl: "Chilli cheese toast",
  }),
  d({
    id: "veg-momos", name: "Pan-fried veg momos", r: "depot", price: 199, dine: null, diet: "veg", spice: 1,
    moods: ["savory", "light"], kw: ["momos", "dumpling", "momo"],
    s: { taste: 3.6, quantity: 4.0, quality: 3.3, packaging: 3.8, value: 3.9 }, rev: 190, ph: 22, del: 22,
    portion: "8 momos", portionSub: "with red chutney", serves: 1, conf: "low", art: "momos",
    ing: [{ name: "cabbage", form: "cooked", seen: [9, 9] }, { name: "garlic", form: "cooked", seen: [0, 9] }],
    allergens: ["gluten"], travels: "ok", listing: { kind: "stock", reuse: 3 },
    take: "Only 22 photos, so treat this as rough. Same kitchen as Biryani Bros.",
    why: ["Fits savory and light.", "Low confidence: 22 photos."],
    q: [{ aspect: "quality", text: "Filling was mostly cabbage.", hl: "mostly cabbage", source: "Delivery review", date: "5 Nov", channel: "delivery" }],
    cap: "Veg momos, pan fried. A bit doughy.", capHl: "Veg momos",
  }),
  d({
    id: "mushroom-pepper-fry", name: "Mushroom pepper fry", r: "karavali", price: 290, dine: 250, diet: "veg", spice: 3,
    moods: ["savory", "spicy"], kw: ["mushroom", "pepper", "fry"],
    s: { taste: 4.5, quantity: 3.7, quality: 4.5, packaging: 4.1, value: 3.9 }, rev: 410, ph: 96, del: 21,
    portion: "200 g", portionSub: "a starter for one", serves: 1, art: "gravy2",
    ing: [{ name: "mushroom", form: "cooked", seen: [9, 9] }, { name: "curry leaves", form: "fried", seen: [8, 9] }, { name: "onion", form: "cooked", seen: [6, 9] }],
    allergens: [], travels: "well", listing: { kind: "own" },
    take: "Peppery and dry, a strong veg pick. Small, so pair it.",
    why: ["“Peppery” in 88 reviews.", "Same kitchen as the best ghee roast near you."],
    q: [{ aspect: "taste", text: "Peppery and dry, exactly right.", hl: "Peppery", source: "Google review", date: "10 Nov", channel: "dine-in" }],
    cap: "Mushroom pepper fry, really peppery.", capHl: "Mushroom pepper fry",
  }),
  d({
    id: "butter-chicken", name: "Butter chicken", r: "kesar", price: 380, dine: 340, diet: "nonveg", spice: 1,
    moods: ["savory", "comfort", "rich"], kw: ["butter", "chicken", "curry", "makhani"],
    s: { taste: 4.5, quantity: 4.1, quality: 4.4, packaging: 4.3, value: 4.0 }, rev: 2140, ph: 640, del: 96,
    portion: "6 pieces", portionSub: "in 350 ml gravy", serves: 1, art: "curry",
    ing: [{ name: "cream", form: "cooked", seen: [9, 9] }, { name: "cashew", form: "cooked", seen: [0, 9], note: "in the gravy, per menu" }, { name: "onion", form: "raw", seen: [5, 9], note: "with lemon, on the side" }],
    allergens: ["dairy", "nuts"], travels: "well", listing: { kind: "own" },
    take: "Rich and mild. Tandoor chicken, not boiled, say reviewers.",
    why: ["Packaging 4.3: sealed tubs, no leaks.", "Contains cashew."],
    q: [{ aspect: "quality", text: "Proper tandoor chicken in the gravy, not boiled.", hl: "not boiled", source: "Google review", date: "11 Nov", channel: "dine-in" }],
    cap: "Butter chicken and naan, delivered.", capHl: "Butter chicken",
  }),
  d({
    id: "paneer-butter-masala", name: "Paneer butter masala", r: "tales", price: 299, dine: null, diet: "veg", spice: 1,
    moods: ["savory", "comfort", "rich"], kw: ["paneer", "butter", "masala", "curry"],
    s: { taste: 3.7, quantity: 4.3, quality: 3.4, packaging: 3.9, value: 3.9 }, rev: 260, ph: 41, del: 41,
    portion: "8 cubes", portionSub: "in 350 ml gravy", serves: 1, art: "curry",
    ing: [{ name: "cream", form: "cooked", seen: [9, 9] }, { name: "paneer", form: "cooked", seen: [9, 9] }, { name: "cashew", form: "cooked", seen: [0, 9] }],
    allergens: ["dairy", "nuts"], travels: "well", listing: { kind: "stock", reuse: 6 },
    take: "Sweet gravy, generous paneer. Same kitchen as Biryani Bros.",
    why: ["Quantity 4.3, quality 3.4.", "Shares one kitchen with 13 other brands."],
    q: [{ aspect: "taste", text: "Gravy was too sweet, paneer was fine.", hl: "too sweet", source: "Delivery review", date: "13 Nov", channel: "delivery" }],
    cap: "Paneer butter masala from Tandoor Tales.", capHl: "Paneer butter masala",
  }),
  d({
    id: "chilli-garlic-noodles", name: "Chilli garlic noodles", r: "wok", price: 260, dine: 230, diet: "veg", spice: 2,
    moods: ["savory", "spicy", "comfort"], kw: ["noodles", "chinese", "hakka", "garlic"],
    s: { taste: 4.2, quantity: 4.2, quality: 4.0, packaging: 3.6, value: 4.1 }, rev: 720, ph: 168, del: 44,
    portion: "1 box", portionSub: "about 400 g", serves: 1, art: "noodles",
    ing: [{ name: "garlic", form: "fried", seen: [9, 9] }, { name: "spring onion", form: "raw", seen: [8, 9] }, { name: "capsicum", form: "cooked", seen: [7, 9] }],
    allergens: ["gluten"], travels: "ok", listing: { kind: "own" },
    take: "Garlicky and filling. Oily by the bottom of the box.",
    why: ["Fits savory and spicy.", "Packaging 3.6: oil pools at the bottom."],
    q: [{ aspect: "packaging", text: "Good noodles, oily by the bottom of the box.", hl: "oily", source: "Delivery review", date: "7 Nov", channel: "delivery" }],
    cap: "Chilli garlic noodles from Wok Street.", capHl: "Chilli garlic noodles",
  }),
  d({
    id: "gulab-jamun", name: "Gulab jamun (2)", r: "tiffin", price: 80, dine: 60, diet: "veg", spice: 0,
    moods: ["sweet", "comfort"], kw: ["gulab", "jamun", "dessert", "sweet"],
    s: { taste: 4.6, quantity: 4.2, quality: 4.5, packaging: 3.9, value: 4.5 }, rev: 930, ph: 210, del: 40,
    portion: "2 pieces", portionSub: "in warm syrup", serves: 1, art: "jamun",
    ing: [{ name: "khoya", form: "cooked", seen: [9, 9] }],
    allergens: ["dairy", "gluten"], travels: "well", listing: { kind: "own" },
    take: "Soft and not too sweet. Travels well, sealed in syrup.",
    why: ["You asked for sweet.", "Few leaks reported."],
    q: [{ aspect: "taste", text: "Soft all the way through, not overly sweet.", hl: "not overly sweet", source: "Google review", date: "7 Nov", channel: "dine-in" }],
    cap: "Gulab jamun, still warm.", capHl: "Gulab jamun",
  }),
  d({
    id: "caesar-salad", name: "Chicken caesar salad", r: "leaf", price: 340, dine: 310, diet: "nonveg", spice: 0,
    moods: ["light", "fresh"], kw: ["salad", "caesar", "healthy"],
    s: { taste: 4.2, quantity: 3.5, quality: 4.4, packaging: 4.5, value: 3.4 }, rev: 380, ph: 88, del: 30,
    portion: "1 bowl", portionSub: "300 g, dressing apart", serves: 1, art: "salad",
    ing: [{ name: "egg", form: "cooked", seen: [0, 9], note: "in the dressing" }, { name: "cheese", form: "raw", seen: [8, 9] }, { name: "garlic", form: "cooked", seen: [0, 9] }],
    allergens: ["egg", "dairy", "gluten"], travels: "well", listing: { kind: "own" },
    take: "Clean and light. Dressing comes separately, so it stays crisp.",
    why: ["Light and close by.", "Packaging 4.5, best on the list."],
    q: [{ aspect: "packaging", text: "Dressing on the side, lettuce crisp.", hl: "lettuce crisp", source: "Delivery review", date: "12 Nov", channel: "delivery" }],
    cap: "Caesar salad, dressing on the side.", capHl: "Caesar salad",
  }),
];

export const DISH: Record<string, Dish> = Object.fromEntries(DISHES.map((x) => [x.id, x]));
export const R = RESTAURANTS;

export const DEFAULT_ORDERS: Order[] = [
  { id: "o1", dish: "chicken-biryani", date: "18 Nov", total: 398, status: "needs" },
  { id: "o2", dish: "masala-dosa", date: "15 Nov", total: 142, status: "rated", verdict: "worse", match: "mostly" },
  { id: "o3", dish: "paneer-tikka", date: "9 Nov", total: 371, status: "rated", verdict: "same", match: "yes" },
  { id: "o4", dish: "veg-momos", date: "2 Nov", total: 238, status: "rated", verdict: "worse", match: "no" },
];

export const INGREDIENTS = ["onion", "garlic", "mushroom", "coriander", "capsicum", "paneer", "egg", "cheese", "cream", "cashew", "coconut", "green chilli", "spring onion", "curry leaves", "potato", "cabbage"];
export const ALLERGENS = ["nuts", "dairy", "gluten", "egg", "shellfish"];
