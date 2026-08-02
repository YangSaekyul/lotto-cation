import test from 'node:test';
import assert from 'node:assert/strict';
import { getStoresNearby, haversineDistance, formatDistance } from '../lib/db';

test('Distance Calculation & Radius Filter Test', () => {
  // Seoul City Hall coordinates
  const seoulLat = 37.5665;
  const seoulLng = 126.9780;

  // Test distance formatting
  assert.equal(formatDistance(0.28), '280m');
  assert.equal(formatDistance(1.24), '1.2km');

  // Test Haversine distance calculation (Seoul to Gangnam Station ~ 8.4km)
  const gangnamDist = haversineDistance(seoulLat, seoulLng, 37.4979, 127.0276);
  assert.ok(gangnamDist > 7 && gangnamDist < 10, `Distance should be ~8.4km, got ${gangnamDist}`);

  // Test 1km radius filter
  const stores1km = getStoresNearby(seoulLat, seoulLng, 1);
  for (const store of stores1km) {
    assert.ok(store.distanceKm! <= 1.0, `Store ${store.name} distance ${store.distanceKm} should be <= 1km`);
    assert.equal(store.is_online, false, 'Online stores should be excluded from radius search');
    assert.notEqual(store.latitude, null, 'Stores on map must have non-null latitude');
    assert.notEqual(store.longitude, null, 'Stores on map must have non-null longitude');
  }

  // Test 5km radius filter contains more stores than 1km
  const stores5km = getStoresNearby(seoulLat, seoulLng, 5);
  assert.ok(stores5km.length >= stores1km.length, '5km search should return >= 1km search results');

  // The API must not silently cap a selected radius at the old 50-store limit.
  const stores10km = getStoresNearby(seoulLat, seoulLng, 10);
  assert.ok(stores10km.length > 50, `10km search should return every matching store, got ${stores10km.length}`);
});
