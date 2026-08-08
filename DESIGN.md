---
version: alpha
name: ORO Home Equity Explorer Design System
description: "A financial-education interface system built from cream canvases, dark green structure, restrained gold actions, editorial serif headings, and explicit non-color-only status cues."

colors:
  surface-page: "#FBF6ED"
  surface-card: "#FFFFFF"
  surface-subtle: "#E2F4EA"
  surface-selected: "#E2F4EA"
  surface-info: "#F0F9F4"
  surface-success: "#F0F9F4"
  surface-warning: "#FFF4CD"
  surface-error: "#FFEAED"
  surface-disabled: "#FBF6ED"
  surface-brand: "#09453B"
  text-primary: "#06281D"
  text-secondary: "#6F6D69"
  text-inverse: "#FFFFFF"
  text-warning: "#5B4209"
  text-error: "#B91B40"
  text-disabled: "#6F6D69"
  border-default: "#85938F"
  border-strong: "#6F6D69"
  border-selected: "#09453B"
  border-focus: "#09453B"
  action-primary: "#E29F06"
  action-primary-hover: "#FAAE02"
  action-primary-pressed: "#F0D77D"
  action-secondary: "#FFFFFF"
  action-secondary-hover: "#FBF6ED"
  action-secondary-pressed: "#E2F4EA"
  action-destructive: "#B91B40"
  action-destructive-hover: "#511B08"
  scrim: "#00000033"

typography:
  headline-display:
    fontFamily: Fraunces
    fontSize: 48px
    fontWeight: 600
    lineHeight: 56px
    letterSpacing: -0.5px
  headline-page:
    fontFamily: Fraunces
    fontSize: 40px
    fontWeight: 600
    lineHeight: 48px
    letterSpacing: -0.25px
  headline-section:
    fontFamily: Fraunces
    fontSize: 28px
    fontWeight: 600
    lineHeight: 36px
    letterSpacing: 0px
  headline-card:
    fontFamily: Fraunces
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: 0px
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0px
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 26px
    letterSpacing: 0px
  body-supporting:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  label-form:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px
    letterSpacing: 0px
  label-button:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: 0px
  caption:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
  data-value:
    fontFamily: Work Sans
    fontSize: 28px
    fontWeight: 500
    lineHeight: 36px
    letterSpacing: -0.25px
  chart-label:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0px

spacing:
  space-2: 2px
  space-4: 4px
  space-8: 8px
  space-12: 12px
  space-16: 16px
  space-20: 20px
  space-24: 24px
  space-32: 32px
  space-40: 40px
  space-48: 48px
  space-64: 64px

rounded:
  xs: 4px
  sm: 8px
  control: 10px
  md: 12px
  lg: 16px
  xl: 24px
  full: 999px

borders:
  default: 1px
  emphasis: 2px
  focus: 3px

layout:
  desktop-canvas: 1440px
  content-max: 1200px
  form-max: 720px
  desktop-grid-columns: 12
  desktop-grid-gutter: 24px
  desktop-grid-margin: 80px
  desktop-header-height: 80px
  mobile-header-height: 96px

elevation:
  level-1: "0 2px 8px 0 rgba(18, 31, 23, 0.08)"
  level-2: "0 8px 24px -4px rgba(18, 31, 23, 0.10), 0 2px 6px 0 rgba(18, 31, 23, 0.06)"
  popover: "0 12px 32px -6px rgba(18, 31, 23, 0.14)"

motion:
  duration-fast: 100ms
  duration-standard: 180ms
  duration-slow: 280ms
  easing-standard: "cubic-bezier(0.2, 0, 0, 1)"
  easing-emphasized: "cubic-bezier(0.2, 0, 0, 1.2)"

