# Faza 1 — Backend + DB + Auth + Products

**Status:** 🔲 Nuk ka filluar
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
- 2026-08-20 — Shtuar `ProductCategory(str, Enum)` te `app/schemas/product.py` (vlerat duhet të përputhen saktë me `CATEGORIES` te `frontend/src/lib/constants.ts`: `womens/mens/shoes/accessories/bags/kids`) dhe u përdor për `category` te `ProductCreate`/`ProductUpdate` — më parë ishte `str` i lirë, që lejoi të dhëna si `"Footwear"`/`"Clothing"` të futeshin në DB (nga seed/testime), duke bërë që `GET /products?category=shoes` të mos i gjente fare ato produkte (filtrim exact-match). Normalizuar edhe të dhënat ekzistuese në DB-në lokale me këtë mapping (shih shënimin përkatës te `faza-2-frontend-integrimi.md`).

## Probleme / Çështje të Hapura

- **Fusha "Status" në krye të kësaj faze ("🔲 Nuk ka filluar") është e vjetruar** — shumica e checklist-it (auth, products CRUD, profile) është dukshëm e implementuar dhe funksionale (verifikuar manualisht 2026-08-20: register/login/create-product/edit-product punojnë). S'e ndryshova statusin global pasi kërkon rishikim të plotë të gjithë checklist-it (jashtë qëllimit të bugfix-eve të kësaj sesioni) — po e shënoj këtu që të mos mbetet e pavërejtur.
