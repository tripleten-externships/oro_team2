# Oro Button reference

Source: [ORO Lo-Fi — Button](https://www.figma.com/design/CZ1f5ADejTNNwkUxIu6hmV/ORO-Home-Equity-Tool-%E2%80%94-Lo-Fi-Prototype-v1--Copy-?node-id=363-360)

- File key: `CZ1f5ADejTNNwkUxIu6hmV`
- Node: `363:360`
- Variants: `Primary`, `Secondary`, `Tertiary`
- Figma states: `Default`, `Disabled`
- Minimum height: `42px`
- Web padding: `8px 20px`; gap: `8px`; full radius
- Label: DM Sans, 14px, 600 weight, 20px line height

## React mapping

Use the native button API instead of exposing visual browser states:

```jsx
<OroButton variant="primary">Continue</OroButton>
<OroButton variant="secondary">Back</OroButton>
<OroButton variant="tertiary" loading>Loading</OroButton>
```

- `variant` maps to the three Figma styles.
- `disabled` maps to Disabled.
- `loading` disables the button and exposes `aria-busy`.
- Hover, pressed, and focus are CSS states.

Primary advances the current task, Secondary supports it, and Tertiary is low-emphasis navigation.
