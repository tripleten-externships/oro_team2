# Oro Button reference

Source: [ORO Hi-Fi — Button](https://www.figma.com/design/CZ1f5ADejTNNwkUxIu6hmV/ORO-Home-Equity-Tool-%E2%80%94-Lo-Fi-Prototype-v1--Copy-?node-id=363-1320)

- File key: `CZ1f5ADejTNNwkUxIu6hmV`
- Node: `363:1320`
- Variants: `Primary`, `Secondary`, `Tertiary`, `Destructive`
- Figma states: `Default`, `Hover`, `Pressed`, `Focus`, `Disabled`, `Loading`
- Minimum height: `48px`
- Web padding: `12px 20px`; gap: `8px`; `10px` radius
- Label: Work Sans, 16px, 600 weight, 24px line height

## React mapping

Use the native button API instead of exposing visual browser states:

```jsx
<OroButton variant="primary">Continue</OroButton>
<OroButton variant="secondary">Back</OroButton>
<OroButton variant="tertiary" loading>Loading</OroButton>
<OroButton variant="destructive">Remove</OroButton>
```

- `variant` maps to the four Figma styles.
- `disabled` maps to Disabled.
- `loading` disables the button and exposes `aria-busy`.
- Hover, pressed, and focus are CSS states.

Primary advances the current task, Secondary supports it, Tertiary is low-emphasis navigation, and Destructive is reserved for irreversible actions.
