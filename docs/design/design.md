# design.md: how Aman's apps should look and feel

This is the design brief for the front ends of **Warmline**, **Forkcast**, **Finance Hub** and **CrowdLens**, and for any app Aman builds after them. Hand it to an AI (Claude or another) together with:

1. this file,
2. the `design-refs/` folder next to it (screenshots of the current UI, described in §2),
3. the app's backend code.

**What this file does and doesn't do.** It doesn't dictate layouts or screens. The backend decides what features exist, and you (the AI building the UI) decide how to lay them out. This file defines the **look, feel and behaviour**: the visual language, the components, the motion, the voice, and the rules for designing any new screen or feature so that it still looks like it belongs. If you follow it, a screen nobody has designed yet should look as if the same person designed it.

---

## Contents

0. How to work with this file
1. The feel in one page
2. Reference screenshots and what to take from each
3. Colour
4. Typography
5. Shape, spacing, elevation
6. Buttons
7. Component vocabulary
8. Layout principles (not layouts)
9. Designing a new screen or feature: the process
10. Data, charts and numbers
11. AI features: how to show the machine thinking
12. Icons
13. Illustration
14. Motion
15. States: loading, empty, error, partial
16. Test data mode
17. Copy and voice
18. Responsive and accessibility
19. Product briefs (one per app)
20. Anti-patterns: what makes it look generic
21. Review checklist before you call a screen done
22. Ready-to-paste tokens and Tailwind setup

---

## 0. How to work with this file

- **Read the whole file and open every image in `design-refs/` before writing any UI.** The screenshots carry things words can't: weight, spacing and density.
- **Read the backend first** (routes, models, any README) to learn what the product can do. List the user's jobs, then design screens around those jobs (§9).
- **Use the tokens in §3 to §6 exactly.** Don't add colours, radii, shadows or fonts. If something seems missing, build it from what's here (§9, step 6).
- **No emojis anywhere.** Not in UI, copy, empty states, toasts, commit-style labels or placeholder data.
- **Build every state** for every screen: loading, empty, error, filled, and partial where AI is involved (§15).
- **Ship test data mode** (§16) so anyone arriving from the portfolio can try the app with no account.
- When this file and your instinct disagree, follow the file. When the file is silent, use the decision rules in §9 and check against the anti-patterns in §20.

Suggested stack (not required): Next.js App Router + TypeScript + Tailwind with the tokens from §22, `lucide-react` icons, and Recharts or plain SVG for charts. Don't use a component library's default theme (shadcn, MUI, Chakra) unstyled. If you use one, restyle it fully to these tokens.

---

## 1. The feel in one page

**Personality:** a friendly, competent tool made by one careful person. It's calm and quiet most of the time, with a few moments of play. It should feel closer to a well-made consumer app (Duolingo's buttons, Linear's calm, Apple's type weight) than to an enterprise dashboard or a startup landing page.

**Five ideas hold the look together:**

1. **Heavy headings, light body.** Titles in Fira Sans 900, body in 400 to 500. The contrast in weight does most of the design work.
2. **White cards on a near-white page.** Content sits on white cards (`#FFFFFF`) with a hairline 1px ring, on a `#FAFAFB` page. No heavy shadows, no borders thicker than 1px, no grey card backgrounds.
3. **One accent colour per app, used sparingly.** The accent goes on the primary button, the active state, the key number and the brand mark. Everything else is neutral. When you squint at a screen, you should see mostly white, black type and one or two touches of colour.
4. **Pills and big radii.** Buttons, chips, tabs and inputs are fully rounded pills. Cards are 20 to 28px rounded. Nothing has sharp corners.
5. **The 3D lip button.** Every button sits on a 4px solid "lip" and physically presses down when clicked. It's the signature detail, so use it on every button.

**Words for the feel:** calm, confident, tactile, honest, warm.
**Not:** flashy, glassy, neon, gradient-heavy, corporate, cluttered, cute for its own sake.

---

## 2. Reference screenshots and what to take from each

All are in `design-refs/`, captured at 2x from the current portfolio. They show the **style**, not the layouts you must build.