components:
  header-desktop:
    backgroundColor: "{colors.surface-brand}"
    textColor: "{colors.text-inverse}"
    height: "{layout.desktop-header-height}"
    horizontalPadding: 80px
    wordmarkSize: "113px 50px"
  header-mobile:
    backgroundColor: "{colors.surface-brand}"
    textColor: "{colors.text-inverse}"
    height: "{layout.mobile-header-height}"
    padding: "12px 16px"
    gap: "{spacing.space-8}"
    wordmarkSize: "100px 44px"
  button-primary:
    backgroundColor: "{colors.action-primary}"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.action-primary}"
    borderWidth: "{borders.default}"
    typography: "{typography.label-button}"
    rounded: "{rounded.control}"
    minHeight: 48px
    padding: "12px 20px"
    gap: "{spacing.space-8}"
  button-primary-hover:
    backgroundColor: "{colors.action-primary-hover}"
  button-primary-pressed:
    backgroundColor: "{colors.action-primary-pressed}"
  button-secondary:
    backgroundColor: "{colors.action-secondary}"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.border-strong}"
    borderWidth: "{borders.default}"
    typography: "{typography.label-button}"
    rounded: "{rounded.control}"
    minHeight: 48px
    padding: "12px 20px"
  button-destructive:
    backgroundColor: "{colors.action-destructive}"
    textColor: "{colors.text-inverse}"
    borderColor: "{colors.action-destructive}"
    borderWidth: "{borders.default}"
    typography: "{typography.label-button}"
    rounded: "{rounded.control}"
    minHeight: 48px
    padding: "12px 20px"
  button-focus:
    borderColor: "{colors.border-focus}"
    borderWidth: "{borders.focus}"
  button-disabled:
    backgroundColor: "{colors.surface-disabled}"
    textColor: "{colors.text-disabled}"
    borderColor: "{colors.border-default}"
  field:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    helperColor: "{colors.text-secondary}"
    borderColor: "{colors.border-strong}"
    borderWidth: "{borders.default}"
    rounded: "{rounded.control}"
    controlHeight: 56px
    horizontalPadding: 16px
    internalGap: "{spacing.space-8}"
    labelTypography: "{typography.label-form}"
    valueTypography: "{typography.body-supporting}"
    helperTypography: "{typography.caption}"
  field-focus:
    borderColor: "{colors.border-focus}"
    borderWidth: "{borders.focus}"
  field-error:
    borderColor: "{colors.text-error}"
    helperColor: "{colors.text-error}"
    borderWidth: "{borders.emphasis}"
  choice-control:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.border-default}"
    borderWidth: "{borders.default}"
    rounded: "{rounded.md}"
    minHeight: 64px
    horizontalPadding: 16px
    gap: "{spacing.space-12}"
    indicatorSize: 24px
  choice-control-selected:
    backgroundColor: "{colors.surface-selected}"
    borderColor: "{colors.border-selected}"
    indicatorColor: "{colors.action-primary}"
    indicatorBorderColor: "{colors.border-selected}"
    indicatorBorderWidth: "{borders.emphasis}"
  product-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.border-default}"
    borderWidth: "{borders.default}"
    rounded: "{rounded.lg}"
    padding: 24px
    gap: "{spacing.space-16}"
    elevation: "{elevation.level-1}"
  product-card-match:
    backgroundColor: "{colors.surface-selected}"
    borderColor: "{colors.border-selected}"
    borderWidth: "{borders.emphasis}"
  product-card-selected:
    backgroundColor: "{colors.surface-card}"
    borderColor: "{colors.border-selected}"
    borderWidth: "{borders.focus}"
  callout-info:
    backgroundColor: "{colors.surface-info}"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.border-selected}"
    borderWidth: "{borders.default}"
    rounded: "{rounded.md}"
    padding: 20px
    gap: "{spacing.space-16}"
  callout-warning:
    backgroundColor: "{colors.surface-warning}"
    textColor: "{colors.text-warning}"
    borderColor: "{colors.text-warning}"
  callout-error:
    backgroundColor: "{colors.surface-error}"
    textColor: "{colors.text-error}"
    borderColor: "{colors.text-error}"
  chart-container:
    backgroundColor: "{colors.surface-card}"
    borderColor: "{colors.border-default}"
    borderWidth: "{borders.default}"
    rounded: "{rounded.lg}"
    padding: 28px
    gap: 18px
  overlay:
    backgroundColor: "{colors.surface-card}"
    scrimColor: "{colors.scrim}"
    rounded: "{rounded.lg}"
    width: 520px
    padding: 32px
    gap: "{spacing.space-24}"
    elevation: "{elevation.popover}"
