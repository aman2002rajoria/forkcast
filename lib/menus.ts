/**
 * Test menus for the fixture restaurants, in the same shape the ingestion pipeline
 * builds from Swiggy's get_restaurant_menu. Items with `dishId` have a full Forkcast
 * score (reviews + photos); the rest only have Swiggy's own dish rating.
 */
export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  veg: boolean;
  /** Swiggy dish rating (out of 5) and vote count, when Swiggy shows one */
  rating?: number;
  votes?: number;
  bestseller?: boolean;
  description?: string;
  /** links to a fully scored dish in lib/data.ts */
  dishId?: string;
  /** live mode: aspect scores from the analysis step, when reviews mention this item */
  scores?: Partial<Record<"taste" | "quantity" | "quality" | "packaging" | "value", number>>;
  mentions?: number;
}

type Row = [name: string, category: string, price: number, veg: boolean, rating: number, votes: number, bestseller?: boolean, dishId?: string];
const build = (rid: string, rows: Row[]): MenuItem[] =>
  rows.map(([name, category, price, veg, rating, votes, bestseller, dishId]) => ({
    id: `${rid}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}`,
    name, category, price, veg, rating, votes, bestseller: !!bestseller, dishId,
  }));

export const META: Record<string, { cuisines: string[]; costForTwo: number }> = {
  smoke: { cuisines: ["North Indian", "Barbecue"], costForTwo: 700 },
  karavali: { cuisines: ["Mangalorean", "Seafood"], costForTwo: 900 },
  hoysala: { cuisines: ["Military hotel", "Biryani"], costForTwo: 600 },
  tiffin: { cuisines: ["South Indian", "Breakfast"], costForTwo: 250 },
  corner: { cuisines: ["Cafe", "Snacks"], costForTwo: 400 },
  leaf: { cuisines: ["Salads", "Bowls"], costForTwo: 700 },
  donne: { cuisines: ["Biryani", "Kebabs"], costForTwo: 400 },
  kesar: { cuisines: ["Punjabi", "North Indian"], costForTwo: 800 },
  wok: { cuisines: ["Chinese", "Asian"], costForTwo: 600 },
  bros: { cuisines: ["Biryani"], costForTwo: 500 },
  depot: { cuisines: ["Momos", "Tibetan"], costForTwo: 350 },
  tales: { cuisines: ["North Indian"], costForTwo: 500 },
};

