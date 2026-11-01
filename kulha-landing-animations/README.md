# Kulha! — landing page hero animations

Three desktop/landscape hero animations (1920×1080, 30 fps, about 5.2 s, no audio). They use the same style as the approved mobile splash (bag rises in, produce orbits and drops in, the lettering pops).
Mobile app splash is a separate asset; for small screens (< 768px) show the poster image or the mobile splash instead of these.

## What's inside

```
hero-1-split/    dark · text left, bag right          (main hero)
hero-2-center/   dark · bag centered, text underneath (campaign / how-it-works opener)
hero-3-light/    cream · text left, bag in green circle (light theme / mid-page section)
  each folder has:
    heroN-xxx.mp4 / .webm                  → slogan + buttons BAKED IN (drop-in, zero code)
    heroN-xxx-logo-only.mp4 / .webm        → logo animation only (put LIVE HTML text on top: SEO, i18n, buttons that really click)
    *_poster.jpg                           → last frame (use as `poster`, reduced-motion fallback, social image)
copy/            slogans.md (readable) + copy.json (for i18n / CMS)
demo/index.html  reference page: the 3 logo-only videos + live HTML/CSS text synced to the animation
logo-layers/     transparent PNGs of every logo layer (1536×1536 canvas, stack in numeric order) + full logo PNG
previews/        small GIF previews (for chat / Slack / review only, do not ship these)
```

## Recommended: logo-only video + live HTML text
Baked-in text is not selectable, not translatable, not indexable and can't hold real buttons. For production use the `-logo-only` files and the live-text pattern in `demo/index.html`.
Use the baked versions for quick prototypes, ads, or as a fallback.

## Minimal embed
```html
<section class="hero">
  <video muted playsinline preload="auto"
         poster="hero-1-split/hero1-split-logo-only_poster.jpg"
         aria-label="Animated Kulha! shopping bag filling up with fresh produce">
    <source src="hero-1-split/hero1-split-logo-only.mp4"  type="video/mp4">
    <source src="hero-1-split/hero1-split-logo-only.webm" type="video/webm">
  </video>
  <!-- live <h1>, subhead and buttons here -->
</section>
```
- `autoplay` can be added; it only works because the video is `muted` + `playsinline`. The demo starts playback with an IntersectionObserver instead.
- **No `loop`**: the animation plays once and holds on the final frame, which is the finished layout.
- The first frame is plain background, so always set `poster` and the hero background-color (`#073324` for heroes 1–2, `#FFF8EA` for hero 3) to avoid flashes.
- `prefers-reduced-motion`: skip the video and show the poster (the demo already does this for the text).
- The video is decorative; keep the real `<h1>` in HTML.

## Timeline (seconds from video start), for syncing HTML text
| Event | Hero 1 | Hero 2 | Hero 3 |
|---|---|---|---|
| Bag enters | 0.0 | 0.0 | 0.3 |
| Lettering "KULHA!" lands | ~1.6 | ~1.6 | ~1.9 |
| Eyebrow | 1.75 | – | 0.35 |
| Headline words (stagger 0.1 s) | 1.85 | 1.9 | 0.45 |
| Subhead | 2.6 | 2.55 | 1.2 |
| CTA / chips | 3.0 | 2.85 | 1.6 |
| Secondary CTA / note | 3.2 | – | 1.9 |
| Idle float until end | 2.2 → 5.2 | 2.2 → 5.2 | 2.2 → 5.2 |

The exact delays are already in `demo/index.html` as `--d` custom properties.

## Layout reference (1920×1080 canvas)
- Hero 1: text column starts x=140, bag centered at x=1330. Keep the left ~50% free for text.
- Hero 2: bag centered; text block sits in the bottom 25%.
- Hero 3: text column x=140; green circle (r=470) centered at x=1330.
- `object-fit: cover` crops the sides on narrower screens; on ultrawide screens the background colors match the video edges, so you can extend the section background with the same color/gradient.

## Brand tokens
| Token | Value |
|---|---|
| Deep green (icon / hero bg) | `#073324` |
| Text green (lettering) | `#06482F` |
| Yellow (accent, CTA) | `#FDBE2E` |
| Cream (bag, text on dark) | `#FCF4E7` |
| Tomato red (accent) | `#EE3F29` |
| Leaf green | `#7EC34A` |
| Subtext on dark | `#CEE0D2` · on light `#345C4A` |
| Font | **Nunito** 800 (headlines), 700 (buttons, eyebrow), 600 (body) — open-source (SIL OFL), via Google Fonts or self-hosted |
| Headline size | 98 px @ 1920 (≈ `5.1cqw`) · eyebrow 23 px, letter-spacing 0.17em · body 32 px |

## Copy
See `copy/slogans.md` and `copy/copy.json`. **The copy is placeholder marketing text**: "in minutes", "Free delivery on your first order" and "iOS & Android" must match what the business actually offers.

## Logo layers (`logo-layers/`)
Every PNG is a full 1536×1536 transparent canvas, so you can stack them with no offsets. Z-order bottom → top:
`01 greens-back → 02 handle-right-leg → 03 baguette → 04 pepper → 05 tomato → 06 bag-body-and-handle → 07 greens-front-leaf → 08 wordmark KULHA → 09 exclamation → 10 wordmark leaf → 11 underline → 12 sparks`.
Items 01–05 sit behind the bag (the bag front covers their lower part). `layers.json` has each layer's crop box if you prefer cropped sprites. `app-icon-original.png` is the supplied app icon.
The layers are a faithful re-creation of the supplied logo; the bag body and lettering are cut directly from it, the produce is redrawn in the same style.

## File sizes
| File | Size |
|---|---|
| `hero-1-split/hero1-split.mp4` | 619 KB |
| `hero-1-split/hero1-split.webm` | 414 KB |
| `hero-1-split/hero1-split-logo-only.mp4` | 509 KB |
| `hero-1-split/hero1-split-logo-only.webm` | 286 KB |
| `hero-2-center/hero2-center.mp4` | 503 KB |
| `hero-2-center/hero2-center.webm` | 341 KB |
| `hero-2-center/hero2-center-logo-only.mp4` | 412 KB |
| `hero-2-center/hero2-center-logo-only.webm` | 242 KB |
| `hero-3-light/hero3-light.mp4` | 702 KB |
| `hero-3-light/hero3-light.webm` | 457 KB |
| `hero-3-light/hero3-light-logo-only.mp4` | 604 KB |
| `hero-3-light/hero3-light-logo-only.webm` | 344 KB |

Total for one hero (logo-only mp4 + webm + poster) ≈ 0.5–1 MB, so you can preload it safely.

## Notes for the developer
- Encoding: H.264 High, yuv420p, `+faststart` (mp4) and VP9 yuv420p (webm). List mp4 first for broadest hardware decoding, webm second as the smaller alternative, or reverse the order if you prefer smaller downloads in Chromium/Firefox.
- If a second language is needed (e.g. Arabic/RTL), the baked videos need to be re-rendered; the logo-only versions plus live text already work with any language (`dir="rtl"` and mirrored layout via CSS).
- Want an idle loop (bag keeps floating) instead of hold-on-last-frame? Ask for a loopable 4 s idle clip.
