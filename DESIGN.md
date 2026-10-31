---
name: CekDBD
description: A calm, clear visual system for dengue education and self-monitoring.
colors:
  primary: "#1366d6"
  primary-hover: "#0d4fae"
  primary-soft: "#dbeafe"
  background: "#f3f7fb"
  surface: "#ffffff"
  surface-soft: "#e8eff7"
  text: "#14263d"
  muted: "#566a80"
  border: "#d5e1ee"
  danger: "#d93a3a"
  warning: "#d99800"
  success: "#1f9d55"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.4vw, 3.25rem)"
    fontWeight: 800
    lineHeight: 1.12
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 700
rounded:
  sm: "8px"
  md: "10px"
  lg: "14px"
  xl: "24px"
  pill: "999px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "9px 17px"
    height: "42px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "7px 15px"
    height: "42px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "clamp(17px, 3vw, 25px)"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  nav-link:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
---

# Design System: CekDBD

## Overview

**Creative North Star: "Klinik digital yang tenang dan tepercaya"**

CekDBD pairs a calm, trustworthy clinical tone with the directness of a practical campus guide. Clear headings, readable Indonesian copy, and a cool blue palette help people scan educational and self-monitoring information without making the interface feel severe. The visual language is documented from the existing implementation and the product owner's chosen direction.

The interface uses quiet grid texture, pale blue surfaces, compact rounded controls, and carefully layered cards. A light/dark toggle carries the same roles across both themes. The home hero has its own dengue-related illustration and interactive mosquito detail; treat that art as a current page expression rather than a required motif for every surface. No visual anti-reference was confirmed.

**Key Characteristics:**
- Calm clinical clarity with a welcoming campus tone.
- Blue-led surfaces with distinct danger, caution, and positive states.
- Friendly, scannable controls and structurally meaningful elevation.
- Responsive layouts and a user-selectable dark theme.

## Colors

The default theme uses trusted blue against cool, pale neutrals; red, amber, and green distinguish urgent, cautionary, and positive states. Dark mode remaps these roles to dark surfaces, readable light text, and brighter semantic accents; use the CSS theme variables rather than hard-coded light values when building components.

### Primary
- **Trusted Blue:** the main action, active navigation, focus, and links.
- **Deep Action Blue:** the pressed or hovered primary action.
- **Blue Wash:** selected navigation, focused fields, and low-emphasis blue surfaces.

### Neutral
- **Cool Mist:** the page canvas and the soft grid backdrop.
- **Clean White:** cards and form surfaces in the default theme.
- **Soft Blue Gray:** secondary surface fills and quiet control backgrounds.
- **Navy Ink:** primary text and headings.
- **Slate Blue:** supporting copy and secondary labels.
- **Pale Blue Line:** card and field boundaries.

### Semantic
- **Alert Red:** danger notices and avoid states.
- **Caution Amber:** caution states and intermediate status.
- **Positive Green:** safe and positive states.

**The Status-By-Meaning Rule.** Keep red, amber, and green attached to the meaning of a status. Do not use them as arbitrary decoration.

## Typography

**Display Font:** Outfit (with system UI and sans-serif fallbacks)
**Body Font:** Plus Jakarta Sans (with system UI and sans-serif fallbacks)
**Label/Mono Font:** Plus Jakarta Sans; no mono family is used.

**Character:** Outfit gives headings a compact, confident shape. Plus Jakarta Sans keeps body copy and controls open and readable. The interface copy is Indonesian.

### Hierarchy
- **Display** (800, responsive 2–3.25rem, 1.12 line-height): the home hero headline.
- **Headline** (700–800, typically 1.2–1.6rem, 1.25 line-height): section and card headings in Outfit.
- **Title** (700, typically 1rem): card and subsection titles.
- **Body** (400, 16px, 1.65 line-height): default reading copy in Plus Jakarta Sans.
- **Label** (700, typically 0.75–0.9rem): navigation, field labels, status cues, and compact controls.

**The Two-Font Rule.** Use Outfit for headings and Plus Jakarta Sans for body text and controls; keep the fallback stack intact.

## Layout

The desktop shell centers content in a fluid container capped at 1160px, with a wider header capped at 1280px. The home hero uses a two-column grid with a wider copy column and a narrower safety-information column. Cards and supporting sections use compact grids and consistent gaps rather than full-bleed editorial layouts.

