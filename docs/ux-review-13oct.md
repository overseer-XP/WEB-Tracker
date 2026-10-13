# Tracker review, 13 Oct 2026 (version 9)

Self review of the Valerie COE tracker as a UX and operations reviewer. Based on a click-through of every screen and on the live data.

## 1. What was tested

| Check | Result |
|---|---|
| Screens visited (3 "View for" settings x desktop and phone, every brand page) | 114 |
| Buttons and links pressed (`tests/audit.js`) | 754, no script errors |
| Controls checked one by one (board squares, grid +, filters, team cards, phases, editors, forms, theme, View for) | 32 of 32 work |
| Update test (`tests/propagation.test.js`): an edit on one screen shows on every other | 38 of 38 pass |
| Sideways scroll at phone width | None |
| Not tested | Two people editing the same record at the same moment; the real claude.ai sign-in roles (tested with a lead account only) |

## 2. Scorecard

| Area | Score (1 to 5) | Why |
|---|---|---|
| Finding your own work | 4 | My tasks now splits onboarding brands from live brands, sorted by urgency |
| Big picture for leadership | 3 | Pipeline, tiles and signing plan are clear. No trends over time |
| Brand detail for leads | 4 | Team cards, steps, access, SOW and BPs on one page |
| Data you can trust | 2 | Most work has no deadline or owner, so late and due-soon signals miss most of it |
| Speed of updating | 3 | One-click status everywhere, but 53 steps x 23 brands is a lot of ticking |
| Visual clarity | 4 | Calm palette, status shown by colour and words. Board squares rely on colour only |
| Safety | 4 | Version pins, gate rule, blocker needs a reason, change log. Backups are manual |

## 3. Data health (live data)

| Signal | Number | Effect |
|---|---|---|
| Open tasks with no deadline | 109 of 127 | Late and Due soon only see 18 tasks. Health looks better than it is |
| Onboarding steps with an owner or deadline | 0 of 612 | Steps never reach anyone's My tasks. Progress moves but nobody is named |
| Brands with a brand lead | 0 of 23 | No single owner per brand |
| SOWs with an owner | 13 of 22 | 9 SOWs have nobody accountable |
| Access rows with a requested date | 1 of 51 | "Waiting X days" never shows, so slow brands are invisible |
| Open tasks with no owner | 14 | They show on no one's list |
| Tasks late by more than 14 days | 14 | Probably stale, not really late |

## 4. Findings, most important first

| # | Finding | Who it hurts | Recommendation |
|---|---|---|---|
| 1 | Ownership gaps (no brand lead, no step owners, SOW owners missing) | Everyone | Fill brand lead for all 23 brands this week. Give each phase a default owner so new steps land on someone |
| 2 | Deadlines missing on most tasks | Leads, leadership | Make deadline required for High and Urgent tasks. Show "No date" as its own count on the Overview |
| 3 | Three stages that can disagree: brand stage, SOW stage and step ticks (Bespoke is Live, SOW in Revisions, steps 83%) | Leadership | Suggest the brand stage from the steps and flag when they disagree |
| 4 | "Blocked" is too easy to reach: one blocked task turns a brand red (6 of 19 active brands) | Leadership | Split into "Blocked" (SOW or gate step blocked) and "Has blockers" (task level) |
| 5 | Step ticking is heavy (1,219 boxes) | Team | Tick at the board square level by default. Auto-tick a step when its matching task is Complete |
| 6 | Stale data is invisible | Leads | Show "Updated X days ago" per brand and flag brands untouched for 7 days |
| 7 | No view over time | Leadership | Weekly snapshot: SOWs signed, brands moved stage, average days per stage |
| 8 | Nobody is told when something changes | Team | "Since your last visit" panel on My tasks now. Email or Slack digest after the move to a real backend |
| 9 | Board squares are colour only | Colour-blind users | Add a tick, dot or dash inside each square |
| 10 | Access "Not Requested" mixes "not asked yet" with "unknown" | Paid team | Fill the requested date when asking. Add "Needed by" so the grid can sort by urgency |
| 11 | The SOW board column map and the paid platform list are only editable as data | Admins | Add a Settings tab for board columns |
| 12 | Backups depend on someone pressing Export | Admin | Weekly JSON backup reminder on the Settings page until the backend move |

## 5. Suggested plan

| When | Do |
|---|---|
| This week (data, no build) | Set brand leads, SOW owners and deadlines on High and Urgent tasks. Add requested dates on access rows |
| Next build | Findings 3, 4, 6 and 9 (stage mismatch flag, two-level blocked, updated X days ago, symbols in squares) |
| After that | Findings 5, 7, 8 and 11 (lighter ticking, weekly trend, since-last-visit, board settings) |
| With the backend move | Digest notifications, automatic backups, per-person access to restricted brands |
