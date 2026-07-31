---
trigger: model_decision
description: Accessibility mandates — ARIA, semantic HTML, keyboard focus, contrast
---

# Accessibility (A11y)

Apply when designing or building UI components and layouts.

## Semantic HTML5
- Always use semantic tags (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`) instead of generic `<div>` wrappers.
- Every page must have exactly one `<h1>`. Headings must not skip levels (e.g., `<h2>` followed by `<h4>`).

## ARIA & Screen Readers
- Use `aria-label` or `aria-labelledby` on interactive elements (buttons, links) that do not contain descriptive text (e.g., icon-only buttons).
- Use `aria-hidden="true"` on purely decorative SVGs or images.
- Provide descriptive `alt` text for all meaningful images.

## Keyboard Navigability
- All interactive elements must be focusable via `Tab`.
- Never use `outline: none` without providing an alternative `:focus-visible` ring.
- Use explicit `:focus-visible` styles that stand out against the background (e.g., `outline: 2px solid var(--color-focus, #fff); outline-offset: 2px;`).

## Color Contrast
- Ensure text meets WCAG AA contrast ratios (4.5:1 for normal text, 3.1 for large text) against its background.
- When generating color palettes in variables, consider foreground/background pairs explicitly.