| File | What it shows | Copy this | Don't copy |
|---|---|---|---|
| `01-product-bento-finance.png` | A product landing made of brand-coloured tiles | The tile rhythm: one big accent tile, white tiles with heavy headings, one tinted tile, one accent tile at the end. 24px radius, 22px padding. The app mark (a rounded square with one letter). | The dashed boxes: those are placeholders for illustrations still to come. |
| `02-product-bento-forkcast.png` | The same pattern in orange | How the accent swaps per app while everything else stays identical | |
| `03-finance-hub-app.png` | A dashboard: tabs, month switcher, KPI row, donut, bars, a highlighted insight card | The density and calm. KPI cards (muted label → big 900 number → muted sub-line). The segmented controls. The "Never counting the same rupee twice" card, which shows a tinted card can carry the product's key insight. Past months in grey and the current one in accent. | The exact chart choices. Pick charts for the data (§10). |
| `04-forkcast-app.png` | An AI search: big question, input with a primary button, suggestion chips, result cards with score bars, a side card explaining the AI | The way a question becomes the heading. Suggestion chips. Result cards with clear hierarchy (name 900, meta muted, evidence line, "Why this?" link in accent). Thin score bars with tabular numbers. | The dashed image slots (placeholders). |
| `05-warmline-app.png` | An AI workflow: list → research → draft → replies | **The AI transparency pattern**: the "Hook" chip, the highlighted hook inside the draft, the "3 sources" chip, the "Suggested reply" block in an accent tint, and "Nothing goes out without your click." under the primary action. Status chips (Drafted, Researched, Sent, Replied) in soft tints. | |
| `06-problem-and-solution.png` | A problem → solution row with a screenshot frame | The numbered accent badge, the "The problem" and "How X solves it" eyebrows, and the browser-frame screenshot treatment | |
| `07-cta-band.png` | A full-width accent band with a call to action | White primary button on an accent background, ghost buttons with a white ring, centred heavy heading | |
| `08-app-top-bar.png` | The top bar | Back pill, app mark + name in 900 + tagline in muted, actions on the right, blurred white background, hairline bottom border | |
| `09-home-hero-light.png` | Portfolio hero | The scale and weight of the type, logos sitting inline in a sentence, the dark and ghost lip buttons side by side | The hero layout itself (it's the portfolio, not an app) |
| `10-project-cards.png` | Cards with mini UI previews | Small floating UI fragments (a score card, a donut chip) layered on a tinted panel, a technique for empty states, onboarding and marketing | |
| `11-chat-dock.png` | A chat panel | The chat bubble style, suggestion chips in an accent tint, the input and Send button, and the panel header with a segmented Chat/Book switch | |

When a screenshot and this text disagree, the text wins (the screenshots include some portfolio-only details).

---

## 3. Colour

### 3.1 Neutrals (all apps)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FAFAFB` | Page background behind cards |
| `--card` | `#FFFFFF` | Cards, panels, modals, inputs, menus |
| `--surface` | `#F6F6F8` | Quiet fills: input background, segmented track, chip, row hover, text areas |
| `--surface-2` | `#EEEEF2` | Stronger fills: progress tracks, ghost button lip, inactive bars, disabled |
| `--line` | `#ECECEF` | Every border and divider (1px) |
| `--ink` | `#1D1D1F` | Headings, key numbers, primary text, dark buttons |
| `--ink-2` | `#48484F` | Body text |
| `--muted` | `#76767E` | Labels, meta, captions, secondary numbers |
| `--faint` | `#A1A1A8` | Placeholders, disabled text, axis labels |

Never use pure black `#000` for text or pure grey hexes outside this list.

### 3.2 One accent per app

| Step | Warmline | Forkcast | Finance Hub | CrowdLens |
|---|---|---|---|---|
| 50 | `#EEF3FF` | `#FFF2EC` | `#E8FBF2` | `#F3F0FF` |
| 100 | `#DCE6FF` | `#FFE1D3` | `#C9F5E0` | `#E6E0FF` |
| 200 | `#B9CCFF` | `#FFC1A6` | `#8FE9C0` | `#CBBEFF` |
| **500** | **`#2F6BFF`** | **`#FF5A1F`** | **`#00B86B`** | **`#7C5CFF`** |
| 600 | `#1F55E0` | `#E54610` | `#009A59` | `#6544F0` |
| 700 | `#1A3FA8` | `#B3350B` | `#007545` | `#4C2FC4` |
| 900 | `#0F2466` | `#5C1A05` | `#003D24` | `#24166B` |

**Where the accent goes (and only here):**
- the primary button (one per view)
- the active tab or nav item indicator
- the app mark
- links and inline actions ("Why this?")
- the single most important number or bar on a screen (e.g. the current month)
- focus rings
- highlights of AI-used text (accent 100 background)
- one tinted "insight" card per screen at most (accent 50 background)

**Contrast rules:**
- Accent text on white uses **700**.
- White text on a **500** fill is fine for blue, orange and violet at 16px/600 and up. **Finance Hub green 500 is too light for white text**, so its buttons use **600**, and green tiles with white text need 20px/800 or larger.
- Accent text on accent 50 or 100 uses 700 or 900.

**A new app** gets its own accent: pick a saturated hue clearly different from these four, build the same 50 to 900 ramp, and check the contrast rules.

### 3.3 Semantic colours

| Meaning | Fill | Text | Tint |
|---|---|---|---|
| Success / positive | `#18C964` | `#0E7A3D` | `#E8FAF0` |
| Warning / needs attention | `#FFB020` | `#8A5A00` | `#FFF6D6` |
| Danger / negative | `#F0443A` | `#B3261E` | `#FDECEB` |
| Neutral status | `--surface-2` | `--ink-2` | `--surface` |

Status chips use the **tint as background and the text colour as text**, never the fill as background (see the chips in `05-warmline-app.png`).

### 3.4 Data colours

Categorical series, in this order: `#7C5CFF` `#00B86B` `#FF5A1F` `#E54B8C` `#00A3BF` `#FFB020` `#2F6BFF`, with `#A1A1A8` always reserved for "Other" or "Uncategorised". For a single series, use the accent for the focus and `--surface-2` for the context (the month bars in `03-finance-hub-app.png`).

### 3.5 Dark theme

Optional and later. If built: bg `#0E0E11`, card `#16161B`, surface `#1D1D23`, surface-2 `#2A2A32`, line `#26262D`, ink `#F3F3F5`, ink-2 `#C2C2CA`, muted `#8D8D97`. Accent 500s stay; accent text uses 200.

---

## 4. Typography

**Fira Sans** for everything (Google Fonts, weights **400, 500, 600, 800, 900**), loaded with `next/font`. For IDs, timestamps in logs and code: **JetBrains Mono 500**. No other fonts, including for headings, logos or numbers.

| Style | Size / line height | Weight | Letter spacing | Use |
|---|---|---|---|---|
| Display | 56 / 1.04 | 900 | -0.01em | Landing hero only |
| H1 | 36–40 / 1.08 | 900 | -0.01em | Page title, or the question on an AI search screen |
| H2 | 26–28 / 1.15 | 900 | -0.005em | Section title |
| H3 | 18–20 / 1.25 | 800–900 | 0 | Card title, list item title |
| Body L | 19 / 1.5 | 400 | 0 | Intros, empty-state sentences |
| Body | 16 / 1.5 | 400 | 0 | Default |
| Body S | 14 / 1.45 | 500 | 0 | Meta, table cells, chip text |
| Label | 13–14 / 1.2 | 600 | 0 | KPI labels, form labels, tab text |
| Eyebrow | 12 / 1.2 | 800 | 0.08em, UPPERCASE | Kicker above a title ("SUGGESTED REPLY", "THE PROBLEM") |
| Number | 28–32 / 1 | 900 | -0.01em | KPI values |
| Mono | 12 / 1.4 | 500 | 0.04em | IDs, raw data |

Rules:
- **Headings are 900.** Bold (700) looks generic, and 900 is the house style.
- Card titles are 900 at 18 to 20px, which is how "Where it went", "Research" and "Replies" look in the references.
- Tabular numbers (`font-variant-numeric: tabular-nums`) for every number that's compared or updates.
- Sentence case for everything except eyebrows. No Title Case Buttons.
- Body lines are at most 68 characters wide.
- Money in INR: `₹31,459` (`toLocaleString("en-IN")`), with lakh grouping for large values (`₹1,20,000`). Show decimals only where paise matter.
- Dates: `15 Nov`, `15 Nov 2026`, `Nov 2026`. Times: `5:30 pm`. Relative time ("2h ago") only in feeds.

---

## 5. Shape, spacing, elevation

### 5.1 Radii (only these)

`12px` small (inputs, image thumbs, tooltips) · `20px` medium (KPI cards, list items, menus) · `24–28px` large (main cards, panels, modals) · `32px` extra (hero tiles, CTA bands) · `999px` pill (buttons, chips, tabs, badges, segmented controls, search inputs).

Nested radii shrink: an element inside a 28px card with 16px padding gets about 12px.

### 5.2 Spacing

4px base, and only these values: 4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96.
- Card padding: 20 compact, 24 default.
- Gaps: 8 inside a group, 16 between cards, 24 to 32 between groups, 40 to 56 between sections.
- Page gutter: `clamp(20px, 4vw, 48px)`. App content max width: 1320px. Reading content (settings, long text): 720px.

Generous white space is part of the look. When unsure, add space rather than a divider.

### 5.3 Elevation

There are three levels and no others:
- **Flat card:** `box-shadow: 0 0 0 1px var(--line)`. Almost everything.
- **Floating:** `0 0 0 1px var(--line), 0 20px 40px -20px rgba(0,0,0,.18)`. Menus, popovers, toasts, the chat panel.
- **Lifted:** `0 0 0 1px var(--line), 0 30px 60px -30px color-mix(in srgb, var(--accent-500) 45%, rgba(0,0,0,.4))`. Modals, and the one hero visual on a landing page.

Never use a grey drop shadow on a static card. Never use `border: 1px solid` and a ring together.

---

## 6. Buttons

The 3D lip is the signature. Every button has it.

```css
.btn { display:inline-flex; align-items:center; gap:10px; padding:14px 22px; border-radius:999px;
  font:600 16px/1 var(--font); white-space:nowrap; background:var(--ink); color:#fff;
  box-shadow:0 4px 0 #000, 0 12px 24px -12px rgba(0,0,0,.45);
  transition:transform .4s var(--spring), box-shadow .4s var(--spring); }
.btn:hover  { transform:translateY(-2px); box-shadow:0 6px 0 #000, 0 16px 28px -12px rgba(0,0,0,.45); }
.btn:active { transform:translateY(4px); box-shadow:0 0 0 #000; transition-duration:.08s; }

.btn.primary { background:var(--accent-500); /* Finance Hub: --accent-600 */
  box-shadow:0 4px 0 color-mix(in srgb,var(--accent-500) 65%,#000), 0 12px 24px -12px var(--accent-500); }
.btn.ghost   { background:#fff; color:var(--ink); box-shadow:inset 0 0 0 1.5px var(--surface-2), 0 4px 0 var(--surface-2); }
.btn.danger  { background:#F0443A; box-shadow:0 4px 0 #B3261E; }
.btn.sm      { padding:10px 16px; font-size:14px; }
.btn:disabled{ opacity:.5; pointer-events:none; }
```

| Variant | Use | Per view |
|---|---|---|
| `primary` (accent) | The one action the screen exists for: "Approve & send", "Ask the copilot", "Upload statements" | **One** |
| default (dark) | Strong secondary actions: "Approve" on each reply card, "Read case study" | Several is fine |
| `ghost` | Everything else: "Rewrite", "Skip", "Cancel", filters | Any |
| `danger` | Only inside a confirm modal for destructive actions | One |
| text link | Inline actions in accent 700, 600 weight ("Why this?", "Undo") | Any |

- Button labels say what happens: "Send 12 emails", not "Submit".
- Arrows at the end mean navigation: `→` for another page, `↗` for an external link, `↓` for further down this page.
- Icon-only buttons are 40px circles in ghost style, with an `aria-label`.
- A sentence under a primary button can reassure the user ("Nothing goes out without your click.", in muted 14px). Use it for any action with consequences.

---

## 7. Component vocabulary

These are the building blocks. Compose screens from them, and make a new component only when none of these fits, by following §9 step 6.

- **Top bar.** Sticky, 64px, white at 86% with a 16px backdrop blur, hairline bottom. Left: the app mark (32px accent square, 10px radius, one white 900 letter, with a 3px lip under it), then the name in 900 and the tagline in muted. Right: the test-data badge (when on), then actions and the avatar. Ref: `08`.
- **Navigation.** For three to six sections, use a segmented control under the top bar (see the Overview / Transactions / Goals tabs in `03`). For more, use a 232px white sidebar with pill items (an active item gets an `--surface` fill and ink text). On mobile, use a bottom tab bar.
- **Card.** White, 24 to 28px radius, flat ring, 24px padding. The title is H3 900, with an optional chip or a ghost action on the right of the title row.
- **KPI card.** 20px radius, 20px padding. A muted label at 14/600, then the value at 28 to 32/900 in tabular numbers, then a muted sub-line at 14/500 that **explains** the number ("card bills and transfers left out"). The value is in accent only when it's *the* number of the screen. Usually in a row of 3 or 4.
- **Insight card.** One per screen at most. An accent 50 background, no ring or a ring in accent 100, and an H3 that states the insight as a sentence ("Never counting the same rupee twice"). Ref: `03`.
- **List item.** 16px padding and 20px radius. The selected item gets an `--surface` fill. Title 800 to 900, sub-line muted, status chip below or on the right. Ref: People list in `05`.
- **Table.** Header 13/600 muted. Rows 44 to 48px with a hairline bottom and an `--surface` hover. Numbers right-aligned and tabular. On mobile each row becomes a stacked card.
- **Segmented control.** An `--surface` pill track with 4px padding. The active option is a white pill with a ring and a 1px bottom shadow. Use it for tabs, time ranges and modes. It springs to scale .94 on press.
- **Chip.** A pill with 6/12 padding at 14/500. Kinds: neutral (`--surface`), accent (accent 50 bg, 700 text), status (semantic tint) and removable (with ×). Suggestion chips are clickable neutral chips that fill the input. Ref: `04`, `11`.
- **Badge.** A small pill (3/8 padding, 11/800 uppercase): "TEST DATA", "AI", "SOON", "BETA".
- **Input.** 48 to 56px tall, a pill or 12px radius, `--surface` background with no border. On focus: a white background, a 2px accent ring and a 4px accent 100 halo. The label sits above (13/600), help or error text below. A search or AI prompt input sits next to its primary button on one line. Ref: `04`.
- **Text area / editor.** An `--surface` background, 20px radius, 20px padding, body 16 to 17px. AI-written passages inside are highlighted in accent 100. Ref: the draft in `05`.
- **Dropzone.** A 1.5px dashed accent 200 border, 28px radius, accent 50 background, an illustration, an H3 and the supported formats in muted text. On drag-over: a solid border and scale 1.01.
- **Progress / score bar.** 8 to 10px tall, radius 10, `--surface-2` track, accent fill, with the value in tabular numbers to the right. Ref: `04`.
- **Toast.** Bottom centre, an ink pill, white 15/500 text, floating shadow, an optional "Undo". 4s.
- **Modal.** Max 520px, 28px radius, lifted shadow, 28px padding, a 40% black backdrop with a 4px blur. The title is H2, the actions bottom right, and the destructive action on the far right.
- **Popover / tooltip.** White, 16px radius, floating shadow, 12/14 padding, 14–15px text, max 280px wide.
- **Chat.** User bubbles are accent 500 with white text. Assistant bubbles are `--surface` with ink text. Both 20px radius with 14/16 padding. Suggestion chips in accent tint sit above the input. Ref: `11`.
- **Avatar / app mark.** A circle for people (photo, or an initial on a tinted background) and a rounded square for apps and companies.

---

## 8. Layout principles (not layouts)

You decide the layouts. These principles keep them consistent:

1. **One job per screen, one primary action per screen.** If a screen has two jobs, split it or make one clearly secondary.
2. **Top-down reading order: question or title → summary → detail → actions.** On a dashboard: KPIs, then charts, then lists. On an AI screen: the prompt, then results, then explanation.
3. **Summaries are numbers with a sentence.** If the data allows, open a screen with 3 or 4 KPI cards, each with a sub-line that says why the number matters.
4. **Work areas are columns.** Workflows read left to right (list → detail → output, as in `05`). Use 2 or 3 columns on desktop and stack them on mobile in the same order.
5. **The explanation lives next to the result**, never on another page ("Why this?" expands inline, sources open in a popover).
6. **A 12-column grid with 16px gaps.** Prefer splits such as 8/4, 6/6, 4/4/4 and 3/3/3/3, and avoid odd splits.
7. **Generous, consistent space.** Use the same gaps everywhere on a screen. Don't fill empty space with decoration.
8. **Left-align content.** Centre only empty states, landing heroes and CTA bands.
9. **Keep it shallow.** Prefer one page that expands over three nested pages. Use a drawer or modal for quick edits, and a page for real work.
10. **Max width 1320px.** On wide screens, centre the content rather than stretching it.

---

## 9. Designing a new screen or feature: the process

Use this for every screen, including features this file doesn't know about.

1. **Name the user's job in one sentence.** For example: "Check which charges this month are uncategorised and fix them."
2. **Find the one primary action.** That's the accent button. Everything else is dark, ghost or a link.
3. **Decide what the user needs to see before acting.** That's the content hierarchy. Put the most important information highest and biggest (900 weight, accent if it's *the* number).
4. **Pick components from §7.** A list of things → list items or a table. A single object → a card. Numbers over time → a chart (§10). Something the AI made → the AI patterns (§11). A choice among 2 to 5 options → a segmented control or chips. A setting → a toggle or select inside a settings card.
5. **Design all states** (§15) before calling it done.
6. **If nothing in §7 fits**, build a new component from the existing parts: white card or `--surface` fill, the radii in §5, Fira at the sizes in §4, a pill shape for anything clickable and small, the accent only for its one key element, and the motion from §14. Then add it to your own component folder so the next screen reuses it.
7. **Write the copy** (§17). The heading should say what's on the screen or what to do, in plain words.
8. **Run the checklist** in §21.

