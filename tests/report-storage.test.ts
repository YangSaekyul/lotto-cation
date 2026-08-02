import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('report persistence uses one atomic database RPC', () => {
  const storage = fs.readFileSync(path.join(process.cwd(), 'lib', 'report-storage.ts'), 'utf8');
  const schema = fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');
  assert.match(storage, /rpc\/submit_store_report/);
  assert.doesNotMatch(storage, /searchParams\.set\("ip_hash"/);
  assert.match(schema, /pg_advisory_xact_lock/);
  assert.match(schema, /NOW\(\) - INTERVAL '1 hour'/);
});
