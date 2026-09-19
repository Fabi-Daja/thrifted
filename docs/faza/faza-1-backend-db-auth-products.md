# Faza 1 — Backend + DB + Auth + Products

**Status:** 🟡 Në proces — Auth bazë (register/login/verify-email), Profile, Products CRUD, follow, verifikim telefoni (opsional) implementuar dhe testuar; mungojnë ende logout/forgot-password/reset-password/change-password dhe testet e automatizuara (unit/integration)
**Varet nga:** —
**Referenca:** [`00-dokumentacion-master.md`](../00-dokumentacion-master.md) §3, §5, §7 (US-01→US-17), §8, §9

## Qëllimi

Ngritja e bazës së backend-it: databaza, autentikimi (JWT + email verification), CRUD për Products, upload i imazheve.

## Checklist

### Setup
- [ ] FastAPI project skeleton (`app/models`, `app/schemas`, `app/routers`, `app/services`, `app/core`)
- [ ] PostgreSQL + SQLAlchemy + Alembic (migrime fillestare)
- [ ] `.env` / config (DB URL, JWT secret, SMTP për email)

### Databaza (ERD §8 — bërthama)
- [ ] Modeli `Users` (email/username unik, password_hash, is_email_verified, rating_avg, rating_count)
- [ ] Modeli `Categories` (self-referencing parent_id)
- [ ] Modeli `Products` (owner_id, category_id, selling_type, status)
- [ ] Modeli `Product_Images` (max 10/product — validuar në service layer, jo DB constraint)
- [ ] UUID si primary key kudo

### Authentication (US-01 → US-07)
- [x] `POST /auth/register`
- [x] `GET /auth/verify-email` (jo `POST` siç ishte planifikuar fillimisht — shih shënimin 2026-08-20 te "Vendime & Ndryshime")
- [x] `POST /auth/login` (JWT)
- [ ] `POST /auth/logout`
- [ ] `POST /auth/forgot-password`
- [ ] `POST /auth/reset-password`
- [ ] `POST /auth/change-password`
- [ ] Middleware: rrugë të mbrojtura kërkojnë email të verifikuar

