# Faza 2 — Frontend + Integrimi me Backend

**Status:** 🔲 Nuk ka filluar
**Varet nga:** Faza 1 (endpoints e auth + products duhet të jenë gati)
**Referenca:** [`00-dokumentacion-master.md`](../00-dokumentacion-master.md) §10, §11

## Qëllimi

Ndërtimi i frontend-it (React + TS + Tailwind) dhe lidhja me API-n e Fazës 1.

## Checklist

### Setup
- [ ] Struktura `src/pages`, `src/components`, `src/api`, `src/hooks`
- [ ] Axios client + interceptors (JWT token, refresh/expiry handling)
- [ ] React Query setup

### Ekranet (UX Flow §10)
- [x] **Home / Browse** — listë produktesh aktive (verifikuar manualisht 2026-08-20)
- [x] **Product Detail** — foto, çmim, condition, shitësi, Buy/Bid sipas `selling_type` (verifikuar manualisht 2026-08-20)
- [x] **Login / Register** — verifikuar manualisht 2026-08-20; redirect pas login-it te `redirect_to` ekziston (`requireAuth` te `products.$id.tsx`)
- [x] **Create Product** — form 3-hapësh, verifikuar manualisht 2026-08-20 (shih bugfix foto-je më sipër)
- [x] **My Profile** — tabs Produktet/Blerjet/Shitjet/Favoritet/Ofertat, verifikuar manualisht 2026-08-20

### Integrim
- [ ] Auth flow i plotë (register → verify email → login → logout)
- [ ] CRUD Products i lidhur me backend
- [ ] Upload imazhesh nga forma → backend → Cloudinary/S3
- [ ] Error handling & loading states (React Query)

## Vendime & Ndryshime

- 2026-08-20 — **Bugfix: editimi i produktit s'funksiononte fare.** Skedari `routes/products.$id.edit.tsx` e regjistronte route-in `/products/$id/edit` si **fëmijë** të `/products/$id` (konventë e file-based routing te TanStack Router). Meqë `products.$id.tsx` s'renderon `<Outlet />`, faqja e editimit s'shfaqej kurrë — URL-ja ndryshonte, por përmbajtja mbetej faqja e produktit. U zgjidh duke e riemërtuar skedarin në `products.$id_.edit.tsx` (underscore-i pas segmentit të prindit = route jo-i-ndërthurur). URL-ja publike mbetet e pandryshuar: `/products/{id}/edit`.
- 2026-08-20 — **Bugfix: `<a>` i ngërthyer brenda `<a>` te Product Detail (`routes/products.$id.tsx`).** Kutia e shitësit e mbështillte `<UserBadge>` me një `<Link>` të vetin, ndërsa `UserBadge` (default `linkToProfile=true`) prodhon vetë një `<Link>` tjetër përreth përmbajtjes — HTML e pavlefshme që shkaktonte "Hydration failed" në çdo hapje të faqes së produktit (React bënte full client re-render, jo hydration normale) dhe click-e të papërcaktueshme brenda kutisë. U shtua `linkToProfile={false}` te thirrja (`users.$id.tsx` e kishte tashmë saktë). Kontrollo çdo përdorim të ri të `UserBadge` brenda një `<Link>`-i prindëror.
- 2026-08-20 — **Bugfix: kategoria shfaqej si slug i papërpunuar** (`"mens"` në vend të `"Rroba meshkuj"`) te breadcrumb-i dhe rreshti "Kategoria" i Product Detail — të gjitha ekranet e tjera (ballina, `create-product`, `search`) e mapojnë `category` përmes `CATEGORIES` (`lib/constants.ts`), por `products.$id.tsx` e printonte drejtpërdrejt. Rregulluar me të njëjtin pattern `CATEGORIES.find(...)?.label ?? raw`.
- 2026-08-20 — **Produktet mund të publikoheshin pa asnjë foto**, pa asnjë warning — shpjegonte pse shumica e listimeve në DB (edhe seed-i) shfaqen "pa foto". `create-product.tsx` kishte tashmë llogaritur `canGoNext` (kërkon `files.length > 0` në hapin "Foto"), po butoni "Vazhdo" i hapit 2 s'e përdorte fare atë vlerë. U shtua `disabled={!canGoNext}` + mesazh i dukshëm nën zonën e upload-it.
- 2026-08-20 — Shtuar `EmailVerificationBanner` (`components/layout/EmailVerificationBanner.tsx`), i renderuar globalisht te `__root.tsx` nën `<Navbar />`: banner i përhershëm kur useri i loguar s'e ka verifikuar email-in, me buton "Ridërgo email-in" (`authApi.resendVerification`, i ri) + cooldown 30s. Më parë vetëm një toast 4-sekondësh te checkout-i i dështuar e tregonte problemin, pa asnjë rrugë veprimi nga app-i. Shih edhe bugfix-in e lidhur te `verify-email` në `faza-1-backend-db-auth-products.md`.

## Probleme / Çështje të Hapura

- Kujdes me route-et e reja nën një prind ekzistues: nëse prindi s'ka `<Outlet />`, fëmija s'renderohet dhe dështimi është i heshtur (pa gabim në konsolë). Përdor sufiksin `_` te segmenti i prindit kur faqja e re duhet të jetë e pavarur.
- Kujdes me `UserBadge`: default `linkToProfile=true` — nëse thirret brenda një `<Link>`/`<a>` tjetër, duhet gjithmonë `linkToProfile={false}`.
- Mbetet një "Hydration failed" gjenerik (jo më nga `<a>` i ngërthyer) në konsolë te disa faqe në dev mode — s'u hetua deri në fund pasi s'ishte pjesë e raportimit fillestar; s'u vu re efekt i dukshëm te useri (vetëm re-render normal client-side).
- Fusha "Status" në krye ("🔲 Nuk ka filluar") është e vjetruar — ekranet kryesore (Home, Product Detail, Login/Register, Create Product, My Profile) janë dukshëm të implementuara dhe funksionale; s'u ndryshua këtu për të njëjtën arsye si te `faza-1-...md`.
