# Stage 0 report: file inventory, formulas, step mapping, problems, questions

Date: 8 Oct 2026. Status: waiting for approval. No app code written.

## 1. Files received

| Brief name | File received | Found |
| --- | --- | --- |
| COE_Project_Tracker.xlsx | Valerie_COE_Project_Tracker_10.xlsx | Yes |
| Project_Task_Management.xlsx | Valerie_Brands_-_Project__Task_Management_5.xlsx | Yes |
| Current_Web_App.html | Valerie_COE_Tracker_1.html | Yes |

Files were uploaded to the session, not placed in `/data`. Names differ from the brief. Content matches the brief.

## 2. Inventory: COE tracker (29 sheets, brief says 30)

| Sheet | Data rows | Columns | Notes |
| --- | --- | --- | --- |
| How To Use | 18 lines | Tab, What it is, Who updates; Rule, How it works | Source of plain-English rules |
| Brand Tracker | 20 brands | Brand, Founder, Website, Stage, Brand Lead, Open Tasks, Blocked Tasks, Overdue Tasks, Platform Access, Access Granted, SOW Stage, SOW Owner, SOW Target Sign, BPs, BP Progress, Onboarding %, Health, Next Step | 12 formula columns. Brand Lead is blank for all 20 brands |
| 20 brand tabs | 98 tasks in total | Task / Deliverable, Owner, Support Team, Status, Priority, Start Date, Deadline, Due Flag, Notes / Next Step, Brief Link, Creative Link | Due Flag is a formula. Brief Link holds the text "Brief" with the real URL behind it (4 rows) |
| Brand Template | 0 | same as brand tabs | Skip |
| Platform Access | 6 | Brand, Platform, Access Level, Needed For, Valerie Owner, Brand Contact, Requested Date, Deadline, Status, Days Waiting, Due Flag, Blocker, Notes | 2 formula columns |
| SOW Tracker | 19 | Brand, SOW Owner, Support Team, SOW Stage, Start Date, Draft Due, Target Sign Date, Due Flag, Blocker / Dependency, Next Step, SOW Link | No row for Valerie (Internal). SOW Link empty in every row |
| BP Tracker | 10 brands | Brand, BP Owner, Due Date, Due Flag, 9 sections, Progress, Overall, Blocker, BP Doc Link, Notes | 90 section cells, 28 filled |
| Onboarding Checklist | 36 steps x 20 brands | Phase, Step, one column per brand | **Every brand cell is empty. 0% for all brands** |
| Completed Archive | 8 | Brand, Task / Deliverable, Owner, Support Team, Start Date, Deadline, Notes | Brand blank on every row |
| Lists | 11 lists | see section 3 | Team list has 25 names |

Tasks per brand: Bespoke 10, Foulplay 3, Seoul Tonic 8, IDEO 6, MugWipes 5, MUMUK 7, Fourth Youth 9, KNDZ 10, Sourced Food Co. 7, Eco Protein 4, MPG Gummies 5, Ponlu 3, Setosa Skincare 5, Lona Beauty 4, CELF 3, Tiny Wins 3, Daisyface Skincare 1, ORA 1, Imperial Sports 1, Valerie (Internal) 3. Total 98.

Task status counts: Pending 41, In Progress 22, Complete 21, Blocked 9, Briefed 5. Not Started and On Hold are unused. 13 tasks have no owner.

## 3. Lists sheet (load exactly)