export const MENUS: Record<string, MenuItem[]> = {
  smoke: build("smoke", [
    ["Paneer tikka", "Starters", 320, true, 4.5, 1120, true, "paneer-tikka"], ["Chicken tikka", "Starters", 360, false, 4.4, 980, true], ["Tandoori mushroom", "Starters", 290, true, 4.2, 310], ["Seekh kebab", "Starters", 380, false, 4.1, 420],
    ["Dal makhani", "Mains", 280, true, 4.3, 760], ["Butter chicken", "Mains", 390, false, 4.2, 640], ["Paneer lababdar", "Mains", 320, true, 4.1, 300],
    ["Garlic naan", "Breads", 80, true, 4.4, 900], ["Butter naan", "Breads", 70, true, 4.3, 1500], ["Phirni", "Desserts", 140, true, 4.0, 120],
  ]),
  karavali: build("karavali", [
    ["Chicken ghee roast", "Starters", 420, false, 4.6, 870, true, "ghee-roast"], ["Mushroom pepper fry", "Starters", 290, true, 4.4, 260, false, "mushroom-pepper-fry"], ["Prawn rava fry", "Starters", 480, false, 4.5, 540], ["Paneer ghee roast", "Starters", 360, true, 4.3, 210],
    ["Kori rotti", "Mains", 390, false, 4.4, 330], ["Fish curry meals", "Mains", 340, false, 4.3, 450], ["Neer dosa (4)", "Mains", 90, true, 4.5, 1200, true], ["Kane rava fry", "Mains", 520, false, 4.4, 190],
    ["Elaneer payasam", "Desserts", 150, true, 4.2, 90],
  ]),
  hoysala: build("hoysala", [
    ["Mutton biryani", "Biryani", 390, false, 4.6, 4100, true, "mutton-biryani"], ["Chicken biryani", "Biryani", 320, false, 4.4, 2300], ["Egg biryani", "Biryani", 220, false, 4.1, 500],
    ["Mutton chops", "Dry", 360, false, 4.5, 900], ["Chicken fry", "Dry", 300, false, 4.3, 700], ["Boti fry", "Dry", 340, false, 4.2, 260],
    ["Ragi mudde with mutton saaru", "Meals", 280, false, 4.4, 380], ["Kesari bath", "Desserts", 70, true, 4.0, 150],
  ]),
  tiffin: build("tiffin", [
    ["Masala dosa", "Dosa", 110, true, 4.7, 6000, true, "masala-dosa"], ["Set dosa", "Dosa", 90, true, 4.3, 700],
    ["Idli vada", "Tiffin", 80, true, 4.6, 3400, true], ["Rava idli", "Tiffin", 70, true, 4.5, 1800], ["Khara bath", "Tiffin", 60, true, 4.4, 900], ["Bisi bele bath", "Rice", 100, true, 4.4, 600],
    ["Gulab jamun (2)", "Sweets", 80, true, 4.5, 900, false, "gulab-jamun"], ["Filter coffee", "Beverages", 40, true, 4.8, 5200, true],
  ]),
  corner: build("corner", [
    ["Chilli cheese toast", "Toasts", 180, true, 4.3, 520, true, "chilli-cheese-toast"], ["Veg club sandwich", "Toasts", 210, true, 4.1, 260],
    ["Bun maska", "Snacks", 90, true, 4.4, 800], ["Keema pav", "Snacks", 220, false, 4.3, 310], ["Egg bhurji pav", "Snacks", 170, false, 4.2, 240],
    ["Masala chai", "Beverages", 60, true, 4.5, 1900, true],
  ]),
  leaf: build("leaf", [
    ["Chicken caesar salad", "Salads", 340, false, 4.3, 360, true, "caesar-salad"], ["Quinoa bowl", "Bowls", 320, true, 4.2, 220], ["Grilled chicken bowl", "Bowls", 380, false, 4.4, 300],
    ["Hummus platter", "Small plates", 260, true, 4.1, 140], ["Pesto pasta", "Mains", 340, true, 4.0, 180], ["Cold pressed juice", "Beverages", 180, true, 4.0, 90],
  ]),
  donne: build("donne", [
    ["Chicken donne biryani", "Biryani", 260, false, 4.6, 6500, true, "donne-biryani"], ["Mutton donne biryani", "Biryani", 340, false, 4.5, 2800], ["Egg donne biryani", "Biryani", 200, false, 4.2, 600], ["Veg pulao", "Biryani", 160, true, 4.0, 300],
    ["Chicken kabab", "Sides", 220, false, 4.4, 2100, true], ["Pepper chicken", "Sides", 260, false, 4.3, 700],
  ]),
  kesar: build("kesar", [
    ["Butter chicken", "Mains", 380, false, 4.5, 2100, true, "butter-chicken"], ["Dal makhani", "Mains", 290, true, 4.5, 1400, true], ["Paneer tikka masala", "Mains", 330, true, 4.3, 800], ["Chole bhature", "Mains", 220, true, 4.4, 1100],
    ["Chicken tikka", "Starters", 350, false, 4.3, 600], ["Amritsari kulcha", "Breads", 180, true, 4.4, 900], ["Sweet lassi", "Beverages", 110, true, 4.5, 700],
  ]),
  wok: build("wok", [
    ["Chilli garlic noodles", "Noodles", 260, true, 4.2, 720, true, "chilli-garlic-noodles"], ["Chicken fried rice", "Rice", 280, false, 4.1, 650], ["Dragon chicken", "Starters", 320, false, 4.3, 540],
    ["Chilli paneer", "Starters", 280, true, 4.2, 500], ["Veg manchurian", "Starters", 240, true, 4.0, 480], ["Hot and sour soup", "Soups", 160, true, 4.1, 300], ["Prawn dim sum", "Dim sum", 340, false, 4.0, 120],
  ]),
  bros: build("bros", [
    ["Chicken biryani (full)", "Biryani", 349, false, 4.5, 1800, true, "chicken-biryani"], ["Mutton biryani", "Biryani", 429, false, 4.2, 400], ["Paneer biryani", "Biryani", 299, true, 4.2, 500],
    ["Chicken 65", "Sides", 249, false, 4.3, 900], ["Raita", "Sides", 49, true, 4.4, 300],
  ]),
  depot: build("depot", [
    ["Pan-fried veg momos", "Momos", 199, true, 4.3, 400, true, "veg-momos"], ["Chicken steamed momos", "Momos", 219, false, 4.4, 700, true], ["Paneer momos", "Momos", 209, true, 4.2, 300], ["Chicken thukpa", "Soups", 249, false, 4.1, 150],
  ]),
  tales: build("tales", [
    ["Paneer butter masala", "Mains", 299, true, 4.3, 600, true, "paneer-butter-masala"], ["Dal tadka", "Mains", 219, true, 4.2, 400], ["Chicken tikka masala", "Mains", 339, false, 4.2, 350],
    ["Veg biryani", "Rice", 259, true, 3.9, 200], ["Tandoori roti", "Breads", 35, true, 4.1, 800],
  ]),
};
