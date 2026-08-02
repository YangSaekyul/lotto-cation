#!/usr/bin/env node
const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.log('Report retention purge skipped: Supabase secrets are not configured.');
  process.exit(0);
}

const cutoff = new Date();
cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
const endpoint = new URL(`${url}/rest/v1/store_reports`);
endpoint.searchParams.set('created_at', `lt.${cutoff.toISOString()}`);

const response = await fetch(endpoint, {
  method: 'DELETE',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: 'return=minimal',
  },
});

if (!response.ok) {
  throw new Error(`Report retention purge failed with HTTP ${response.status}`);
}
console.log(`Reports older than ${cutoff.toISOString()} were purged.`);