| List | Values |
| --- | --- |
| Task Status | Not Started, Pending, Briefed, In Progress, Blocked, On Hold, Complete |
| Priority | Urgent, High, Medium, Low |
| Stage | Qualification, Setup, Founder Workshops, Best Practices + Briefs, SOW, Live, On Hold, Internal |
| Team (25) | Anthony, Apoorva, Ashna, Ashraf, Ben, Cat, Catherine, Cyrus, Gonika, Johnny, Marcus, Nalini, Noopur, Paras, Pradnya, Robin, Sairaj, Sharna, Shivani, Soham, Swaraj, Talia, Tanish, Vignesh, Yurawati |
| Platform (21) | Meta Business Manager, Meta Ads Manager, Instagram, Facebook Page, TikTok Ads, TikTok Shop, Amazon Seller Central, Amazon Ads, Google Ads, GA4, Google Tag Manager, Google Search Console, Google Merchant Center, Shopify, Website CMS, Klaviyo, Pinterest Ads, Snapchat Ads, Paid Media (TBC), All Platforms (TBC), Other |
| Access Level | Admin, Editor / Advertiser, Analyst / View Only, Partner Access, TBC |
| Access Status | Not Requested, Requested, In Progress, Granted, Blocked, Not Needed |
| SOW Stage | Not Started, Template Pending, Drafting, Internal Review, Final Review (Ben), Founder Check-in, Revisions, Sent for Signature, Signed, On Hold, Blocked |
| Checklist | Not Started, In Progress, Done, N/A |
| BP Section | Influencer, UGC, Affiliates, Brand Partnerships, Ambassadors, Paid Media, Amazon, Website / CRO, Email / CRM |
| BP Status | Not Started, Foundations, Tactics In, In QA, Complete, Blocked, N/A |

All match section 4.2 of the brief.

## 4. Inventory: Project Task Management (7 sheets)

| Sheet | Rows | What it is | Use |
| --- | --- | --- | --- |
| WIP Alt Master status tracker | 61 steps, 7 phases | Step list template. No brand data, no owners, no gates marked | Master step list |
| SOW + GF Tracker | 14 brands | Batch, SOW link, GF link, Updated GF?, plus mostly empty owner/status columns | Add gf_link, gf_updated, batch to `sow` |
| Master Project Flow | 167 task rows, 19 brands, plus 2 brands with no tasks | Per-brand tasks with sprint label | See problem P1. It is newer than the COE tabs in places |
| Commercial check list | 2 steps | Short early copy of Ben's notes | Reference only |
| Notes from Ben via Robin | 26 lines | SOW and BP guidance | Read-only reference notes |
| Valerie | 3 tasks | Exact copy of the Valerie (Internal) tab | Skip, duplicate |
| Completed tasks | 8 tasks | Exact copy of Completed Archive (brand column says "COMPLETE") | Skip, duplicate |

Sprint labels from Master Project Flow: Seoul Tonic and Foulplay Sprint 1; IDEO, MugWipes, MUMUK Sprint 2; KNDZ, Fourth Youth, Sourced Food Co. Sprint 3; Eco Protein, MPG Gummies, Ponlu, Setosa, Lona Beauty Sprint 4; CELF, Tiny Wins Sprint 5; Daisyface, ORA, Imperial Sports Pipeline; Bespoke "TBC"; Valerie (Internal) none.

## 5. Inventory: current web app

| Item | Finding |
| --- | --- |
| Storage | **Not Firebase.** It uses the claude.ai artifact database (`claude.use("db")`), collections brands, tasks, access, sow, checklist, config, bps |
| Screens | Overview (pipeline + table), My tasks, Brand (Tasks, Platform access, SOW, Onboarding checklist), Platform access, SOW tracker, BP tracker, Team + lists |
| Look | Cream background #FAF6EE, Onest font, left sidebar grouped by stage (newest first), health dots, pill colours |
| Step list | Same 36 steps as the Excel checklist. Optional: q5, s5, w2, w5. Gates: q6, b5, o2, o4. Doc link per doc step |
| Gate rule | **Not enforced.** Gates are only shaded red. Nothing stops a gate being Done early |
| My tasks | You type your name. Matches owner or support team by text. No login |
| Roles | View only or edit, from claude.ai permissions. No restricted brands |
| Missing vs Excel | No Creative Link on tasks. Internal brands show SOW "N/A" |

## 6. Formula list in plain English (from the Excel, checked against the brief)

