# Valerie COE Tracker

Interim build (release 0). It runs as a claude.ai page with its own shared database. No Supabase yet.

| Path | What |
| --- | --- |
| `app/index.html` | The whole web app. Published to claude.ai with the `db`, `user` and `downloads` capabilities |
| `migration/build_seed.py` | Turns the two Excel files plus `decisions.json` and `step_extras.json` into database records and a report |
| `migration/compare_excel.py` | Three-way compare: old team Excel, new team Excel, live tracker. Writes `proposal.json` |
| `migration/apply_excel_update.py` | Turns `proposal.json`, the paid channels sheet and a decisions file into pinned database batches and `report.json` |
| `docs/stage-0-report.md` | File inventory, formulas, step mapping, open questions |
| `docs/migration-report.md` | Row counts and every changed, merged or dropped row |
| `docs/build-log.md` | What was done and why |

## Rebuild the data

```
python3 -I migration/build_seed.py <inputs_dir> <out_dir>
```

`<inputs_dir>` holds `COE_Project_Tracker.xlsx`, `Project_Task_Management.xlsx`, `decisions.json` and `step_extras.json`. These hold company data and are kept outside git.

## Database collections

`brands`, `tasks`, `access`, `sow`, `bps`, `steps`, `brand_steps` (one record per brand, holding every step status), `config/lists`, `config/people`, `log` (one record per person per day), `data/users/<id>/profile` (who each viewer is, private).

These match the Supabase tables planned in the brief, so the later move is a copy, not a redesign.

## Access rules

| Path | Read | Write |
| --- | --- | --- |
| everything | anyone the page is shared with | people with "Can interact" or above |
| `config` (lists, people) | everyone | editors only |
| `steps` (the step list) | everyone | editors only |

## Excel round trip

| Step | Who | How |
| --- | --- | --- |
| 1. Export | Claude | Read every collection from the live tracker into `.live/` (with `versions.json`), then `python3 -I migration/sync_export.py .live exports/<name>.xlsx` |
| 2. Edit | Team | Change white cells, add task rows with an empty ID, send the file back |
| 3. Import | Claude | Fresh export to `.live/`, then `python3 -I migration/sync_import.py <edited.xlsx> .live <out_dir>`. Read `report.md` |
| 4. Apply | Claude | Send each `batch_N.json` as one database batch. Every update is pinned to the live version, so an edit made in the app after step 3 makes the batch fail instead of being overwritten |

Only cells that differ from the export snapshot (hidden `_sync` sheet) are written. A field changed both in Excel and in the app keeps the app value and is listed as a conflict. Invalid values, bad dates and gate steps marked Done too early are skipped and listed.

## Import the team's own Excel files

Used when the team sends a newer copy of the COE tracker they kept before this app (first done 13 Oct).

| Step | How |
| --- | --- |
| 1. Compare | Fresh export to `.live/`, then `python3 -I migration/compare_excel.py <old_coe.xlsx> <new_coe.xlsx> <seed_dir> .live <out_dir>`. An Excel change is used only where the tracker still holds the old value |
| 2. Decide | Show the differences to the product owner. Record the answers in a decisions file (skips, gates, owner rules, paid sheet names) |
| 3. Build | `python3 -I migration/apply_excel_update.py <proposal.json> <paid.json or -> .live <decisions.json> .sync/<date>` |
| 4. Apply | Send each `batch_N.json` as one database batch, in order. New steps go in first and old steps are deleted last |

Blank Excel cells never wipe a tracker value. Owners that are not people (for example "TBC (Finance/Ops)") are not written.

## Tests

```
python3 -I docs/feature_map/make_preview.py .live app/index.html .shots/preview.html
node tests/propagation.test.js .shots/preview.html
```

Runs the real app on a copy of exported data and checks that every kind of update reaches every screen it should. Run it before publishing a new version.