**Where a new feature goes:**
- It's part of an existing job → add it to that screen as a card or a section, not a new tab.
- It's a new job the user does often → a new tab or nav item.
- It's occasional or configuration → settings, or a menu (⋯) on the relevant card.
- It's a one-off step (import, connect, confirm) → a modal or a short flow, then back to where the user was.
- It's experimental → put it behind a "BETA" badge, still in the same style.

---

## 10. Data, charts and numbers

- **Pick the chart from the question.** Parts of a whole (≤ 7 parts) → donut with a list beside it. Change over time → bars (few periods) or a line (many). Comparison across items → horizontal bars. One number against a target → a progress bar. Distribution → a histogram. Never use 3D charts, pies with more than 7 slices, or radar charts.
- **Focus + context:** the item that matters is the accent, and the rest is `--surface-2` (see the month bars in `03`).
- Charts sit inside cards with an H3 title that's a statement or a question ("Where it went", "Real spend by month").
- Use as few axes, gridlines and legends as possible. Label directly where you can, and put values in a list beside the chart (the donut in `03`).
- Numbers carry their meaning: always a unit (₹, %, km, min) and a sub-line or tooltip saying what's included.
- Negative is danger, positive is success, but only where good or bad is obvious. Spending going up is not automatically "danger".
- Use skeleton charts while loading and an empty illustration when there's no data.

