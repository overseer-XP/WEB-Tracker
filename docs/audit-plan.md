# VALFLO full audit plan

Scope agreed with the user: full depth, nothing trimmed. Findings first; no fixes without approval (mock-ups before any visible change).

## Lenses
New team member (day one), Head of Product, Head of Design, Head of Business Operations.

## Areas
| # | Area | What is checked | Output |
|---|---|---|---|
| 1 | New person walk-through | Sign-in to every page, each role (admin, member, view only, leadership, founder view). On every screen: what is this, what do I do, why is it here | Confusion list, ranked |
| 2 | Features and functions | Every feature questioned: used, needed, right place, simpler way | Keep, merge, move or remove per feature |
| 3 | Connections and automations | Sign-in, Supabase, claude.ai data, Vercel, auto-tick steps, auto-pin, change log, exports | Works, fragile, missing |
| 4 | Look and feel | Fonts, sizes, buttons, text, shadows, cards, spacing, colour, light and dark | Consistency report with before and after |
| 5 | Scale | 100 brands, 100 tasks per person, 1,000 change log rows: load time, search, filters, pagers, clutter | Timings and break points |
| 6 | Code | Dead code, stacked patches, duplicate styles, render speed, file size | Streamlined code, no visible change unless approved |
| 7 | Outside research | Linear, Asana, Monday, Notion, ClickUp, HubSpot and others | Better solutions per finding |
| 8 | Jobs per role | Each role gets its answer in under 10 seconds | Gaps per role |
| 9 | Usage | Which pages and buttons are used | Cut list candidates |
| 10 | Single source of truth | Same fact shown in several places can disagree | Conflicts list |
| 11 | Empty, error, first-run states | New brand, empty list, failed save | State gaps |
| 12 | Notifications and nudges | Blocked, late, mentioned without opening VALFLO | Proposal |
| 13 | Roadmap fit | On-hold items ranked by what they unblock | Order |
| 14 | Success metrics | LOI to SOW days, tasks with owner and date, late SOWs per week | Metric set |
| 15 | Design system inventory | Colours, type, spacing, radius, shadow, components | One token list |
| 16 | Information architecture | Sidebar order, page names vs team language | Proposed structure |
| 17 | Wording | Labels, buttons, helper text, verbs | Word list fixes |
| 18 | Visual hierarchy | One primary action and focus per page | Per page notes |
| 19 | Density | Comfortable vs compact for scale | Proposal |
| 20 | Dark mode parity | Every page in dark | Fix list |
| 21 | Mobile and tablet | Which pages must work on phone | Must, should, desktop only |
| 22 | Accessibility | Keyboard-only run, screen reader, colour-blind safe statuses | Fix list |
| 23 | Feedback and motion | Saving, saved, error, undo for every action | Gaps |
| 24 | Process fit | Real LOI to SOW to handoff to live flow vs VALFLO; where people still use WhatsApp or sheets | Gaps |
| 25 | Ownership | One owner, approver, backup per step; orphan steps | RACI gaps |
| 26 | Handoffs | Onboarding to live, team to team | Loss points |
| 27 | Data quality | Missing dates, owners, founders, time zones, sign-ins, duplicates | Clean-up list (change list before any write) |
| 28 | Security and access | Founder data, restricted notes, sign-in list, leavers, audit trail | Risks |
| 29 | Backup and recovery | Restore path, backup frequency | Runbook |
| 30 | Reliability | Failed saves, two editors at once, claude.ai vs website drift | Risks and fixes |
| 31 | Reporting | Weekly leadership view, exports, founder vs team view | Gaps |
| 32 | Cost and running | Vercel, Supabase, claude.ai limits at 100 brands; who maintains | Cost and maintenance note |
| 33 | Change management | New joiner guide, what's new notes, training | Pack outline |
| 34 | Time on task | 10 common jobs timed and click-counted | Before scores |
| 35 | Risk register | Top 10 ways VALFLO could break or lose data | Register |

## Deliverables
1. Audit report as a shareable page: findings by lens, ranked by impact and effort, with screenshots.
2. Quick wins (ship in a week, no design change).
3. Bigger bets (mock-ups and approval first).
4. Scorecard 1 to 5 per area, re-scored after fixes.

## Rules that still apply
No passwords, tokens, contract text or valuations stored. Founder access sheet login, password and ID columns never read. Ponlu legal notes restricted. Bank and tax details never in VALFLO. Trello cards unchanged. No coloured left edges. Overview unchanged unless approved. No hard-coded brands, people, steps or list values. Never push to main.

## Open before the audit
- Fixes 1 and 2 (readable dark-mode tags, 11px to 12px): mock-up sent, waiting for approval.
- Org structure table headings do not line up with the rows: found, waiting for approval.
