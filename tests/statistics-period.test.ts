import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getNumberStatistics } from '../lib/db';

test('60-month statistics use a calendar cutoff, not an estimated draw count', () => {
  const source = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'official_draw_results_all.json'), 'utf8')) as {
    draws: Array<{ draw_date: string }>;
  };
  const latest = source.draws.reduce((max, draw) => draw.draw_date > max ? draw.draw_date : max, '');
  const cutoffYear = String(Number(latest.slice(0, 4)) - 5);
  const cutoff = `${cutoffYear}${latest.slice(4)}`;
  const expectedDraws = source.draws.filter((draw) => draw.draw_date >= cutoff).length;
  const totalNumberOccurrences = getNumberStatistics(60).reduce((sum, item) => sum + item.count, 0);
  assert.equal(totalNumberOccurrences, expectedDraws * 6);
});