---

## 11. AI features: how to show the machine thinking

These apps are AI products, and trust comes from showing the work. Apply these to every AI output, now and in future features:

1. **Show the evidence.** Every AI result has a source chip ("3 sources", "Based on 131 reviews and 54 photos"). Clicking it shows the actual sources.
2. **Highlight what the AI used.** If the output uses a specific fact (the hook in Warmline), highlight that fact in the output with an accent 100 background, and show it as a chip above.
3. **Explain on demand.** A "Why this?" link in accent 700 expands an inline explanation, written in plain words, two or three sentences.
4. **Label AI-written text.** Suggestions sit in an accent 50 block with an eyebrow ("SUGGESTED REPLY"), and they're always editable.
5. **The human approves.** Anything with consequences (sending, posting, deleting, paying) needs an explicit click on a button that names the action, with a reassurance line under it.
6. **Show progress in words.** While the AI works, show what it's doing ("Reading 214 reviews across 12 places…") with three pulsing dots. Never a bare spinner for more than a second.
7. **Show confidence honestly.** Low-confidence results get a warning-tint chip ("Not sure, check this") instead of being hidden or shown as certain.
8. **Let the user steer.** Offer Rewrite, Regenerate and Edit next to every AI output, plus suggestion chips for common follow-ups.
9. Never personify the AI with a mascot face or "I'm thinking…" bubbles in the app UI. The portfolio's AI Aman is the exception.

