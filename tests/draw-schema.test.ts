import test from 'node:test';
import assert from 'node:assert/strict';
import { getLatestDraw } from '../lib/db';

test('Latest Draw Result JSON Schema Test', () => {
  const draw = getLatestDraw();

  assert.equal(draw.draw_no, 1234, 'Latest draw number should be 1234');
  assert.ok(draw.draw_date.includes('2026') || draw.draw_date.includes('7'), 'Draw date formatted');
  assert.equal(draw.winning_numbers.length, 6, 'Should have exactly 6 main winning numbers');

  for (const num of draw.winning_numbers) {
    assert.ok(num >= 1 && num <= 45, `Winning number ${num} must be between 1 and 45`);
  }

  assert.ok(draw.bonus_number >= 1 && draw.bonus_number <= 45, 'Bonus number must be between 1 and 45');
  assert.ok(!draw.winning_numbers.includes(draw.bonus_number), 'Bonus number should not duplicate main numbers');

  // Verify 1~5th winner counts present
  for (let rank = 1; rank <= 5; rank++) {
    const count = draw.winner_counts[String(rank)];
    assert.ok(typeof count === 'number' && count >= 0, `Winner count for rank ${rank} must be valid number`);
  }

  assert.ok(draw.source_url.startsWith('https://'), 'Source URL must be present and valid HTTPS');
  assert.ok(draw.collected_at.length > 0, 'Collected timestamp must be present');
});
