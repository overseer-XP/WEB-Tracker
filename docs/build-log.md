# Build log

| Date | Stage | What | Why |
| --- | --- | --- | --- |
| 8 Oct 2026 | 0 | Read all 3 files with scripts (sheets, cells, formulas, hyperlinks, dropdowns). Wrote `docs/stage-0-report.md` | Brief requires a full read before any build |
| 8 Oct 2026 | 0 | Found the current app uses the claude.ai artifact database, not Firebase | Changes how its data can be exported |
| 8 Oct 2026 | 0 | Found Master Project Flow holds newer tasks than the COE tabs | Needs a decision before migration |
| 8 Oct 2026 | 0 | No app code written. Waiting on Stage 0 approval | Gate |
| 8 Oct 2026 | 0 | Read the claude.ai board database (brands, tasks, sow, access, bps, config, checklist). Same as COE Excel, checklist empty | Answer Q3 |
| 8 Oct 2026 | 0 | Recorded source-of-truth decision and the 8 Oct SOW target dates in the report, section 10 | User update |
| 8 Oct 2026 | 1 | Decision: build without Supabase for now, as a claude.ai page with a shared database. Desktop first. 61 steps | Product owner |
| 8 Oct 2026 | 1 | Wrote `migration/build_seed.py`. Tasks from Master Project Flow (168) + Valerie sheet (3) + Completed tasks (8). 323 records, 100 logged changes | Newest data |
| 8 Oct 2026 | 1 | Built `app/index.html`: My tasks, Overview with SOW signing plan, Brand page (tasks, 61 steps with gates, access, SOW, BPs), SOW, Platform access, Best Practices, Settings (people, lists, step list, needs a brand, change log, Excel and JSON export) | Brief section 7 |
| 8 Oct 2026 | 1 | Published new page, seeded 323 records. Old board left untouched | |
| 8 Oct 2026 | 1 | Browser test with migrated data: all 8 screens render, gate rule refuses 1A.05 with 3 open steps, one-tap status writes a change log entry, Blocked asks for a line and a person, 380 px has no sideways scroll | Proof |
| 8 Oct 2026 | 1 | Access check: a member cannot change the step list (refused by the database) | Proof |
