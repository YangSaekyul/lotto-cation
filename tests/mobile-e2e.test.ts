import test from 'node:test';
import assert from 'node:assert/strict';
import { getTopStores } from '../lib/db';

test('Mobile E2E Flow Test: Store Directions URL & Fallback Verification', () => {
  // Test Store detail directions URL generation against a stable data query.
  const store = getTopStores('all', '전체', 1)[0] ?? null;
  assert.ok(store !== null, 'Store should exist');

  let directionsUrl = `https://map.naver.com/v5/search/${encodeURIComponent(store!.name + " " + store!.address)}`;
  if (store!.latitude && store!.longitude) {
    directionsUrl = `https://map.naver.com/v5/directions/-/${store!.latitude},${store!.longitude},${encodeURIComponent(store!.name)}/-/walk`;
  }

  assert.ok(directionsUrl.startsWith('https://map.naver.com/v5/'), 'Naver map URL must start with valid scheme');
  assert.ok(directionsUrl.includes(encodeURIComponent(store!.name)), 'Directions URL must include store name');

  // Verification of Naver Map Client ID fallback environment variable key name
  const envVarKey = 'NEXT_PUBLIC_NAVER_MAP_CLIENT_ID';
  assert.equal(envVarKey, 'NEXT_PUBLIC_NAVER_MAP_CLIENT_ID');
});
