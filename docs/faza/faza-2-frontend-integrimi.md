# Faza 2 — Frontend + Integrimi me Backend

**Status:** 🟡 Në proces — ekranet kryesore (Home, Product Detail, Login/Register, Create Product, My Profile) implementuar, testuar dhe rindërtuar vizualisht ("Sistemi Classical", 2026-08-31); mbetet i hapur vendimi "Checkout i personalizuar"
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

- 2026-08-31 — **Rindërtim i sistemit vizual dhe i disa ekraneve kryesore**, kërkuar nga useri (skill `/frontend-design`), bazuar te `Thrifted-dizajni.pptx` ("Sistemi Classical", gusht 2026 - deck me 15 slide + 7 screenshot mockup, importuar nga useri pasi linku i Claude Design ishte i kyçur pas login-i dhe DesignSync s'u autorizua dot në këtë sesion jo-interaktiv).
  - **Tokenat e reja** (`styles.css`): paleta bazuar te slide 4 ("Sistemi vizual") - `background #F3F2F2`, `surface #FFFFFF`, `primary/aksent #B68235`, `eyebrow #7D5411` (etiketa small-caps), `textPrimary #201F1D`, `textSecondary #605D5D`; **dy fonte serif** (jo më Inter/sans) - `Cormorant Garamond` (tituj/çmime, 300/400/600, token `font-display`) + `Lora` (teksti i ndërfaqes, 400/500/600, zëvendëson `font-sans`); radius më i vogël (0.375rem base); hije shumë të lehta (ndarja vjen nga border, jo shadow).
  - **Butonat**: `components/forms/Button.tsx` variant `primary` u ndryshua nga mbushje solide (`bg-primary`) në **outline** (border + tekst aksent, sfond transparent) - asnjë buton në deck s'ka sfond të mbushur me aksent; e njëjta konventë u aplikua manualisht te të gjitha CTA-të e paskajshme nga `Button` (Navbar, Home hero, checkout success).
  - **Navigimi**: `Navbar.tsx` rishkruar (logo serif, "Katalogu", search bar inline, "?" ndihmë, "Shit tani" outline) + komponent i ri `components/layout/CategoryNav.tsx` (rreshti i dytë i tabeve të kategorive, montuar te `__root.tsx` nën `Navbar`) - përdor `CATEGORIES` ekzistuese (flat) sepse backend-i s'ka fushë të veçantë "gjini" për mega-menu dy-nivelesh siç sugjeron `thriftalflows.md`.
  - **Home** (`routes/index.tsx`): rindërtuar si **Variant A** ("Hero editorial", slide 7) - vendim i userit mes Variant A/B (slide 9), jo A/B toggle live. Hequr grid-i "Kategoritë" (zëvendësuar nga `CategoryNav` te header-i) dhe search bar-i nga hero (tashmë te navbar); shtuar rresht "Në modë" (4 produkte) para grid-it të plotë.
  - **Katalogu** (`routes/search.tsx`): filtra horizontalë individualë (Madhësia/Marka/Gjendja/Çmimi + rreshto) në vend të një butoni "Filtra" + modal (slide 10, "pa shirit anësor"). `components/navigation/FilterDropdown.tsx` **u fshi** (u zëvendësua plotësisht). "Ngjyra"/"Materiali" të deck-ut **s'u shtuan** - `ProductFilters` s'i ka fare këto fusha në backend.
  - **Posto produkt** (`routes/create-product.tsx`): wizard rindërtuar nga 3 në **4 hapa** (Foto→Detaje→Çmimi→Rishiko, slide 11) - krijimi i produktit tani ndodh **vetëm në fund** (publish), jo më në kalimin Detaje→Foto, që fotot të mund të jenë hapi i parë pa `product_id` ende.
  - **Profili publik i shitësit** (`routes/users.$id.tsx`): rindërtuar me avatar+emër serif+vlerësim+qytet+skeda (slide 14).

- **Gap-e të gjetura kundrejt deck-ut (QËLLIMISHT s'u ndërtuan si UI fiktive)**:
  - **Gate-i i verifikimit të telefonit** (slide 11): as `UserResponse` as backend s'kanë asnjë fushë telefoni/verifikimi - do të ishte një dialog bllokues mbi asgjë reale.
  - **Checkout-i i personalizuar** (slide 13: adresë + 3 metoda pagese Kartë/Portofol/Cash + tarifë mbrojtjeje + dërgesë): backend-i (`payment_service.py`) përdor **vetëm Stripe Hosted Checkout** me `product.price` (asnjë tarifë shtesë, asnjë "portofol"/"cash në dorëzim", asnjë fushë adrese) - s'u ndërtua faqe checkout-i vetjake që do të fabrikonte tarifa/metoda pagese joreale. `checkout.success.tsx` mori vetëm rifinim tokenash.
  - **"Ndiq"/Followers-Following/skeda "Të preferuarat"** te profili publik i shitësit (slide 14): s'ka koncept "follow" as te `UserResponse` as te backend; `useFavorites()` merr vetëm favoritet e VETË userit të loguar, jo të një profili tjetër publik - do të ishin buton/numra/skedë fiktive. Skeda "Të shitura" u mbajt (client-side filter mbi `product.status === "sold"`, e dhënë reale).
  - Këto tre gap-e i shtohen listës së "Probleme / Çështje të Hapura" më poshtë si vendime të hapura (kërkojnë backend të ri nëse duhen ndërtuar).
  - **AI chat widget** (`components/chat/ChatWidget.tsx`, shih §5.1 te `faza-5-ai-features.md`) mori vetëm rifinim tipografie (font-display te "Thrifty"/çmimet) - struktura/funksionaliteti mbetën të paprekura, s'ishte pjesë e 5 ekraneve të deck-ut.
  - **Testuar:** `tsc --noEmit` dhe `eslint` (mbi skedarët e prekur, duke përjashtuar zhurmën CRLF paraekzistuese në gjithë repo-n) kalojnë pa gabime; verifikuar live në browser (desktop + mobile 375px) kundër `vite dev` lokal pa backend - Home, Katalogu (me filtër kategorie aktiv), dhe redirect-i i `ProtectedRoute` te `/create-product`.

## Probleme / Çështje të Hapura

- Kujdes me route-et e reja nën një prind ekzistues: nëse prindi s'ka `<Outlet />`, fëmija s'renderohet dhe dështimi është i heshtur (pa gabim në konsolë). Përdor sufiksin `_` te segmenti i prindit kur faqja e re duhet të jetë e pavarur.
- Kujdes me `UserBadge`: default `linkToProfile=true` — nëse thirret brenda një `<Link>`/`<a>` tjetër, duhet gjithmonë `linkToProfile={false}`.
- Mbetet një "Hydration failed" gjenerik (jo më nga `<a>` i ngërthyer) në konsolë te disa faqe në dev mode — s'u hetua deri në fund pasi s'ishte pjesë e raportimit fillestar; s'u vu re efekt i dukshëm te useri (vetëm re-render normal client-side).
- **[Dy bug-e reale, gjetur dhe rregulluar gjatë implementimit të gate-it të telefonit, 2026-09-01]** (1) Early-return-i i gate-it (`create-product.tsx`) fillimisht ishte VENDOSUR PARA disa `useState`/`useEffect`, duke i thirrur ato me radhë të ndryshme mes renders (`react-hooks/rules-of-hooks`, kapur nga `eslint`, jo nga `tsc`) - zgjidhur duke e zhvendosur early-return-in PAS të gjitha hooks-eve të komponentit. (2) `PhoneVerificationModal` fillimisht thërriste `onClose()` edhe pas verifikimit të suksesshëm (jo vetëm në anulim) - te gate-i i `create-product.tsx`, `onClose` do të thotë "kthehu te ballina", kështu që useri **ridrejtohej gabimisht te Home menjëherë pasi verifikohej**, në vend që të shihte wizard-in e zhbllokuar. Kapur duke testuar live në browser (jo nga tsc/eslint - të dyja kalonin pastër). Rregulluar: verifikimi i suksesshëm thërret vetëm `onVerified()`, jo `onClose()`; `/settings` (që NUK ka semantikë "kthehu diku") e mbyll vetë modalin te `onVerified`.
- ~~Fusha "Status" në krye ("🔲 Nuk ka filluar") është e vjetruar~~ — **korrigjuar 2026-09-17** (i njëjti rishikim si te `faza-1-...md`).
- **[Vendim i hapur] Checkout i personalizuar** (deck 2026-08-31, slide 13) — a duam adresë dërgese + tarifë mbrojtjeje blerësi + metoda pagese shtesë (portofol/cash) si te thrift.al? Kërkon punë backend reale (`payment_service.py`, `Order` model) përpara se frontend-i të ndërtojë UI-në - aktualisht vetëm Stripe Hosted Checkout, çmimi i produktit pa tarifa.
- **[x→hequr] Verifikimi i numrit të telefonit — implementuar 2026-08-31/09-01, GATE-I HEQUR 2026-09-06 me kërkesë të userit** ("nuk eshte e nevojshme te verifikoj telefonin" për të postuar produkt). `POST /users/me/phone/send-code` + `POST /users/me/phone/verify` (backend) dhe `components/user/PhoneVerificationModal.tsx` (frontend) **mbeten në kod**, të papërdorura si detyrim - verifikimi mbetet i mundshëm vetëm si opsion vullnetar te `/settings` (badge "Verifikuar" + buton "Ndrysho"/"Shto numrin"). U hoq vetëm early-return-i bllokues te `CreateProductPage` (`routes/create-product.tsx`) - wizard-i i postimit tani hapet direkt për çdo user të loguar, pavarësisht `is_phone_verified`. **Testuar live**: user testues i ri, i paverifikuar → `/create-product` shfaq direkt Hapin 1 (Fotot), pa dialog. Backend-i s'e ka detyruar kurrë gate-in server-side te `POST /products` (shih faza-1) - kështu që hequrja e gate-it frontend ishte e mjaftueshme, pa nevojë ndryshimi backend.
- **[x] "Follow" shitësi — IMPLEMENTUAR 2026-09-01** (backend + frontend, shih `faza-1-backend-db-auth-products.md`): `POST`/`DELETE /users/{id}/follow`, `followers_count`/`following_count`/`is_following` te `UserResponse`, buton "Ndiq" + numra te `users.$id.tsx`, testuar 21/21 kundër DB lokale reale. **Mbetet e hapur** vetëm: njoftimi automatik i ndjekësve kur shitësi postos produkt të ri (slide 14, "Ndjekja si kanal") - kërkon hook të ri te `create_product` + `Notification`.