---

## 12. Icons

**Lucide** (`lucide-react`) only, at 1.75 stroke width: 20px in navigation and buttons, 16px inline with text, colour `currentColor`. Icons support labels, they don't replace them, except in 40px icon buttons with an `aria-label`. No emoji, no filled icon fonts, no mixing in other icon sets.

---

## 13. Illustration

The illustration language is **glossy 3D objects**: soft clay-plastic renders, rounded edges, lit from the top left, on transparent backgrounds. They're bright and saturated: the app's accent plus one warm secondary (orange or yellow). The portfolio thumbnails in `10-project-cards.png` show the style (the TV, and the mailbox in the portfolio).

- **Use them for:** empty states, onboarding, upload and success moments, the landing bento, and error pages.
- **Don't use them for:** data views (tables, charts, lists) or as decoration filling space.
- **Size:** 96 to 160px in the app, up to 360px on landing tiles.
- **Motion:** one pop-in when it appears (scale .9 to 1, spring). No idle bobbing or floating.
- **Objects per app:** Warmline (mailbox, envelope stack, paper plane, speech bubble), Forkcast (bowl of biryani, plate and fork, star badge), Finance Hub (coin jar with a leaf, stack of statements, piggy bank, receipt), CrowdLens (retro TV, film strip, megaphone, small crowd of figures).
- **Midjourney prompt base:** `glossy 3D render of a [object], soft clay plastic, rounded edges, [accent colour] with warm orange accents, bright saturated colours, studio lighting from top left, plain white background, centered, three-quarter view, no text --style raw --ar 1:1`. Remove the background after rendering.
- **Until a render exists:** use a dashed rounded box with the object name in mono (the dashed boxes in `01`, `02` and `04`), so the layout is final and the art drops in later.
- Photos (food photos in Forkcast, video frames in CrowdLens) are content, not illustration. Show them in 12 to 20px radius frames.

