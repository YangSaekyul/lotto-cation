import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStoreReport } from '../lib/report-validation';

test('report validation rejects malformed inputs', () => {
  const valid = { storeId: '123', reportType: 'closed', detail: '충분한 상세 내용입니다.' };
  assert.equal(validateStoreReport(valid).ok, true);
  assert.equal(validateStoreReport({ ...valid, reportType: 'invalid' }).ok, false);
  assert.equal(validateStoreReport({ ...valid, detail: '짧음' }).ok, false);
  assert.equal(validateStoreReport({ ...valid, detail: 'x'.repeat(1001) }).ok, false);
  assert.equal(validateStoreReport({ ...valid, reporterEmail: 'bad' }).ok, false);
  assert.equal(validateStoreReport({ ...valid, honeypot: 'bot' }).ok, false);
});
