#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
records: list[dict] = []

with (DATA / "winning_store_history.csv").open(encoding="utf-8-sig", newline="") as handle:
    for row in csv.DictReader(handle):
        records.append({
            "draw_no": int(row["회차"]),
            "prize_rank": int(row["등수"]),
            "store_id": None,
            "name": row["상호명"].strip(),
            "address": row["주소"].strip(),
            "latitude": None,
            "longitude": None,
            "source": "legacy_snapshot",
        })

official = json.loads((DATA / "official_winning_stores_current.json").read_text(encoding="utf-8"))
for item in official["records"]:
    records.append({**item, "source": "donghaeng_official"})

records.sort(key=lambda item: (item["draw_no"], item["prize_rank"], item["name"] or "", item["address"] or ""))
latest = max(item["draw_no"] for item in records)
output = {
    "coverage": {
        "legacy_draws": "262-1168; ranks 1-2",
        "official_draws": f"1169-{latest}; ranks 1-5",
    },
    "records": records,
}
(DATA / "winning_store_records_current.json").write_text(
    json.dumps(output, ensure_ascii=False), encoding="utf-8"
)
print({
    "records": len(records),
    "latest_draw": latest,
    "official_coordinates": sum(item["latitude"] is not None for item in records),
})
