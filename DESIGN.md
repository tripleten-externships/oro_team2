---
version: alpha
name: ORO Home Equity Explorer Design System
source: "Figma Lo-Fi Foundations 363:173 and Hi-Fi Controls 363:1314"
description: "A restrained financial-education system with accessible Hi-Fi form and navigation controls."

colors:
  surface-page: "#FBF6ED"
  surface-card: "#FFFFFF"
  surface-subtle: "#E2F4EA"
  surface-selected: "#E2F4EA"
  surface-info: "#F0F9F4"
  surface-warning: "#FFF4CD"
  surface-error: "#FFEAED"
  text-primary: "#06281D"
  text-secondary: "#6F6D69"
  text-inverse: "#FFFFFF"
  text-accent: "#5B4209"
  text-error: "#B91B40"
  border-default: "#85938F"
  border-strong: "#6F6D69"
  border-selected: "#09453B"
  border-warning: "#5B4209"
  border-error: "#B91B40"
  action-primary: "#E29F06"

typography:
  controls:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: 400–600
    lineHeight: 24px
  brand:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: 600
    lineHeight: 32px
    letterSpacing: 0.4px
  heading-page:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: 600
    lineHeight: 40px
  heading-section:
    fontFamily: DM Sans
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
  heading-card:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
  body-default:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
  body-small:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: 400
    lineHeight: 18px
  label-default:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.4px
  label-button:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
  data-value:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px

spacing: [2px, 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px]
rounded: [8px, 10px, 12px, 999px]
borders: [1px, 2px, 3px]
layout:
  desktop-canvas: 1440px
  content-max: 1200px
  form-max: 720px
  header-height: 72px
---

# ORO Home Equity Explorer Design System

## Source of truth

This document records the shared foundations from Figma node `363:173` and the current control behavior from Hi-Fi node `363:1314`. Hi-Fi controls override their older Lo-Fi versions; the remaining Lo-Fi components stay valid until a newer reference replaces them.

Use global custom properties from `src/styles/tokens.css`. Component styles consume those properties and use lowercase BEM classes. Add a global token when a design value is repeated; keep one-off chart geometry local to the chart.

## Visual foundations

Cream is the page canvas, white is the primary control and card surface, and mint identifies selected or softly emphasized content. Dark green carries primary text, selection, and focus. Gold is reserved for primary actions, progress, and selected markers.

Status must never rely on color alone. Pair warning, error, selection, and unavailable colors with a marker or written label.

Playfair Display is limited to the ORO wordmark and primary page heading. DM Sans remains the application body and data face. Work Sans is used by the Hi-Fi buttons, fields, choices, dropdowns, icon buttons, and segmented controls. All three fonts are self-hosted from `public/fonts`.

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
- Default, filled, error, success, and disabled states.
- Error copy is associated with the control and exposed through `aria-invalid` and `aria-describedby`.

### Icons and icon buttons

- System icons are 24px exported Figma assets: chevrons, close, info, and check.
- Icon buttons are native 48px buttons with a 10px radius and a required accessible name.
- Loading and disabled icon buttons preserve native button semantics.

### Segmented controls

- Segments are 48px native buttons with a 160px reference width.
- The selected segment combines the dark green brand surface with inverse text.
- Segmented controls compose Segment instances and support arrow, Home, and End keys.

### Step indicator and view tabs

- Progress uses six written and visual segments so it is understandable without color.
- Tabs are 42px pill controls. Selected state combines mint, green border, and `aria-selected`.

### Product and data components

- Product cards use a 360px reference width but grow to the available container.
- Card order remains product identity, eligibility, description, two key outcomes, risk, and education action.
- Selected and unavailable products remain educational and visible.
- Stat tiles are 92px minimum-height labeled outcomes with default and strong emphasis.
- Callouts support info, warning, error, and risk with a text marker and semantic copy.

### Charts and actions

- Chart panels expose Equity remaining, Cumulative cost, and Monthly impact views.
- Charts receive normalized series; they do not calculate mortgage values.
- Chart labels, line styles, markers, and accessible summaries prevent color-only interpretation.
- CTA banners provide one primary and one supporting action and stack on narrow screens.

### App header

- One responsive component serves desktop and mobile layouts.
- Height is 72px with a white surface and bottom border.
- It always retains the product label and educational-estimate notice.

## Accessibility and responsive behavior

Use semantic HTML and native controls, visible `:focus-visible` outlines, associated labels, and useful status text. Keep touch targets usable even when the visual control is compact. At narrow widths, cards, chart panels, CTA actions, and metric groups stack rather than clipping or shrinking text.

Motion is minimal and respects `prefers-reduced-motion`.
