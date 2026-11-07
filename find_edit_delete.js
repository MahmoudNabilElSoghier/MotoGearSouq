const fs = require('fs');
const c = fs.readFileSync('apps/web/app/[locale]/admin/landing/page.tsx', 'utf8');
const lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('t("edit")') || lines[i].includes('t("delete")')) {
    console.log((i+1) + ': ' + lines[i]);
  }
}