---

# ORO Home Equity Explorer Design System

## Overview

ORO is a financial-education interface for homeowners comparing seven ways to access home equity. It combines editorial hierarchy with utility controls: Fraunces headings make questions and outcomes feel explanatory rather than transactional, while Work Sans carries dense comparison data, form labels, navigation, and legal qualification.

The visual field is predominantly cream, with white or mint panels separated by thin gray-green borders. A dark green header provides persistent orientation, and gold is a focused action color rather than a general-purpose surface. Screens use little ornamentation; hierarchy comes from type scale, measured whitespace, borders, and explicit status markers. Product comparison screens are intentionally denser than guided-question screens, but preserve equal card widths and consistent metric ordering so no product is implied to be preferable through size alone.

The hi-fi variables, styles, component sets, and repeated screens define the production system. Lo-fi values that conflict with the hi-fi system—such as 42px buttons or the earlier Playfair Display/DM Sans pairing—are exploratory artifacts, not core rules.

## Colors

Cream is the default page surface, white is the primary card and control surface, and mint is used for selected, matched, neutral-educational, and softly emphasized regions. The dark green brand surface is concentrated in global navigation, focus/selected borders, status symbols, and high-confidence informational cues. Near-black green is the default text color; neutral gray is reserved for supporting explanations, metadata, placeholders, and helper copy.

The palette follows the file's stated 60/30/10 relationship: cream, white, and dark neutrals carry most of the interface, while gold remains under roughly ten percent and is reserved for primary actions, progress, and the inner mark of selected controls. Gold is not used for normal text on white.

Status colors always combine three channels: a pale surface, a darker border/text color, and a symbol or written label. Success and information use green on pale green; warning uses brown on pale yellow; error uses raspberry on pale rose. Selection likewise combines mint fill, green outline, and a check, dot, or selected label. Do not communicate eligibility, suitability, chart selection, or validation by color alone.

## Typography

Fraunces SemiBold is the Figma file's temporary fallback for the licensed Concrette M Semibold headline face. It is restricted to display, page, section, and card headings. Work Sans handles body copy and every functional role: controls, labels, captions, metrics, chart annotations, navigation, and disclosures.

Desktop page titles use the 40px page-heading style, with 28px section headings and 20px card headings. Body copy is normally 16px; 18px is used for introductions and high-level explanatory copy. Form labels remain visible above controls at 16px Medium. Buttons use 16px SemiBold. Captions and chart labels use 14px, while primary numeric outcomes use 28px Medium with slightly tightened tracking.

Sentence case is the default. Short eyebrows such as question numbers and comparison context may be uppercase and semibold, but body copy, controls, and status labels are not forced to uppercase. Weight—not extra containers—is used to distinguish labels from values inside comparison rows.

## Layout

The desktop reference canvas is 1440px. The documented base grid uses 12 columns, 24px gutters, and 80px outer margins. Product flows then constrain primary content to 1200px, producing 120px content insets at 1440px. The 720px form width is the narrower reading-and-entry measure; guided questions may pair a roughly 760px question column with a 368px educational aside and a 72px gap.

Desktop main regions typically begin 40–48px below the header and end with 64px bottom padding. Major vertical groups use 24–32px gaps. Cards use 24px internal padding and 16px content gaps; callouts use 20px padding; chart containers use 28px; overlays use 32px. Three-up product and comparison layouts divide the 1200px content region into equal columns with 24px gutters. Comparison rows are aligned across columns and remain 88px high to support direct scanning.

