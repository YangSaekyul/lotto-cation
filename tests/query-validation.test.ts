import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBoundsQuery, validateNearbyQuery } from '../lib/query-validation';

test('nearby query validation accepts the six product radii without a result cap', () => {
  for (const radius of ['0.3', '0.5', '1', '3', '5', '10']) {
    assert.equal(validateNearbyQuery('37.5', '127', radius).ok, true);
  }
  assert.equal(validateNearbyQuery('91', '127', '5').ok, false);
  assert.equal(validateNearbyQuery('37', '181', '5').ok, false);
  assert.equal(validateNearbyQuery('37', '127', 'Infinity').ok, false);
  assert.equal(validateNearbyQuery('37', '127', '2').ok, false);
});

test('visible map bounds validation rejects inverted or oversized bounds', () => {
  assert.equal(validateBoundsQuery('37.4', '126.8', '37.7', '127.2').ok, true);
  assert.equal(validateBoundsQuery('37.7', '126.8', '37.4', '127.2').ok, false);
  assert.equal(validateBoundsQuery('37.4', '127.2', '37.7', '126.8').ok, false);
  assert.equal(validateBoundsQuery('-90', '-180', '90', '180').ok, false);
});
