---
name: Timekeeper
description: A standing ledger for the working day — flat, ring-ruled surfaces and one blue signal.
colors:
  ledger-blue: "oklch(0.5744 0.1880 259.8145)"
  ledger-blue-foreground: "oklch(1.0000 0 0)"
  page: "oklch(1.0000 0 0)"
  ink: "oklch(0.3211 0 0)"
  surface: "oklch(1.0000 0 0)"
  rule: "oklch(0.9276 0.0058 264.5313)"
  quiet: "oklch(0.9846 0.0017 247.8389)"
  quiet-foreground: "oklch(0.5510 0.0234 264.3637)"
  chip: "oklch(0.9670 0.0029 264.5419)"
  chip-foreground: "oklch(0.4461 0.0263 256.8018)"
  wash: "oklch(0.9514 0.0250 236.8242)"
  wash-foreground: "oklch(0.3791 0.1378 265.5222)"
  alarm: "oklch(0.5933 0.2078 25.3313)"
  page-dark: "oklch(0.2046 0 0)"
  ink-dark: "oklch(0.9219 0 0)"
  surface-dark: "oklch(0.2686 0 0)"
  rule-dark: "oklch(0.3715 0 0)"
  quiet-dark: "oklch(0.2393 0 0)"
  quiet-foreground-dark: "oklch(0.7155 0 0)"
  wash-dark: "oklch(0.3791 0.1378 265.5222)"
  wash-foreground-dark: "oklch(0.8823 0.0571 254.1284)"
  ledger-blue-dark: "oklch(0.6231 0.1880 259.8145)"
  ledger-blue-foreground-dark: "oklch(0.2046 0 0)"
  alarm-dark: "oklch(0.6368 0.2078 25.3313)"
  settled: "#059669"
  attention: "#b45309"
  fabricated: "#6d28d9"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.375
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  prose:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.025em"
  micro:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  single: "0.75rem"
  chrome: "2px"
  full: "9999px"
spacing:
  base: "0.25rem"
  card: "1rem"
  card-sm: "0.75rem"
  gutter: "1rem"
  gutter-md: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.ledger-blue}"
    textColor: "{colors.ledger-blue-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.single}"
    padding: "0 0.625rem"
    height: "2rem"
  button-primary-hover:
    backgroundColor: "color-mix(in oklch, var(--primary), var(--foreground) 15%)"
  button-outline:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.single}"
    padding: "0 0.625rem"
    height: "2rem"
  button-destructive:
    backgroundColor: "oklch(0.5933 0.2078 25.3313 / 0.1)"
    textColor: "{colors.alarm}"
    typography: "{typography.body}"
    rounded: "{rounded.single}"
    padding: "0 0.625rem"
    height: "2rem"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.single}"
    padding: "1rem 0"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.single}"
    padding: "0.25rem 0.625rem"
    height: "2rem"
  badge-status:
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.5rem"
    height: "1.25rem"
  nav-item-active:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.wash-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.single}"
    padding: "0.625rem 0.75rem"
---

# Design System: Timekeeper

## Overview

**Creative North Star: "The Standing Ledger"**

Timekeeper is a record that keeps itself. Its core promise is that the day's
entry is already filed and correct before the user thinks to check, so the
interface is not a control panel — it is the ledger you consult afterward to
confirm what was written in your name. Every screen is a page of that ledger:
ruled with hairlines rather than boxed in with borders, set in tabular figures
that align down the column, and printed at reading size where the text is the
artifact itself rather than a label for one.

The philosophy is quiet, exact, and unshowy. Restraint is the point, not a
budget constraint. Nothing decorative survives: there are no gradients, no
illustrations, no ornamental shadows, and no color that isn't carrying
information. Confidence comes from precision — a single radius everywhere, one
blue that means one thing, status stated in words inside a pill rather than
implied by a dot. The system is comfortable being plain because the product's
voice is plain; it states what happened, including when what happened was a
failure.

Density is desktop-first and deliberately compact. Controls are small (a 32px
default button) because the audience is colleagues on laptops who want more of
the ledger visible at once, and the places where fingers are genuinely involved
override to a comfortable target explicitly rather than inflating the whole
scale. The accent earns its brightness by appearing almost nowhere.

