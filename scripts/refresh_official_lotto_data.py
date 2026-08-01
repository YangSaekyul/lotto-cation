#!/usr/bin/env python3
"""Refresh Lotto 6/45 draw results and winning-store records from Donghaeng Lottery."""
from __future__ import annotations
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
BASE = "https://www.dhlottery.co.kr"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; LottoMapDataRefresh/1.0)"}


def fetch(path: str, params: dict[str, str | int]) -> dict:
    req = Request(f"{BASE}{path}?{urlencode(params)}", headers=HEADERS)
    with urlopen(req, timeout=30) as response:
        payload = json.load(response)
    if payload.get("resultCode") not in ("200", 200, None):
        raise RuntimeError(f"official API error: {payload}")
    return payload["data"]


def main() -> None:
    # The official results page exposed 1234 as the most recent completed draw at refresh time.
    latest = 1234
    start = 1169
    refreshed_at = datetime.now(timezone.utc).isoformat()
    draw_results = []
    stores = []
    for draw_no in range(start, latest + 1):
        result = fetch("/lt645/selectPstLt645InfoNew.do", {"srchDir": "center", "srchLtEpsd": draw_no})["list"]
        draw = next(item for item in result if int(item["ltEpsd"]) == draw_no)
        draw_results.append({
            "draw_no": draw_no,
            "draw_date": draw["ltRflYmd"],
            "numbers": [draw[f"tm{i}WnNo"] for i in range(1, 7)],
            "bonus_number": draw["bnsWnNo"],
            "winner_counts": {str(rank): draw[f"rnk{rank}WnNope"] for rank in range(1, 6)},
            "source_url": f"{BASE}/lt645/result",
        })
        for rank in range(1, 6):
            result = fetch("/wnprchsplcsrch/selectLtWnShp.do", {"srchWnShpRnk": rank, "srchLtEpsd": draw_no})
            for item in result.get("list", []):
                stores.append({
                    "draw_no": draw_no, "prize_rank": rank, "store_id": item.get("ltShpId"),
                    "name": item.get("shpNm"), "address": item.get("shpAddr", "").strip(),
                    "latitude": item.get("shpLat"), "longitude": item.get("shpLot"),
                    "sale_status": item.get("slrOperSttsCd"), "source_url": f"{BASE}/wnprchsplcsrch/home?ltGds=lt645&ltEpsd={draw_no}",
                })
        time.sleep(0.06)
    meta = {"source": BASE, "refreshed_at": refreshed_at, "draw_range": [start, latest]}
    (DATA / "official_draw_results_1169_1234.json").write_text(json.dumps({**meta, "draws": draw_results}, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA / "official_winning_stores_1169_1234.json").write_text(json.dumps({**meta, "records": stores}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"draws": len(draw_results), "store_records": len(stores), **meta}, ensure_ascii=False))


if __name__ == "__main__":
    main()
