import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { DishCard } from "@/components/DishCard";
import { Photo } from "@/components/Photo";
import { Bars } from "@/components/Bars";
import { DISH, R } from "@/lib/data";

export const metadata: Metadata = { title: "Rate the dish, not the restaurant · Forkcast", description: "How and why I built Forkcast, a dish-level layer on top of Swiggy." };

const TOC = [
  ["why", "Why I built it"],
  ["scroll", "The 9 pm scroll"],
  ["rating", "One rating for a whole menu"],
  ["who", "Who gets stuck"],
  ["chat", "From filters to a chat"],
  ["compare", "Comparing across restaurants"],
  ["dinein", "Dine in or order in"],
  ["photos", "Matching photos to plates"],
  ["kitchens", "Finding the shared kitchens"],
  ["rejected", "Decisions I rejected"],
  ["hard", "What's hard"],
  ["measure", "How I'd measure it"],
  ["next", "What's next"],
];

const SOURCES = [
  ["One licence traced to 189 Swiggy listings", "Peabee (Substack)", "https://peabee.substack.com/p/17-one-kitchen-hundreds-of-internet", "Deccan Herald", "https://www.deccanherald.com/india/karnataka/bengaluru/300-eateries-2-licences-just-1-owner-happens-in-only-bengaluru-1142895.html"],
  ["80% of surveyed restaurants price higher on delivery apps than on their printed menu", "Inc42", "https://inc42.com/buzz/restaurants-charging-consumers-around-10-more-on-zomato-swiggy-report"],
  ["Place Details returns at most 5 reviews and 10 photos", "Google Places API (New) reference", "https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places"],
  ["Scraping and caching limits on Maps content", "Google Maps Platform terms", "https://cloud.google.com/maps-platform/terms"],
  ["No benchmarking or harvesting beyond scope", "Swiggy MCP builder access rules", "https://mcp.swiggy.com/builders/access/"],
] as const;

const PERSONAS = [
  ["Tired, solo, 9 pm", "“Comfort, not heavy” isn't a filter. “4.0+ and under 30 min” still returns hundreds of places.", "One message, 3 picks with what arrives", "45 → 3"],
  ["Four flatmates in HSR", "Cost for two is a restaurant number. No portion size, no way to vote.", "“For two” weighting, compare, a shared link", "70 → 5"],
  ["Jain family, a nut allergy", "“Pure veg” isn't Jain. Cashew in the gravy is rarely labelled.", "A Jain rule and a nut rule, set once", "50 → 2"],
  ["Dine in or order in?", "No dine-in price, and delivery photos mixed with plated ones.", "Both prices, delivered-only photos", "35 → 2"],
];

const STEPS = [
  ["Search Swiggy", "Restaurants, menus, dish prices and dish ratings near you, with your own sign-in.", "Swiggy MCP"],
  ["Find the real place", "Match each listing to Google Maps by name, area and menu.", "Places API"],
  ["Collect evidence", "Reviews and customer photos, with dates and delivery vs dine-in.", "Places API"],
  ["Match photos to dishes", "The restaurant's own menu is the label list. Caption, look-alike photos and a vision model must agree.", "Gemini · SigLIP"],
  ["Score each dish", "Split reviews into taste, quantity, quality, packaging and value, per dish.", "Gemini"],
  ["Rank for you", "Your rules first, then your balance. Every pick shows its sources.", "Your taste"],
];

