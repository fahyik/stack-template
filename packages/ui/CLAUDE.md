# UI Package (packages/ui)

Shared React component library. Built on Tailwind v4 with `clsx` + `tailwind-merge` for class composition.

Consumed as raw `.ts`/`.tsx` source via the `exports` field — there is no build step, the consuming app's bundler (Vite) handles transformation. ESM-only (`"type": "module"`).

## Structure

- `src/globals.css` — Design tokens (CSS custom properties for colors, shadows, typography), Tailwind v4 theme
- `src/components/ui/` — **Primitives.** shadcn-derived, mostly unstyled building blocks: `button`, `input`, `textarea`, `select`, `label`, `field`, `input-group`, `input-otp`, `combobox`, `separator`, `sonner`
- `src/components/*.tsx` — **Composites.** App-level components built on top of the primitives (`phone-input-group`, `country-code-select`, `timezone-combobox-field`, `gender-combobox-field`, `language-combobox-field`, `eyebrow`, `spinner`)
- `src/hooks/` — Shared hooks, one per file
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)

## Adding components

**Which tier?** A new component goes in `src/components/*.tsx` (composite) by default. Only add to `src/components/ui/` when you are pulling in a genuine shadcn primitive — and per the `design-language` skill, **ask before pulling in a new shadcn component**. The primitives already vendored here are grandfathered; that rule governs new additions.

Create the file with a single exported component. Keep components dependency-light — reach for a Radix primitive (or any other library) only when behavior actually requires it, not as scaffolding.

**No barrel `index.ts`.** Repo-wide rule (see the root `.claude/CLAUDE.md` "Code Style"). Consumers import directly from the file that owns the symbol. Do not create `src/components/index.ts` — it isn't in the `exports` map, so it wouldn't resolve anyway.

## Exports

The package exports via the `package.json` `exports` field. Every entry is a per-file wildcard — there is no barrel:

- `@repo/ui/components/*` — Component files (`src/components/*.tsx`), including primitives at `@repo/ui/components/ui/button`
- `@repo/ui/hooks/*` — Hooks (`src/hooks/*.ts`)
- `@repo/ui/lib/*` — Utilities (`src/lib/*.ts`)
- `@repo/ui/globals.css` — Global styles

```ts
import { Spinner } from "@repo/ui/components/spinner";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";
```

## Commands

```bash
npm run lint -- --filter=@repo/ui          # Lint
npm run type-check -- --filter=@repo/ui    # Type-check (no build step — consumed as source)
```

## Swapping the palette

`src/globals.css` is the **single source of truth** for every design token, in three layers:

1. **Layer 1** — raw role-named primitives (`--surface-*`, `--text-*`, `--brand-1…5`, `--glow-*`). This is the only layer you edit to rebrand.
2. **Layer 2** — `@theme inline`, mapping those onto Tailwind utilities (`bg-background`, `text-muted-foreground`, `shadow-brand-md`). These names are the shadcn contract; renaming them breaks `npx shadcn add`.
3. **Layer 3** — base styles, keyframes and the `brand-bg` / `brand-text` utilities.

The shipped palette is a deliberately plain zinc + indigo **placeholder**. To make it yours:

1. Edit only between the `SWAP ME` banners in `src/globals.css` — in **both** `:root` and `.dark`.
2. Don't touch `@theme inline`. If a colour is wrong somewhere, the Layer 1 value or the mapping is wrong; fix it there rather than overriding at the component.
3. Swapping fonts means changing three things together: the `@fontsource/*` imports at the top of `globals.css`, `--font-display` / `--font-sans` / `--font-mono` in `@theme inline`, and the matching deps in `package.json`.
4. Update the Color and Typography sections of `.claude/skills/design-language/SKILL.md` **in the same commit** — it's maintained by hand and drifts otherwise.
5. Verify: `npm run lint -w packages/ui`, then boot a frontend and check `/login` in both light and dark.
