---
title: "دليل المستندات — مقابلة الحج تامر"
date: 2026-10-31
author: محمود نبيل الصغير
lang: ar
dir: rtl
---

# دليل المستندات

هذا المجلد يحتوي على 9 مستندات منفصلة لمقابلة الحج تامر — شركة السعد للدراجات النارية.

## الملفات

| # | الملف | الغرض | الصفحات المتوقعة |
|---|---|---|---|
| 1 | `01-executive-summary.md` | ملخص تنفيذي — الصفحة الأولى | 1 |
| 2 | `02-interview-agenda.md` | جدول المقابلة + 8 أسئلة | 2 |
| 3 | `03-vision-roadmap.md` | الرؤية — 5 مراحل | 3 |
| 4 | `04-break-even-framework.md` | الإطار المحاسبي + مثال | 2 |
| 5 | `05-sales-growth-plan.md` | خطة نمو المبيعات | 2 |
| 6 | `06-pricing-packages.md` | 3 باقات + ملاحظات | 1 |
| 7 | `07-value-proposition.md` | 4 نقاط القيمة | 1 |
| 8 | `08-next-steps.md` | الخطوة الجاية + الـ ask | 1 |
| 9 | `09-checklist-and-notes.md` | Checklist + ملاحظات ذهبية | 2 |

## التحويل إلى Word باستخدام Pandoc

```bash
cd docs/interview-2026-10-31

# تحويل كل الملفات إلى ملف Word واحد
pandoc 0*.md \
  --from markdown \
  --to docx \
  --output ../../ELSAAD-Interview-Haj-Tamer.docx \
  --toc \
  --toc-depth=2 \
  --number-sections \
  --reference-doc=../../reference.docx