Auto Layout is the dominant construction method. Related content stacks vertically, actions use horizontal rows with space-between or right alignment, and repeated cards use equal-width horizontal groups. Long detail and comparison content extends below the initial 1024px frame rather than compressing typography or reducing row heights.

## Elevation & Depth

Depth is primarily structural: cream-to-white or cream-to-mint surface changes, 1px borders, and aligned spacing establish hierarchy. The first elevation style adds only a green-black 8%-opacity shadow at 0 2px 8px and is used on product cards. It should not be applied to every container.

The second elevation style is reserved for stronger raised surfaces and combines a broad 0 8px 24px -4px shadow with a smaller 0 2px 6px shadow. Popovers and modal overlays use the deepest documented shadow, 0 12px 32px -6px at 14% opacity, over a 20% black scrim. Borders remain visible even when elevation is present.

## Shapes

The interface uses softened rectangles rather than pill-shaped containers everywhere. Buttons, fields, badges, and suitability indicators use a 10px radius. Choice controls, callouts, disclosures, and accordions use 12px. Product cards, chart containers, system states, and overlays use 16px. The 24px radius exists for larger exceptional surfaces; full rounding is reserved for radio indicators and other circular marks.

Normal boundaries are 1px. A 2px border indicates validation emphasis or a matched-product treatment. A 3px green border is the visible focus treatment and is also used for selected product cards. This stronger outline is intentional redundancy, not decoration.

## Components

**Navigation.** The desktop header is 80px high with 80px horizontal padding, a 113×50px vector wordmark, centered progress context, and a restart action. The mobile header is 96px high, uses 16px side padding, reduces the wordmark to roughly 100×44px, and places progress context on a second line. The official wordmark is a vector asset; do not recreate it as typed text or combine it with a separate key mark.

**Buttons.** Primary, secondary, tertiary, and destructive styles share a 48px minimum height, 10px radius, 12×20px padding, 8px internal gap, and 16px SemiBold label. Every style defines default, hover, pressed, focus, disabled, and loading states. Primary changes from gold to brighter yellow on hover and muted mustard when pressed. Secondary remains bordered white, moving through cream and mint interaction surfaces. Tertiary removes visible container emphasis until interaction. Destructive uses raspberry and dark sienna. Focus is always a 3px green outline; disabled actions use cream, gray text, and a gray-green border.

**Inputs and dropdowns.** Labels persist above controls. The control itself is 56px high, white, 10px rounded, and padded 16px horizontally; label, control, and helper are separated by 8px. Text, currency, percentage, and number variants share default, hover, focus, filled, error, disabled, and success states. Focus uses a 3px green border. Error and success use 2px semantic borders and matching helper copy. Disabled controls use the cream disabled surface. Dropdowns preserve the same geometry and place a 24px chevron instance at the trailing edge.

**Choice and segmented controls.** Radio and checkbox cards are at least 64px high with 12px radius, 16px side padding, and a 24px indicator. Selected choices combine mint fill, green outline, and a gold-centered marked indicator. Segmented controls use adjacent 48px-high segments inside a lightly padded group; the selected segment uses the dark green surface with inverse text, while unselected segments remain light and bordered.

**Progress.** The six-step indicator uses separated gold/neutral bar segments plus a written step label, so progress remains legible without color. It sits inside the content column rather than spanning the full browser width.

**Product cards and comparison.** Summary product cards are 360px in the component set and expand evenly to the available three-column grid. They keep a fixed content order: name and plain-language definition, eligibility and relative-fit indicators, key metrics, a principal tradeoff, then an action. Standard cards are white with a 1px border. A match uses mint plus a 2px green outline and explicit fit language. Selection uses a 3px outline. Unavailable products remain visible on cream with educational explanation rather than disappearing.

Focused comparison uses equal columns and repeated 88px metric rows. Labels are smaller and neutral; values are darker and semibold. Mobile comparison does not squeeze three columns into the viewport: it exposes one approximately 315px column at a time in a horizontal viewport and offers a quick textual summary.