**Key Characteristics:**

- Flat, ring-ruled surfaces — no resting shadows anywhere
- One radius (0.75rem) across every element, lint-enforced
- One accent blue, used for the single primary action and the active nav row
- Tabular figures for every hour, monospace for every ticket key
- Status always spelled out in a pill, never encoded in color alone
- Reading-size prose (15px/1.625) for the posted text, because it is the product
- Compact controls with deliberate, commented touch-target exceptions

## Colors

An almost entirely achromatic system — true neutrals with a faint cool cast in
the borders — interrupted by exactly one saturated blue and three borrowed
status hues.

The descriptive names below are documentation. The tokens in code keep their
shadcn names, and those are what you write: Ledger Blue is `--primary`
(`bg-primary`), Page is `--background`, Ink is `--foreground`, Surface is
`--card`, Rule is `--border` / `--input`, Quiet is `--muted` /
`--muted-foreground`, Chip is `--secondary`, Wash is `--accent`, and Alarm is
`--destructive`. All are defined in `apps/web/src/styles.css` and exposed to
Tailwind through `@theme inline`.

### Primary

- **Ledger Blue** (`oklch(0.5744 0.1880 259.8145)` light /
  `oklch(0.6231 0.1880 259.8145)` dark): The system's only brand color and its
  only saturated element at rest. It fills the single primary action on a
  screen, marks the active navigation row, forms the focus ring, carries the
  "keeper" half of the wordmark, and fills completed and current steps on the
  wizard rail.
  The two modes need different lightness and this is measured, not stylistic. A
  single value cannot serve both: the dark-mode value on a white page gives a
  white button label only 3.68:1, and the light-mode value on the dark page
  drops the accent as text to ~3.2:1. The accent therefore darkens one step in
  light mode, and accent fills carry a **white** label in light mode and a
  **page-dark** label in dark mode. Do not "unify" them.

### Neutral

- **Page** (`oklch(1.0000 0 0)` light / `oklch(0.2046 0 0)` dark): The app
  background. Pure white in light mode; in dark mode the page is *darker* than
  the cards on it, so surfaces read as raised by tone alone.
- **Ink** (`oklch(0.3211 0 0)` light / `oklch(0.9219 0 0)` dark): Body text.
  Deliberately not black — a soft dark gray that keeps long prose comfortable.
- **Surface** (`oklch(1.0000 0 0)` light / `oklch(0.2686 0 0)` dark): Card and
  popover fill. In light mode it is identical to the page, which is why cards
  need the hairline ring to exist at all.
- **Rule** (`oklch(0.9276 0.0058 264.5313)` light / `oklch(0.3715 0 0)` dark):
  Borders, dividers, and input strokes. Faintly cool rather than neutral gray.
- **Quiet** (`oklch(0.9846 0.0017 247.8389)`) and **Quiet Foreground**
  (`oklch(0.5510 0.0234 264.3637)`): The recessive pair — hover fills, icon
  wells, skipped rows, and every piece of secondary and explanatory text.
- **Chip** (`oklch(0.9670 0.0029 264.5419)`) with **Chip Foreground**
  (`oklch(0.4461 0.0263 256.8018)`): The neutral badge fill, used for factual
  quantities like hours.
- **Wash** (`oklch(0.9514 0.0250 236.8242)`) with **Wash Foreground**
  (`oklch(0.3791 0.1378 265.5222)`): A pale blue tint reserved almost entirely
  for the active navigation row on desktop. It is the accent's whisper.
- **Alarm** (`oklch(0.6368 0.2078 25.3313)`): Failure. Never used as a solid
  fill on a control — it appears as text on a 10% tint of itself, so a
  destructive action reads as serious without shouting.

### Named Rules

**The One Signal Rule.** Ledger Blue marks exactly one thing per surface: the
primary action, or the active nav row, never both competing. If a second element
wants the accent, one of them is not actually primary.

**The Borrowed Status Rule.** The three status hues — **Settled** emerald
(posted, connected), **Attention** amber (queued, stale, an unbalanced day), and
**Fabricated** violet (sample content that is not real) — are borrowed Tailwind
steps, not system tokens. They appear only as a tinted pill with `border-0` and
always ship a light/dark pair (`bg-emerald-100 text-emerald-800` /
`dark:bg-emerald-950 dark:text-emerald-300`). Never promote one into the brand
palette, and never use one as a surface or text color outside a status pill.

