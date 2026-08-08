# ORO typography assets

The application bundles the two open-source fallback families specified by `DESIGN.md`:

- `Fraunces`: display, page, section, and card headings. Use weight `600`.
- `Work Sans`: body, labels, buttons, captions, metrics, and chart annotations. Use weights `400`, `500`, and `600`.

Font files use descriptive kebab-case. BEM applies to UI blocks, elements, and modifiers, not font assets:

```text
public/fonts/
├── fraunces-variable.ttf
└── work-sans-variable.ttf
```

The files are variable fonts, so CSS exposes the full weight range and the design tokens select the required weights. Licenses are stored in `docs/licenses/` as `fraunces-OFL.txt` and `work-sans-OFL.txt`.

Sources:

- [Fraunces in Google Fonts](https://github.com/google/fonts/tree/main/ofl/fraunces)
- [Work Sans in Google Fonts](https://github.com/google/fonts/tree/main/ofl/worksans)
- [Google Fonts licensing guide](https://googlefonts.github.io/gf-guide/)
