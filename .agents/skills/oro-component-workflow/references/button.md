# Oro Button reference

Source: [ORO Home Equity Tool — Button](https://www.figma.com/design/E90h1tNmxaqERKCStVhuPG/ORO-Home-Equity-Tool-%E2%80%94-Lo-Fi-Prototype-v1--Copy-?node-id=363-1320&t=Gc1guuBArVyTWTja-4)

- File key: `E90h1tNmxaqERKCStVhuPG`
- Node: `363:1320`
- Variants: `Primary`, `Secondary`, `Tertiary`, `Destructive`
- Figma states: `Default`, `Hover`, `Pressed`, `Focus`, `Disabled`, `Loading`
- Minimum height: `48px`
- Padding: `12px 20px`; gap: `8px`; radius: `10px`
- Label: Work Sans, 16px, 600 weight, 24px line height

## React mapping

Use the web API below instead of exposing every Figma state as a prop:

```jsx
<Button variant="primary">Continue</Button>
<Button variant="secondary">Back</Button>
<Button variant="destructive" loading>Delete</Button>
```

- `variant` maps to the four Figma styles.
- `disabled` maps to Disabled.
- `loading` maps to Loading and disables the native button.
- Hover, pressed, and focus are browser/CSS states.

Primary is the main action and should normally appear once per view. Use Secondary or Tertiary for supporting actions and Destructive only for irreversible actions.
