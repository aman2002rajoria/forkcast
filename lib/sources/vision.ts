/**
 * Photo → dish matching (live mode, offline batch job). Not called by the UI.
 *
 * The restaurant's own Swiggy menu is the label set, so the model answers
 * "which of these 60 dishes is this?" instead of "what food is this?".
 * A photo is tied to a dish only when three signals agree:
 *   1. the review caption names the dish (fuzzy match against the menu),
 *   2. its nearest neighbours by image embedding (SigLIP, run locally) are already labelled that dish,
 *   3. the vision model picks the same dish with confidence >= 0.7.
 * The same pass returns what is visible (raw onion, a side cup, piece count) and whether it was delivered or plated.
 */

export interface PhotoVerdict {
  dish: string | null;
  confidence: number;
  setting: "delivered" | "dine-in" | "not food";
  visible: { item: string; form: "raw" | "cooked" | "fried" | "side" }[];
  pieces?: number;
}

export function visionPrompt(menu: string[], caption?: string) {
  return [
    "You label customer food photos for one restaurant.",
    `Menu (the only allowed labels): ${menu.join("; ")}.`,
    caption ? `The reviewer wrote: "${caption}".` : "",
    "Return JSON: {dish: one menu item or null, confidence: 0-1, setting: delivered|dine-in|not food,",
    "visible: [{item, form: raw|cooked|fried|side}], pieces: number or null}.",
    "Use null when unsure. Delivered means a box, foil or bag is visible.",
  ].filter(Boolean).join("\n");
}

/** Combine the three signals. Disagreement means the photo stays unlabelled. */
export function agree(captionDish: string | null, neighbourDish: string | null, model: PhotoVerdict): string | null {
  if (!model.dish || model.confidence < 0.7) return null;
  const votes = [captionDish, neighbourDish].filter((x) => x === model.dish).length;
  return votes >= 1 ? model.dish : null;
}
