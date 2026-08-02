import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.join(process.cwd(), 'components', 'map-home.tsx'), 'utf8');

test('geolocation failure never resets a moved map to City Hall', () => {
  assert.doesNotMatch(source, /fetchNearbyStores\(DEFAULT_CENTER\.lat, DEFAULT_CENTER\.lng/);
  assert.match(source, /locationMessage/);
});

test('map idle refreshes both visible pins and radius list from map center', () => {
  assert.match(source, /map\.getCenter\(\)/);
  assert.match(source, /fetchNearbyStores\([\s\S]*?\.lat\(\)[\s\S]*?\.lng\(\)[\s\S]*?radiusRef\.current/);
});

test('past wins are the default list sorting mode', () => {
  assert.match(source, /useState<NearbySort>\("wins"\)/);
});

test('programmatic geolocation movement is not mistaken for a manual map drag', () => {
  assert.match(source, /programmaticMoveRef\.current = true/);
  assert.match(source, /if \(programmaticMoveRef\.current\) return/);
});

test('map initialization uses the latest center even when geolocation finishes first', () => {
  assert.match(source, /centerLocationRef\.current = coords/);
  assert.match(source, /center: new window\.naver\.maps\.LatLng\(centerLocationRef\.current\.lat, centerLocationRef\.current\.lng\)/);
});

test('store marker opens preview first and detail on second click', () => {
  assert.match(source, /new window\.naver\.maps\.InfoWindow/);
  assert.match(source, /activeStoreIdRef\.current === store\.id/);
  assert.match(source, /길찾기/);
});