**The Measured Contrast Rule.** Accent and error colors are set by contrast
measurement, not by eye. Normal text and control labels clear 4.5:1 against
whatever they actually sit on, and focus indicators clear 3:1. Before changing
`--primary`, `--destructive`, `--primary-foreground` or any hover fill, measure
the composited result in both modes — a hover or an alpha tint changes the
background the label is read against.

Three measured exceptions are known and deliberate, all of them accent-on-its-own-tint
at marginal ratios: destructive text on `destructive/10` (3.89:1, the destructive
button), accent text on `primary/10` (3.96:1, the "Scheduled" pill), and dark-mode
destructive text on `destructive/20` (3.24:1). Clearing these needs a separate
darker on-tint value, which the system has deliberately not adopted. Do not add
new accent-on-tint pairings without measuring.

**The Named State Rule.** No state is conveyed by color alone. Every status pill
carries its word — "Posted", "Skipped", "Failed", "Sending", "Scheduled", "Not
connected", "Sign in again" — and most carry an icon as well.

## Typography

**Display Font:** Inter (with `sans-serif` fallback)
**Body Font:** Inter (with `sans-serif` fallback)
**Label/Mono Font:** JetBrains Mono (with `monospace` fallback)

**Character:** A single neutral grotesque doing all the expressive work through
weight and size rather than contrast, with a monospace reserved strictly for
machine identifiers. The pairing has no personality of its own by design — the
data is the subject, and the type is the ruled paper it sits on.

> **Known defect, not a design decision.** Neither Inter nor JetBrains Mono is
> actually loaded. `--font-sans` and `--font-mono` name them,
> `@fontsource-variable/inter` is a dependency, but nothing imports it and
> `index.html` has no font link, so the app currently renders in whatever the OS
> supplies. Inter is normative — treat the missing import as a bug to fix, not
> as license to redesign around the system font.

### Hierarchy

- **Display** (600, 1.5rem, tracking-tight): The date on Today and the title on
  a legal page — the one true page heading per screen. Scales to 1.875rem at
  `sm` on legal pages only.
- **Headline** (600, 1.25rem, tracking-tight): Section headings within a screen,
  and the step title inside the wizard. It sits between the 1.5rem page heading
  and the 1rem card title so a section genuinely outranks the cards inside it.
- **Title** (500, 1rem, leading-snug): Card titles and section headings. Note
  the drop to weight 500 — card titles are labels, not headlines.
- **Body** (400, 0.875rem): The default for the entire interface. Descriptions,
  list rows, button labels, form text.
- **Prose** (400, 0.9375rem, 1.625): Reserved for text the user is meant to
  actually read rather than scan — the posted timesheet message, the message
  editor, and legal page paragraphs. Capped at a 70ch measure everywhere it
  appears, so it never runs the full column width.
- **Label** (500, 0.75rem, tracking-wide, uppercase): Badge text. There are no
  eyebrows or kickers above headings anywhere in this system — a heading carries
  its own weight, and information that wanted to be a kicker belongs in the
  description or alongside the state it describes.
- **Micro** (500, 0.6875rem): Mobile nav labels, the connection role badge, the
  board-key badge. The floor — nothing smaller exists.
- **Mono** (400, 0.6875rem): Jira ticket keys and board keys only.

### Named Rules

**The Verbatim Rule.** The text that will reach the timesheet renders at prose
size (0.9375rem / 1.625), never at UI body size. It is the artifact the product
produces, and it is shown exactly as it will be posted — there must be no gap
between what is displayed and what gets filed.

**The Tabular Rule.** Every hour figure carries `tabular-nums` so columns of
hours align. Every Jira ticket key and board key carries `font-mono`. These are
not stylistic choices; they are how a number is distinguished from a word and an
identifier from a name.

## Layout

