# RDA Bygg AB — Premium 3D Construction Page

A fully interactive, conversion-focused homepage section for **RDA Bygg AB**, a
Swedish construction and carpentry company. Built as a Shopify theme section that
plugs into the existing Shopify theme layer in this repository (the same layer the
`sorein-*` sections use), with its own namespaced CSS/JS and self-contained vector
assets — no external CDN dependencies.

> This page lives in the **Shopify theme layer** of the repo (the `sections/`,
> `snippets/`, `templates/`, `layout/`, `config/`, `assets/` Shopify folders). It is
> uploaded to Shopify, not rendered by the Eleventy/Stride static-site build. It is
> fully namespaced under `.rda-page` / `rda-*`, so it does **not** touch or break the
> existing Sorein theme, the Stride site, navigation, footer or product templates.

---

## Files created

| File | Purpose |
|------|---------|
| `sections/rda-3d-construction-home.liquid` | The complete page section: 8 blocks (hero → quote form), schema settings, `material` + `service` blocks, and a full preset. Loads its own CSS/JS. |
| `assets/rda-3d-construction.css` | Premium Scandinavian design system, fully namespaced under `.rda-page`. Responsive + `prefers-reduced-motion`. |
| `assets/rda-3d-construction.js` | Namespaced IIFE (`window.RDA`). Hero parallax, material-card flip/tilt, scroll-build sequence, before/after slider, mobile sticky CTA, graceful form. |
| `templates/page.rda-construction.json` | JSON page template wiring the section + its 12 default blocks (6 materials, 6 services). |
| `assets/rda-hero-scene.svg` | Hero scene — Scandinavian carpentry interior, warm wood framing, daylight. |
| `assets/rda-before.svg` / `assets/rda-after.svg` | Before/after renovation images for the comparison slider. |
| `assets/rda-service-carpentry.svg` | Service card — carpentry workbench. |
| `assets/rda-service-kitchen.svg` | Service card — fitted kitchen. |
| `assets/rda-service-flooring.svg` | Service card — herringbone flooring. |
| `assets/rda-service-decking.svg` | Service card — outdoor deck. |
| `assets/rda-service-interior.svg` | Service card — interior renovation. |
| `assets/rda-service-custom.svg` | Service card — custom joinery. |
| `assets/rda-texture-wood.svg` | Wood grain texture (material swatch + CTA background). |
| `assets/rda-texture-blueprint.svg` | Blueprint grid texture (hero + build stage). |
| `assets/rda-texture-concrete.svg` | Subtle concrete background texture (services). |
| `assets/rda-texture-metal.svg` | Brushed metal texture (tools material swatch). |
| `assets/rda-logo.svg` | Clean RDA Bygg AB wordmark/monogram. |
| `assets/rda-noise.svg` | Fine film-grain texture overlaid on dark sections for material realism. |

Files edited: `.eleventyignore` (excludes this `.md` doc from the Stride build).

### About the assets
All visuals are **optimized SVG** — crisp at any resolution, a few KB each, no
external requests, and accessible (`role="img"` + descriptive `aria-label`). Every
image slot in the section is also an **`image_picker`**, so the SVGs act as
production-ready built-in artwork that a merchant can swap for real photography in
the customizer at any time, with no code changes.

---

## How to add the page in Shopify

**Option A — as a full page (recommended):**
1. Upload the theme (or these files) to Shopify.
2. In the admin: **Online Store → Pages → Add page** (e.g. title *"Construction"*).
3. In **Theme template**, choose **`page.rda-construction`**.
4. Save. Visit `/pages/construction` — the page renders with all 12 default blocks.

**Option B — drop the section onto any JSON template:**
1. **Online Store → Themes → Customize.**
2. Open the template you want (e.g. Home), **Add section → "RDA 3D Construction".**
3. The preset loads the hero, 6 material cards and 6 service cards automatically.
4. Edit any text, links, colours-by-content, images, or add/remove material &
   service blocks from the sidebar.

Everything is editable in the customizer: hero copy & CTAs, trust items, all
section headings, the scroll-build steps, process steps, trust items, before/after
images & labels, the quote-form fields/options, and the form action URL.

