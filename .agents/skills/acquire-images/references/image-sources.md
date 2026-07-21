# Image sources reference

Use this when choosing public-domain or openly licensed photos. Always verify the license on the specific asset page before downloading.

## Preferred sources

| Source | Typical license | Notes |
|--------|-----------------|-------|
| [Wikimedia Commons](https://commons.wikimedia.org/) | Varies — filter for Public Domain / CC0 / CC BY | Check each file’s license tab; prefer PD and CC0 when attribution is hard to surface on a fictional brand site |
| [NASA Image and Video Library](https://images.nasa.gov/) | Usually public domain (US gov) | Excellent for space, aviation, science textures |
| [Unsplash](https://unsplash.com/) | Unsplash License (permissive) | Good atmospheric photos; not PD — still OK for this portfolio if license terms are respected |
| [Pexels](https://www.pexels.com/) | Pexels License | Similar to Unsplash for atmosphere shots |

## When PD/open is a good fit

- Landscapes, weather, forests, coastlines
- Generic industrial textures (metal, weld sparks *without* branded UI)
- Food ingredients, materials, workshop ambience
- Historical or documentary feel when the brief is not product-hero focused

## When to generate instead

- Specific fictional product in brand colours
- Branded storefront / packaging / UI-in-scene
- Characters or bespoke compositions stock cannot match
- Brief asks for a look that would require heavy editing of stock

## Practical tips

- Download the highest reasonable resolution, then rely on `npm run optimize:webp`.
- Name files descriptively: `hero.webp`, `workshop.webp`, `tig_arc.webp`.
- Do not hotlink external URLs in production HTML — copy files into `sites/<slug>/assets/`.
- If a license requires attribution and you cannot place it tastefully, pick another asset or generate.
