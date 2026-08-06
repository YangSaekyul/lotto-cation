import test from 'node:test';
import assert from 'node:assert/strict';
import { getTopStores, getDistricts, extractDistrict } from '../lib/db';

// ============================================================
// API-LEVEL TESTS (using the actual lib functions that the API routes call)
// ============================================================

test('API: city-only selection (Seoul) returns entire city via getTopStores', () => {
  const stores = getTopStores('all', '서울', 50);
  assert.ok(stores.length > 0, 'Seoul city-wide should return stores');
  for (const store of stores) {
    assert.match(store.address, /^서울/, `store ${store.id} must be in Seoul`);
  }
  // Should return 50 stores (default limit)
  assert.ok(stores.length <= 50, 'Should respect limit of 50');
});

test('API: city + district selection (Seoul + Gangnam-gu) returns only that district', () => {
  const stores = getTopStores('all', '서울', 50, '강남구');
  assert.ok(stores.length > 0, 'Gangnam-gu should have stores');
  for (const store of stores) {
    assert.match(store.address, /^서울\s+강남구/, `store ${store.id} must be in 강남구`);
  }
});

test('API: district with no stores returns empty list', () => {
  const stores = getTopStores('all', '서울', 50, '존재하지않는구');
  assert.equal(stores.length, 0);
});

test('API: missing/empty district behaves like city-wide selection', () => {
  const emptyDistrict = getTopStores('all', '서울', 50, '');
  const allDistrict = getTopStores('all', '서울', 50, '전체');
  const noDistrict = getTopStores('all', '서울', 50);
  assert.equal(emptyDistrict.length, noDistrict.length);
  assert.equal(allDistrict.length, noDistrict.length);
});

test('API: getDistricts returns Seoul districts when city=서울', () => {
  const result = getDistricts('서울');
  assert.ok(result.includes('강남구'), 'Seoul districts should include 강남구');
  assert.ok(result.includes('송파구'), 'Seoul districts should include 송파구');
  assert.ok(result.length >= 25, `Seoul should have 25 gu, got ${result.length}`);
});

test('API: getDistricts returns empty list for city with no stores', () => {
  // Using a district filter that has no stores
  const result = getDistricts('존재하지않는시');
  assert.equal(result.length, 0);
});

test('API: district list resets when switching cities (simulated)', () => {
  const seoulDistricts = getDistricts('서울');
  const busanDistricts = getDistricts('부산');
  const gyeonggiDistricts = getDistricts('경기');
  
  // All should have districts
  assert.ok(seoulDistricts.length > 0);
  assert.ok(busanDistricts.length > 0);
  assert.ok(gyeonggiDistricts.length > 0);
  
  // District options should be different (at least some districts unique to each city)
  // Note: Some district names like "강서구" exist in both Seoul and Busan
  // The key is that the lists are different overall
  assert.notDeepEqual(seoulDistricts.sort(), busanDistricts.sort(), 'Seoul and Busan district lists should differ');
  assert.notDeepEqual(seoulDistricts.sort(), gyeonggiDistricts.sort(), 'Seoul and Gyeonggi district lists should differ');
});

// ============================================================
// EDGE CASES
// ============================================================

test('Edge case: district filter "전체" returns city-wide results', () => {
  const storesWithAll = getTopStores('all', '서울', 50, '전체');
  const storesWithoutDistrict = getTopStores('all', '서울', 50);
  assert.equal(storesWithAll.length, storesWithoutDistrict.length);
  for (const store of storesWithAll) {
    assert.match(store.address, /^서울/, `store must be in Seoul`);
  }
});

test('Edge case: rank filter works with district filter', () => {
  const stores = getTopStores(1, '서울', 50, '강남구');
  // All returned stores should have at least one 1st rank win
  for (const store of stores) {
    assert.ok(store.rankCounts[1] > 0, `store ${store.id} must have 1st rank wins`);
  }
});