At 1050px, the header navigation moves onto its own row. At 760px, it becomes a collapsible vertical menu and the hero and footer grids stack. At 480px, the hero actions become full-width stacked buttons. Other content grids reduce to two columns around 900px and one column around 620–760px. The main content width is 92% with an 1160px cap. Preserve these responsive transitions and allow text and controls to wrap without horizontal overflow.

## Elevation & Depth

Elevation is structural: subtle shadows separate cards from the patterned canvas, while stronger shadows and a blurred translucent fill distinguish the sticky header after scrolling. Borders reinforce card and field edges. The owner's direction is to keep layered surfaces soft and scannable while letting elevation clarify hierarchy.

### Shadow Vocabulary
- **Resting surface** (`0 2px 12px rgba(20, 38, 61, 0.07)`): default light-theme cards and compact controls.
- **Scrolled header** (`0 8px 32px rgba(20, 38, 61, 0.12)`): sticky header after the page moves.
- **Interactive card** (`0 12px 32px rgba(20, 38, 61, 0.14)`): hover or focus-within on interactive triage cards.
- **Dark surface** (`0 2px 14px rgba(0, 0, 0, 0.3)`): default dark-theme elevation.

**The Hierarchy-Through-Elevation Rule.** Reserve stronger shadows for interaction or a meaningful layer change; keep resting cards quiet.

## Shapes

Controls use gently rounded 10px corners; cards are more generous at 14px, with the hero at 24px. Pills and status badges use fully rounded ends. Inputs and cards retain fine borders, while primary buttons are filled and secondary buttons use a clear outline. Clip decorative hero artwork within its rounded container.

## Components

The shared components are friendly and easy to scan. Keep each control's state visible through color, border, and focus treatment.

### Buttons
- **Shape:** softly rounded corners (10px), 42px minimum height, 9px by 17px padding.
- **Primary:** trusted blue fill with white text; deepen the fill on hover and lift slightly.
- **Outline:** transparent fill with a 2px blue border; fill blue on hover.
- **Small:** 36px height and 6px by 12px padding in the header.
- **Hover / Focus:** hover shifts up 1px; active presses to 97% scale. Preserve a clear keyboard focus indicator wherever a component defines one.

### Cards / Containers
- **Corner style:** 14px for regular cards; hero uses 24px.
- **Background:** solid surface over the page canvas; selected banners may blend the soft blue into the surface.
- **Shadow strategy:** light structural shadow at rest; stronger shadow and subtle lift only for interactive/focused cards.
- **Border:** 1px pale blue border.
- **Internal padding:** responsive 17–25px for general cards; compact alert cards use 18px by 20px.

### Inputs / Fields
- **Style:** white or theme surface, 1px border, 10px corners, 12px by 14px padding.
- **Focus:** blue border with a 3px soft-blue outline; retain visible keyboard focus.
- **Placeholder:** muted-light text; keep labels outside fields and clearly associated.

### Navigation
- **Desktop:** centered links in the header, 8px by 16px padding, pill-shaped hit areas, bold compact type.
- **States:** active and hover links use the soft blue fill and blue text; locked destinations are visibly muted and open sign-in.
- **Mobile:** a menu button reveals a stacked vertical navigation; keep the menu's expanded state exposed to assistive technology.
- **Scrolled header:** add a translucent theme surface, backdrop blur, border, and structural shadow.

### Status Chips
- Use fully rounded compact badges with a pale semantic fill and matching status text. Keep each color tied to its meaning and retain text or an icon so status is not conveyed by color alone.

### Theme Toggle
- The 42px square control switches between light and dark themes with a segmented shutter motion and sun/moon icon. Respect reduced-motion preferences and preserve the theme role mapping.

## Do's and Don'ts

### Do:
- **Do** keep headings in Outfit and body/control text in Plus Jakarta Sans.
- **Do** use the shared theme variables for colors so light and dark mode remain aligned.
- **Do** use blue for interaction and semantic colors for status.
- **Do** preserve the fluid, centered content width and the observed responsive grid changes.
- **Do** make keyboard focus visible and respect reduced-motion preferences.

### Don't:
- **Don't** use red, amber, or green as decoration detached from a status meaning.
- **Don't** remove the contrast between primary and outline actions.
- **Don't** apply the home hero's illustration or interactive mosquito motif to every screen by default.
- **Don't** use shadows stronger than the interactive-card treatment for resting content.
