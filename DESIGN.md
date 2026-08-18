---
version: alpha
name: ORO Home Equity Explorer Design System
source: "Figma file JrvM5uyW4lDxTEdUe6Sd6k · Lo-Fi Foundations 363:173; Hi-Fi Controls 363:1314; Hi-Fi Nav & Feedback 363:1680; Hi-Fi Product & Data 363:1793"
description: "A restrained financial-education system with accessible controls, navigation, product education, comparison data, and feedback."

colors:
  surface-page: "#FBF6ED"
  surface-card: "#FFFFFF"
  surface-subtle: "#E2F4EA"
  surface-selected: "#E2F4EA"
  surface-info: "#F0F9F4"
  surface-success: "#F0F9F4"
  surface-disabled: "#FBF6ED"
  surface-brand: "#09453B"
  surface-warning: "#FFF4CD"
  surface-error: "#FFEAED"
  text-primary: "#06281D"
  text-secondary: "#6F6D69"
  text-inverse: "#FFFFFF"
  text-muted: "#6F6D69"
  text-action: "#06281D"
  text-accent: "#5B4209"
  text-warning: "#5B4209"
  text-success: "#09453B"
  text-info: "#09453B"
  text-disabled: "#6F6D69"
  text-error: "#B91B40"
  border-default: "#85938F"
  border-strong: "#6F6D69"
  border-selected: "#09453B"
  border-focus: "#09453B"
  border-warning: "#5B4209"
  border-error: "#B91B40"
  border-success: "#09453B"
  action-primary: "#E29F06"
  action-primary-hover: "#FAAE02"
  action-primary-pressed: "#F0D77D"
  action-destructive: "#B91B40"

typography:
  display:
    fontFamily: Fraunces
    fontSize: 24–30px
    fontWeight: 600
    lineHeight: 34–41px
  controls:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: 400–600
    lineHeight: 24px
  brand:
    fontFamily: Fraunces
    fontSize: 24px
    fontWeight: 600
    lineHeight: 32px
    letterSpacing: 0.4px
  heading-page:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: 600
    lineHeight: 40px
  heading-section:
    fontFamily: Fraunces
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
  heading-card:
    fontFamily: Fraunces
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
  body-default:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
  body-small:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: 400
    lineHeight: 18px
  label-default:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.4px
  label-button:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
  data-value:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px

spacing: [2px, 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px]
rounded: [8px, 10px, 12px, 16px, 999px]
borders: [1px, 2px, 3px, 5px]
layout:
  desktop-canvas: 1440px
  content-max: 1200px
  form-max: 720px
  header-height: 80px
  header-padding-inline: 80px
  mobile-header-height: 96px
---

# ORO Home Equity Explorer Design System

## Source of truth

This document records the shared foundations from Figma node `363:173`, controls from Hi-Fi node `363:1314`, navigation and feedback from Hi-Fi node `363:1680`, and product and data components from Hi-Fi node `363:1793` in the current Figma file.