---

## 14. Motion

One spring for movement, one ease for fades:

```css
--spring: linear(0,.096 4.4%,.355 9.5%,.705 16.1%,.877 20.3%,1.004 24.7%,1.074 29.1%,1.098 33.6%,1.09 38.6%,1.035 49.7%,1.003 60.7%,.996 72.1%,1);
--soft: cubic-bezier(.22,1,.36,1);
```

| What | How |
|---|---|
| Button hover / press | Up 2px / down 4px as the lip collapses. Spring .4s; press .08s. |
| Cards entering | Fade and rise 16px, .6s `--soft`, staggered 60ms in reading order, first view only |
| Bento tiles / grids | Pop from scale .92, spring, 60ms apart |
| Tabs, segmented controls | The active pill slides, spring .35s |
| KPI numbers | Count up over .8s on first load only |
| Bars, progress, donut | Grow from 0 over 1s with the spring, after a .2s delay |
| Toasts, popovers | Rise 12px and fade in; fade out .15s |
| Modals | Backdrop fade .2s; the panel scales .96 to 1 with the spring |
| Page change | Accent-coloured squares ripple out from the click and cover the screen (about 520ms), then clear from the centre |
| AI working | Three dots pulsing in sequence, plus a status line |
| Success | One small moment only: the illustration pops, or a check draws in. No confetti. |

Avoid idle loops (floating, bobbing, spinning), parallax, hover tilt, auto-playing carousels and scroll-jacking. Respect `prefers-reduced-motion`: keep only opacity fades.

---

## 15. States: loading, empty, error, partial

| State | Look |
|---|---|
| Loading | Skeletons in the final shape (an `--surface` block with a slow 1.6s shimmer). Text that changes as work progresses for anything over 2s. |
| Empty | Centred in the card or page: an illustration (96–160px), an H3 saying what will be here, one muted sentence, one primary button that fixes it (often "Try with test data"). |
| Error | An inline card in the danger tint: what went wrong in plain words, what to do, and a "Try again" button. Keep the user's input. Never a raw error code alone. |
| Partial / low confidence | Show the results, with warning-tint chips on the uncertain ones and a count in the header ("2 need a check"). |
| Offline / slow | A thin warning bar under the top bar. The app stays usable with cached data where possible. |
| Success | A toast for small things. For milestones (first campaign sent, first statement parsed), a short inline success state with the illustration. |

---

## 16. Test data mode

Every app must be usable in one click with no account, because people arrive from the portfolio.

- The first screen offers **"Use my own data"** (primary) and **"Try with test data"** (ghost).
- Test data loads realistic fixtures: Indian names, ₹ amounts, real-sounding places, and no lorem ipsum.
- While test data is on, a **"TEST DATA"** badge in warning tint sits in the top bar, with a menu: "Switch to my own data", "Reset test data".
- Side effects are simulated in test mode, and the UI says so ("Sent in test mode. Nothing left your browser.").
- Every new feature must work in test mode too.

---

## 17. Copy and voice

