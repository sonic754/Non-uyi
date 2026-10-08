---
version: alpha
name: Non Uyi Operations
description: Warm bakery operations dashboard with clear human review signals.
colors:
  primary: "#78350F"
  accent: "#92400E"
  background: "#FBF6EA"
  surface: "#FFFFFF"
  ink: "#292018"
  muted: "#51463C"
  danger: "#B42318"
  dangerSurface: "#FEF0EE"
  border: "#E8DCCB"
typography:
  heading:
    fontFamily: Calistoga
    fontSize: 2rem
    fontWeight: 400
    lineHeight: 1.15
  body:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
rounded:
  card: 18px
  control: 10px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: 12px
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: 24px
  alert:
    backgroundColor: "{colors.dangerSurface}"
    textColor: "{colors.danger}"
    rounded: "{rounded.control}"
    padding: 16px
  canvas:
    backgroundColor: "{colors.background}"
    textColor: "{colors.muted}"
---

## Overview

Bakery warmth without hiding operational urgency. Data is compact and legible; AI never sends messages.

## Colors

Amber is for action, white for reading surfaces, red exclusively for human escalation and failures.

## Typography

Calistoga distinguishes the bakery identity; Inter keeps multilingual tabular operations readable. Local serif and system sans fallbacks are required.

## Layout

Desktop rail plus working area; composer and inbox sit side by side. On narrow screens they stack, with no fixed overlays.

## Elevation & Depth

Subtle borders and shallow shadows separate surfaces; no unnecessary motion in the workflow.

## Shapes

Rounded cards and compact square-ended table rules. Controls have 44px minimum height.

## Components

Primary button for analysis; alerts are distinct from category pills. Never communicate category by color alone.

## Do's and Don'ts

Do show review status, retries and unknown data. Don't suggest AI replies were sent or invent product facts.
