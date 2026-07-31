---
name: audit-accessibility
description: Runs a static accessibility audit on a given site's DOM based on the rules in 04-accessibility.md. Use this skill when asked to check a site's accessibility or before shipping if requested.
---

# Audit Accessibility

## Goal
Verify that the target site's HTML conforms to the `.agents/rules/04-accessibility.md` standards. 

## Process
1. Read the compiled HTML of the target site from `dist/sites/<YYYY-MM>/<slug>/index.html` (or locally from `sites/`).
2. Verify that there is exactly one `<h1>` tag.
3. Check all `<button>` and `<a>` elements for accessible names (either inner text or `aria-label`).
4. Ensure all `<img src="...">` tags contain an `alt` attribute (even if empty `alt=""` for decorative images).
5. Ensure structural semantic tags (`<header>`, `<main>`, `<footer>`) are present.
6. Return a summary report of issues found. Do NOT modify the files automatically; present the findings to the user.