- Plain, short and specific. Second person for the user ("your statements"). No jargon the user wouldn't say.
- Headings say what's here or what to do: "What are you in the mood for?", "Where it went", "People".
- Sub-lines explain numbers: "card bills and transfers left out", "37% reply rate".
- Button labels are verbs with objects: "Approve & send", "Ask the copilot", "Upload statements".
- Errors: what happened + what to do. "That PDF is password-protected. Enter the password or upload another copy."
- Use no exclamation marks in UI chrome, and never "Oops", "Whoops", "Awesome", "Uh-oh" or emoji.
- Prefer numbers to adjectives: "54 real customer photos", not "lots of photos".
- Use sentence case, and the Oxford comma is fine. Write ₹ before the amount with no space.

---

## 18. Responsive and accessibility

- Breakpoints: < 640 mobile, 640–899 tablet, ≥ 900 desktop, ≥ 1320 content stops growing.
- Mobile: single column in reading order, bottom tab bar, KPI rows 2×2, tables become cards, and the primary action can become a sticky bottom button.
- Forkcast is used mostly on phones: design it at 390px first.
- Touch targets ≥ 44px. Keyboard: everything is reachable, with a visible focus ring (3px accent, 3px offset). Use shortcuts for repetitive workflows (J/K to move, A to approve) and show them in a tooltip.
- Contrast: body text ≥ 4.5:1 and large text ≥ 3:1 (§3.2 rules).
- Every chart has a text alternative (the list beside it counts). Every icon-only button has a label.

---

## 19. Product briefs

These describe each product's **purpose, users, core jobs and character**, not its screens. Read the backend to see the real features, then design screens with §8 and §9. Anything marked *idea* is a suggestion you can drop.

### Warmline (blue `#2F6BFF`)
- **What:** cold outreach that reads warm. It researches each person, finds one real hook, drafts a short personal email, sends it from the user's own Gmail after approval, and sorts the replies with suggested answers.
- **For:** students and juniors doing internship and job outreach. They're anxious about sounding fake and short on time.
- **Core jobs:** add people → review and approve drafts → send → handle replies → see what's working.
- **Signature moment:** the draft with **the hook highlighted** and its source one click away (ref `05`). Protect this in every redesign.
- **Character:** focused and quietly encouraging, like a good mentor reading over your shoulder.
- **Must have:** nothing is sent without explicit approval. A daily send limit is visible. Replies are grouped by intent.
- *Idea:* keyboard-driven review (J/K/A) for approving many drafts fast.

### Forkcast (orange `#FF5A1F`)
- **What:** rates the dish, not the restaurant. It reads real reviews and customer photos and scores dishes on taste, quantity and quality.
- **For:** someone hungry and tired at 9 pm, on a phone.
- **Core jobs:** say what you're in the mood for → compare a few dishes → trust one → go and order it.
- **Signature moment:** a dish card with **three score bars** and "Based on 131 reviews and 54 real customer photos" (ref `04`).
- **Character:** warm, appetising and quick. Fewer, better picks, never an endless list.
- **Must have:** real customer photos labelled as such, "Why this?" on every pick, and a clear path to order.
- *Idea:* a "for two / for one" toggle that changes the quantity weighting.

### Finance Hub (green `#00B86B`, buttons in `#009A59`)
- **What:** every statement, one calm picture. It parses bank and card statements, matches card bills and self-transfers so nothing is counted twice, categorises spend, and tracks goals.
- **For:** anyone whose money sits across several banks and cards.
- **Core jobs:** bring in statements → see what was really spent → fix the few uncertain items → track goals and budgets.
- **Signature moment:** "Real spend", with the **"Never counting the same rupee twice"** card showing what was left out and why (ref `03`).
- **Character:** calm and reassuring, never alarming. Money is stressful, and the UI shouldn't add to it. Use danger red sparingly.
- **Must have:** every number explains what's included. Uncertain categories are flagged, not guessed silently. Tagging one merchant applies to all its charges, after confirming.
- *Idea:* a monthly "what changed" summary card in plain sentences.

### CrowdLens (violet `#7C5CFF`)
- **What:** test a video on a simulated crowd of Indian viewers before it goes live. It flags the exact moments that might land badly, with whom, and why.
- **For:** creators and brand teams about to publish.
- **Core jobs:** upload a cut and pick audiences → read the flags → compare segments → fix and re-run.
- **Signature moment:** **the timeline with flags at the exact seconds**, each one explaining who reacts and why, with a suggested edit.
- **Character:** sharp and honest, like a trusted editor. Specific about problems, never preachy.
- **Must have:** flags tied to timestamps, segment chips on every flag, and suggested edits that are concrete ("trim 3s", "change the caption").
- *Idea:* a side-by-side comparison of two cuts.

### A future app
Pick a new accent (§3.2), write a brief in this same shape (what, for, core jobs, signature moment, character, must have), then follow §9.

---

## 20. Anti-patterns: what makes it look generic

If you notice yourself doing any of these, stop:

- Purple-to-blue gradients, gradient text, glassmorphism panels, glowing borders, neon on dark.
- Inter, Roboto, Poppins or a second font family. Bold 700 headings instead of 900.
- Grey cards on a grey page; heavy drop shadows; 1px borders *and* shadows; sharp corners anywhere.
- Accent colour everywhere: coloured headings, coloured icons, several coloured buttons on one screen.
- Emoji as icons or decoration. Stock illustrations of people at laptops. Abstract blobs.
- A hero with "Supercharge your X with AI ✨". Marketing copy inside the app.
- Dashboards full of charts nobody asked for. KPI cards without sub-lines.
- Spinners with no text, or modals for things that could be inline.
- Hover effects that tilt, glow or scale cards. Idle animations.
- Placeholder text left in ("Lorem ipsum", "Card title", "Description goes here").
- Default component-library styling showing through (default shadcn greys, MUI blue, Bootstrap buttons).

