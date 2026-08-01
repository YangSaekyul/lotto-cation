#!/usr/bin/env python3
from __future__ import annotations
import csv, json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/'data'
records=[]
with (DATA/'winning_store_history.csv').open(encoding='utf-8-sig', newline='') as f:
    for row in csv.DictReader(f):
        records.append({'draw_no':int(row['회차']),'prize_rank':int(row['등수']),'store_id':None,'name':row['상호명'].strip(),'address':row['주소'].strip(),'latitude':None,'longitude':None,'source':'legacy_snapshot'})
latest=json.loads((DATA/'official_winning_stores_1169_1234.json').read_text())
for x in latest['records']:
    records.append({**x,'source':'donghaeng_official'})
records.sort(key=lambda x:(x['draw_no'],x['prize_rank'],x['name'],x['address']))
out={'coverage':{'legacy_draws':'262-1168; ranks 1-2','official_draws':'1169-1234; ranks 1-5'},'records':records}
(DATA/'winning_store_records_current.json').write_text(json.dumps(out,ensure_ascii=False),encoding='utf-8')
print({'records':len(records),'latest_draw':max(x['draw_no'] for x in records),'official_coordinates':sum(x['latitude'] is not None for x in records)})
