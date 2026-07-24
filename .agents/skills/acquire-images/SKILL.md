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

## Report

List each major asset: **URL** / **PD/open** / **generated**, and confirm WebP.

## Next

Hand off to `qa-and-ship`.
