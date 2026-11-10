const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../apps/web/messages/en.json');
const arPath = path.join(__dirname, '../apps/web/messages/ar.json');

const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arJson = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const namespacesToVerify = ['sidebar', 'nav', 'header', 'common', 'cart'];

let hasError = false;

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
  console.error('\n❌ i18n verification failed for core namespaces!');
  process.exit(1);
} else {
  console.log('✅ All core i18n namespaces (sidebar, nav, header, common, cart) verified successfully!');
  process.exit(0);
}
