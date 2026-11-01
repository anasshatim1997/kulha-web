# KULHA! Visual direction — brand marketing pass

## Product identity

KULHA! is a Moroccan neighbourhood marketplace for discounted surplus-food baskets. The visual language uses market green, warm cream, saffron and restrained tomato accents. Local identity comes from the everyday neighbourhood voice, practical value for customers, and a clear path for local shop owners—not from a generic nationality slogan or decorative flag motif.

## Homepage hierarchy

1. **Hero:** viewport-height first impression with a localized typewriter headline, short product explanation, customer CTA, how-it-works CTA and the original supplied animated KULHA! bag/wordmark. The logo animation is cropped from the provided hero master and displayed without player controls or a framed player surface.
2. **Neighbourhood voice:** three short campaign cards about better-value baskets, discovering nearby shops and making use of available food.
3. **Audience choice:** two high-visibility cards route customers to basket discovery and shop owners to merchant onboarding.
4. **Before you reserve:** six practical reassurance cards covering MAD pricing, declared contents, stock checks, reviewed shop accounts, collection details and payment terms. The pilot-status panel only refers to launch areas after confirmation.
5. **How it works:** three steps, followed by a compact strip of shop categories.
6. **Why KULHA!:** customer benefits focused on fair prices, local shops, declared details and clear collection.
7. **Pickup and shops:** the customer collection flow and merchant onboarding in one two-column chapter.
8. **FAQ:** priority first-visit questions followed by a direct account CTA; the full FAQ remains on its own page.

The header is deliberately non-sticky and exposes four clear destinations: customers, how it works, FAQ, and the shop-owner space. The footer keeps the product promise and useful links without a generic “Une marque marocaine” label.

## Arabic / RTL

- The hero grid uses explicit column placement: the artwork stays on the left and Arabic copy stays on the right.
- Arabic headings do not inherit negative Latin letter spacing.
- Arabic headings and paragraphs use increased line height.
- The Latin brand artwork is isolated from the Arabic heading; it cannot overlap the text column.
- The typewriter title cycles through Modern Standard Arabic, French or English campaign lines according to the active locale.

## Account screens

- Desktop: exactly two equal grid columns spanning the viewport width below the masthead. The brand/benefit panel takes one half and the form area takes the other half.
- Tablet and phone: stacked layout with a compact brand panel followed by the form.
- The form has no nested scroll container. When the viewport is too short, the document itself can scroll rather than trapping the user inside the form.

## Responsive breakpoints

- Desktop: four navigation destinations and two-column content cards.
- Tablet: compact navigation drawer and stacked homepage hero.
- Phone: single-column campaign/audience cards and stacked account layout.

## Validation performed for this pass

- Parsed all TypeScript/TSX source files with the installed TypeScript compiler API: no syntax diagnostics.
- Parsed the full global stylesheet with tinycss2: no CSS parse error.
- Confirmed all three locale dictionaries and all AR/FR/EN typewriter lines are present.
- Verified the cropped hero video streams and poster are generated from the supplied original logo animation.

A full Next.js build, Vitest run and live browser rendering still require installing dependencies and running the app in a browser.

## Customer decision checklist

The homepage should answer these questions before asking a visitor to register:

- What is KULHA!, and what happens to the basket after reservation?
- What is the price in MAD, what contents has the shop declared, and how much stock is available?
- Which participating shop is offering it, where is the shop, and what is the collection window?
- What payment terms apply, and can an unavailable or expired basket still be reserved?
- Is the visitor's neighbourhood actually included in the pilot yet?

No partner names, launch locations, discount percentages, ratings, customer counts or environmental impact figures should be displayed until verified. Food details and allergen information must come from the shop or another validated source; unknowns remain unknown.
