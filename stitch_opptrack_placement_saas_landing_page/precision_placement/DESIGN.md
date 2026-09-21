---
name: Precision Placement
colors:
  surface: '#f7f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f7f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#191c1e'
  on-surface-variant: '#44474d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f4'
  outline: '#75777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#4d5f7d'
  primary: '#000615'
  on-primary: '#ffffff'
  primary-container: '#0b1f3a'
  on-primary-container: '#7587a7'
  inverse-primary: '#b5c7ea'
  secondary: '#3b5e97'
  on-secondary: '#ffffff'
  secondary-container: '#9dbffe'
  on-secondary-container: '#274d84'
  tertiary: '#000806'
  on-tertiary: '#ffffff'
  tertiary-container: '#00241e'
  on-tertiary-container: '#009884'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b5c7ea'
  on-primary-fixed: '#071c36'
  on-primary-fixed-variant: '#364764'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#aac7ff'
  on-secondary-fixed: '#001b3e'
  on-secondary-fixed-variant: '#20467e'
  tertiary-fixed: '#72f8df'
  tertiary-fixed-dim: '#52dcc3'
  on-tertiary-fixed: '#00201b'
  on-tertiary-fixed-variant: '#005045'
  background: '#f7f9fc'
  on-background: '#191c1e'
  surface-variant: '#e0e3e6'
typography:
  display:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system pairs the rigorous clarity of modern developer tools (like Linear) with the structured versatility of productivity workspaces (like Notion). Designed for student placement productivity and career orchestration, it projects enterprise-grade credibility alongside an intuitive, student-accessible clarity.

The emotional core is authoritative, calm, focused, and momentum-driven. The interface avoids frivolous ornamentation in favor of micro-precision: crisp data boundaries, refined typography, and purposeful teal-hued accents that represent career advancement and intelligent tracking.

### Design Movement
**Modern Technical Minimalism:** A controlled, high-density light interface defined by crisp 1px borders, generous structural whitespace, calm slate-gray canvas grounding, and soft, highly diffused ambient elevations.

## Colors

The palette balances deep naval structure with energetic, forward-moving teal signals.

### Palette Architecture
- **Primary Canvas & Surfaces:** Background canvas rests at `#F7F9FC` (Light Slate), while active work surfaces, cards, and modal sheets use pure `#FFFFFF` to maintain distinct card contrast.
- **Deep Navy (`#0B1F3A`):** Anchors the visual hierarchy. Used for dominant headings, high-contrast primary actions, and solid badges.
- **Brand Blue (`#123C73`):** Secondary structural tone for active states, tab underlines, navigational highlights, and icon containers.
- **Teal Continuum:**
  - `#18B7A0` (Core Teal): Used for status badges, pipeline indicators, progress trackers, and conversion highlights.
  - `#22C7AE` (Bright Teal): Reserved for interactive hovers, AI-assisted suggestions, and active status pings.
  - `#E8F8F5` (Light Teal Tint): Serves as subtle tinted backgrounds for success tags, highlight chips, and active filter states.
- **Neutral Boundaries & Texts:**
  - Border: `#E5EAF0` strictly applied at 1px.
  - Body Text: `#475569` for balanced readability.
  - Muted Label Text: `#64748B`.

## Typography

Typography prioritizes high-density legibility and geometric alignment through Inter.

### Hierarchy & Style Rules
- **Display & Headlines:** Tightly tracked (`-0.02em` to `-0.03em`) with intentional negative letter-spacing to mirror modern toolsets. Display treatments must feature high contrast against the slate canvas.
- **Numerical Alignment:** Use tabular lining figures (`font-variant-numeric: tabular-nums`) for all placement stats, interview counters, dates, and stage percentages.
- **Labels & Micro-tags:** Category headers and metadata tags leverage `label-sm` with slight uppercase tracking (`0.04em`) to establish visual structure without adding weight.

## Layout & Spacing

The layout is built on a 12-column responsive fluid grid with a strict 4px base rhythm (using `0.25rem` increments).

### Grid Configuration
- **Desktop (≥1200px):** 12 columns, `margin: 2.5rem`, `gutter: 1.5rem`, max content container width of `1240px`.
- **Tablet (768px - 1199px):** 8 columns, `margin: 2rem`, `gutter: 1rem`.
- **Mobile (<768px):** 4 columns, `margin: 1.25rem`, `gutter: 0.75rem`.

### Spatial Rhythm
- **Component Tightness:** Spacing between internal elements of interactive cards adheres strictly to `space-sm` (8px) and `space-md` (16px) to emulate high-utility desktop tool interfaces.
- **Section Pacing:** Large informational blocks and feature showpieces use `space-xl` (40px) to `80px` on desktop to maintain clarity and prevent cognitive fatigue.