### Connecting the quote form
Leave **Form action URL** blank to use the built-in friendly confirmation
(no backend needed). To capture leads, set it to your Shopify contact endpoint
(the fields already use `contact[...]` names) or any form handler.

---

## Page structure

1. **Hero** — "Crafted Construction. Comfortable Solutions." with a serif display
   headline, rating badge, layered mouse/tilt-reactive (eased + idle-float) 3D
   scene and trust strip.
2. **Credibility stats band** — 4 animated count-up figures (years, projects,
   rating, insured).
3. **Interactive 3D material showcase** — cards tilt + cursor-sheen on hover and
   flip on click/tap/Enter to reveal details.
4. **Services** — 6 premium cards with depth-hover, image, copy and CTA.
5. **Scroll-build animation** — blueprint → materials → frame → details →
   finished result, driven by scroll, with a live progress bar.
6. **Before / After** — draggable, keyboard-accessible comparison slider.
7. **Process** — 5-step timeline.
8. **Trust** — 6 reasons + guarantee badges.
9. **Testimonial** — featured customer review.
10. **Final CTA + quote form** — "Ready to build something better?"

Plus a **mobile sticky CTA** (call + Request a Quote) on small screens.

### Premium design pass (v2)
- **Typography**: craft serif display face (**Fraunces**, italic accents) paired
  with **Inter** for UI — distinctive, editorial, not generic/techy.
- **Materials & depth**: warm material palette (wood/brass/cream/forest green),
  film-grain overlay on dark sections, layered soft shadows, gradient hairlines,
  vignettes and lighting/dust detail baked into the SVG scenes for realism.
- **Motion**: eased (lerped) hero parallax with idle float, cursor-tracking sheen
  on material cards and primary buttons, staggered scroll reveals, animated stat
  counters, and a scroll-driven build progress bar — all 200–300ms, GPU-friendly
  (`transform`/`opacity`), and fully disabled under `prefers-reduced-motion`.
- **Conversion**: rating badge + stats band + testimonial add credibility; quote
  form gains a title; generous Scandinavian spacing rhythm and refined mobile layout.

---

## Testing notes

- **Liquid** — schema JSON validated (64 settings, 2 block types, 12-block preset);
  page template JSON validated; uses only safe Liquid filters (`asset_url`,
  `image_url`, `default`, `escape`, `split`, `newline_to_br`, `where`).
- **Assets** — all 14 SVGs validated as well-formed XML; no external/CDN assets;
  no placeholder or broken paths.
- **JS** — passes `node --check`; namespaced, no globals; supports
  `shopify:section:load` for the theme editor; every selector matches a Liquid hook.
- **CSS/JS/Liquid integration** — cross-checked: all `rda-*` classes and data hooks
  used in markup exist in CSS/JS.
- **Accessibility** — semantic landmarks, `aria-label`/`aria-labelledby`, keyboard
  operable material cards and slider, visible focus styles, decorative layers
  `aria-hidden`, high-contrast text.
- **Performance** — hero image `fetchpriority="high"`, all other images
  `loading="lazy"`, `width`/`height` set to avoid layout shift, animations use only
  `transform`/`opacity`, rAF-throttled listeners.
- **Reduced motion** — `prefers-reduced-motion` disables parallax/tilt and snaps the
  scroll-build to the finished state.
- **Responsive** — 3-col → 2-col → 1-col breakpoints; no horizontal overflow;
  mobile sticky CTA appears below 620px.
- **Visual QA** — a single self-contained `rda-preview.html` (CSS/JS/SVG inlined)
  was generated to verify rendering and interactions in a browser.

> Note: the repo's Eleventy (`npm run build`) build already fails on the pre-existing
> Shopify `layout/theme.liquid` (Eleventy's LiquidJS doesn't understand Shopify's
> `{% section %}`/`{% schema %}` tags). That is a pre-existing condition of the Shopify
> theme overlay on `master` and is unrelated to this page — these files are meant to be
> uploaded to Shopify, not built by Eleventy.
