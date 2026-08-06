import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDistrict, getDistricts, getTopStores } from '../lib/db';

test('extractDistrict parses gu segment from addresses', () => {
  assert.equal(extractDistrict('서울 강남구 역삼동 813'), '강남구');
  assert.equal(extractDistrict('서울 중구 퇴계로56길 57'), '중구');
  assert.equal(extractDistrict('서울 서초구 서초동 1591-3 탑스벤처빌딩 1층'), '서초구');
  // Province addresses resolve to their city/county segment.
  assert.equal(extractDistrict('경기 수원시 권선구 ...'), '수원시');
  // No region prefix -> empty district.
  assert.equal(extractDistrict(''), '');
});

test('getDistricts returns Seoul districts and ignores district with no stores', () => {
  const seoulDistricts = getDistricts('서울');
  assert.ok(seoulDistricts.includes('강남구'), 'Seoul should include 강남구');
  assert.ok(seoulDistricts.includes('송파구'), 'Seoul should include 송파구');
  assert.ok(seoulDistricts.length >= 25, `Seoul should have 25 gu, got ${seoulDistricts.length}`);
  // A district with no stores should be absent.
  assert.ok(!seoulDistricts.includes('없는구'), 'No-store district must not appear');
});

test('city-only selection returns entire city (Seoul-wide)', () => {
  const stores = getTopStores('all', '서울');
  assert.ok(stores.length > 0, 'Seoul should have top stores');
  for (const store of stores) {
    assert.match(store.address, /^서울/, `store ${store.id} must be in Seoul`);
  }
});

test('city + district selection returns only that district (Gangnam-gu)', () => {
  const stores = getTopStores('all', '서울', 50, '강남구');
  assert.ok(stores.length > 0, 'Gangnam-gu should have top stores');
  for (const store of stores) {
    assert.match(store.address, /^서울\s+강남구/, `store ${store.id} must be in 강남구`);
  }
});

test('district with no stores returns empty list', () => {
  const stores = getTopStores('all', '서울', 50, '존재하지않는구');
  assert.equal(stores.length, 0);
});

test('missing/empty district behaves like city-wide selection', () => {
  const emptyDistrict = getTopStores('all', '서울', 50, '');
  const allDistrict = getTopStores('all', '서울', 50, '전체');
  const noDistrict = getTopStores('all', '서울', 50);
  assert.equal(emptyDistrict.length, noDistrict.length);
  assert.equal(allDistrict.length, noDistrict.length);
});
