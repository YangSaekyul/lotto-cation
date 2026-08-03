import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.join(process.cwd(), 'components', 'map-home.tsx'), 'utf8');

test('geolocation failure never resets a moved map to City Hall', () => {
  assert.doesNotMatch(source, /fetchNearbyStores\(DEFAULT_CENTER\.lat, DEFAULT_CENTER\.lng/);
  assert.match(source, /locationMessage/);
});

test('map idle refreshes the radius list from map center, which feeds both markers and list', () => {
  assert.match(source, /map\.getCenter\(\)/);
  assert.match(source, /fetchNearbyStores\([\s\S]*?\.lat\(\)[\s\S]*?\.lng\(\)[\s\S]*?radiusRef\.current/);
});

test('map markers render from the same radius data as the nearby list, so the two counters always agree', () => {
  assert.match(source, /getPodiumRanks\(nearbyStores\)/);
  assert.match(source, /for \(const store of nearbyStores\)/);
  assert.match(source, /\[isMapLoaded, nearbyStores\]/);
  // The markers must no longer come from the viewport bounds API.
  assert.doesNotMatch(source, /\/api\/stores\/bounds/);
  assert.doesNotMatch(source, /fetchVisibleMapStores/);
  assert.doesNotMatch(source, /mapStores/);
});

test('the in-map badge shows the same radius count as the nearby list heading (no viewport count)', () => {
  assert.match(source, /반경 내 \{nearbyStores\.length\}곳/);
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

test('on mount the app auto-requests the user current location instead of showing a Seoul default first', () => {
  assert.match(source, /useState<"locating" \| "granted" \| "denied" \| "map">\("locating"\)/);
  assert.match(source, /useEffect\(\(\) => \{[\s\S]*?navigator\.geolocation\.getCurrentPosition/);
  assert.match(source, /applyUserLocation\(\{ lat: position\.coords\.latitude, lng: position\.coords\.longitude \}\)/);
});

test('while locating, the radius list and viewport do not fetch the Seoul default', () => {
  assert.match(source, /if \(locationStatusRef\.current === "locating"\) return;/);
  assert.match(source, /locationStatus === "locating" \? \(/);
  assert.match(source, /현재 위치를 확인하는 중입니다/);
});

test('location denial at initial load falls back to the default center with a notice, but never resets a moved map', () => {
  assert.match(source, /기본 위치\(서울\) 기준으로 보여드립니다/);
  assert.doesNotMatch(source, /fetchNearbyStores\(DEFAULT_CENTER\.lat, DEFAULT_CENTER\.lng/);
  assert.match(source, /if \(locationStatusRef\.current !== "locating"\) return;/);
});
