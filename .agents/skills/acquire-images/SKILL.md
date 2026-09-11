---
name: acquire-images
description: Acquires hero and section images using PD/open license or Antigravity/Gemini generation, then converts all photos to WebP. Use when sourcing images, heroes, photos, stock, Wikimedia, Imagen, or generating visuals for a daily site.
---

# Acquire images

## Goal

Fill `sites/<slug>/assets/` with working imagery. Prefer the best source per asset. **Every photographic asset must ship as `.webp`.**

## Decision tree (per asset)

1. **Brief URLs** — If concrete URLs exist, download, verify, place under `assets/`.
2. **Public domain / open license** — Prefer for real-world texture/atmosphere when a good PD/CC0 match exists. See `references/image-sources.md`.
3. **Generate (Antigravity / Gemini)** — Prefer for brand-specific, fictional, or when stock looks wrong. Use §7 / §10 prompt-ready lines.
4. **Tie-breakers** — generate for invented products/storefronts; PD/open for authentic texture/speed.
5. **Failure** — CSS/SVG placeholder only as interim; leave QA failing until real assets exist. No silent 404s. No picsum as a finished state.

## WebP hard rule

- After download or generation, run from repo root:
  - `npm run optimize:webp`
  - `npm run optimize:html`
- Update HTML/CSS/JS so live photo `src`s are **`.webp` only** (SVG allowed for favicon/icons).
- `meta.json` `"hero"` must be `assets/<file>.webp` (no leading `./`).
- **Do not hand off** while hero or section photos still use `.png`, `.jpg`, or `.jpeg` as the live source — convert to `.webp` first.

## Asset isolation (hard rule)

Assets are **site-private**. See `AGENTS.md` §12.

- Never copy, move, symlink, or reference an asset from another site folder — not as a placeholder, not "just for now".
- Never reuse a generated image or video across sites. If two briefs want a similar shot, generate two.
- Never hotlink remote media. Download it into this site's `assets/`.
- Filenames must describe their own subject and be unique repo-wide. `hero.webp`, `image1.webp`, `photo.webp`, `temp*.jpg` are rejected. Prefix with the slug when a name could collide.
- Verify before handing off: `npm run check:assets -- <slug>`. It hashes every asset in the repo and fails on byte-identical duplicates across sites.

## Generation quota exhausted

If image-generation quota, rate limits, or credits run out mid-build:

1. Finish everything that does not depend on the missing assets.
2. Fall back to the PD/open route (step 2) for whatever remains and say which assets were substituted.
3. **Do not** set `qa: "v2-pass"` while any asset is a placeholder — placeholders and picsum remain a hard failure.
4. Report it as the **last thing in your response**, after the video prompt block, in the bold block specified in `AGENTS.md` §15 — naming every missing asset and the exact commands to resume.

## Report

List each major asset: **URL** / **PD/open** / **generated**, and confirm WebP. Confirm `check:assets` passes.

## Next

Hand off to `qa-and-ship`.