### User Profile (US-08 → US-11)
- [x] `GET /users/me`
- [x] `PATCH /users/me` — ekzistonte në backend, po s'kishte UI. 2026-08-20: u shtua faqja `/settings` ("Konfigurimet", link te `/me` dhe menuja e navbar-it) për të ndryshuar emrin, username-in, vendndodhjen dhe bio-n.
- [x] `GET /users/{id}` (publik)
- [x] `GET /users/me/purchases` — shih shënimin te `faza-4-bids-chat.md`
- [x] `GET /users/me/sales` — shih shënimin te `faza-4-bids-chat.md`
- [x] `POST /users/me/avatar` — 2026-08-20 (shtesë e re, s'ishte në planin fillestar): ngarkim i fotos së profilit në Cloudinary (i njëjti model si `POST /products/{id}/images`), i integruar te `/settings`.
- [x] `POST /users/me/phone/send-code` + `POST /users/me/phone/verify` — 2026-08-31 (shtesë e re, kërkuar nga useri për të përputhur backend-in me gate-in e verifikimit të telefonit nga `Thrifted-dizajni.pptx`, shih `faza-2-frontend-integrimi.md`): fusha të reja te `User` (`phone_number`, `is_phone_verified`, + gjendje interne OTP-je), migrim Alembic `a3b4c5d6e7f8`, kod 6-shifror i hash-uar (jo tekst i thjeshtë), skadim 10 min, max 5 tentativa, cooldown 60s ripërsëritje. `app/core/sms.py` — **s'ka ende ofrues real SMS të konfiguruar**, kodi logohet në konsolë (fallback dev, shih env `SMS_PROVIDER_URL`/`SMS_PROVIDER_API_KEY`). `UserResponse` publik mori `is_phone_verified` (badge besueshmërie, i sigurt publikisht); `phone_number` vetë mbetet vetëm te `UserPrivateResponse` (`/users/me`), s'del kurrë te `GET /users/{id}`.
- [x] `POST /users/{id}/follow` + `DELETE /users/{id}/follow` — 2026-09-01 (shtesë e re, gap-i i dytë nga 3 i flag-uar te `faza-2-frontend-integrimi.md` pas rindërtimit të frontend-it): tabelë e re `follows` (migrim `b4c5d6e7f8a9`, `follower_id`/`followed_id` → `users.id` `ondelete="CASCADE"` që në fillim, `UniqueConstraint` + `CheckConstraint("follower_id != followed_id")` në DB, jo vetëm kontroll aplikacioni). Idempotente (ndryshe nga `POST /favorites/{id}` që kthen 404 nëse ekziston tashmë - shih bug-un e njohur te "Probleme" më poshtë). `UserResponse` mori `followers_count`/`following_count`/`is_following` - **jo kolona te modeli**, llogariten në çast (`COUNT` mbi `follows`) nga `_attach_follow_stats()` te `routers/users.py` dhe bashkëngjiten si atribute jo-persistente para serializimit; `is_following` mbetet `None` për guest ose kur shikon profilin tënd (`GET /users/{id}` përdor tani `get_current_user_optional`). Frontend: `hooks/useFollow.ts` + buton "Ndiq"/"Duke ndjekur" + numra Ndjekës/Ndjek te `users.$id.tsx`.

### Products (US-12 → US-17)
- [ ] `POST /products` (vetëm user i verifikuar)
- [ ] `GET /products/{id}`
- [ ] `PATCH /products/{id}` (vetëm owner)
- [ ] `DELETE /products/{id}` (vetëm owner)
- [x] `PATCH /products/{id}/archive` — 2026-08-20: u korrigjua gabimi i shkrimit në backend (`/archieve` → `/archive`); endpoint-i i dokumentuar kthente 404 sepse frontend-i thërriste drejtshkrimin e saktë.
- [x] `GET /products?owner_id=` — 2026-08-20: **bugfix.** `GET /products` s'e pranonte fare parametrin `owner_id` (FastAPI e injoron çdo query param të padeklaruar), ndonëse frontend-i e dërgonte prej kohësh te `/me` (tab "Produktet") dhe te `/users/$id` (profili publik). Rrjedhimi: "Produktet e mia" shfaqte produktet e **të gjithë** userave (aktive, të paginuara), jo vetëm të userit të loguar. U shtua parametri `owner_id: uuid.UUID | None` te `get_products()` në `app/routers/product.py`, me `query.filter(Product.owner_id == owner_id)`.
- [ ] `POST /products/{id}/images` (max 10, integrim Cloudinary/S3)
- [ ] `DELETE /products/{id}/images/{imageId}`
- [ ] Validim: statuset `Draft → Active → Reserved → Sold/Archived`

### Testim
- [ ] Unit/integration tests për auth flow
- [ ] Unit/integration tests për Products CRUD + rregullat e biznesit (§3)

## Vendime & Ndryshime

_(Shto këtu çdo vendim të ri ose ndryshim nga plani fillestar, me datë. P.sh.: "2026-08-20 — Redis u hoq nga MVP, shtohet vetëm nëse nevojitet rate-limiting.")_

- 2026-08-20 — **Bugfix kritik: verifikimi i email-it ishte plotësisht i pakalueshëm nga UI.** Tre probleme të lidhura, të gjitha rregulluar: (1) `send_verification_email()` (`app/core/email.py`) e ndërtonte linkun drejt backend-it të hardkoduar (`http://127.0.0.1:8000/auth/verify-email?...`) në vend të `FRONTEND_URL`, ndryshe nga `send_password_reset_email()` që e bënte saktë — në prod linku do të ishte plotësisht i thyer, dhe në dev anashkalonte faqen `/verify-email` të frontend-it (spinner + UI); (2) edhe sikur useri të hapte manualisht `/verify-email?token=...`, `authApi.verifyEmail()` në frontend thërriste `POST /auth/verify-email` me `{token}` në body, ndërsa endpoint-i real është `GET /auth/verify-email?token=...` — do të dështonte gjithmonë me 405/422; (3) `POST /auth/resend-verification` ekzistonte në backend por s'thirrej kurrë nga frontend-i — useri s'kishte asnjë mënyrë të ridërgonte email-in nëse e humbte. Rrjedhimi total: **asnjë user s'mund ta verifikonte email-in kurrë nëpërmjet app-it**, edhe pse `is_email_verified` bllokon blerjet (`payment_service.py`). U shtua edhe `authApi.resendVerification()` + një banner i përhershëm (`EmailVerificationBanner`, shih `faza-2-frontend-integrimi.md`) që e bën këtë të dukshme dhe të veprueshme nga vetë useri, jo vetëm një toast gabimi te checkout.
- 2026-08-31 — **Verifikim numri telefoni (backend).** Useri kërkoi "rregullo backend qe te perputhet me flow te frontend" pas rindërtimit të frontend-it sipas `Thrifted-dizajni.pptx`; nga 3 gap-et e flag-uara (checkout i personalizuar, follow shitësi, verifikim telefoni), zgjodhi verifikimin e telefonit të parin (më i vogël, i vetëmbyllur, pa varësi nga logjika financiare ekzistuese). Implementuar: `app/models/user.py` (6 fusha të reja), `app/core/sms.py` (OTP + dërgim me fallback log në mungesë të ofruesit), `app/schemas/phone.py`, `app/routers/users.py` (2 endpoints të rinj + `UserPrivateResponse` i ri për të mos rrjedhur `phone_number` publikisht). **Testuar me skript i vetëdedikuar (jashtë repo-s, jo i commituar) kundër DB lokale reale** (jo mock) — 16 kontrolle: 401 pa token, validim numri (422), dërgim i suksesshëm, cooldown (429), kod i gabuar (400 + numërim tentativash), kod korrekt (200 + `is_phone_verified=true`), idempotencë e verifikimit të dytë, dhe **kontrolli kritik i privatësisë**: `GET /users/{id}` publik s'e kthen `phone_number` fare (por e kthen `is_phone_verified`), ndërsa `GET /users/me` e kthen. **16/16 PASS.** User-i testues (`e2e-phonetest-*@example.com`) u fshi menjëherë pas ekzekutimit, verifikuar 0 mbetje në DB. **[Vendim i hapur, jo trajtuar këtu]** gate-i aktual s'zbatohet ende server-side te `POST /products` (as `is_email_verified` s'zbatohet atje sot) — mbetet vendim i frontend-it/UX-it nëse duhet edhe UI-ja e vetë gate-it (dialogu para postimit) dhe/ose enforcim i vërtetë në `create_product`.
- 2026-09-01 — **Follow shitësi (backend + frontend).** Useri kërkoi "vazhdo me implementimin e follow" — gap-i i dytë nga 3 (checkout, follow, telefon) i flag-uar te `faza-2-frontend-integrimi.md`. Implementuar: `app/models/follow.py` (tabelë `follows`, `UniqueConstraint` + `CheckConstraint` anti-self-follow në DB që në fillim, `ondelete="CASCADE"` që në fillim - mësimi nga bug-u i `product_image_embeddings`, `faza-5-ai-features.md`), migrim `b4c5d6e7f8a9`, `_attach_follow_stats()` (helper i ri te `routers/users.py`, thirret në **çdo** endpoint që kthen `UserResponse`/`UserPrivateResponse` - `/me`, `PATCH /me`, avatar, phone/*, `/{id}`, follow/unfollow - përndryshe `followers_count`/`following_count` do të mbeteshin gabimisht `0` nga default-i i schema-s). `POST`/`DELETE /users/{id}/follow` **idempotente** (ndryshe nga `POST /favorites/{id}` - shih bug-un e njohur te "Probleme"). `GET /users/{id}` tani përdor `get_current_user_optional` (jo më publik pa auth fare) për të llogaritur `is_following` kur viewer-i është i loguar. **Testuar me skript i vetëdedikuar (jashtë repo-s) kundër DB lokale reale** — 21 kontrolle: 401 pa token, 400 self-follow, 404 user inekzistent, follow i suksesshëm + counts, idempotencë follow (1 rresht i vetëm në DB pas 2 thirrjesh), `is_following` korrekt për viewer/guest/vetë-profil, `phone_number` ende s'rrjedh publikisht (regresion i testuar eksplicit nga faza e mëparshme), unfollow + idempotencë, 0 rreshta në DB pas unfollow. **21/21 PASS.** Dy userat testues (`e2e-followtest-alice-*`/`e2e-followtest-bob-*`) dhe rreshtat `follows` u fshinë menjëherë, verifikuar 0 mbetje. Frontend: `api/usersApi.ts::follow/unfollow`, `hooks/useFollow.ts::useToggleFollow`, buton "Ndiq"/"Duke ndjekur" + numra Ndjekës/Ndjek te `routes/users.$id.tsx` (i fshehur kur viewer-i shikon profilin e vet ose s'është i loguar). **[Vendim i hapur]** njoftimi i ndjekësve kur shitësi postos produkt të ri (slide 14: "Ndjekja si kanal") s'u implementua - kërkon hook të ri te `create_product` + `Notification`, jashtë qëllimit të kësaj sesioni.
- 2026-08-20 — Shtuar `ProductCategory(str, Enum)` te `app/schemas/product.py` (vlerat duhet të përputhen saktë me `CATEGORIES` te `frontend/src/lib/constants.ts`: `womens/mens/shoes/accessories/bags/kids`) dhe u përdor për `category` te `ProductCreate`/`ProductUpdate` — më parë ishte `str` i lirë, që lejoi të dhëna si `"Footwear"`/`"Clothing"` të futeshin në DB (nga seed/testime), duke bërë që `GET /products?category=shoes` të mos i gjente fare ato produkte (filtrim exact-match). Normalizuar edhe të dhënat ekzistuese në DB-në lokale me këtë mapping (shih shënimin përkatës te `faza-2-frontend-integrimi.md`).

## Probleme / Çështje të Hapura

- ~~Fusha "Status" në krye të kësaj faze ("🔲 Nuk ka filluar") është e vjetruar~~ — **korrigjuar 2026-09-17**, gjatë një rishikimi të kërkuar nga useri ("çfarë kemi për të mbyllur te projekti aktual"). Mbeten ende hapur, konkretisht: `POST /auth/logout`, `/forgot-password`, `/reset-password`, `/change-password` (asnjë s'ekziston ende); middleware që kërkon email të verifikuar për rrugë të mbrojtura (sot enforcohet vetëm te pagesa, jo në mënyrë të përgjithshme); dhe teste të automatizuara (unit/integration) të commituara në repo — çdo testim deri tani ka qenë manual ose me skript të përkohshëm, jashtë repo-s.