| Value | Excel rule | Matches brief? |
| --- | --- | --- |
| Task due flag | Blank if no task title, status Complete, or deadline not a real date. Overdue if deadline before today. Due Soon if 0 to 3 days away. Else On Time | Yes |
| SOW due flag | Blank if Signed. Uses Target Sign Date. **If blank, falls back to Draft Due.** Same Overdue / Due Soon / On Time | Brief does not say which date. Add the fallback |
| BP due flag | Blank if Progress is 100% or no due date. Same thresholds | Yes, in effect |
| Platform access due flag | Blank if Granted, Not Needed or no deadline. Same thresholds | Not in brief. Add it |
| Days waiting | Today minus Requested Date. Blank if Granted, Not Needed or no date | Yes |
| Platform Access summary | Not Set Up if no rows except Not Needed. Blocked if any Blocked. All Granted if every counted row Granted. Else In Progress | Yes |
| Access Granted | "granted / counted". Blank if nothing counted | Yes |
| Open tasks | Title not blank and status not Complete (blank status counts as open) | Yes |
| Blocked tasks | Title not blank and status Blocked | Yes |
| Overdue tasks | Due flag Overdue | Yes |
| SOW Stage on brand | Blank stage shows "Not Set". No SOW row shows "No SOW Row" | Not in brief |
| BP progress | Complete / (9 minus N/A). 0 on error | Yes |
| BP overall | Blocked, then Complete, then Not Started, then In QA, else In Progress | Yes. Edge case: all 9 N/A gives Complete |
| Onboarding % | Done / (36 minus N/A). Optional steps count in the total. Not rounded | **App disagrees**: app leaves untouched optional steps out and rounds |
| Health | Blocked if blocked task, access Blocked, SOW Blocked or BP Blocked. At Risk if overdue task. Live if SOW Signed. Else On Track | Yes. Note: How To Use text leaves out "BP Blocked", the formula has it |
| Labels | Excel: "Due Soon", "On Time", "At Risk", "On Track", "Not Set Up", "All Granted" | App uses lower case. I will use the Excel spelling |

Cached Excel values were calculated on 29 Sep 2026 (from `TODAY()`), so live numbers today will differ. The side-by-side check in Stage 3 will recalc both on the same date.

## 7. Step mapping: old 36 to new 61

New codes are mine: phase code plus row order in the WIP Alt sheet.

### 7.1 New step list (61)

| Phase | Steps |
| --- | --- |
| 1A Qualification (10) | 1A.01 Founder intro call 1; 1A.02 Founder intro call 2; 1A.03 Founder intro call 3 (optional); 1A.04 LOI shared; 1A.05 LOI signed + filed in Agreements (sheet says "becomes substep of row 9"); 1A.06 Brand kickoff call with founder; 1A.07 Mutual NDA shared; 1A.08 Prefill + send Founder Sync; 1A.09 Send Financial Snapshot; 1A.10 Send Platform Access |
| 1B SOW Internal Setup (9) | 1B.01 Create Brand Channel, invite leadership; 1B.02 Set up Monday.com board; 1B.03 Set up SharePoint folders; 1B.04 Mutual NDA signed + filed; 1B.05 Share completed Founder Sync; 1B.06 Share completed Financial Snapshot; 1B.07 Founder call: technical access sync; 1B.08 Share completed Platform Access; 1B.09 FYI email to Marcus |
| 1C Start SOW Process (5) | 1C.01 Add contributors to Brand Channel; 1C.02 Announce in COE chat; 1C.03 Announce in Brand Channel; 1C.04 Brand kickoff call with COE; 1C.05 Growth Forecast V1 (Apoorva) |
| 2A Founder Workshops (16) | 2A.01 Schedule Workshop 1A Financial + GF; 2A.02 Schedule Workshop 1B Cashflow + capital; 2A.03 Workshop 1 done, notes filed; 2A.04 Schedule Workshop 2a Creative Discovery; 2A.05 Workshop 2 done, notes filed; 2A.06 Growth Assessment; 2A.07 Share Growth Assessment with founder; 2A.08 GTM deck; 2A.09 Schedule Workshop 2b GTM walkthrough; 2A.10 Workshop 2b done, notes filed; 2A.11 Share GTM deck with founder; 2A.12 Internal alignment; 2A.13 Growth Forecast V2; 2A.14 Schedule Workshop 1c Capital + Valuation; 2A.15 Growth Forecast final; 2A.16 Post-workshop founder check-in |
| 2B SOW Internal Alignment (13) | 2B.01 Brand brief (internal); 2B.02 Schedule internal brand brief call; 2B.03 Internal brand brief call done, notes filed; 2B.04 BP sections drafted (foundations); 2B.05 BP QA review; 2B.06 GTM deck passed to COE (brief call 2); 2B.07 BP sections drafted (tactics); 2B.08 Talent enablement brief; 2B.09 Founder enablement brief; 2B.10 Content enablement brief; 2B.11 Thinking Alignment section; 2B.12 Commercial section; 2B.13 Partnerships section |
| 2C Finalising SOW (6) | 2C.01 SOW draft 1 review (internal); 2C.02 Schedule SOW check-in with founder; 2C.03 Send SOW draft 24h before; 2C.04 SOW check-in done, notes filed; 2C.05 Final SOW; 2C.06 Send SOW for signature |
| 2D SOW Signed (2) | 2D.01 Finance handoff to Marcus; 2D.02 Intro session with Portfolio Lead (handoff) |

