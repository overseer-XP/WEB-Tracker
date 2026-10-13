# Feature map

| File | What |
| --- | --- |
| `build_feature_map.py` | All feature, rule, data and risk tables. Edit here, then rebuild |
| `make_preview.py` | Runs the app on an exported data folder, for screenshots only |
| `take_screens.js` | Takes 25 screenshots with red feature tags |

Rebuild (the workbook holds screenshots of company data, so it stays out of git):

```
python3 -I docs/feature_map/make_preview.py .live app/index.html .shots/preview.html
node docs/feature_map/take_screens.js .shots/preview.html .shots/img
python3 -I docs/feature_map/build_feature_map.py exports/Valerie_COE_Tracker_Feature_Map.xlsx .shots/img
```
