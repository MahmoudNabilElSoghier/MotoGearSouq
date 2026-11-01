# Infrastructure Rename Status (ELSAAD → MotoGearSouq)

Tracking doc for the manual dashboard renames. Code references stay
untouched until the URLs are confirmed (see commit gates).

## Status

- Repo: ✅ renamed to MotoGearSouq (remote URL already updated locally)
- Vercel project: ✅ renamed to motogearsouq (URL saved in notepad)
- Neon project: ✅ renamed to motogearsouq
- Railway: ⏸️ DEFERRED — waiting for new account (trial expired)
- Domain: ⏸️ NOT PURCHASED yet (motogearsouq.com)
- Cookie: ✅ mgs_rt (renamed in Phase 9A)
- Local folder: ⏸️ still D:\GitHub_Repos\ELSAAD (will rename after Phase 9B)

## WAITING FOR (next session prerequisites — user must provide)

1. New Railway URL (after account setup + API deploy)
2. New Vercel URL (from project settings after rename)
3. Neon hostname (verify unchanged after project rename)
4. Domain purchase confirmation (motogearsouq.com)

Then Phase 9B will:

1. Update vercel.json rewrite to new Railway URL
2. Update apps/web/.env.example API_ORIGIN
3. Update docs URLs
4. Update Railway env CORS_ORIGINS
5. Redeploy + verify

## Current (pre-rename) — for reference while Phase 9B pending

- Repo: https://github.com/MahmoudNabilElSoghier/MotoGearSouq (renamed ✅)
- Vercel URL (old): elsaad-auda2.vercel.app (now 404)
- Railway URL (old): elsaad-api.up.railway.app (decommissioned with trial)
- Neon project: motogearsouq (renamed ✅)
- Cookie: mgs_rt (renamed ✅)
- Local folder: D:\GitHub_Repos\ELSAAD (unchanged)

## Code touchpoints for Phase 9B (do not change until new URLs exist)

- vercel.json → rewrite destination ($comment carries the TODO)
- apps/web/.env.example → API_ORIGIN
- docs/DEPLOYMENT.md → Railway/Neon/Vercel URL references
- README.md → any deployed-URL references
- Railway env vars → CORS_ORIGINS with new Vercel origins
- Local folder + local repo rename (D:\GitHub_Repos\ELSAAD → MotoGearSouq)