Total 61. If 1A.05 becomes a substep, 60. I found no list with 62.

### 7.2 Mapping (proposal, needs your yes)

Strength: S strong, M medium, W weak, none.

| Old | Old step | New step(s) | Fit |
| --- | --- | --- | --- |
| q1 | Lead qualified | none (closest 1A.01) | none |
| q2 | Call 1: Qualification | 1A.01 | S |
| q3 | LOI + NDA sent | 1A.04 + 1A.07 | S |
| q4 | Call 2: Commercials | 1A.02 | M |
| q5 | Call 3: Confidence call (optional) | 1A.03 | S |
| q6 | GATE: LOI signed | 1A.05 | S |
| s1 | Pod + SOW contributors nominated | 1C.01 | M |
| s2 | Monday.com board set up | 1B.02 | S |
| s3 | Teams channel created | 1B.01 | S |
| s4 | Sync docs sent to founder | 1A.08 + 1A.09 + 1A.10 | S |
| s5 | Follow up for inputs (optional) | none | none |
| s6 | Founder completes the sheets | 1B.05 + 1B.06 + 1B.08 | M |
| s7 | Signed announcement | 1C.02 + 1C.03 | M |
| s8 | Workshop booking emails | 2A.01 + 2A.02 + 2A.04 | M |
| s9 | Internal kickoff call | 1C.04 | S |
| w1 | Workshop 1: Financial + Growth | 2A.01 + 2A.03 | S |
| w2 | Workshop 3: Technical Access (optional) | 1B.07 (moves earlier) | S |
| w3 | Workshop 2: Creative Discovery | 2A.04 + 2A.05 | S |
| w4 | Internal creative brainstorm | none (closest 2A.12) | none |
| w5 | Alignment deck (optional) | 2A.08 | M |
| w6 | GF revisited, internal | 2A.13 + 2A.15 | M |
| w7 | Founder creative call #2 | 2A.09 + 2A.10 | M |
| w8 | Valuation + AI Workshop | 2A.14 | M |
| w9 | Post-workshop founder check-in | 2A.16 | S |
| b1 | BP foundations | 2B.04 | S |
| b2 | Internal brand call: full download | 2B.02 + 2B.03 | M |
| b3 | New brief written (GA + COE brief) | 2A.06 + 2B.01 | M |
| b4 | Tactics filled into BP | 2B.07 | S |
| b5 | GATE: BP QA review | 2B.05 (order changes: QA now before tactics) | S |
| b6 | Enablement briefs built | 2B.08 + 2B.09 + 2B.10 | S |
| o1 | SOW assembled | 2B.11 + 2B.12 + 2B.13 | M |
| o2 | GATE: SOW first draft review | 2C.01 | S |
| o3 | SOW check-in with founder | 2C.02 + 2C.04 | S |
| o4 | GATE: SOW signed and sent | 2C.05 + 2C.06 | M |
| o5 | Invoice issued (Marcus) | 2D.01 | M |
| o6 | PM PODs takeover / handoff | 2D.02 | S |