Reference links: [Foundations](https://www.figma.com/design/JrvM5uyW4lDxTEdUe6Sd6k/ORO-Home-Equity-Tool-%E2%80%94-Lo-Fi-Prototype-v1--Copy-?node-id=363-173), [Controls](https://www.figma.com/design/JrvM5uyW4lDxTEdUe6Sd6k/ORO-Home-Equity-Tool-%E2%80%94-Lo-Fi-Prototype-v1--Copy-?node-id=363-1314), [Nav and feedback](https://www.figma.com/design/JrvM5uyW4lDxTEdUe6Sd6k/ORO-Home-Equity-Tool-%E2%80%94-Lo-Fi-Prototype-v1--Copy-?node-id=363-1680), [Product and data](https://www.figma.com/design/JrvM5uyW4lDxTEdUe6Sd6k/ORO-Home-Equity-Tool-%E2%80%94-Lo-Fi-Prototype-v1--Copy-?node-id=363-1793).

Use global custom properties from `src/styles/tokens.css`. Component styles consume those properties and use lowercase BEM classes. Add a global token when a design value is repeated; keep one-off chart geometry local to the chart.

## Visual foundations

Cream is the page canvas, white is the primary control and card surface, and mint identifies selected or softly emphasized content. Dark green carries primary text, selection, and focus. Gold is reserved for primary actions, progress, and selected markers.

Status must never rely on color alone. Pair warning, error, selection, and unavailable colors with a marker or written label.

Fraunces is the Hi-Fi display face for brand text, headings, product panels, education sections, and chart titles. Work Sans is used by Hi-Fi controls, body copy, labels, and data. DM Sans remains available for legacy application content and Figma documentation metadata; Playfair Display remains only as a legacy fallback. All fonts are self-hosted from `public/fonts`.

## Component rules

### Button

- Primary, secondary, tertiary, and destructive variants.
- 48px minimum height, 10px radius, and 20px horizontal padding.
- 16px Work Sans SemiBold label.
- Disabled and loading states use the native `disabled` behavior; hover, pressed, and focus remain CSS states.

### Choice option

- Native radio or checkbox input inside a 64px minimum-height card.
- 12px radius and 16px padding.
- Selected state combines mint, a green border, a gold marker, and a visible dot or check.

### Input field and dropdown

- Persistent 16px label, 56px control, 10px radius, and optional prefix or suffix.
- Inputs support text, currency, percentage, and number kinds. Dropdowns use a native `select` and the exported chevron.
- Default, hover, focus, filled, error, success, and disabled states.
- Error copy is associated with the control and exposed through `aria-invalid` and `aria-describedby`.

### Icons and icon buttons

- System icons are 24px exported Figma assets: chevrons, close, info, and check.
- Icon buttons are native 48px buttons with a 10px radius and a required accessible name.
- Loading and disabled icon buttons preserve native button semantics.

### Segmented controls

- Segments are 48px native buttons with a 160px reference width.
- The selected segment combines the dark green brand surface with inverse text.
- Segmented controls compose Segment instances and support arrow, Home, and End keys.

### Progress indicator

- Six responsive 8px segments show the current and completed steps.
- The written `Step n of 6 · label` description keeps progress understandable without color.
- Work Sans Medium at 14px is used for the optional label.

### Educational callouts and disclosures

- Callouts support info, neutral, success, warning, error, and risk intents with a written symbol reinforcing color.
- Disclaimer and help panels compose the callout rather than duplicating feedback markup.
- Tooltip and definition disclosures are static educational surfaces; accordions use native `details` and `summary` behavior.

### System states

- Empty, loading, and recoverable error states use a 480px reference width and 240px minimum height.
- Every state includes a marker, title, and plain-language recovery guidance.
- Loading exposes `aria-busy`; errors use an alert role.

### Step indicator and view tabs

- Progress uses six written and visual segments so it is understandable without color.
- Tabs are 42px pill controls. Selected state combines mint, green border, and `aria-selected`.

### Product and data components

- Product cards use a 360px reference width but grow to the available container.
- Card order remains product identity, definition, separate eligibility and suitability indicators, two key outcomes, primary tradeoff, and education or comparison action.
- Summary and comparison modes share one component. The rendered Figma variants use a 1px green outline for Summary/Match and a 2px green outline for Comparison/Match. Selected uses a 5px gold outline; unavailable remains visible with a written status and disabled action. Figma's component description states a 2px Match outline for all modes, so that discrepancy should be confirmed with design before further visual changes.
- Strong suitability uses a gold surface with a written match label; possible uses a cream surface with warning text; limited uses the disabled surface. Suitability is separate from eligibility.
- Eligibility never implies suitability. Suitability describes relative alignment with the user's priorities and must not imply approval or personalized financial advice.
- Product definition sections compose benefit, consideration, and requirement rows. Detail panels compose the definition section, illustrative disclaimer, and shared controls.
- Comparison columns compose one comparison-mode product card and semantic 88px comparison rows. Values come from the calculation model or product content; components never calculate them.
- Long-form product education composes six native disclosure accordions for use case, costs, payments, equity, eligibility, and professional questions.

### Charts and actions

- Chart panels expose Equity remaining, Cumulative cost, and Monthly impact views.
- Charts receive normalized series; they do not calculate mortgage values.
- Chart labels, solid/dashed/dotted line patterns, written legend labels, selected checkmarks, and accessible summaries prevent color-only interpretation.
- Chart containers provide default, selected-series, and no-data states. Selection is represented by a pressed legend control and an accessible tooltip.
- Every chart includes direct labels and an educational caption explaining that values are illustrative and not guaranteed.
- CTA banners provide one primary and one supporting action and stack on narrow screens.

### App header

- One responsive component serves desktop and mobile layouts.
- It uses the official exported Oro primary wordmark at no less than 100px wide.
- Desktop is 80px with brand, journey context, and restart action; mobile stacks context beneath a 44px brand/action row for a 96px total reference height.
- Restart remains a native tertiary button and is rendered only when a handler is supplied.

## Accessibility and responsive behavior

Use semantic HTML and native controls, visible `:focus-visible` outlines, associated labels, and useful status text. Keep touch targets usable even when the visual control is compact. At narrow widths, cards, chart panels, CTA actions, and metric groups stack rather than clipping or shrinking text.

Motion is minimal and respects `prefers-reduced-motion`.
