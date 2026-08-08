# Agent instructions

## Project

Oro is a small React + JavaScript SPA for exploring mortgage options. It is frontend-only: use browser `localStorage` and do not introduce a backend, database, authentication, or unnecessary architecture.

## Before changing code

- Read the relevant source, styles, and `DESIGN.md` before editing.
- Repository skills live in `.agents/skills/*/SKILL.md`; use them only alongside these instructions.
- Mortgage formulas live in `docs/mortgage-calculations.md`; treat it as the source of truth.
- For non-trivial work, state a short plan and confirm material ambiguity.
- Keep the Vite structure; ask before architectural changes or new dependencies.

## Implementation

- Use lightweight separation of concerns: components render UI, hooks/utilities own reusable state and calculations, and CSS owns presentation. Avoid a monolithic `App`; keep modules focused.
- Prefer readable React components and hooks. Keep state local; extract a component or utility when it improves clarity. Keep data flow explicit and avoid unnecessary global state or prop-drilling.
- Use JavaScript, not TypeScript, unless explicitly requested.
- Keep mortgage calculations and assumptions explicit. Validate form input and handle empty or malformed `localStorage` safely.
- Use semantic HTML, labels, keyboard-accessible controls, visible focus states, useful alt text, and status messages that do not rely on color alone.
- Keep styles cohesive and responsive. `DESIGN.md` is the source of truth for colors, typography, spacing, radii, layout, and states. Define its values as global CSS custom properties in `:root`, use them throughout component styles, and avoid magic design values. Add a variable before repeating a value.

## Validation

Run these checks after changes:

```sh
npm run lint
npm run build
```

If a check cannot run, say why. In the final handoff, summarize changes, checks, and limitations.