New steps with no old step (start as Not Started): 1A.06, 1B.03, 1B.04, 1B.09, 1C.05, 2A.07, 2A.11, 2A.12, 2B.06, 2C.03.

### 7.3 Progress carry rule (proposal)

| Old status | New status |
| --- | --- |
| Done | Every mapped new step Done |
| N/A | Every mapped new step N/A |
| In Progress | First mapped new step In Progress, the rest Not Started |
| Not Started / blank | Not Started |
| Two old steps on one new step | Take the less advanced status |
| Old step with no match | Kept as a note on the brand, listed in the migration report |

Every carried value records the old step code so it can be traced and reversed.

**The Excel checklist has no ticks.** The only ticked progress, if any, is in the current web app's database. See question Q3.

## 8. Data problems found

| # | Problem | Impact | Proposed handling |
| --- | --- | --- | --- |
| P1 | Master Project Flow is newer than the COE brand tabs in places: 167 vs 98 tasks, Bespoke 59 vs 10, notes dated up to 8 Oct. At least 7 statuses differ (KNDZ GTM share call and cash flow call, IDEO cash flow call, Sourced Food creative discovery, Setosa creative workshop, Ponlu GF are Complete in MPF; Seoul Tonic GF Blocked in MPF) | Loading only COE tabs loses work | Your call, see Q4 |
| P2 | Current app data is in a claude.ai artifact database, not Firebase | Export path differs | I can read it with the artifact tools if you share its link |
| P3 | Excel Onboarding Checklist is empty for all brands | Nothing to carry from Excel | Use app data if it exists |
| P4 | Gate rule is not in the current app | "Keep from web app" is not possible | Build it new. Need the gate list (Q5) |
| P5 | WIP Alt list marks no gates, owners or doc labels; only 1A.03 is marked optional | `steps_master` fields would be empty | Need your list (Q5) |
| P6 | Ponlu has a legal matter in Brand Tracker next step, SOW blocker and 1 task note. MPF has more detail naming a third party | Sensitive | Make Ponlu restricted. Do not migrate the MPF wording. Q7 |
| P7 | Brand Lead blank for all 20 brands | Overview "Owner" column empty | Q10 |
| P8 | Completed Archive: 8 rows, no brand. Guesses: "Complete BPs" and "Complete SOW" look like Seoul Tonic (same dates and team as Seoul Tonic rows) | Needs your mapping | Q8 |
| P9 | Foulplay SOW link in SOW + GF Tracker points to the MugWipes SharePoint site and starts with "NEW " | Wrong link | Load it flagged, Q15 |
| P10 | Links stored behind display text ("Brief", file names) in 4 task rows and 6 GF cells | Text alone has no URL | Read the hyperlink target, not the cell text |
| P11 | Brand names differ across files: "Foul  Play", "IDEO Skincare", "Mumuk", "Mugwipes ", "Daisy Face ", "Bespoke*", "Lona Beauty - ON PAUSE", trailing spaces | Exact match fails | Alias table for your approval, every non-exact match reported |
| P12 | SOW + GF Tracker has no row for Bespoke, Seoul Tonic, Lona Beauty, ORA, Imperial Sports | No GF data for them | Leave blank |
| P13 | People not in Lists: Sarah, Caitie, Katherine (founder), Pippa, Chloe, Bhavana, Shreyaa, Ravi. Group names used as people: COE Team, Design, Creative, UGC, Content Team. Aliases: Noops, Ash, Ash G, Ash Ghorab, Vignesh MK, CAT. "Sharan" in old file vs "Sharna" in Lists | People table needs cleaning | Q9 |
| P14 | Support Team is free text with commas | My tasks matching by text is unreliable | Store as a person list per task |
| P15 | 13 tasks have no owner | Nobody sees them in My tasks | Show in an "No owner" filter for leads |
| P16 | Valerie (Internal) has no SOW row; Excel shows "No SOW Row", app shows "N/A" | Rule gap | Q11 |
| P17 | 3 of 6 platform access rows have no Valerie owner; 2 use placeholder platforms (Paid Media (TBC), All Platforms (TBC)) | Owner-less blockers | Load as is, flag |
| P18 | MPF has two brands not in COE: Wipes Well, PopCornaa (no data). Lona Beauty "ON PAUSE" in MPF but Stage Setup in COE. Foulplay "deprioritised" | Stage and paused flag unclear | Q13, Q14 |
| P19 | MPF priority values "URGENT" and "Complete :)", date cells with "N/A", "ASAP", "30TH", "4-/50%" | Not valid values | Normalise, report each change. Only matters if MPF is loaded |
| P20 | Lists names never used in data: Ben, Marcus, Robin, Sharna, Soham, Talia | None | Load them anyway |
| P21 | This GitHub repo is `overseer-xp/web-tracker`, not a company account | IP ownership | Q2 |

