---
name: design-language
description: Design system tokens and rules for React UI work — colors, typography (serif display / Inter Tight / JetBrains Mono), brand-tinted shadows, motion, radii, gradient utilities, glass panels, layout patterns. Use this skill whenever writing or editing JSX/TSX in apps/webapp, apps/backoffice, apps/landing, or packages/ui — for any component work involving className, style props, Tailwind utilities, color choices, fonts, shadows, or styling. Trigger even when the user doesn't say "design" or "styling" — any React UI work in this repo requires these tokens to avoid hex-code drift, or accidental shadcn imports. Also use when proposing new tokens, reviewing UI code for token compliance, or when you see hex codes / arbitrary values in components that should be tokens.
---

# Design language

> **First run:** this file documents a *placeholder* palette. Before doing UI
> work on a new project, replace the brand values in `packages/ui/src/globals.css`
> (between the `SWAP ME` banners) and rewrite the Color and Typography sections
> below to match. This file is maintained by hand — update it in the same commit
> as any token change.

Authoritative rules for all React component code in `apps/webapp`, `apps/backoffice`, `apps/landing`, and `packages/ui`. When a styling decision is in question, this doc and `packages/ui/src/globals.css` are the answer.

## Source of truth

- **`packages/ui/src/globals.css` is the single source of truth** for every token. When this document and that file disagree, the file wins — and this document needs updating.
- Tokens are exposed both as CSS custom properties and as Tailwind v4 utilities. Prefer the utility form.

## How to use tokens

Always reach for a token before reaching for a literal value.

- **Tailwind utility classes** that map to tokens (`bg-background`, `text-foreground`, `font-display`, `rounded-md`, `shadow-brand-sm`, `tracking-wider`, `animate-brand-sweep`) are the preferred form.
- **CSS custom properties** (`var(--brand-3)`, `var(--brand-gradient)`, `var(--ease-spring)`) are fine in `style={{ ... }}` when a utility doesn't exist — mostly: gradients, raw glow tints, easing curves.
- **Never inline a hex code** (`#3D5AFE`, `#7A5FE6`, `rgb(...)`) in JSX. If you find yourself wanting to: pick the existing token, or propose a new token to the user before adding it.

## Color

- **Surfaces (background hierarchy):**
  - `bg-background` — page (`#FAF9FC`, the pearl void)
  - `bg-card` / `bg-popover` — raised surfaces (`#FFFFFF`)
  - `bg-muted` / `bg-secondary` / `bg-accent` — subtle hover or grouped panels (`#F4EFFB`)
- **Text:**
  - `text-foreground` — primary copy (`#1A1430`, ink)
  - `text-secondary-foreground` — secondary copy (`#4A4368`, paper-soft)
  - `text-muted-foreground` — labels, captions (`#756E92`, paper-mute)
  - `text-placeholder` — input placeholder only (`#A49FB8`, paper-ghost)
- **Borders & lines:**
  - `border-border` — default border (`#E1D9F0`, ink-edge); already the global default for every element
  - `border-rule` — dividers, hairlines (`#ECE6F5`, ink-rule)
  - `ring-ring` / `outline-ring` — focus outline (the primary brand colour)
- **Brand ramp** — emphasis colors, no `*-foreground` pair (use `text-white` or `text-foreground` as appropriate when placing text on top):
  - `bg-brand-1` … `bg-brand-5` — the accent ramp. Read the current values from `globals.css`; they are placeholders until you rebrand.
- **Primary CTA:** `bg-primary` (= `--brand-2`) + `text-primary-foreground` (white). Don't use `bg-brand-2` for the same purpose; the semantic alias exists so we can re-skin without touching every button.
- **Semantic:** `bg-success` / `bg-warning` / `bg-destructive` (each with matching `*-foreground`).
- **Gradients:** apply via the `brand-bg` (background) or `brand-text` (gradient text-clip) utilities, or inline with `style={{ background: "var(--brand-gradient)" }}` / `var(--brand-gradient-v)` / `var(--brand-radial)`.

## Typography

