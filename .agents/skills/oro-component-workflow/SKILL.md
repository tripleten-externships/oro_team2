---
name: oro-component-workflow
description: "Plan and implement reusable React/JavaScript components from Figma references in the Oro repository. Use when creating or updating a component from a Figma URL, translating variants and states, mapping DESIGN.md tokens to global CSS custom properties, or deciding how to compose existing components."
---

# Oro component workflow

Use this workflow for small, reusable UI components in the Oro React/Vite app.

`AGENTS.md` is the repository contract and has priority over this skill. Follow its scope, simple architecture, JavaScript preference, `localStorage` boundary, `DESIGN.md` tokens, and validation commands.

## Inspect and plan

- Read `AGENTS.md`, `DESIGN.md`, the relevant consumer, and nearby components/styles.
- If the component displays mortgage or equity results, read `docs/mortgage-calculations.md` and reuse its model; never duplicate formulas in JSX.
- Parse the Figma URL and keep its exact file key and node ID. Do not guess a node.
- Before calling Figma `get_design_context`, load/use `figma-design-to-code` and pass it in `skillNames`.
- Treat Figma output as reference. Adapt it to this repo's JavaScript and CSS; do not paste Tailwind output or install Tailwind.
- Write a short plan covering responsibility, public props, variants, interaction states, accessibility, and files to change.

## Define the component contract

- Prefer semantic props such as `variant`, `size`, `loading`, and `disabled`.
- Map browser states to CSS: use `:hover`, `:active`, and `:focus-visible`; expose a prop only when behavior changes.
- Use native HTML controls. Forward useful attributes and events. Loading controls should be disabled and expose `aria-busy`.
- Keep calculations/state outside presentational components unless the component owns that behavior.

## Structure and styles

Create one focused folder per reusable component:

```text
src/components/oro-component/
├── oro-component.jsx
├── oro-component.css
└── index.js
```

- Use lowercase BEM names for UI blocks, elements, and modifiers: `oro-component`, `oro-component__element`, and `oro-component--modifier`. Apply this to component files and CSS classes, not fonts or documentation. Use descriptive kebab-case for font assets, such as `fraunces-variable.ttf`.
- Export from `index.js` and import from the folder path. Keep React and CSS file names aligned with the same block name.
- Put shared design tokens in `src/styles/index.css` under `:root`, using names such as `--oro-color-*`, `--oro-space-*`, and `--oro-radius-*`.
- Map tokens from `DESIGN.md` once. Component CSS must consume variables and avoid repeated hex values, magic spacing, or inline styles.
- Keep styles prefixed, responsive where needed, and include visible keyboard focus and reduced-motion behavior.

## Use and verify

- Compose the component in the nearest feature instead of duplicating markup.
- Verify default, every supported variant, disabled/loading behavior, keyboard focus, long labels, and narrow screens.
- Run `npm run lint` and `npm run build`. Report checks and known limitations. Avoid unrelated refactors.

For the current Button contract and Figma mapping, read [references/button.md](references/button.md).
