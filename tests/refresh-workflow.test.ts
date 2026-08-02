import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Saturday refresh starts at 21:00 KST and retries until a new draw appears', () => {
  const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/refresh-data.yml'), 'utf8');
  assert.match(workflow, /cron: "0 12 \* \* 6"/);
  assert.match(workflow, /seq 1 12/);
  assert.match(workflow, /sleep 300/);
  assert.match(workflow, /새 회차가 확인되지 않았습니다/);
});