---

## 21. Review checklist before you call a screen done

- [ ] Only colours, radii, shadows and fonts from this file are used.
- [ ] Exactly one primary (accent) button, and its label says what happens.
- [ ] Headings are Fira 900, body 400 to 500, numbers tabular.
- [ ] Every button has the lip and presses down.
- [ ] No emoji anywhere, including in test data.
- [ ] Loading, empty, error and filled states exist (plus partial for AI).
- [ ] Every AI output shows its source, can be explained, and can be edited, and every consequential action needs an approval click.
- [ ] Works in test data mode.
- [ ] Works at 390px wide, the keyboard reaches everything, and the focus ring is visible.
- [ ] Reduced motion turns off everything but fades.
- [ ] Squint test: mostly white and ink, with the accent on one or two things.
- [ ] Next to `design-refs/03` and `05`, it looks like the same family.

---

## 22. Ready-to-paste tokens and Tailwind setup

```css
:root {
  --font: "Fira Sans", system-ui, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, monospace;

  --bg:#FAFAFB; --card:#FFFFFF; --surface:#F6F6F8; --surface-2:#EEEEF2; --line:#ECECEF;
  --ink:#1D1D1F; --ink-2:#48484F; --muted:#76767E; --faint:#A1A1A8;

  /* per app: Warmline shown. Swap the ramp from §3.2. */
  --accent-50:#EEF3FF; --accent-100:#DCE6FF; --accent-200:#B9CCFF; --accent-500:#2F6BFF;
  --accent-600:#1F55E0; --accent-700:#1A3FA8; --accent-900:#0F2466;

  --success:#18C964; --success-text:#0E7A3D; --success-tint:#E8FAF0;
  --warning:#FFB020; --warning-text:#8A5A00; --warning-tint:#FFF6D6;
  --danger:#F0443A;  --danger-text:#B3261E;  --danger-tint:#FDECEB;

  --r-s:12px; --r-m:20px; --r-l:28px; --r-xl:32px; --r-pill:999px;

  --shadow-flat:0 0 0 1px var(--line);
  --shadow-float:0 0 0 1px var(--line), 0 20px 40px -20px rgba(0,0,0,.18);
  --shadow-lift:0 0 0 1px var(--line), 0 30px 60px -30px color-mix(in srgb, var(--accent-500) 45%, rgba(0,0,0,.4));

  --spring:linear(0,.096 4.4%,.355 9.5%,.705 16.1%,.877 20.3%,1.004 24.7%,1.074 29.1%,1.098 33.6%,1.09 38.6%,1.035 49.7%,1.003 60.7%,.996 72.1%,1);
  --soft:cubic-bezier(.22,1,.36,1);
}
body { background:var(--bg); color:var(--ink); font-family:var(--font); font-size:16px; line-height:1.5; -webkit-font-smoothing:antialiased; }
```

```ts
// tailwind.config.ts (excerpt): replace the default palette so Tailwind blues and greys can't creep in
theme: {
  colors: {
    transparent: "transparent", white: "#FFFFFF",
    bg: "var(--bg)", card: "var(--card)", surface: "var(--surface)", "surface-2": "var(--surface-2)", line: "var(--line)",
    ink: "var(--ink)", "ink-2": "var(--ink-2)", muted: "var(--muted)", faint: "var(--faint)",
    accent: { 50: "var(--accent-50)", 100: "var(--accent-100)", 200: "var(--accent-200)", 500: "var(--accent-500)", 600: "var(--accent-600)", 700: "var(--accent-700)", 900: "var(--accent-900)" },
    success: { DEFAULT: "var(--success)", text: "var(--success-text)", tint: "var(--success-tint)" },
    warning: { DEFAULT: "var(--warning)", text: "var(--warning-text)", tint: "var(--warning-tint)" },
    danger:  { DEFAULT: "var(--danger)",  text: "var(--danger-text)",  tint: "var(--danger-tint)" },
  },
  borderRadius: { none: "0", s: "12px", m: "20px", l: "28px", xl: "32px", full: "999px" },
  boxShadow: { flat: "var(--shadow-flat)", float: "var(--shadow-float)", lift: "var(--shadow-lift)", none: "none" },
  fontFamily: { sans: ["var(--font)"], mono: ["var(--mono)"] },
  fontWeight: { normal: "400", medium: "500", semibold: "600", extrabold: "800", black: "900" },
}
```

Portfolio hand-off: when an app is live, capture the screens its product page lists (`/v2/apps/<slug>` shows the labels) at 1440×900 in test data mode, export them as WebP under 300KB into `public/v2/shots/<app>-<n>.webp`, and set `live:` for the app in `src/components/v2/data.ts`.
