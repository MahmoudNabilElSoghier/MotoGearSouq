const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../apps/web/messages/en.json');
const arPath = path.join(__dirname, '../apps/web/messages/ar.json');

const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arJson = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const namespacesToVerify = ['sidebar', 'nav', 'header', 'common', 'cart'];

let hasError = false;

// ---------------------------------------------------------------------------
// Language-of-value audit:
//   1. ar.json values that are entirely English  -> someone forgot to translate
//   2. en.json values that are entirely Arabic   -> Arabic leaked into en.json
// Allowed exceptions: brand names, URLs, emails, identifiers.
// ---------------------------------------------------------------------------
const BRAND_ALLOWLIST = [
  'MotoGearSouq',
  'ELSAAD',
  'ELFADY',
  'ELSAAD Motorcycle',
  'WhatsApp',
];

// Keys whose value is intentionally in the OTHER language on purpose.
//   switcher.* — the locale switcher shows the TARGET language in its own
//   name (AR button says "English", EN button says "العربية") by design.
const VALUE_KEY_ALLOWLIST = [
  'switcher.english',
  'switcher.arabic',
];

// English letters + basic sentence punctuation only (no digits, no emoji,
// no '/' or '@' so URLs/emails/paths never match).
const ENGLISH_ONLY_RE = /^[A-Za-z\s.,!?'":;()&+\-]+$/;
const ARABIC_ONLY_RE = /^[\u0600-\u06FF\s.,!?'":;()\-\u2014]+$/;
const HAS_LATIN_RE = /[A-Za-z]/;

function isEnglishOnlyValue(v) {
  if (typeof v !== 'string') return false;
  const t = v.trim();
  if (!t) return false;
  if (!/[A-Za-z]/.test(t)) return false;            // needs at least one letter
  if (!ENGLISH_ONLY_RE.test(t)) return false;
  if (t.includes('://') || t.startsWith('www.')) return false; // URL
  if (t.includes('@')) return false;                // email / handle
  if (BRAND_ALLOWLIST.some((b) => t.toLowerCase() === b.toLowerCase())) return false;
  return true;
}

function isArabicOnlyValue(v) {
  if (typeof v !== 'string') return false;
  const t = v.trim();
  if (!t) return false;
  if (!/[\u0600-\u06FF]/.test(t)) return false;      // needs at least one Arabic char
  if (HAS_LATIN_RE.test(t)) return false;           // mixed / contains English
  if (t.includes('://') || t.includes('@') || t.includes('/')) return false; // URL/email/path
  if (BRAND_ALLOWLIST.some((b) => t.toLowerCase() === b.toLowerCase())) return false;
  return true;
}

function walkValues(obj, prefix, visit) {
  for (const [k, v] of Object.entries(obj)) {
    const keyPath = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object') {
      walkValues(v, keyPath, visit);
    } else {
      visit(keyPath, v);
    }
  }
}

walkValues(arJson, '', (keyPath, v) => {
  if (VALUE_KEY_ALLOWLIST.includes(keyPath)) return;
  if (isEnglishOnlyValue(v)) {
    console.error(`❌ [ar.json is ENGLISH] ${keyPath}: ${JSON.stringify(v)}`);
    hasError = true;
  }
});

walkValues(enJson, '', (keyPath, v) => {
  if (VALUE_KEY_ALLOWLIST.includes(keyPath)) return;
  if (isArabicOnlyValue(v)) {
    console.error(`❌ [en.json is ARABIC] ${keyPath}: ${JSON.stringify(v)}`);
    hasError = true;
  }
});

for (const ns of namespacesToVerify) {
  const enNs = enJson[ns] || {};
  const arNs = arJson[ns] || {};
  const enKeys = Object.keys(enNs);
  const arKeys = Object.keys(arNs);

  for (const k of enKeys) {
    if (!(k in arNs)) {
      console.error(`❌ Missing in ar.json under namespace '${ns}': ${k}`);
      hasError = true;
    }
  }

  for (const k of arKeys) {
    if (!(k in enNs)) {
      console.error(`❌ Missing in en.json under namespace '${ns}': ${k}`);
      hasError = true;
    }
  }
}

if (hasError) {
  console.error('\n❌ i18n verification failed (missing keys or wrong-language values)!');
  process.exit(1);
} else {
  console.log('✅ All core i18n namespaces (sidebar, nav, header, common, cart) verified successfully!');
  console.log('✅ Language-of-value audit passed (no English values in ar.json, no Arabic values in en.json)!');
  process.exit(0);
}
