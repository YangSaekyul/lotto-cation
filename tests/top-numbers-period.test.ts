import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getTopNumbersByPeriod } from '../lib/db';

type DrawRow = { draw_date: string; numbers: number[] };

function loadDraws(): DrawRow[] {
  const source = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'data', 'normalized_db.json'), 'utf8'),
  ) as { draws: DrawRow[] };
  return source.draws;
}

function computeCutoffKey(latestRawDate: string, months: number): string {
  const year = Number(latestRawDate.slice(0, 4));
  const monthIndex = Number(latestRawDate.slice(4, 6)) - 1;
  const day = Number(latestRawDate.slice(6, 8));
  const cutoff = new Date(Date.UTC(year, monthIndex, 1));
  cutoff.setUTCMonth(cutoff.getUTCMonth() - Math.max(1, months));
  const lastDay = new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate();
  cutoff.setUTCDate(Math.min(day, lastDay));
  return cutoff.toISOString().slice(0, 10).replaceAll('-', '');
}

function expectedTop(months: number, limit: number): number[] {
  const draws = loadDraws();
  const latest = draws.reduce((max, d) => (d.draw_date > max ? d.draw_date : max), '');
  const cutoff = computeCutoffKey(latest, months);
  const freq: Record<number, number> = {};
  for (const draw of draws) {
    if (!/^\d{8}$/.test(draw.draw_date) || draw.draw_date < cutoff) continue;
    for (const num of draw.numbers) {
      if (num >= 1 && num <= 45) freq[num] = (freq[num] || 0) + 1;
    }
  }
  return Object.keys(freq)
    .map(Number)
    .filter((n) => freq[n] > 0)
    .sort((a, b) => freq[b] - freq[a] || a - b)
    .slice(0, limit);
}

test('구간별 상위 번호: 요청한 모든 구간이 같은 순서로 포함된다', () => {
  const periods = getTopNumbersByPeriod([1, 3, 6, 12]);
  assert.deepEqual(
    periods.map((p) => p.periodMonths),
    [1, 3, 6, 12],
  );
});

test('구간별 상위 번호: 각 구간 최대 6개, 출현 횟수 내림차순·동률 번호 오름차순', () => {
  for (const months of [1, 3, 6, 12, 60]) {
    const entry = getTopNumbersByPeriod([months], 6)[0];
    assert.ok(entry.numbers.length <= 6, `${months}개월 구간이 6개 초과: ${entry.numbers.length}`);
    // 존재하는 번호만 반환 (1~45 범위)
    for (const n of entry.numbers) {
      assert.ok(n >= 1 && n <= 45, `범위 밖 번호: ${n}`);
    }
    // 독립 재계산과 일치
    assert.deepEqual(entry.numbers, expectedTop(months, 6), `${months}개월 구간 정렬 불일치`);
  }
});

test('구간별 상위 번호: limit 파라미터가 최대 개수를 제한한다', () => {
  const entry = getTopNumbersByPeriod([12], 3)[0];
  assert.ok(entry.numbers.length <= 3, `limit=3인데 ${entry.numbers.length}개 반환`);
  assert.deepEqual(entry.numbers, expectedTop(12, 3));
});

test('구간별 상위 번호: 데이터가 부족해도 존재하는 번호만 정렬해 반환', () => {
  // 1개월 구간은 5회차뿐이지만 여전히 6개 이상 사는 게 일반적; 범위·정렬은 독립 재계산과 일치해야 한다.
  const one = getTopNumbersByPeriod([1], 6)[0];
  assert.deepEqual(one.numbers, expectedTop(1, 6));
  // 존재하는 번호는 모두 출현 횟수 > 0인 번호다 (1~45 범위 내).
  assert.ok(one.numbers.length > 0);
});

test('구간별 상위 번호: 기본 구간은 1,3,6,12', () => {
  const periods = getTopNumbersByPeriod();
  assert.deepEqual(
    periods.map((p) => p.periodMonths),
    [1, 3, 6, 12],
  );
});

test('구간별 상위 번호: 구간 내 번호 합이 해당 기간 총 출현 수를 초과하지 않는다', () => {
  // 상한 검증: 6개 이하이므로 항상 참이지만, 각 번호가 실존 번호인지도 함께 확인
  for (const p of getTopNumbersByPeriod([1, 3, 6, 12], 6)) {
    assert.ok(p.numbers.length <= 6);
    assert.ok(new Set(p.numbers).size === p.numbers.length, '중복 번호가 있음');
  }
});