## 9. Open questions

| # | Question | Why it matters |
| --- | --- | --- |
| Q1 | Data region for Supabase? (EU London, EU Frankfurt, Sydney, US East...) | Irreversible. Not defaulting |
| Q2 | Company accounts: which GitHub org, Supabase org, Vercel team and domain? Is this repo the final one? | Valerie must own the IP |
| Q3 | Export the current app's data? If yes, send its claude.ai link and confirm it is newer than the Excel | Only source of checklist ticks and maybe newer edits |
| Q4 | Master Project Flow vs COE tabs: (a) COE tabs only, (b) COE tabs plus tasks only in MPF, (c) MPF wins where newer | 69+ tasks and several statuses at stake |
| Q5 | Which new steps are gates and which are optional? Is 1A.05 a step or a substep? Is the target 61 or 62? Default owner role per step? | Fills `steps_master` and the gate rule |
| Q6 | Approve the mapping in 7.2 and the carry rule in 7.3? What to do with q1, s5, w4 (no match): add to the new list or retire? | Progress must not be lost |
| Q7 | Ponlu: make it restricted? Who can see it? | Sensitive matter |
| Q8 | Brand for each of the 8 Completed Archive rows | Required by step 6 of migration |
| Q9 | People: confirm aliases (Ash / Ash G / Ash Ghorab = Ashraf? Noops = Noopur? Sharan = Sharna? Cat and Catherine two people?). Which names are external (no login)? Email, department and role for each app user | Builds `people` and `users` |
| Q10 | Who is Brand Lead for each brand, or leave blank? | Overview Owner column |
| Q11 | Internal brands: SOW shows N/A (app) or No SOW Row (Excel)? Can internal brands be Live? | Health rule |
| Q12 | Onboarding %: Excel rule (optional steps count) or app rule (untouched optional steps left out)? | Numbers will differ |
| Q13 | Add Wipes Well and PopCornaa as Qualification brands? | Not in COE |
| Q14 | Lona Beauty: set paused = yes? Foulplay paused? | Brand flags |
| Q15 | Correct Foulplay SOW link? | P9 |
| Q16 | Who are the Admin (technical owner) and backup admin, and the Product owner? | Roles at Stage 2 |
| Q17 | Departments for release 1: just COE, or COE plus Finance / Ops / Creative as separate departments? | Department lead permissions |
| Q18 | Email alerts: who gets them, how often (daily digest or instant)? Sender address on your domain? | Stage 6 |

## 11. Update 8 Oct: decisions and new data

### 11.1 Decisions received

| Topic | Decision | Effect |
| --- | --- | --- |
| Source of truth | "Valerie Brands - Project + Task Management" holds the newest data | Tasks load from Master Project Flow (167 rows), not the 20 COE tabs (98). Answers Q4 |
| Claude artifact board | Read on 8 Oct. Same data as the COE Excel, no user edits, empty checklist | Nothing to export. Answers Q3. No old checklist progress exists, so the 36 to 61 mapping is for reference only. No progress can be lost |
| Current board | Not a real web app. Needs visual redesign, process remap and streamlining | See Q19 |
| New brands | Wipes Well and PopCornaa have target dates | Add both. Answers Q13 |

### 11.2 Which file feeds which table (proposal)