**Callouts, disclosures, and system states.** Callouts use a marker, title, and body in a 12px-rounded container with 20px padding and 16px gap. Information, neutral, success, warning, and error variants change surface, border, text, and symbol together. Tooltips and definitions use 16px padding; accordions use the same 12px geometry in closed and open states. Empty, loading, and recoverable error panels are larger 16px-rounded surfaces with 32px padding and plain-language next steps.

**Charts.** Chart containers are 760px wide in the component set, with 28px padding, 18px vertical gaps, 16px radius, and a 1px border. Series use direct endpoint labels and solid, dashed, or dotted patterns in addition to color. Legends repeat the pattern and add a check plus mint surface for selected series. Every chart includes an explanatory caption and defines default, selected-series, and no-data states.

**Overlays.** Confirmation and educational overlays are 520px wide with 32px padding, 24px section gaps, 16px radius, right-aligned actions, a scrim, and popover elevation. Restart is treated as destructive; cancel remains secondary.

## Iconography

Functional icon slots are 16, 20, and 24px. The system favors simple vector or symbol marks—checks, information markers, warnings, chevrons, selection dots, and chart-pattern samples—paired with text. Icon colors follow the same primary, secondary, inverse, success, warning, error, and information roles as typography and borders. Icons clarify a state but never replace its written label.

There is no evidence for decorative illustration as a recurring system rule. New screens should rely on the wordmark, functional icons, charts, and typographic hierarchy rather than introducing ornamental imagery.

## Motion

The declared motion scale is 100ms, 180ms, and 280ms with a standard `cubic-bezier(0.2, 0, 0, 1)` curve. Use the fast duration for hover and pressed component changes, the standard duration for ordinary state or view changes, and the slow duration only when a larger spatial change needs additional orientation. The emphasized overshoot curve is available but should remain exceptional.

Prototype reactions consistently use fast Smart Animate state changes. Some prototype navigation and overlay links contain 150ms and 220ms timings; these are contextual prototype values, not additional system tokens.

## Responsive Behavior

Desktop is represented at 1440px, laptop at 1280px, tablet at 768px, and mobile at 375px. Laptop layouts retain the desktop structure with 64px content insets when appropriate. Tablet examples use 32–40px content insets and shift the global header to the mobile header pattern. Mobile screens repeatedly use 20px page insets, 16px header insets, full-width actions, and vertically stacked forms.

Typography reduces contextually rather than scaling the entire interface: desktop page titles are 40px, tablet examples use 36px, and mobile examples use 30–32px depending on title length and screen density. These responsive title sizes are contextual overrides in the file, not separate published text styles.

Three-up cards collapse to two columns on tablet and one column on mobile. Dense comparisons become stacked summaries or horizontally scrollable single-card viewports; controls, labels, borders, and 44–48px targets do not shrink. Content reflows, while text and components retain readable sizes.

## Do's and Don'ts

- **Do** keep cream as the dominant canvas, white and mint as supporting surfaces, and dark green as structural navigation and state emphasis.
- **Don't** use gold as a large background field or normal text color; reserve it for primary actions, progress, and selected-control marks.
- **Do** pair every selected, eligible, warning, or error color with a border, symbol, and written label.
- **Don't** imply that one financial product is better by making its card larger. Use the documented Match, Selected, Eligibility, and Suitability treatments.
- **Do** preserve the Fraunces-for-headings and Work-Sans-for-function split.
- **Don't** use the headline face for body copy, form controls, comparison rows, or legal qualification.
- **Do** keep persistent field labels, visible helper or correction copy, and 44px-or-larger interactive targets.
- **Don't** replace labels with placeholders or remove unavailable products; keep the explanation visible.
- **Do** use 24px card padding, 24px grid gutters, and the documented 10/12/16px radius hierarchy.
- **Don't** introduce intermediate spacing, radius, or border values to make isolated screens fit.
- **Do** rely on tonal surfaces and 1px borders for most hierarchy, adding level-1 elevation to cards and stronger elevation to overlays.
- **Don't** turn every section into a floating card or apply deep shadows to routine content.
