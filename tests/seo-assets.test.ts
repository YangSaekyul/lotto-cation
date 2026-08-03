import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('browser icon and Google crawl endpoints are present', () => {
  for (const relativePath of ['app/icon.svg', 'app/robots.ts', 'app/sitemap.ts']) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, `${relativePath} must exist`);
  }
  const layout = fs.readFileSync(path.join(root, 'app/layout.tsx'), 'utf8');
  assert.match(layout, /metadataBase/);
  assert.match(layout, /lotto-ri\.vercel\.app/);
  assert.match(layout, /application\/ld\+json/);
});
