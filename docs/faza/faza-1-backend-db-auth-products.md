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
- [ ] `POST /auth/register`
- [ ] `POST /auth/verify-email`
- [ ] `POST /auth/login` (JWT)
- [ ] `POST /auth/logout`
- [ ] `POST /auth/forgot-password`
- [ ] `POST /auth/reset-password`
- [ ] `POST /auth/change-password`
- [ ] Middleware: rrugë të mbrojtura kërkojnë email të verifikuar

### User Profile (US-08 → US-11)
- [ ] `GET /users/me`
- [ ] `PATCH /users/me`
- [ ] `GET /users/{id}` (publik)
- [ ] `GET /users/me/purchases`
- [ ] `GET /users/me/sales`

### Products (US-12 → US-17)
- [ ] `POST /products` (vetëm user i verifikuar)
- [ ] `GET /products/{id}`
- [ ] `PATCH /products/{id}` (vetëm owner)
- [ ] `DELETE /products/{id}` (vetëm owner)
- [ ] `PATCH /products/{id}/archive`
- [ ] `POST /products/{id}/images` (max 10, integrim Cloudinary/S3)
- [ ] `DELETE /products/{id}/images/{imageId}`
- [ ] Validim: statuset `Draft → Active → Reserved → Sold/Archived`

### Testim
- [ ] Unit/integration tests për auth flow
- [ ] Unit/integration tests për Products CRUD + rregullat e biznesit (§3)

## Vendime & Ndryshime

_(Shto këtu çdo vendim të ri ose ndryshim nga plani fillestar, me datë. P.sh.: "2026-08-20 — Redis u hoq nga MVP, shtohet vetëm nëse nevojitet rate-limiting.")_

-

## Probleme / Çështje të Hapura

-
