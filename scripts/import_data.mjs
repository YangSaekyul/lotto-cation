#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

function normalizeName(name) {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ');
}

function normalizeAddress(address) {
  if (!address) return '';
  return address
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/번지$/, '')
    .replace(/,/g, '');
}

function isOnlineStore(name, address, storeId) {
  if (storeId === '00000000') return true;
  const lowerName = (name || '').toLowerCase();
  const lowerAddr = (address || '').toLowerCase();
  return (
    lowerName.includes('인터넷') ||
    lowerName.includes('동행복권') ||
    lowerAddr.includes('인터넷')
  );
}

function stableSuffix(value) {
  return createHash('sha1').update(value).digest('hex').slice(0, 10);
}

function main() {
  console.log('Starting LottoRi data normalization & import process...');

  const recordsPath = path.join(DATA_DIR, 'winning_store_records_current.json');
  const resultsPath = path.join(DATA_DIR, 'official_draw_results_all.json');
  const geocodeCachePath = path.join(DATA_DIR, 'naver_geocode_cache.json');

  if (!fs.existsSync(recordsPath) || !fs.existsSync(resultsPath)) {
    console.error('Data files missing!');
    process.exit(1);
  }

  const rawRecordsData = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
  const rawResultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const geocodeCache = fs.existsSync(geocodeCachePath)
    ? JSON.parse(fs.readFileSync(geocodeCachePath, 'utf8'))
    : {};

  const records = rawRecordsData.records || [];
  const draws = rawResultsData.draws || [];

  console.log(`Loaded ${records.length} winning store records and ${draws.length} draw results.`);

  const storeMap = new Map();
  const normalizedRecords = [];
  const officialIdsByKey = new Map();
  const keysByOfficialId = new Map();

  const officialNameByAddress = new Map();
  for (const item of records) {
    const normName = normalizeName(item.name || '');
    const normAddr = normalizeAddress(item.address || '');
    if (normAddr && normName && !normName.includes('기타_검증용')) {
      officialNameByAddress.set(normAddr, normName);
    }
  }

  for (const item of records) {
    const storeId = item.store_id ? String(item.store_id) : null;
    if (!storeId) continue;
    const normName = normalizeName(item.name || '');
    const normAddr = normalizeAddress(item.address || '');
    const key = `nameaddr:${normName}::${normAddr}`;
    officialIdsByKey.set(key, storeId);
    if (!keysByOfficialId.has(storeId)) keysByOfficialId.set(storeId, new Set());
    keysByOfficialId.get(storeId).add(key);
  }

  for (const item of records) {
    const rawName = item.name || '';
    const rawAddress = item.address || '';
    let normName = normalizeName(rawName);
    const normAddr = normalizeAddress(rawAddress);

    if (normName.includes('기타_검증용') && officialNameByAddress.has(normAddr)) {
      normName = officialNameByAddress.get(normAddr);
    }

    const storeId = item.store_id ? String(item.store_id) : null;
    const isOnline = isOnlineStore(rawName, rawAddress, storeId);
    const cachedGeocode = geocodeCache[rawAddress.trim()];
    const hasCachedCoordinates = cachedGeocode?.status === 'ok';
    const latitude = item.latitude ?? (hasCachedCoordinates ? cachedGeocode.latitude : null);
    const longitude = item.longitude ?? (hasCachedCoordinates ? cachedGeocode.longitude : null);
    const geocodeSource = item.latitude != null && item.longitude != null
      ? (item.geocode_source || 'official')
      : (hasCachedCoordinates ? 'naver_geocoding' : null);

    const mapKey = `nameaddr:${normName}::${normAddr}`;

    let store = storeMap.get(mapKey);
    if (!store) {
      const officialId = officialIdsByKey.get(mapKey);
      const generatedId = officialId
        ? (keysByOfficialId.get(officialId).size === 1 ? officialId : `${officialId}_${stableSuffix(mapKey)}`)
        : `legacy_${stableSuffix(mapKey)}`;
      const displayName = rawName.includes('기타_검증용') && officialNameByAddress.has(normAddr)
        ? officialNameByAddress.get(normAddr)
        : rawName;
      store = {
        id: generatedId,
        name: displayName,
        normalized_name: normName,
        address: rawAddress,
        normalized_address: normAddr,
        latitude,
        longitude,
        is_online: isOnline,
        is_closed: false,
        geocode_status: latitude != null && longitude != null
          ? (geocodeSource === 'naver_geocoding' ? 'geocoded' : 'official_verified')
          : 'pending',
        geocoded_at: latitude != null && longitude != null ? new Date().toISOString() : null,
        rank_counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        total_wins: 0,
        latest_draw: 0,
        history: [],
      };
      storeMap.set(mapKey, store);
    } else {
      if (store.name.includes('기타_검증용') && !rawName.includes('기타_검증용')) {
        store.name = rawName;
        store.normalized_name = normName;
      }
      // Prefer an available official coordinate, otherwise reapply the durable Naver cache.
      const officialCoordinatesAvailable = item.latitude != null && item.longitude != null;
      if (
        latitude != null && longitude != null &&
        (store.latitude == null || (officialCoordinatesAvailable && store.geocode_status === 'geocoded'))
      ) {
        store.latitude = latitude;
        store.longitude = longitude;
        store.geocode_status = geocodeSource === 'naver_geocoding' ? 'geocoded' : 'official_verified';
        store.geocoded_at = new Date().toISOString();
      }
      if (!store.address && rawAddress) store.address = rawAddress;
    }

    const drawNo = Number(item.draw_no);
    const prizeRank = Number(item.prize_rank);

    if (prizeRank >= 1 && prizeRank <= 5) {
      store.rank_counts[prizeRank] = (store.rank_counts[prizeRank] || 0) + 1;
      store.total_wins += 1;
      if (drawNo > store.latest_draw) store.latest_draw = drawNo;

      store.history.push({
        draw: drawNo,
        rank: prizeRank,
        count: 1,
        source: item.source || 'official',
      });
    }

    normalizedRecords.push({
      draw_no: drawNo,
      prize_rank: prizeRank,
      store_id: store.id,
      raw_name: rawName,
      raw_address: rawAddress,
      source_url: item.source_url || 'https://www.dhlottery.co.kr',
    });
  }

  // Deduplicate unique stores array
  const uniqueStoresMap = new Map();
  for (const store of storeMap.values()) {
    uniqueStoresMap.set(store.id, store);
  }

  const storesArray = Array.from(uniqueStoresMap.values());
  // Sort history for each store descending by draw
  for (const store of storesArray) {
    store.history.sort((a, b) => b.draw - a.draw);
  }

  const normalizedDb = {
    meta: {
      generated_at: new Date().toISOString(),
      total_stores: storesArray.length,
      offline_stores_with_coordinates: storesArray.filter(s => !s.is_online && s.latitude && s.longitude).length,
      total_winning_records: normalizedRecords.length,
      total_draws: draws.length,
      latest_draw: draws.reduce((max, d) => Math.max(max, d.draw_no), 0),
    },
    draws: draws.sort((a, b) => b.draw_no - a.draw_no),
    stores: storesArray,
  };

  const outputPath = path.join(DATA_DIR, 'normalized_db.json');
  fs.writeFileSync(outputPath, JSON.stringify(normalizedDb), 'utf8');

  console.log('Import completed successfully!');
  console.log({
    total_stores: storesArray.length,
    offline_with_coords: normalizedDb.meta.offline_stores_with_coordinates,
    total_records: normalizedRecords.length,
    latest_draw: normalizedDb.meta.latest_draw,
  });
}

main();
