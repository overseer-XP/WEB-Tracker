# Migration report

## Counts

| Source | Rows in Excel | Documents | Note |
| --- | --- | --- | --- |
| Lists | 107 | 1 | All dropdowns in one config document |
| Brand Tracker | 20 | 22 | 2 new brands added |
| Master Project Flow (tasks) | 168 | 168 | Rows with a task name |
| Valerie sheet (tasks) | 3 | 3 | Valerie (Internal) |
| Completed tasks | 8 | 8 | No brand yet |
| Platform Access | 6 | 6 |  |
| SOW Tracker | 19 | 21 | Plus rows for brands that had none |
| SOW + GF Tracker | 14 | 14 | Merged into SOW rows |
| BP Tracker | 10 | 10 | Blank sections stored as Not Started (same result in every formula) |
| WIP Alt Master status tracker | 61 | 61 | Gates and optional steps are proposals |
| Lists > Team | 25 | 37 | 12 more names found in the data |

| Collection | Documents |
| --- | --- |
| access | 6 |
| bps | 10 |
| brand_steps | 22 |
| brands | 22 |
| config | 2 |
| sow | 21 |
| steps | 61 |
| tasks | 179 |

## Changed, merged or dropped

| Sheet | Row | What | Why |
| --- | --- | --- | --- |
| decisions.json | - | Added brand Wipes Well | Has a target sign date in the 8 Oct SOW update. Other fields left blank to fill later |
| decisions.json | - | Added brand PopCornaa | Has a target sign date in the 8 Oct SOW update. Other fields left blank to fill later |
| decisions.json | - | Lona Beauty: set {'paused': True} | Product owner decision |
| decisions.json | - | Ponlu: set {'restricted': True} | Product owner decision |
| Master Project Flow | 5 | Brand 'Bespoke*' matched to 'Bespoke' | Alias table |
| Master Project Flow | 6 | 'Site updates': unlabelled column S added to notes | No header on column S |
| Master Project Flow | 11 | 'Six-Month Content Cadence': deadline 'TBC' cleared | Not a date |
| Master Project Flow | 63 | 'Confirm deposit and payment timeline': owner 'TBC (Finance/Ops)' moved to notes | Not a person |
| Master Project Flow | 64 | Brand 'Seoul Tonic*' matched to 'Seoul Tonic' | Alias table |
| Master Project Flow | 66 | 'Complete SOW': unlabelled column S added to notes | No header on column S |
| Master Project Flow | 66 | 'Complete SOW': start 'N/A' cleared | Not a date |
| Master Project Flow | 67 | 'Brand Book': text 'Sept' in a link column moved to notes | Not a link |
| Master Project Flow | 73 | 'Creative Workshop': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 74 | 'Creative Kick Off': no status, set Not Started | Blank |
| Master Project Flow | 75 | 'Growth Assessment': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 78 | 'Sprint Growth Plan': no status, set Not Started | Blank |
| Master Project Flow | 80 | 'Go To Market - (GTM) Deck': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 81 | 'GTM Share Call with Founder': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 82 | 'Cash flow conversation': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 85 | Brand 'Foulplay* (slightly deprioritized until strategy is redone)' matched to 'Foulplay' | Alias table |
| Master Project Flow | 85 | 'Complete / REDO SOW': start 'N/A' cleared | Not a date |
| Master Project Flow | 93 | 'Founder Sync': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 94 | 'Creative Workshop': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 95 | 'Growth Assessment  Document': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 96 | 'COE Briefing Document': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 98 | 'Cash flow & capital workshop': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 99 | 'Creative Discovery + Growth Workshop': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 103 | 'Creative Kick Off': no status, set Not Started | Blank |
| Master Project Flow | 103 | 'Creative Kick Off': start '30TH' cleared | Not a date |
| Master Project Flow | 108 | 'Complete BPs': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 109 | 'Go To Market - (GTM) Deck': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 110 | 'cash flow conversation': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 122 | Brand 'MugWipes*' matched to 'MugWipes' | Alias table |
| Master Project Flow | 122 | 'Growth Assessment + COE Briefing draft': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 125 | 'Go To Market - (GTM) Deck': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 132 | 'Go To Market - (GTM) Deck': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 132 | 'Go To Market - (GTM) Deck': start '4-/50%' cleared | Not a date |
| Master Project Flow | 133 | 'GTM Share Call w/ Founder': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 134 | 'Cashflow + capital workshop': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 140 | 'GF': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 144 | 'Founders Sync': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 146 | 'Go To Market - (GTM) Deck': no status, set Not Started | Blank |
| Master Project Flow | 148 | 'Growth Forecast': no status, set Not Started | Blank |
| Master Project Flow | 149 | Row has data but no task name | Skipped. Details: Define leaders/project team |
| Master Project Flow | 154 | 'Creative Discovery + Growth': priority 'Complete :)' cleared | Not a priority value |
| Master Project Flow | 157 | Brand 'Lona Beauty - ON PAUSE' matched to 'Lona Beauty' | Alias table |
| Master Project Flow | 137 | Ponlu 'Creative Workshop': note replaced | Sensitive detail. Replaced with the wording already used in the COE tracker |
| Completed tasks | 4 | 'Complete Q4 Marketing Plan': no brand | Shown under Settings > Needs a brand |
| Completed tasks | 5 | 'Complete BPs': no brand | Shown under Settings > Needs a brand |
| Completed tasks | 6 | 'Complete Enablement Briefs': no brand | Shown under Settings > Needs a brand |
| Completed tasks | 7 | 'Complete SOW': no brand | Shown under Settings > Needs a brand |
| Completed tasks | 8 | 'Complete BPs + EBs': no brand | Shown under Settings > Needs a brand |
| Completed tasks | 9 | 'Complete Enablement Briefs': no brand | Shown under Settings > Needs a brand |
| Completed tasks | 10 | 'Present GTM': deadline 'ASAP' cleared | Not a date |
| Completed tasks | 10 | 'Present GTM': no brand | Shown under Settings > Needs a brand |
| Completed tasks | 11 | 'Commence Q4 Marketing Plan': no brand | Shown under Settings > Needs a brand |
| Platform Access | 4 | IDEO Amazon Seller Central: no Valerie owner | Kept. Owner to be added |
| Platform Access | 6 | MugWipes Amazon Seller Central: no Valerie owner | Kept. Owner to be added |
| Platform Access | 7 | MUMUK Paid Media (TBC): no Valerie owner | Kept. Owner to be added |
| SOW Tracker | - | Wipes Well: SOW row created | Brand had no SOW row |
| SOW Tracker | - | PopCornaa: SOW row created | Brand had no SOW row |
| SOW + GF Tracker | 4 | Brand 'Foul  Play' matched to 'Foulplay' | Alias table |
| SOW + GF Tracker | 5 | Brand 'IDEO Skincare' matched to 'IDEO' | Alias table |
| SOW + GF Tracker | 6 | Brand 'Mumuk' matched to 'MUMUK' | Alias table |
| SOW + GF Tracker | 7 | Brand 'Mugwipes' matched to 'MugWipes' | Alias table |
| SOW + GF Tracker | 18 | Brand 'Daisy Face' matched to 'Daisyface Skincare' | Alias table |
| 8 Oct SOW update | - | Bespoke: target_sign '' to '2026-10-09', stage 'Signed' to 'Revisions', blocker '' to 'Amendments still needed. Ben and Talia to confirm what they are.', next_step 'Next steps TBC' to 'Confirm amendments, update and recirculate. Confirm credit card for the ad campaign and deposit for the content shoot before the weekly call. Other agreements close this week.' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | Seoul Tonic: target_sign '2026-10-02' to '2026-10-09', stage 'Drafting' to 'Revisions', blocker 'Ben to update Commercial and Partnerships sections after call Wed 30 Sep.' to 'Sophie sent questions. Ben to confirm position.', next_step 'Close out w/c 28 Sep.' to 'Update the Partnership section once Ben confirms the position with Sophie.' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | KNDZ: target_sign '' to '2026-10-16', next_step 'Cat shared in Teams channel. Nalini to archive it correctly.' to 'SOW set up and shared in the KNDZ channel. Noopur books Finance + Capital workshop this week. Ben calls the founder.' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | Fourth Youth: target_sign '' to '2026-10-16', stage 'Not Started' to 'Drafting', next_step '' to 'SOW to be set up and shared. Noopur books Finance + Capital workshop this week. Ben calls the founder.' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | IDEO: target_sign '' to '2026-10-16', stage 'Template Pending' to 'Internal Review', blocker 'Awaiting updated SOW template from Cat.' to '', next_step 'Check in with Cyrus w/c 28 Sep.' to 'Insert Partnership Alignment section. Revise Growth Forecast. Ben calls the founder.' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | MUMUK: target_sign '' to '2026-10-16', stage 'Drafting' to 'Internal Review', next_step '40 to 50% done.' to 'Insert Partnership Alignment section. Revise Growth Forecast. Ben calls the founder.' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | MugWipes: target_sign '' to '2026-10-16', stage 'Drafting' to 'Internal Review', blocker 'Awaiting updated SOW template from Cat.' to '', next_step 'Confirm current status.' to 'Insert Partnership Alignment section. Revise Growth Forecast. Ben calls the founder.' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | Foulplay: old SOW link removed | Restarting with a new document. Old link pointed to another brand's site |
| 8 Oct SOW update | - | Foulplay: target_sign '' to '2026-10-23', stage 'Final Review (Ben)' to 'Not Started', blocker 'Ben leading market expansion and new strategy conversation (28 Sep).' to 'Waiting on a call with Ryan to confirm the new market focus.', next_step 'Noopur to schedule call with Ben and Ryan to finalise market conversation.' to 'Restart with a new document: Growth Assessment, GTM, refreshed BPs, Thinking Alignment, Growth Forecast and Partnership section.' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | Setosa Skincare: target_sign '' to '2026-10-23', next_step 'TBC' to 'SOW to be set up and shared. Noopur books Finance + Capital workshop next week.' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | Sourced Food Co.: target_sign '' to '2026-10-23', next_step '' to 'SOW to be set up and shared. Noopur books Finance + Capital workshop next week.' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | MPG Gummies: target_sign '' to '2026-10-23', next_step '' to 'Creative workshop this week.' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | Eco Protein: target_sign '' to '2026-10-23', next_step 'TBC' to 'Creative workshop this week.' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | Tiny Wins: target_sign '' to '2026-10-23', next_step '' to 'Creative workshop this week.' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | Ponlu: target_sign '' to '2026-10-28' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | Daisyface Skincare: target_sign '' to '2026-10-28' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | ORA: target_sign '' to '2026-10-28' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | CELF: target_sign '' to '2026-11-05' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | Wipes Well: target_sign '' to '2026-11-05' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | PopCornaa: target_sign '' to '2026-11-05' | Newest SOW status from the product owner |
| 8 Oct SOW update | - | Lona Beauty: next_step '' to 'Target sign date TBC.' | Newest SOW status from the product owner |
| Onboarding Checklist | - | No progress to carry | Excel checklist and the claude.ai board checklist are both empty. Every brand starts at 0% |
| People | - | 'Ash' added as unconfirmed | Used in the data but not in the Lists sheet |
| People | - | 'Ash Ghorab' added as unconfirmed | Used in the data but not in the Lists sheet |
| People | - | 'Caitie' added as unconfirmed | Used in the data but not in the Lists sheet |
| People | - | 'Content Team' added as unconfirmed | Used in the data but not in the Lists sheet |
| People | - | 'Creative' added as unconfirmed | Used in the data but not in the Lists sheet |
| People | - | 'Design' added as unconfirmed | Used in the data but not in the Lists sheet |
| People | - | 'Katherine' added as unconfirmed | Used in the data but not in the Lists sheet |
| People | - | 'Pippa' added as unconfirmed | Used in the data but not in the Lists sheet |
| People | - | 'Sarah' added as unconfirmed | Used in the data but not in the Lists sheet |
| People | - | 'Shreyaa' added as unconfirmed | Used in the data but not in the Lists sheet |
| People | - | 'UGC' added as unconfirmed | Used in the data but not in the Lists sheet |
| People | - | 'Vignesh MK' added as unconfirmed | Used in the data but not in the Lists sheet |