test('Edge case: extractDistrict handles various address formats', () => {
  assert.equal(extractDistrict('서울 강남구 역삼동 813'), '강남구');
  assert.equal(extractDistrict('서울 중구 퇴계로56길 57'), '중구');
  assert.equal(extractDistrict('서울 서초구 서초동 1591-3 탑스벤처빌딩 1층'), '서초구');
  assert.equal(extractDistrict('경기 수원시 권선구 ...'), '수원시');
  assert.equal(extractDistrict('부산 해운대구 우동'), '해운대구');
  assert.equal(extractDistrict('대구 수성구 범어동'), '수성구');
  assert.equal(extractDistrict(''), '');
  assert.equal(extractDistrict('   '), '');
});

test('Edge case: getDistricts with "전체" returns districts from all cities', () => {
  const allDistricts = getDistricts('전체');
  assert.ok(allDistricts.length > 25, '전체 should have districts from multiple cities');
  assert.ok(allDistricts.includes('강남구'), 'Should include Seoul districts');
  assert.ok(allDistricts.includes('해운대구'), 'Should include Busan districts');
});

test('Edge case: city-only selection for non-Seoul city works', () => {
  const stores = getTopStores('all', '부산', 50);
  assert.ok(stores.length > 0, 'Busan should have stores');
  for (const store of stores) {
    assert.match(store.address, /^부산/, `store ${store.id} must be in Busan`);
  }
});

test('Edge case: city + district for non-Seoul city works', () => {
  const stores = getTopStores('all', '부산', 50, '해운대구');
  assert.ok(stores.length > 0, 'Haeundae-gu should have stores');
  for (const store of stores) {
    assert.match(store.address, /^부산\s+해운대구/, `store ${store.id} must be in 해운대구`);
  }
});

// ============================================================
// UI-LEVEL SIMULATION TESTS
// These test the UI logic by simulating the React component behavior
// ============================================================

test('UI Logic: selectedDistrict resets to "전체" when selectedCity changes', () => {
  // Simulating the useEffect in page.tsx lines 55-88
  let selectedCity = '전체';
  let selectedDistrict = '전체';
  let districtOptions: string[] = [];
  
  // Function simulating the city change effect
  const onCityChange = (newCity: string) => {
    selectedCity = newCity;
    selectedDistrict = '전체'; // Reset district
    
    if (newCity === '전체') {
      districtOptions = [];
    } else {
      // In real app: fetch(`/api/stores/districts?city=${newCity}`)
      // Here we use the lib function directly
      districtOptions = getDistricts(newCity);
    }
  };
  
  // Start with Seoul selected
  onCityChange('서울');
  const seoulDistrictCount = districtOptions.length;
  assert.ok(seoulDistrictCount > 0, 'Seoul should have districts');
  assert.equal(selectedDistrict, '전체', 'District should reset to 전체');
  
  // Switch to Busan
  onCityChange('부산');
  const busanDistrictCount = districtOptions.length;
  assert.ok(busanDistrictCount > 0, 'Busan should have districts');
  assert.equal(selectedDistrict, '전체', 'District should reset to 전체 when switching cities');
  
  // District options should be different
  assert.ok(districtOptions.length !== seoulDistrictCount || 
    !districtOptions.every(d => getDistricts('서울').includes(d)),
    'District options should change when city changes');
  
  // Use selectedCity to avoid unused variable warning
  assert.equal(selectedCity, '부산');
});

test('UI Logic: locationLabel renders correctly for different states', () => {
  // Simulating the locationLabel logic from page.tsx lines 119-125
  const getLocationLabel = (city: string, district: string) => {
    if (district && district !== '전체') {
      return `${city} ${district}`;
    }
    if (city === '전체') {
      return '전국';
    }
    return `${city} 전체`;
  };
  
  assert.equal(getLocationLabel('전체', '전체'), '전국');
  assert.equal(getLocationLabel('서울', '전체'), '서울 전체');
  assert.equal(getLocationLabel('서울', '강남구'), '서울 강남구');
  assert.equal(getLocationLabel('부산', '해운대구'), '부산 해운대구');
  assert.equal(getLocationLabel('경기', '전체'), '경기 전체');
});

