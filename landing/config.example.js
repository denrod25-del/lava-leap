/* Lava Leap — runtime config
 * 1. Copy this file to `config.js` (same folder as index.html).
 * 2. Paste your real Supabase Project URL + anon public key.
 * 3. `config.js` is gitignored so keys never land in version control.
 *    The anon key is safe to ship to browsers — Row Level Security,
 *    not key secrecy, is what protects your data.
 * 4. Reference it in index.html BEFORE the main script:
 *      <script src="/config.js"></script>
 */
window.LAVA_CONFIG = {
  SUPABASE_URL: 'https://xxxxxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...your-anon-key...',
  WAITLIST_TABLE: 'waitlist',
  BUILD_VERSION: 'v1.0.0',
  BUILD_DATE: '2026-07-05'
};
