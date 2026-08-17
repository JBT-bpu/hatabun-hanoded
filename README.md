# הטאבון הנודד

אתר תדמית אינטראקטיבי לטאבון הנודד — חוויית אש ניידת לאירועים.

## קישורים

- אתר פעיל: https://hatabun-hanoded.jbt.chatgpt.site/
- בונה פוקאצ׳ה: https://hatabun-hanoded.jbt.chatgpt.site/#menu

## פיתוח

נדרש Node.js בגרסה 22.13 ומעלה.

```bash
npm ci
npm run dev
npm run build
npm test
```

## פריסה

- יעד הייצור הוא Vercel באמצעות export סטטי של `vinext`.
- `npm run build:vercel` מייצר פלט נייד תחת `dist/client`.
- חיבור Sites/Cloudflare נשמר כאדפטר Preview נפרד ואינו חלק מליבת האתר.
- הקוד ב־`app/` והנכסים ב־`public/` אינם תלויים בספק אירוח מסוים.

## מבנה

- `app/` — עמוד האתר, אנימציות ועיצוב.
- `public/brand/` — נכסי המותג הפעילים.
- `public/campaign/` — תמונות הקמפיין הפעילות.
- `tests/` — בדיקות רינדור ותנועה.
- `vite.config.ts` — בחירת אדפטר לפי יעד הפריסה.
- `.openai/hosting.json` — הגדרת סביבת Preview של Sites בלבד.

## כללי עבודה

- `main` היא הגרסה המאושרת האחרונה.
- לא מוסיפים קבצי build, ארכיוני פריסה או חומרי גלם כפולים ל־Git.
- לפני שמירה או פרסום מריצים `npm run build`.
- תוכן התפריט והתמונות עדיין בטיוטה ויוחלפו כשהלקוח יעביר חומר סופי.
