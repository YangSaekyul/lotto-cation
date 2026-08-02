#!/usr/bin/env python3
"""Geocode missing store addresses with Naver Geocoding API and a durable cache."""
from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
CACHE_PATH = DATA / "naver_geocode_cache.json"
RECORDS_PATH = DATA / "winning_store_records_current.json"


def geocode(address: str, client_id: str, client_secret: str) -> dict:
    url = "https://maps.apigw.ntruss.com/map-geocode/v2/geocode?" + urlencode({"query": address})
    request = Request(url, headers={
        "X-NCP-APIGW-API-KEY-ID": client_id,
        "X-NCP-APIGW-API-KEY": client_secret,
        "User-Agent": "LottoCationGeocoder/1.0",
    })
    with urlopen(request, timeout=20) as response:
        payload = json.load(response)
    addresses = payload.get("addresses") or []
    if not addresses:
        return {"status": "not_found"}
    match = addresses[0]
    return {"status": "ok", "latitude": float(match["y"]), "longitude": float(match["x"]), "road_address": match.get("roadAddress")}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=200, help="maximum new API calls")
    parser.add_argument("--delay", type=float, default=0.12)
    args = parser.parse_args()
    client_id = os.environ.get("NAVER_GEOCODING_CLIENT_ID")
    client_secret = os.environ.get("NAVER_GEOCODING_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise SystemExit("NAVER_GEOCODING_CLIENT_ID and NAVER_GEOCODING_CLIENT_SECRET are required")

    dataset = json.loads(RECORDS_PATH.read_text(encoding="utf-8"))
    cache = json.loads(CACHE_PATH.read_text(encoding="utf-8")) if CACHE_PATH.exists() else {}
    pending = sorted({item["address"].strip() for item in dataset["records"] if item.get("address") and item.get("latitude") is None})
    called = 0
    for address in pending:
        if address in cache or called >= args.limit:
            continue
        try:
            cache[address] = geocode(address, client_id, client_secret)
        except Exception as exc:
            cache[address] = {"status": "error", "error": type(exc).__name__}
        called += 1
        if called % 20 == 0:
            CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
        time.sleep(args.delay)
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    updated = 0
    for item in dataset["records"]:
        match = cache.get((item.get("address") or "").strip())
        if item.get("latitude") is None and match and match.get("status") == "ok":
            item["latitude"] = match["latitude"]
            item["longitude"] = match["longitude"]
            item["geocode_source"] = "naver_geocoding"
            updated += 1
    RECORDS_PATH.write_text(json.dumps(dataset, ensure_ascii=False), encoding="utf-8")
    print({"api_calls": called, "records_updated": updated, "cache_entries": len(cache)})


if __name__ == "__main__":
    main()