test('UI Logic: API params construction matches expected behavior', () => {
  // Simulating the fetchRanking logic from page.tsx lines 90-117
  const buildParams = (rank: string, city: string, district: string) => {
    const params = new URLSearchParams({
      rank: String(rank),
      region: city,
    });
    if (district && district !== '전체') {
      params.set('district', district);
    }
    return params.toString();
  };
  
  // City only - no district param
  const cityOnly = buildParams('all', '서울', '전체');
  assert.ok(!cityOnly.includes('district='), 'City-only should not include district param');
  // URLSearchParams encodes Korean, so check for encoded version
  assert.ok(cityOnly.includes('region=%EC%84%9C%EC%9A%B8'), 'Should include encoded region=서울');
  
  // City + district - includes district param
  const cityDistrict = buildParams('all', '서울', '강남구');
  assert.ok(cityDistrict.includes('district=%EA%B0%95%EB%82%A8%EA%B5%AC'), 'Should include encoded district=강남구');
  assert.ok(cityDistrict.includes('region=%EC%84%9C%EC%9A%B8'), 'Should include encoded region=서울');
  
  // Rank filter
  const withRank = buildParams('1', '서울', '강남구');
  assert.ok(withRank.includes('rank=1'), 'Should include rank=1');
});

// ============================================================
// INTEGRATION: Full flow from city selection to filtered results
// ============================================================

test('Integration: Full flow Seoul city-wide -> 50 stores all in Seoul', () => {
  // 1. User selects city = 서울
  const city = '서울';
  
  // 2. District dropdown populates (via getDistricts)
  const districts = getDistricts(city);
  assert.ok(districts.length >= 25);
  assert.ok(districts.includes('강남구'));
  
  // 3. User leaves district as "전체" (city-wide)
  const district = '전체';
  
  // 4. Fetch stores
  const stores = getTopStores('all', city, 50, district);
  
  // 5. Verify all stores are in Seoul
  assert.ok(stores.length > 0);
  assert.ok(stores.length <= 50);
  for (const store of stores) {
    assert.match(store.address, /^서울/, `store ${store.id} address: ${store.address}`);
  }
  
  // 6. Location label should be "서울 전체"
  const label = district && district !== '전체' ? `${city} ${district}` : `${city} 전체`;
  assert.equal(label, '서울 전체');
});

test('Integration: Full flow Seoul + Gangnam-gu -> stores only in Gangnam-gu', () => {
  // 1. User selects city = 서울
  const city = '서울';
  
  // 2. District dropdown populates
  const districts = getDistricts(city);
  assert.ok(districts.includes('강남구'));
  
  // 3. User selects district = 강남구
  const district = '강남구';
  
  // 4. Fetch stores
  const stores = getTopStores('all', city, 50, district);
  
  // 5. Verify all stores are in Seoul Gangnam-gu
  assert.ok(stores.length > 0);
  for (const store of stores) {
    assert.match(store.address, /^서울\s+강남구/, `store ${store.id} address: ${store.address}`);
  }
  
  // 6. Location label should be "서울 강남구"
  const label = district && district !== '전체' ? `${city} ${district}` : `${city} 전체`;
  assert.equal(label, '서울 강남구');
});

test('Integration: City switch resets district and reloads', () => {
  // Start with Seoul + Gangnam-gu
  let city = '서울';
  let district = '강남구';
  let stores = getTopStores('all', city, 50, district);
  for (const store of stores) {
    assert.match(store.address, /^서울\s+강남구/);
  }
  
  // Switch to Busan - district should reset
  city = '부산';
  district = '전체'; // Reset
  stores = getTopStores('all', city, 50, district);
  for (const store of stores) {
    assert.match(store.address, /^부산/);
  }
  
  // Now select Haeundae-gu
  district = '해운대구';
  stores = getTopStores('all', city, 50, district);
  for (const store of stores) {
    assert.match(store.address, /^부산\s+해운대구/);
  }
});

test('Integration: Rank filter + district filter combined', () => {
  const city = '서울';
  const district = '강남구';
  const rankFilter = 1;
  
  const stores = getTopStores(rankFilter, city, 50, district);
  
  // All should be in Seoul Gangnam-gu AND have 1st rank wins
  for (const store of stores) {
    assert.match(store.address, /^서울\s+강남구/);
    assert.ok(store.rankCounts[1] > 0, `store ${store.name} should have 1st rank wins`);
  }
});