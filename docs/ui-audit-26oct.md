# UI/UX audit against the UI UX Pro Max skill, 26 Oct 2026

Checked with `tests/ui_audit.js` (13 screens x light/dark x desktop 1440/phone 375) plus a manual pass on the rules a browser cannot measure. Rule names are the skill's own. Counts are distinct element types, not every repeat.

## Critical and high

| # | Rule (skill) | Finding | Where | Suggested fix |
|---|---|---|---|---|
| 1 | color-contrast | Faint grey text is 2.7:1 on white (needs 4.5:1). Used for dates, owners, hints, "of 6 done" | Every page | Darken the faint token to about 4.6:1 |
| 2 | color-contrast | Near misses at 4.2 to 4.4:1: menu counts, table headers, pills, tags, card badges, active menu item | Every page | Darken muted text and the pill/tag text colours slightly |
| 3 | color-contrast | Left menu section headings ("LIVE", "SOW") 2.3:1 at 11px | Left menu | Darker colour, 12px |
| 4 | color-contrast | Avatar initials white on light purple, 2.3:1 | Cards | Darker avatar fills |
| 5 | color-contrast (dark) | Brand name in the slim bar uses the brand colour on dark: 1.3:1 | Campaign page, dark | Use normal text colour in dark |
| 6 | dragging-alternative (WCAG 2.2 AA) | Moving a card to another list is drag-only | Campaign board | Add a "List" picker on the card back |
| 7 | form-labels | Card back fields have visible labels that are not tied to their inputs (screen readers read them unlabelled) | Every edit panel | Link each label to its field |
| 8 | web-target-size (WCAG 2.2 AA, 24px) | SOW board squares 22px high, status pickers 22px, Settings checkboxes 13px, sort and fold buttons under 20px | SOW tracker, Settings, Overview, My tasks | Raise to at least 24px |
| 9 | deep-linking, back-behavior | A campaign has no link of its own; the browser Back button leaves the brand instead of going back to the campaign list | Campaign pages | Put the campaign in the address (#brand-bespoke/plumpicity-launch) |
| 10 | readable-font-size, touch-target-size | On phones, inputs are 14px (iPhone zooms in on focus) and menu items, buttons and pickers are 26 to 32px tall (skill asks 44) | Phone | 16px inputs and 40 to 44px controls at phone width only |

## Medium and low

| # | Rule (skill) | Finding | Suggested fix |
|---|---|---|---|
| 11 | readable-font-size | Text under 12px: tags 11px, card badges 11.5px, avatars 10px, timeline dates 11.5px, tile labels 11.5px | 12px minimum |
| 12 | heading-hierarchy | H4 straight after H2 on Overview (signing plan) and Leadership (launch calendar) | Use H3 |
| 13 | truncation-strategy | On phones some cut-off text has no way to see it in full: tile labels, timeline task names | Add the full text as a tooltip, or wrap |
| 14 | skip-links, focus-on-route-change | No "skip to content" link; focus stays put when the page changes | Add a skip link; move focus to the page title on change |
| 15 | line-height | Body line height 1.45 (skill: 1.5 to 1.75) | 1.5 |

## Passed

| Rule | Result |
|---|---|
| no-emoji-icons | No emoji used as icons |
| horizontal-scroll | No sideways scroll at 375 or 1440 (also in tests/audit.js) |
| reduced-motion | Respected |
| focus-states | Visible focus rings |
| color-not-only | Health and status always have a word next to the colour |
| confirmation-dialogs | Every delete asks first |
| toast-accessibility | Toast is a polite status region |
| nav-state-active, breadcrumb-web | Current page highlighted; path shown inside campaigns |
| dark-mode-pairing | Light and dark designed together (except finding 5) |
| number-tabular | Tabular figures throughout |

## Not checked

Screen reader reading order with a real screen reader, landscape phone, largest system text size. These need a person on a device.