The measure belongs to the page, not the shell. `AppShell.Content` owns only the
gutter (1rem, opening to 2rem from `md`), the vertical padding (1.25rem rising to
2rem) and the phone tab-bar clearance; each screen then declares its own width
through `PageLayout`. Most take the `reading` measure of `max-w-3xl` (48rem); the
Timesheet takes `wide` (64rem) because it is genuinely tabular and columns beat a
short line. Prose is capped at a `70ch` measure wherever it is meant to be read —
legal pages and the entry message alike — rather than being allowed to run the
full width.

Screens are vertical stacks of full-width cards, and the primary content column
is never subdivided into a card grid. One screen adds a *supporting* second
column: Today puts the recent-entries list in a `PageLayout.Aside` from `xl` up,
where it is reference material consulted beside the work rather than a queue
below it. The distinction is the rule — a second column may carry state or
reference, never more of the primary task.

Spacing is a three-step ladder, and the steps are meant to be felt as different:
**0.75rem inside a record** (the gap between a card's own parts), **1.5rem
between records** (one card to the next), and **2.5rem between sections**. The
between-record step is deliberately double the within-record step so a card
groups by proximity rather than relying on its ring to do the work. A heading
always carries more space above it than below.

Every screen opens with the same header construct — heading, optional
description, optional trailing action, 1.5rem of space beneath — so the eye
lands in the same place on every route. It is a component, not a per-screen
composition; see Components.

Spacing derives from a 0.25rem base. Card internals are governed by a single
`--card-spacing` custom property (1rem, dropping to 0.75rem for `size="sm"`)
which drives gap, vertical padding, and horizontal padding together, so a card's
rhythm can be retuned from one value.

There are two structural breakpoints and they do different jobs.

`md` (768px) flips the **navigation**: below it, a fixed bottom tab bar with
icon-over-label items and `env(safe-area-inset-bottom)` padding, plus a sticky
translucent header carrying the wordmark and account menu; at and above it, the
tab bar becomes a full-height 15rem left rail with icon-beside-label rows, the
header disappears entirely, and the wordmark moves into the rail. Content
reserves 6rem of bottom padding on mobile so the floating tab bar never covers
the last card. `md` also returns touch-sized controls to the compact scale and
stops full-width action rows from stretching under a cursor.

`xl` (1280px) flips the **composition**, and only where a screen has supporting
material to move: Today's recent list steps out into a sticky 19rem aside. It is
deliberately not `lg` — see The One Column Rule.

### Named Rules

**The Thumb Rail Rule.** Primary navigation is bottom-anchored on phones and
side-anchored on desktop — never a hamburger, never a top tab strip. Content
must always reserve clearance for the floating bar.

**The One Column Rule.** The primary content column is a single stack of
full-width cards and the ledger reads top to bottom. Do not break the work
itself into side-by-side cards. A second column is allowed only for material you
consult rather than act on — state and history — and only from `xl`, where the
15rem rail has already been subtracted and the main column can still hold its
measure.

**The Grouping Gap Rule.** The space between two records must visibly exceed the
largest space inside one (0.75rem within, 1.5rem between). If a card needs its
ring to be legible as a single object, the gap is too small — fix the spacing,
not the border.

## Elevation & Depth

This system is flat, and that is doctrine rather than accident. No resting
surface casts a shadow. Cards are delineated by a hairline ring at 10% of the
ink color (`ring-1 ring-foreground/10`) — not a border, which would participate
in layout — and in light mode a card is exactly the same white as the page
behind it, so that ring is the *only* thing separating them. In dark mode the
card lightens above the page and depth becomes tonal instead. Structural chrome
uses single-sided borders: the mobile header's bottom edge, the tab bar's top
edge, the desktop rail's right edge, the card footer's top edge.

Depth is otherwise conveyed by translucency: the sticky header and mobile nav
sit at 80–95% page opacity with `backdrop-blur`, so content passing beneath them
is visibly behind rather than hidden.

### Shadow Vocabulary

Shadows exist only for layers that genuinely float above the document, and only
these:

- **Overlay** (`box-shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10)`):
  Dropdown menus, select menus, command palettes, popovers.
- **Raised overlay** (`box-shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10)`):
  The one popover that needs to read as further forward.

### Named Rules

**The Flat Ledger Rule.** A surface that is part of the page is flat and
ring-ruled. Shadow is reserved exclusively for elements that overlay the page
and will be dismissed. If a card has a shadow, it is wrong.

**The Ring Not Border Rule.** Card edges are rings, not borders, so adding one
never shifts layout by a pixel. Reach for `border` only on structural chrome
edges and single-sided dividers.

## Shapes

One corner radius governs the entire application: **0.75rem (12px)**. Every
Tailwind tier — `rounded-sm` through `rounded-4xl` — is remapped in `@theme` to
resolve to that same value, including the tiers Tailwind would otherwise default
to 16/24/32px. Tier names are therefore interchangeable at the call site: pick
whichever reads best, they are identical. An eslint rule
(`no-restricted-syntax`) enforces this and fails the build on a bare
`rounded-2xl`/`3xl`/`4xl` or an arbitrary `rounded-[…]`.

Two escapes exist, both principled. `rounded-full` and `rounded-none` are
shapes, not tiers, and are always available — pills, avatars, wizard dots, and
the connector rails all use `rounded-full`. And `--radius-chrome` (2px) covers
chrome too small for 12px to read as rounded at all, such as a tooltip's arrow
notch. Small buttons additionally clamp via `min(var(--radius-md), 10px|12px)`
so a 24px-tall control does not look like a lozenge — an arbitrary radius built
from the token, which is the only permitted form.

Form language is otherwise rectangular and quiet: no clipped corners, no
asymmetry, no decorative geometry. Icon wells are 2.5rem rounded squares. The
one dashed edge in the system is the empty state, where a dashed border signals
an absence rather than a container.

### Named Rules

**The One Radius Rule.** 0.75rem, everywhere, no exceptions beyond
`rounded-full`, `rounded-none`, `var(--radius-chrome)`, and the small-control
clamp. Never hardcode a radius; never name a tier expecting a different result.

## Components

### Buttons

- **Shape:** The single radius (0.75rem), with xs/sm sizes clamping to 10px and
  12px respectively.
- **Sizes:** Compact and utilitarian — 1.5rem (xs), 1.75rem (sm), 2rem
  (default), 2.25rem (lg), and square 1.5/1.75/2/2.25rem icon variants.
  Horizontal padding is 0.625rem, tightening to 0.5rem on the icon-bearing edge
  so an icon doesn't push the label off-center.
- **Primary:** Ledger Blue fill; white label in light mode, page-dark label in
  dark mode. Hover mixes the fill 15% toward `--foreground`, which darkens it in
  light mode and lightens it in dark — so hover always *raises* label contrast.
  It must never fade to a lower opacity: `/80` lightened the light-mode fill and
  dropped the white label to 3.24:1.
- **Outline:** Page-colored fill with a rule-colored border; hover fills with
  Quiet. In dark mode it takes a 30% input-colored fill instead of transparent.
- **Secondary:** Chip fill, hovering via `color-mix(in oklch, …)` toward the ink
  by 5% — a computed hover rather than a second token.
- **Ghost:** No fill until hover, then Quiet.
- **Destructive:** A 10% Alarm tint with Alarm text — never a solid red button.
- **Link:** Accent text with a 4px underline offset on hover.
- **Focus:** A 3px ring at 50% of the accent plus a solid accent border, on
  `:focus-visible` only. Destructive swaps in its own hue for both.
- **Press:** `active:translate-y-px` — a genuine 1px physical nudge, suppressed
  on menu triggers where the button stays down while the menu is open.
- **Disabled:** 50% opacity and pointer events off.
- **Touch exception:** Where a control is a primary mobile target, it overrides
  to 2.75rem (44px) explicitly, with a comment saying why. The variant scale
  tops out at 36px and is not to be stretched.

### Cards / Containers

- **Corner Style:** The single radius, with `overflow-hidden` so images and
  footers clip to it.
- **Background:** Surface. Identical to the page in light mode.
- **Shadow Strategy:** None. See Elevation — a hairline ring at 10% ink does the
  separating.
- **Border:** None on the card itself. The footer carries a top border and a 50%
  Quiet fill, making it read as a distinct action shelf.
- **Internal Padding:** One `--card-spacing` value (1rem, or 0.75rem for `sm`)
  drives gap, vertical padding, and horizontal padding together.

### Inputs / Fields

- **Style:** 2rem tall, single radius, transparent fill with a rule-colored
  border. Dark mode fills to 30% input color.
- **Type size:** `text-base` below `md` and `text-sm` above — the larger mobile
  size exists to stop iOS zooming the viewport on focus, and must not be
  "corrected".
- **Focus:** Border shifts to the accent and a 3px 50%-accent ring appears.
- **Error:** `aria-invalid` drives an Alarm border plus a 20% Alarm ring — the
  attribute is the trigger, so validity state is never styled by class alone.
- **Disabled:** 50% opacity, 50% input fill, `not-allowed` cursor.

### Badges

- **Style:** 1.25rem tall, always `rounded-full`, 0.75rem text at weight 500,
  0.5rem horizontal padding, icons locked to 0.75rem.
- **Variants:** default (accent fill), secondary (chip fill — the workhorse for
  quantities), outline (rule border, used for identifiers and roles), plus
  destructive, ghost, and link.
- **Status usage:** Status pills drop the border (`border-0`) and supply their
  own borrowed hue pair. See The Borrowed Status Rule.

### Navigation

- **Mobile:** A fixed bottom bar at 95% page opacity with `backdrop-blur`,
  items stacked icon-over-label at micro size (0.6875rem), minimum 4rem wide,
  padded for the safe area. Active state is accent *text* only — no fill.
- **Desktop:** A 15rem full-height left rail with a 1rem pad and the wordmark
  above a 1.5rem gap. Items become horizontal rows at body size with a 0.75rem
  icon gap. Active state is a Wash fill with Wash Foreground text — a filled row,
  unlike mobile.
- **Both:** Driven by the router's `data-status=active`, so active state is never
  hand-managed.
- **The account menu lives in two places by necessity.** The phone header is
  hidden from `md` up, so the account is rendered into both that header and the
  rail's footer. Anything added to the phone header needs a rail counterpart or
  it silently becomes unreachable on desktop.

### Page Header

Every route opens with the same construct, so the eye lands identically on every
screen.

- **Structure:** A baseline-aligned row — a 1.5rem heading with an optional
  0.875rem description beneath it on the left, an optional action on the right —
  followed by 1.5rem of space.
- **Rules:** One `h1` per screen. No eyebrow above the heading. The description
  is a full sentence at body size in Quiet Foreground, and it is where an
  identity pair (`PLAT Platform Rebuild → Northwind`) belongs rather than in a
  kicker.
- **Never hand-roll it.** Five screens previously built this inline with four
  different bottom margins and two different description offsets; the component
  exists so that cannot recur.

### Touch Targets

The variant scale is desktop-density and tops out at 36px, so genuine thumb
targets are raised per instance rather than by stretching the scale: `h-11
md:h-8` (44px on touch, back to the compact 32px where the pointer is a mouse).
This applies to the Today action row, the entry editor's buttons, the connection
actions, and the primary action in a page header. Every use is commented with why.

### Signature Component: The Entry Card

The system's centerpiece and the clearest expression of the North Star. A single
card holds one day's entry for one board link, assembled from parts rather than
configured by props: a heading (client over project, with the board key in mono,
the hours in tabular figures, and an "Example" pill when the content is
fabricated), a status pill, the posted message at prose size, an optional
inline editor, a breakdown listing which tickets produced each sentence, and a
footer of actions. A skipped entry drops to 60% opacity rather than being hidden
— the ledger records what did *not* happen too.

Its defining property is traceability: the message is shown verbatim, and the
breakdown lets a surprising sentence be traced back to the rule and ticket that
produced it. Anything added here must preserve that chain.

### Signature Component: The State Trio

Loading, failed, and empty are first-class and visually distinct. **Loading**
draws skeletons shaped like the real card — same ring, same padding, same badge
positions — so nothing jumps when data lands. **Failed** is a 30% Alarm border
over a 5% Alarm wash, centered, with an icon and a retry. **Empty** is a
*dashed* rule-colored border, centered, with a muted icon and a single call to
action. Absence is dashed; error is tinted; loading is shaped.

### Signature Component: The Day Tally

Today's second line and the answer to the only question the screen exists to
answer: is the day covered. A full-width row directly beneath the date carrying
a state pill on the left (`All 2 filed`, or `1 of 2 filed` with the posting time
beside it) and the hours against the expected total on the right, in tabular
figures, tinted Attention when they do not agree.

It leads the screen because the date is identity and this is state. The row
itself stays untinted — the state lives in its pills, per The Borrowed Status
Rule — so it never reads as another card in the stack.

### Signature Component: The Wizard Rail

A dot rail rather than a labeled stepper: fixed 1.5rem circles with flexible
0.125rem connectors between them, so the rail fills its container evenly with no
trailing gap. Completed steps show a check, the current step its number, both in
accent; future steps sit in Quiet. Step titles are deliberately absent — on a
phone there is no room, and the count is what the user wants.

## Do's and Don'ts

### Do:

- **Do** use the single radius (0.75rem) by any tier name — they are identical —
  and reach for `rounded-full` only for genuine pills, dots, and avatars.
- **Do** delineate cards with `ring-1 ring-foreground/10` and keep them flat.
- **Do** spend Ledger Blue on exactly one element per surface, per The One Signal
  Rule.
- **Do** put `tabular-nums` on every hour figure and `font-mono` on every ticket
  or board key.
- **Do** render posted or postable message text at prose size (0.9375rem /
  1.625), per The Verbatim Rule.
- **Do** spell out every status in words inside its pill, and ship a light/dark
  pair for any borrowed status hue.
- **Do** drive validity styling from `aria-invalid`, and focus styling from
  `:focus-visible` with the 3px accent ring.
- **Do** override to a 44px target where a control is a real mobile tap target,
  using `h-11 md:h-8`, and leave a comment saying why.
- **Do** build new composites as compound components (`Thing.Root`,
  `Thing.Heading`) assembled at the route, never as a props-configured wrapper.
- **Do** open every screen with `PageHeader`, and keep records 1.5rem apart
  against 0.75rem within, per The Grouping Gap Rule.
- **Do** shape loading skeletons like the card they replace.

### Don't:

- **Don't** put a shadow on a resting surface. Shadow belongs only to dismissible
  overlays.
- **Don't** use `border` where a `ring` belongs — a card border shifts layout.
- **Don't** hardcode a radius or write an arbitrary `rounded-[…]` unless it is
  built from `var(--radius)` or `var(--radius-chrome)`. Lint will fail the build.
- **Don't** name `rounded-2xl`, `rounded-3xl`, or `rounded-4xl` even though they
  resolve correctly — the rule bans the names to keep intent honest.
- **Don't** make a destructive control a solid red fill; it is a 10% tint with
  Alarm text.
- **Don't** express a hover state as a lower opacity on a filled control — it
  lightens the fill and costs label contrast. Mix toward `--foreground` instead.
- **Don't** give a light-mode accent fill a dark label, or a dark-mode accent
  fill a white one. The label inverts between modes by measurement.
- **Don't** promote emerald, amber, or violet beyond a status pill, or use one as
  a surface, body text, or second brand color.
- **Don't** convey state by color alone.
- **Don't** "fix" the `text-base md:text-sm` input sizing — the larger mobile
  size prevents iOS zoom on focus.
- **Don't** inflate the button scale past 36px to solve a touch target; override
  the single instance instead.
- **Don't** introduce side-by-side card grids, or put primary work in a second
  column. An aside carrying state or history is the only exception.
- **Don't** cap a page's width in `AppShell.Content`; reach for `PageLayout` so
  the measure stays the page's own decision.
- **Don't** hand-roll a page heading, and don't put an eyebrow or kicker above
  one — that information belongs in the description.
- **Don't** add anything to the phone header without a desktop rail counterpart;
  the header is `md:hidden` and whatever sits there alone disappears.
- **Don't** add a gradient, illustration, decorative shadow, or ornamental
  flourish. Nothing in this system is decorative.
- **Don't** revive `--chart-1` through `--chart-5`, the eight `--sidebar-*`
  tokens, or `--font-serif`. All fourteen are unreferenced leftovers from a
  theme generator; treat them as debt to delete, not as system tokens. If the app
  ever needs charts or a serif, that is a new decision made deliberately.
