import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getDbMeta } from '../lib/db';

type StoredStore = { id: string; name: string; address: string; is_online: boolean };

test('Data Import Idempotency Test', () => {
  const meta = getDbMeta();
  assert.ok(meta.total_stores > 0, 'Total stores should be greater than 0');
  assert.ok(meta.total_winning_records > 0, 'Total winning records should be greater than 0');

  const official = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'official_draw_results_all.json'), 'utf8')) as { draw_range: [number, number] };
  assert.equal(meta.latest_draw, official.draw_range[1], 'Latest normalized draw must match official snapshot');

  const dbContent = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'normalized_db.json'), 'utf8')) as { stores: StoredStore[] };
  const onlineStores = dbContent.stores.filter((store) => store.is_online);
  const normalizedKeys = dbContent.stores.map((store) => `${store.name.trim().replace(/\s+/g, ' ')}::${store.address.trim().replace(/\s+/g, ' ').replace(/번지$/, '').replace(/,/g, '')}`);
  assert.equal(new Set(normalizedKeys).size, normalizedKeys.length, 'Normalized name/address stores must be merged');
  for (const store of onlineStores) {
    assert.equal(store.is_online, true);
    assert.ok(
      store.id === '00000000' || store.name.includes('인터넷') || store.name.includes('동행복권'),
      `Online store ${store.name} marked correctly`,
    );
  }

  const importScript = fs.readFileSync(path.join(process.cwd(), 'scripts', 'import_data.mjs'), 'utf8');
  assert.match(importScript, /naver_geocode_cache\.json/, 'Import must reapply the durable geocoding cache after weekly source refresh');
});