export default function Story() {
  const bir = ["mutton-biryani", "donne-biryani", "chicken-biryani"].map((id) => DISH[id]);
  const pt = DISH["paneer-tikka"];
  return (
    <div className="wrap pb-10 pt-8">
      <div className="lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Contents" className="hidden lg:block">
          <div className="sticky top-[96px]">
            <div className="eyebrow mb-3">Contents</div>
            <ol className="grid gap-0.5">
              {TOC.map(([id, l]) => <li key={id}><a href={`#${id}`} className="block rounded-full px-3 py-1.5 text-[14px] font-medium text-muted hover:bg-surface hover:text-ink">{l}</a></li>)}
            </ol>
            <Link href="/" className="btn primary sm mt-6">Try Forkcast <ArrowRight /></Link>
          </div>
        </nav>

        <article className="min-w-0">
          <header className="max-w-[720px]">
            <div className="eyebrow accent mb-4">Case study · Forkcast</div>
            <h1 className="text-[40px] font-black leading-[1.04] tracking-[-0.01em] sm:text-[56px]">Rate the dish, not the restaurant</h1>
            <p className="mt-5 text-[19px] text-ink-2">How I built Forkcast, a prototype that scores single dishes from reviews and customer photos, so a 9 pm order takes one message instead of six menus.</p>
            <p className="mt-4 text-sm font-medium text-muted">Aman · Bengaluru · Nov 2026 · Solo prototype, test data · 8 min read</p>
          </header>

          <Figure caption="A pick in Forkcast, on test data: one dish, scored for you, with a photo customers took of their delivery.">
            <BrowserFrame>
              <div className="grid gap-4 bg-bg p-5 sm:grid-cols-[minmax(0,1fr)_260px]">
                <div className="flex flex-col gap-3">
                  <div className="bubble-user self-end">Something savory under ₹500, from a good restaurant</div>
                  <div className="flex flex-wrap justify-end gap-1.5"><span className="chip sm">Savory</span><span className="chip sm">Under ₹500</span><span className="chip sm">No cloud kitchens</span></div>
                  <div className="bubble-ai">3 savory picks under ₹500. Top pick: mutton biryani.</div>
                </div>
                <DishCard pick={{ id: "mutton-biryani", score: 4.5, flags: [] }} rank={0} />
              </div>
            </BrowserFrame>
          </Figure>

          <Section id="why" title="Why I built it">
            <P>On Swiggy, ratings in Bengaluru started to feel unreliable to me. A place showing 4 stars would turn out to be a cloud kitchen. A biryani with a great rating would arrive with lots of rice and not much else, because the people rating it cared about quantity, not quality. The photos looked professionally shot. What arrived didn&rsquo;t.</P>
            <P>The question I wanted answered wasn&rsquo;t &ldquo;which restaurant is good&rdquo;. It was &ldquo;which dish, from which kitchen, will be good when it reaches me&rdquo;. No app answers that, because the answer sits in three places: menus on Swiggy, opinions in reviews, and the truth in customer photos.</P>
            <P>Forkcast is a solo prototype built to test one idea: score dishes, not restaurants, and always show the evidence. This version runs on test data for 14 dishes across 12 places. The live version searches Swiggy through its MCP, signed in with your own account.</P>
          </Section>

          <Section id="scroll" title="The 9 pm scroll">
            <P>You open Swiggy hungry. A typical session, by my own count: six restaurants opened, four filters tried, a detour to Google Maps for photos, and still no order. Every restaurant says 4.2 to 4.5. Nothing says what will arrive.</P>
            <LoopDiagram />
            <P>The loop has three exits, and only one of them is any good:</P>
            <div className="my-6 grid gap-3 sm:grid-cols-3">
              {[["Same safe thing", "The usual biryani. Relief, no delight."], ["Order and regret", "A 4.5 that turns out to be one of 14 brands from one kitchen."], ["Give up", "Maggi at home. A few nights like this, and the app loses you."]].map(([t, b]) => (
                <div key={t} className="card compact"><div className="h3 text-[17px]">{t}</div><p className="mt-1 text-[15px] text-ink-2">{b}</p></div>
              ))}
            </div>
            <BeforeAfter />
          </Section>

          <Section id="rating" title="One rating for a whole menu">
            <P>A star rating scores the restaurant, not your plate. A kitchen with a great biryani and a weak paneer gets one number. Four things make it worse:</P>
            <div className="my-6 grid gap-3 sm:grid-cols-2">
              <Fact chip="Swiggy 4.5 · dish quality 3.1" test title="Quantity lovers set the score">In my test data, a 4.5 restaurant&rsquo;s biryani scores 3.1 on quality once reviews about portion size are separated out.</Fact>
              <Fact chip="Stock photo · on 9 other listings" test title="The photo isn't the food">Listing photos are styled, and some appear on several listings.</Fact>
              <Fact chip="Cloud kitchen · many brands, 1 address" title="One kitchen, many names">One Bengaluru licence was traced to 189 Swiggy listings.<Sup n={1} /></Fact>
              <Fact chip="+₹40 vs dine-in" title="The app costs more">80% of surveyed restaurants price higher on delivery apps than on their printed menu.<Sup n={2} /></Fact>
            </div>
            <P>Filters work on restaurants. The decision is about a dish.</P>
          </Section>

          <Section id="who" title="Who gets stuck">
            <P>Four people, four ways filters fail. Tap counts are my estimates for a typical session, not measured.</P>
            <div className="my-6 grid gap-3 md:grid-cols-2">
              {PERSONAS.map(([who, fail, fix, taps]) => (
                <div key={who} className="card compact grid gap-2">
                  <div className="flex items-start justify-between gap-3"><div className="h3 text-[17px]">{who}</div><span className="chip sm num">{taps} est. taps</span></div>
                  <p className="text-[15px] text-muted">{fail}</p>
                  <p className="text-[15px] font-semibold text-ink-2">{fix}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="chat" title="From filters to a chat">
            <P>&ldquo;Savory&rdquo; isn&rsquo;t a filter. Neither is &ldquo;not oily&rdquo; or &ldquo;enough for two but not heavy&rdquo;. So the main screen is a chat: you say it the way you&rsquo;d say it to a friend, and Forkcast shows how it read you as chips you can remove.</P>
            <ul className="my-6 grid gap-3">
              {[
                ["Three picks, never a list", "A long list is the loop again. Three picks, each with a reason, and two more if you ask."],
                ["Every pick shows its work", "Review and photo counts on every card, “Why this?” inline, and a warning when there are too few photos."],
                ["Rules, not toggles", "“No onion or garlic”, “nut allergy”, “nothing over ₹300”. Typed in plain words or built in two taps, each with a preview of how many dishes it affects."],
                ["Learning needs your OK", "After an order, Forkcast suggests changes. Nothing applies without a tap."],
              ].map(([t, b]) => (
                <li key={t} className="rounded-m bg-card p-4 shadow-flat"><div className="font-black">{t}</div><p className="mt-1 text-[15px] text-ink-2">{b}</p></li>
              ))}
            </ul>
          </Section>

          <Section id="compare" title="Comparing across restaurants">
            <P>Comparing three biryanis on Swiggy means three menus, one at a time: about 12 numbers across 6 screens, by my count. Nobody holds that in their head, so people pick the one they remember.</P>
            <P>Filters can&rsquo;t help, because they sort restaurants. Forkcast puts dishes from different kitchens side by side on the same scale, and ends with one verdict line.</P>
          </Section>
          <Figure caption="Three biryanis from three kitchens on one scale. The orange bar wins its row. Test data.">
            <div className="rounded-l bg-card p-4 shadow-flat sm:p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {bir.map((d) => (
                  <div key={d.id} className="grid content-start gap-3">
                    <Photo dish={d} kind="delivered" ratio="4 / 3" label="Delivered" />
                    <div><div className="font-black">{d.name}</div><div className="text-sm text-muted">{R[d.r].name} · ₹{d.price}</div></div>
                    <Bars dish={d} compact focus={d.id === "chicken-biryani" ? "quantity" : d.id === "mutton-biryani" ? "taste" : "value"} />
                    {R[d.r].type === "cloud" && <span className="chip warn sm w-fit">Cloud kitchen · 14 brands</span>}
                  </div>
                ))}
              </div>
              <p className="mt-5 rounded-m bg-accent-50 p-4 font-extrabold" style={{ color: "var(--on-tint)" }}>Mutton biryani wins for you. Chicken biryani (full) if you want the most food. Chicken donne biryani is ₹130 cheaper.</p>
            </div>
          </Figure>

          <Section id="dinein" title="Dine in or order in">
            <P>The same dish has two prices and two versions. On the app it costs more, and it arrives in a box 30 to 40 minutes later.</P>
            <P>Forkcast shows the menu price next to the app price, and keeps delivered photos apart from plated ones. When a dish travels badly it says so: a masala dosa from 9 km away usually arrives soft, so the honest answer is to go there.</P>
          </Section>
          <Figure caption="One dish, three photos. Only the delivered one is what you get. Test data, drawn stand-ins.">
            <div className="grid grid-cols-3 gap-3">
              <div><Photo dish={pt} kind="listing" label="Listing" /><p className="mt-2 text-sm font-semibold text-ink-2">The listing</p></div>
              <div><Photo dish={pt} i={21} kind="dinein" label="Dine-in" /><p className="mt-2 text-sm font-semibold text-ink-2">At the restaurant, ₹280</p></div>
              <div><Photo dish={pt} i={1} kind="delivered" label="Delivered" pins flagLabels={["raw onion"]} /><p className="mt-2 text-sm font-semibold text-ink-2">Delivered, ₹320 · raw onion in 7 of 9</p></div>
            </div>
          </Figure>

          <Section id="photos" title="Matching photos to plates">
            <P>Places with tens of thousands of Google reviews have hundreds of customer photos, enough to show every main dish. The hard part is knowing which photo shows which dish.</P>
            <ol className="my-6 grid gap-3 lg:grid-cols-3">
              {STEPS.map(([t, b, tool], i) => (
                <li key={t} className="card compact grid content-start gap-2">
                  <div className="flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink font-black text-card">{i + 1}</span><span className="chip sm">{tool}</span></div>
                  <div className="font-black">{t}</div>
                  <p className="text-[15px] text-ink-2">{b}</p>
                </li>
              ))}
            </ol>
            <P>The trick is the menu. A photo from a restaurant can only be one of the 60 or so dishes it sells, so the question changes from &ldquo;what food is this?&rdquo; to &ldquo;which of these 60?&rdquo;. A photo is tied to a dish only when its caption, its look-alike photos and a vision model agree. The same pass notes what&rsquo;s visible, like raw onion or a side of chutney, which is what makes a rule like &ldquo;no raw onion&rdquo; possible.</P>
          </Section>

          <Section id="kitchens" title="Finding the shared kitchens">
            <P>Cloud kitchens aren&rsquo;t bad by default. The problem is not knowing. Three signals together flag one: 3 or more Swiggy brands at the same address, the same listing photos across those brands, and no dine-in place on Google Maps.</P>
            <P>The label stays factual: &ldquo;Cloud kitchen · 14 brands, 1 address&rdquo;, never &ldquo;fake&rdquo;. You decide what to do with it.</P>
          </Section>

          <Section id="rejected" title="Decisions I rejected">
            <ul className="my-4 grid gap-3">
              {[
                ["A ranked list", "Fifty results recreates the scroll. Three picks forces the ranking to commit."],
                ["Weight sliders on the main screen", "Numbers like 1.2× mean nothing at 9 pm. They live in My taste and change through suggestions you approve."],
                ["Browsing by cuisine or restaurant", "It copies the loop Forkcast exists to break."],
                ["Scraping Zomato or scoring from Reddit", "Legal risk, and too little data per dish. Reddit stays as evidence only."],
                ["Learned rules that hide dishes", "Learned rules can only warn or rank lower. Hiding, diet and allergy rules come only from you."],
              ].map(([t, b]) => <li key={t} className="rounded-m bg-card p-4 shadow-flat"><div className="font-black">{t}</div><p className="mt-1 text-[15px] text-ink-2">{b}</p></li>)}
            </ul>
          </Section>

          <Section id="hard" title="What's hard">
            <ul className="my-4 grid gap-3">
              {[
                ["Reviews are the bottleneck, not the AI", <>Google&rsquo;s Places API returns 5 reviews and 10 photos per place.<Sup n={3} /> Getting thousands needs a paid third-party service, a grey area under Google&rsquo;s terms.<Sup n={4} /></>],
                ["Swiggy gives menus, not opinions", <>The MCP tools I had access to in Nov 2026 return dish prices and dish ratings, but no review text, fees or licence numbers.</>],
                ["Terms limit the scale", <>Swiggy&rsquo;s rules for builders rule out benchmarking and bulk harvesting.<Sup n={5} /> Forkcast works on demand, on your own account, with a small cache.</>],
                ["Allergens can't be promised", <>Photos and reviews can&rsquo;t prove a dish is nut-free. An allergy rule hides likely matches and says to ask the kitchen.</>],
              ].map(([t, b]) => <li key={t as string} className="rounded-m bg-card p-4 shadow-flat"><div className="font-black">{t}</div><p className="mt-1 text-[15px] text-ink-2">{b}</p></li>)}
            </ul>
          </Section>

          <Section id="measure" title="How I'd measure it">
            <P>None of this is measured yet. These are the targets I&rsquo;d test against, after a 15-person diary study sets the baseline.</P>
            <div className="my-6 overflow-x-auto rounded-l bg-card shadow-flat">
              <table className="w-full min-w-[520px] text-left text-[15px]">
                <thead><tr className="text-[13px] font-semibold text-muted"><th className="px-5 py-3">Metric</th><th className="px-5 py-3">Target</th><th className="px-5 py-3">What it counts</th></tr></thead>
                <tbody>
                  {[["Time to decision", "under 90 s", "First message to Swiggy cart"], ["Abandoned sessions", "under 25%", "Searched, never reached a cart"], ["Regret rate", "half of baseline", "Orders rated worse than shown"], ["Top-3 hit rate", "over 60%", "Carts from the first three picks"], ["New dishes tried", "up, with low regret", "Exploring without the risk"]].map(([m, t, w]) => (
                    <tr key={m} className="border-t border-line"><td className="px-5 py-3 font-extrabold">{m}</td><td className="num px-5 py-3 font-semibold text-accent-700">{t}</td><td className="px-5 py-3 text-ink-2">{w}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <P>Orders happen on Swiggy, so they&rsquo;re confirmed from your order history, not from the cart hand-off.</P>
          </Section>

          <Section id="next" title="What's next">
            <ol className="my-4 grid gap-2">
              {["Live mode: Swiggy sign-in and a review source with enough depth", "Voting on a shared shortlist, without signing in", "“Surprise me”: one pick inside your rules, with its confidence", "Rules from a photo: tap the onion rings, confirm"].map((t, i) => (
                <li key={t} className="flex items-center gap-3 rounded-m bg-card p-4 shadow-flat"><span className="num grid h-7 w-7 flex-none place-items-center rounded-full bg-surface text-sm font-black">{i + 1}</span><span className="font-semibold">{t}</span></li>
              ))}
            </ol>
            <P>And what I&rsquo;d do differently: run the diary study first, solve review access on day one (the 5-review limit, not the model, is the real constraint), and design for one person, the tired 9 pm orderer, before the other three.</P>
          </Section>

          <section className="mt-14 max-w-[720px] border-t border-line pt-6" aria-labelledby="sources">
            <h2 id="sources" className="eyebrow mb-3">Sources</h2>
            <ol className="grid gap-1.5 text-[13px] text-muted">
              {SOURCES.map(([claim, n1, u1, n2, u2], i) => (
                <li key={claim} id={`src-${i + 1}`}><span className="num font-semibold">{i + 1}.</span> {claim}. <a className="font-semibold text-accent-700 underline-offset-2 hover:underline" href={u1} target="_blank" rel="noreferrer">{n1} ↗</a>{n2 && <>, <a className="font-semibold text-accent-700 underline-offset-2 hover:underline" href={u2} target="_blank" rel="noreferrer">{n2} ↗</a></>}</li>
              ))}
              <li>Everything marked test data comes from the prototype&rsquo;s fixtures. Restaurant names are made up.</li>
            </ol>
          </section>

          <div className="mt-14 rounded-xl bg-accent-500 px-6 py-12 text-center text-white sm:px-12">
            <h2 className="text-[32px] font-black leading-tight">Try it with test data</h2>
            <p className="mx-auto mt-2 max-w-[44ch] text-[17px] opacity-90">14 dishes across 12 Bengaluru places. Nothing leaves your browser.</p>
            <Link href="/" className="btn mt-6" style={{ background: "#fff", color: "#1D1D1F", boxShadow: "0 4px 0 rgba(0,0,0,.25)" }}>Open Forkcast <ArrowRight /></Link>
          </div>
        </article>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="mt-14 max-w-[720px] scroll-mt-24"><h2 className="h2 mb-4">{title}</h2>{children}</section>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-[17px] leading-relaxed text-ink-2">{children}</p>;
}
function Sup({ n }: { n: number }) {
  return <sup className="ml-0.5"><a href={`#src-${n}`} className="font-bold text-accent-700" aria-label={`Source ${n}`}>{n}</a></sup>;
}
function Figure({ caption, children }: { caption: string; children: React.ReactNode }) {
  return <figure className="my-10 max-w-[1000px]">{children}<figcaption className="mt-3 text-sm text-muted">{caption}</figcaption></figure>;
}
function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-l bg-card shadow-lift">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3"><span className="h-3 w-3 rounded-full bg-surface-2" /><span className="h-3 w-3 rounded-full bg-surface-2" /><span className="h-3 w-3 rounded-full bg-surface-2" /><span className="ml-3 rounded-full bg-surface px-3 py-1 font-mono text-xs text-muted">localhost:3100</span></div>
      {children}
    </div>
  );
}
function Fact({ chip, title, test, children }: { chip: string; title: string; test?: boolean; children: React.ReactNode }) {
  return (
    <div className="card compact grid gap-2">
      <div className="flex flex-wrap items-center gap-2"><span className="chip warn sm w-fit">{chip}</span>{test && <span className="badge">Test data</span>}</div>
      <div className="h3 text-[17px]">{title}</div>
      <p className="text-[15px] text-ink-2">{children}</p>
    </div>
  );
}
function BeforeAfter() {
  return (
    <figure className="my-8">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card compact grid gap-3">
          <div className="eyebrow">Today</div>
          <div className="flex flex-wrap gap-1.5">{["Open app", "Scroll", "Restaurant 1…6", "Filters", "Zomato", "Maps", "Back"].map((s) => <span key={s} className="chip sm">{s}</span>)}</div>
          <div className="num text-[28px] font-black">~12 min <span className="text-[15px] font-semibold text-muted">estimate</span></div>
          <p className="text-[15px] text-muted">6 restaurants, 3 apps, then the usual.</p>
        </div>
        <div className="card compact insight grid gap-3">
          <div className="eyebrow accent">With Forkcast</div>
          <div className="flex flex-wrap gap-1.5">{["1 message", "3 picks", "Compare", "Swiggy cart"].map((s) => <span key={s} className="chip sm bg-card">{s}</span>)}</div>
          <div className="num text-[28px] font-black" style={{ color: "var(--on-tint)" }}>&lt;90 s <span className="text-[15px] font-semibold opacity-70">target</span></div>
          <p className="text-[15px]" style={{ color: "var(--on-tint)" }}>Evidence on every pick, before you pay.</p>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-muted">Same goal, two journeys. Left is my estimate of today; right is the target, not yet measured.</figcaption>
    </figure>
  );
}

function LoopDiagram() {
  const node = (x: number, y: number, w: number, label: string, sub: string, accent = false) => (
    <g>
      <rect x={x} y={y} width={w} height={56} rx={16} fill="var(--card)" stroke={accent ? "var(--accent-500)" : "var(--line)"} strokeWidth={accent ? 2 : 1} />
      <text x={x + w / 2} y={y + 24} textAnchor="middle" fontWeight={800} fontSize={14} fill="var(--ink)">{label}</text>
      <text x={x + w / 2} y={y + 42} textAnchor="middle" fontSize={12} fill="var(--muted)">{sub}</text>
    </g>
  );
  return (
    <figure className="my-8">
      <div className="overflow-x-auto rounded-l bg-surface p-4">
        <svg viewBox="0 0 680 300" className="w-full min-w-[560px]" role="img" aria-label="The decision loop: open, scroll, open a restaurant, then loop back through other restaurants, filters or other apps, until you settle, regret or give up.">
          <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted)" /></marker></defs>
          {node(10, 20, 110, "Open app", "banners, offers")}
          {node(160, 20, 120, "Scroll", "all 4.2 to 4.5")}
          {node(320, 20, 160, "Open a restaurant", "90 items, studio photos")}
          {node(520, 20, 150, "Cart", "fees appear")}
          <path d="M120 48 H158" stroke="var(--muted)" strokeWidth={1.5} markerEnd="url(#ah)" />
          <path d="M280 48 H318" stroke="var(--muted)" strokeWidth={1.5} markerEnd="url(#ah)" />
          <path d="M480 48 H518" stroke="var(--muted)" strokeWidth={1.5} markerEnd="url(#ah)" />
          {node(150, 140, 120, "Hop back", "6 more restaurants", true)}
          {node(290, 140, 110, "Filters", "no “savory”", true)}
          {node(420, 140, 130, "Other apps", "Zomato, Maps", true)}
          <path d="M370 76 C370 110 230 110 215 138" stroke="var(--accent-500)" strokeWidth={1.5} fill="none" markerEnd="url(#ah)" />
          <path d="M400 76 L350 138" stroke="var(--accent-500)" strokeWidth={1.5} fill="none" markerEnd="url(#ah)" />
          <path d="M440 76 L480 138" stroke="var(--accent-500)" strokeWidth={1.5} fill="none" markerEnd="url(#ah)" />
          <path d="M210 140 C190 100 200 80 215 78" stroke="var(--accent-500)" strokeWidth={1.5} strokeDasharray="4 4" fill="none" markerEnd="url(#ah)" />
          <text x={340} y={222} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--accent-text)">the loop</text>
          {node(80, 236, 150, "Same safe thing", "relief, no delight")}
          {node(265, 236, 150, "Order and regret", "not what arrived")}
          {node(450, 236, 150, "Give up", "and, over time, churn")}
        </svg>
      </div>
      <figcaption className="mt-3 text-sm text-muted">The before journey. Orange paths are the loops. Steps are from my own sessions, not measured.</figcaption>
    </figure>
  );
}
