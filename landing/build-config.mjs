// Vercel build step: generate config.js from environment variables so the
// Supabase values never live in git. Set SUPABASE_URL and SUPABASE_ANON_KEY
// in the Vercel project's Environment Variables (the anon key is public by
// design — RLS protects the data, not key secrecy).
//
// Missing or malformed values are NOT a build failure: the script skips the
// write, logs why, and the page degrades to its "waitlist opens soon" state.
import { writeFileSync } from 'node:fs';

const url = (process.env.SUPABASE_URL || '').trim();
const key = (process.env.SUPABASE_ANON_KEY || '').trim();
const version = (process.env.BUILD_VERSION || 'v1.0.0').trim();
const date = (process.env.BUILD_DATE || new Date().toISOString().slice(0, 10)).trim();

const URL_RE = /^https:\/\/[a-z0-9-]+\.supabase\.co$/;

if (!URL_RE.test(url) || key.length <= 20) {
  const reason = !url && !key
    ? 'SUPABASE_URL and SUPABASE_ANON_KEY are not set'
    : !URL_RE.test(url)
      ? `SUPABASE_URL is malformed (${JSON.stringify(url)})`
      : 'SUPABASE_ANON_KEY is missing or too short';
  console.warn(`[build-config] skipping config.js: ${reason}. ` +
    'The waitlist will show "opens soon" until the env vars are set.');
  process.exit(0);
}

const body = `/* Generated at deploy time by build-config.mjs — do not edit or commit. */
window.LAVA_CONFIG = {
  SUPABASE_URL: ${JSON.stringify(url)},
  SUPABASE_ANON_KEY: ${JSON.stringify(key)},
  WAITLIST_TABLE: 'waitlist',
  BUILD_VERSION: ${JSON.stringify(version)},
  BUILD_DATE: ${JSON.stringify(date)}
};
`;

writeFileSync(new URL('./config.js', import.meta.url), body);
console.log(`[build-config] wrote config.js for ${url} (${version}, ${date})`);