- **`font-display`** — a serif face (a system serif stack by default; swap it in `globals.css`). Hero, section titles, editorial moments. Weight 400; allow italic for emphasis.
- **`font-sans`** — Inter Tight. The default body face — already applied to `<body>` automatically. Weights 300/400/500/600/700/800 are loaded.
- **`font-mono`** — JetBrains Mono. Eyebrows, kickers, ticker text, type labels — anything uppercase + spaced. Weights 400/500.
- **Tracking scale** — pick from `tracking-display` (-.025em, hero), `tracking-tight` (-.02em, large display), `tracking-normal`, `tracking-wide` (.1em, pills), `tracking-wider` (.14em, labels), `tracking-widest` (.2em, hero eyebrows). Don't invent new letter-spacing values.
- Body base is 16px and antialiased — don't override globally.
- Selection color is set globally (brand bg, white text) — don't restyle `::selection` per component.

## Radii

- `rounded-sm` — 8px, small badges/tags
- `rounded-md` — 14px, **buttons, inputs, chips** (the workhorse)
- `rounded-lg` — 22px, cards
- `rounded-xl` — 34px, large hero cards / mockups
- `rounded-full` — fully-rounded pills

## Shadows

The default system is **soft, layered, brand-tinted**. Pick from the named scale rather than inlining new `box-shadow` recipes; if your brand wants a different shadow language, change the scale once in `globals.css`:

- `shadow-brand-sm` — primary button at rest
- `shadow-brand-accent` — primary button on hover (pink shift)
- `shadow-brand-md` — glass card on hover, mid-depth
- `shadow-brand-lg` — large card / hero
- `shadow-brand-xl` — mockups, the heaviest depth
- `shadow-glass` — glassmorphic panels (paired with `backdrop-blur` and a translucent bg)
- `shadow-glow` — orbs, wordmarks, accent halos
- `shadow-ring-focus` — focus state on inputs / interactive elements

## Motion

- **Easing:** `ease-spring` (`cubic-bezier(.2,.8,.2,1)`) for hover, press, and reveal transitions. Don't reach for Tailwind's stock easings.
- **Animations** (utility-class form): `animate-drift`, `animate-pulse-ring`, `animate-brand-sweep`. Use them only when the design references the corresponding pattern.
- **Reduced motion** is honored globally via `@media (prefers-reduced-motion: reduce)` in `globals.css` — do not override or duplicate per component.
- Hover lifts: `translateY(-2px)` is the conventional offset.

## Layout patterns

- **Glass panel:** translucent `bg-white/70` (or similar) + `backdrop-blur-md` + `shadow-glass` + `border-border`. The inset highlight in `shadow-glass` provides the top-edge gleam.
- **Gradient border:** for gradient borders, mask a `var(--brand-gradient)` background through a `padding-box / border-box` clip — do not approximate with a single border color.
- **Grain overlay:** opacity is `var(--grain-opacity)` (.035), blend mode `overlay`, `z-index: -1`. Apply to a fixed full-screen `<div>` if used.

## Hard rules — do not

- Do not introduce hex codes, OKLCH literals, or one-off `rgba()` values in components. Add them as tokens or use existing ones.
- Do not add `dark:` variants in components yet. The design system is light-only; dark mode is deferred until design provides explicit dark tokens.
- Do not install or pull in shadcn/ui without first asking for permission.
- Do not edit tokens in `packages/ui/src/globals.css` without the user being aware — token changes ripple across every surface. Rebranding is the exception: that is exactly what the `SWAP ME` block is for.

## When the design calls for something not yet tokenized

- Confirm with the user that the value is intended to be a system token, not a one-off.
- If yes: add the raw value to `:root` in `packages/ui/src/globals.css`, expose it via `@theme inline` (and `@utility` if it's a gradient or composed effect), and update this doc.
- If no: scope it to the component file as a Tailwind arbitrary value (`bg-[var(--whatever)]`) or inline `style`, and add a one-line comment naming the design surface it serves.

## Reference paths

- Tokens: `packages/ui/src/globals.css`
- Token definitions: `packages/ui/src/globals.css`
- Palette swap ritual: `packages/ui/CLAUDE.md`
- UI package guidance: `packages/ui/CLAUDE.md`
- Webapp guidance: `apps/webapp/CLAUDE.md`
- Backoffice guidance: `apps/backoffice/CLAUDE.md`
- Landing guidance: `apps/landing/CLAUDE.md`