## Elevation & Depth

Visual depth is achieved through the interplay of structural hairline borders and tinted, highly diffused ambient drop shadows rather than stacked opaque surfaces.

### Elevation Levels
- **Level 0 (Flat Canvas):** `#F7F9FC` background with no shadow.
- **Level 1 (Surface Cards & Structural Containers):** Pure `#FFFFFF` fill with a crisp `1px solid #E5EAF0` border and an ambient shadow:
  `box-shadow: 0 4px 20px -2px rgba(11, 31, 58, 0.05);`
- **Level 2 (Dropdowns, Floating Toolbars, Active Dragging):** Pure `#FFFFFF` fill with `1px solid #E5EAF0`:
  `box-shadow: 0 12px 32px -4px rgba(11, 31, 58, 0.08), 0 4px 12px -2px rgba(11, 31, 58, 0.03);`
- **Level 3 (Modals & Overlays):** 
  `box-shadow: 0 24px 48px -12px rgba(11, 31, 58, 0.14);` Backed by a backdrop blur filter of `backdrop-filter: blur(4px)` over `rgba(11, 31, 58, 0.4)`.

### Accent Glows
AI suggestions, active placement stage rings, and targeted focus states use a subtle teal glow:
`box-shadow: 0 0 0 3px rgba(24, 183, 160, 0.15);`

## Shapes

The geometric vocabulary balances clean rectangular tool surfaces with softened ergonomic corners.

- **Primary Cards & Containers:** Standardized at `12px` (`0.75rem`), establishing a structured yet approachable frame for placement pipelines and metric grids.
- **Buttons, Field Inputs, & Selectors:** Standardized at `8px` (`0.5rem`) for compact, precise control targets.
- **Status Pills & Micro-badges:** Fully rounded (`9999px`) to immediately signal transient tags, interview tags, and system signals.

## Components

### Buttons
- **Primary Button:** Deep Navy (`#0B1F3A`) background, `#FFFFFF` typography, `8px` radius, `height: 40px` (or `48px` for landing page hero CTAs), horizontal padding `1.25rem`. Hover shifts to `#123C73` with transition speed of `150ms ease`.
- **Secondary / Ghost Button:** Pure white background, `1px solid #E5EAF0`, `#0B1F3A` text. Hover changes border to `#CBD5E1` and background to `#F8FAFC`.
- **Teal Action / Accent Button:** Core Teal (`#18B7A0`) background with pure white text, transitioning to `#22C7AE` on hover. Used for primary conversion funnels and AI triggers.

### Cards
- **Pipeline & Metric Cards:** Built with a `12px` corner radius, pure `#FFFFFF` background, `1px solid #E5EAF0`, and Level 1 ambient shadow. Header rows within cards include subtle internal dividers (`border-bottom: 1px solid #F1F5F9`).
- **Interactive Kanban / Application Cards:** Support hover lifts of `translateY(-2px)` with shadow adjusting to Level 2.

### Input Fields & Controls
- **Form Inputs:** `8px` border radius, `1px solid #E5EAF0` border, `height: 42px`, `padding: 0 0.875rem`. Focused state replaces border with `#18B7A0` accompanied by `0 0 0 3px rgba(24, 183, 160, 0.15)`.
- **Checkboxes & Radios:** `18px x 18px` size with `4px` radius (checkbox) or circular (radio). Unchecked: `1px solid #CBD5E1`. Checked: Core Teal (`#18B7A0`) fill with crisp white vector marks.

### Chips & Status Badges
- **Status Pills:** Fully rounded, `height: 24px`, padding `0 10px`, font size `label-sm`.
  - *Applied / In Review:* Background `#F1F5F9`, text `#475569`.
  - *Interviewing:* Background `#E8F8F5`, text `#18B7A0`, with a pulsing 6px `#22C7AE` dot.
  - *Offer Received:* Background `#E8F8F5`, text `#0B1F3A`, with a solid `#18B7A0` edge.

### Specialized Application Tracking Components
- **Stage Progress Bar:** Segmented 4px tall bars displaying application journey phases, utilizing `#E2E8F0` for pending and `#18B7A0` for completed stages.
- **AI Assist Callout:** Light Slate background with a `1px solid rgba(24, 183, 160, 0.3)` border and a subtle gradient sweep (`rgba(232, 248, 245, 0.5)` to transparent), featuring `body-sm` typography with bright teal highlight tokens.