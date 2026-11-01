# Infrastructure Rename Status (ELSAAD → MotoGearSouq)

Tracking doc for the manual dashboard renames. Code references stay
untouched until the URLs are confirmed (see commit gates).

## Current (pre-rename)

- Repo: https://github.com/MahmoudNabilElSoghier/ELSAAD
- Vercel URL: elsaad-auda2.vercel.app
- Railway URL: elsaad-api.up.railway.app
- Neon project: elsaad
- Cookie: elsaad_rt
- Local folder: D:\GitHub_Repos\ELSAAD

## Post-rename (to fill in after manual steps)

- Repo: https://github.com/MahmoudNabilElSoghier/MotoGearSouq
- Vercel URL: _______________
- Railway URL: _______________
- Neon project: motogearsouq
- Cookie: mgs_rt
- Local folder: D:\GitHub_Repos\MotoGearSouq

## Manual steps (user)

1. GitHub: rename repo ELSAAD → MotoGearSouq (remote URL updates automatically;
   local remote keeps working until folder rename)
2. Vercel: rename project elsaad → motogearsouq (URL changes; update
   NEXT_PUBLIC_SITE_URL + CORS_ORIGINS afterwards)
3. Railway: rename service elsaad-api → motogearsouq-api (URL changes;
   update vercel.json rewrite + CORS_ORIGINS + NEXT_PUBLIC_API_URL)
4. Neon: rename project elsaad → motogearsouq (verify whether DB hostname
   changes — if yes, update DATABASE_URL in .env + Railway env vars)

## Code touchpoints for the follow-up pass (Phase 9 — do not change yet)

- vercel.json → rewrite destination (TODO comment added, not committed)
- apps/api/.env + Railway CORS_ORIGINS → new origins
- apps/web/.env(.local) → NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_API_URL
- Cookie name elsaad_rt → mgs_rt (middleware + API + README/ARCHITECTURE docs)
- Local folder + git remote URL after GitHub rename
