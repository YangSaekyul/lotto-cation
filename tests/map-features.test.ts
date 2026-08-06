import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNaverDirectionsUrl, getPodiumRanks, sortNearbyStores } from '../lib/map-features';

type Store = {
  id: string;
  totalWins: number;
  distanceKm?: number;
  rankCounts: { 1: number; 2: number; 3: number; 4: number; 5: number };
};

const store = (id: string, totalWins: number, distanceKm: number, first = 0, second = 0): Store => ({
  id,
  totalWins,
  distanceKm,
  rankCounts: { 1: first, 2: second, 3: 0, 4: 0, 5: 0 },
});

test('visible-map podium assigns top 5 ranks using deterministic tie breakers', () => {
  const ranks = getPodiumRanks([
    store('d', 4, 0.2, 0, 4),
    store('e', 3, 0.4, 0, 3),
    store('b', 5, 0.5, 1, 4),
    store('a', 5, 0.7, 2, 3),
    store('c', 5, 0.3, 2, 3),
    store('f', 1, 0.9, 0, 1),
  ]);

  assert.deepEqual(ranks, { c: 1, a: 2, b: 3, d: 4, e: 5 });
});

test('nearby list can switch between distance and past-win sorting', () => {
  const stores = [store('far-winner', 10, 1.2), store('near', 1, 0.1), store('middle', 3, 0.5)];
  assert.deepEqual(sortNearbyStores(stores, 'distance').map((item) => item.id), ['near', 'middle', 'far-winner']);
  assert.deepEqual(sortNearbyStores(stores, 'wins').map((item) => item.id), ['far-winner', 'middle', 'near']);
});

test('marker preview directions link targets the selected store coordinates', () => {
  const url = buildNaverDirectionsUrl({
    name: '독산로또',
    address: '서울 금천구 독산동 1',
    latitude: 37.4692,
    longitude: 126.8977,
  });
  assert.match(url, /^https:\/\/map\.naver\.com\/v5\/directions\//);
  assert.match(url, /37\.4692,126\.8977/);
  assert.match(url, new RegExp(encodeURIComponent('독산로또')));
});
