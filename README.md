# Valerie COE Tracker

Interim build (release 0). It runs as a claude.ai page with its own shared database. No Supabase yet.

| Path | What |
| --- | --- |
| `app/index.html` | The whole web app. Published to claude.ai with the `db`, `user` and `downloads` capabilities |
| `migration/build_seed.py` | Turns the two Excel files plus `decisions.json` and `step_extras.json` into database records and a report |
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
