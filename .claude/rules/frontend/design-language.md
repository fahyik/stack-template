---
description: Design language guardrails — the hard "do not" rules for React UI code. The full token reference lives in the design-language skill.
paths:
  - "apps/webapp/**/*.tsx"
  - "apps/backoffice/**/*.tsx"
  - "apps/landing/**/*.tsx"
  - "packages/ui/**/*.tsx"
---

# Design language — guardrails

This file is the always-on safety net for React component code in `apps/webapp`, `apps/backoffice`, `apps/landing`, and `packages/ui`. It only contains the hard rules; the full token reference (colors, typography, shadows, motion, radii, layout patterns) lives in the **`design-language` skill** — invoke it whenever you're actively making styling decisions.

## Hard rules — DO

- **Prefer using ui components** already defined in `packages/ui` before creating custom components

## Hard rules — DO NOT

- **No hex codes, OKLCH literals, or one-off `rgba()` values** in components. Reach for an existing token, or propose a new one to the user before adding it.
  Use the semantic tokens (`bg-card`, `text-muted-foreground`, `border-border`); they already resolve correctly in dark mode. Do not hand-write `dark:` colour overrides — if a surface looks wrong in dark, the token mapping is wrong and belongs fixed in `globals.css`.
  Check `packages/ui/src/globals.css` — it is the single source of truth for every token.

## When you need actual styling guidance

Consult the `design-language` skill — it has the full color stack, typography scale, shadow scale, motion easings, radii, and layout recipes (glass panels, iris borders, grain overlays). Do not guess at token names from memory; the skill is the source of truth alongside `packages/ui/src/globals.css`.