| Table | Source | Why |
| --- | --- | --- |
| tasks | Master Project Flow, plus the "Valerie" sheet for Valerie (Internal) | Newest |
| Completed archive | "Completed tasks" sheet (same 8 rows) | Same data |
| brands: name, founder, website, sprint_label | Master Project Flow | Newest |
| brands: stage, next step | COE Brand Tracker, then updated from the SOW list below | Master Project Flow has no stage column |
| platform_access, best_practices | COE tracker | Only source |
| sow: link, GF link, GF updated, batch | SOW + GF Tracker | Only source |
| sow: stage, target sign, next step | 8 Oct SOW update below | Newest |
| steps_master | WIP Alt Master status tracker | Agreed target |

### 11.3 SOW update of 8 Oct (to load at migration)

| Brand | Target sign | Proposed SOW stage | Next steps |
| --- | --- | --- | --- |
| Bespoke | 9 Oct | Revisions (was Signed) | Ben and Talia confirm amendments. Confirm credit card for ad campaign and deposit for content shoot before weekly call. Other agreements close this week |
| Seoul Tonic | 9 Oct | Revisions | Sophie sent questions. Ben confirms position, then Partnership section updated |
| KNDZ | 16 Oct | Drafting | SOW set up in KNDZ channel. Noopur books Finance + Capital workshop this week. Ben calls founder |
| Fourth Youth | 16 Oct | Drafting | SOW set up shortly. Noopur books Finance + Capital workshop this week. Ben calls founder |
| IDEO | 16 Oct | Internal Review | Insert Partnership Alignment section. Revise GF. Ben calls founder |
| MUMUK | 16 Oct | Internal Review | Same as IDEO |
| MugWipes | 16 Oct | Internal Review | Same as IDEO |
| Foulplay | 23 Oct | Not Started (restart) | Call with Ryan on new market focus. New document: Growth Assessment, GTM, BPs, Thinking Alignment, GF, Partnership |
| Setosa Skincare | 23 Oct | Not Started | SOW set up shortly. Noopur books Finance + Capital workshop next week |
| Sourced Food Co. | 23 Oct | Not Started | Same as Setosa |
| MPG Gummies | 23 Oct | Not Started | Creative workshop this week |
| Eco Protein | 23 Oct | Not Started | Creative workshop this week |
| Tiny Wins | 23 Oct | Not Started | Creative workshop this week |
| Ponlu | 28 Oct | Blocked (unchanged) | Confirm the legal matter is cleared |
| Daisyface Skincare | 28 Oct | Not Started | |
| ORA | 28 Oct | Not Started | |
| CELF | 5 Nov | Not Started | |
| Wipes Well (new) | 5 Nov | Not Started | |
| PopCornaa (new) | 5 Nov | Not Started | |
| Lona Beauty | TBC | Not Started | |
| Imperial Sports | not given | Not Started | |

The IDEO, MUMUK and MugWipes SOW links in the update point to the same documents as the SOW + GF Tracker.

### 11.4 New questions

| # | Question |
| --- | --- |
| Q19 | Redesign scope: keep the cream / Onest look and restyle, or start a fresh visual design? I suggest 2 mock screens (My tasks, Brand) on a phone for your yes before Stage 4 |
| Q20 | Process remap: is the 61-step WIP Alt list final, or will the remap change it? The app will hold steps as data, so changes later need no rebuild |
| Q21 | Bespoke goes from Signed to Revisions, so its health drops from Live. Correct? |
| Q22 | Ponlu has a 28 Oct target. Keep the SOW Blocked until the legal matter clears? |
| Q23 | Founders and websites for Wipes Well and PopCornaa? |

## 10. Not done or not verified

| Item | Status |
| --- | --- |
| Current app data | Read on 8 Oct from the claude.ai board. Matches the COE Excel |
| Live (today) values of the Excel formulas | Not recalculated. Only cached values from 29 Sep read |
| Opened the old app in a browser | Not done. It only runs inside claude.ai, so it shows an "open from claude.ai" message elsewhere. Reviewed the code and CSS instead |
| Excel row 5 to 200 blank rows | Checked by script. Only rows with a title or other typed value counted |
