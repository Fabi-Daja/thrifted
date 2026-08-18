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
- [ ] **Home / Browse** — listë produktesh aktive
- [ ] **Product Detail** — foto, çmim, condition, shitësi, Buy/Bid sipas `selling_type`
- [ ] **Login / Register** — redirect automatik te ekrani i mëparshëm pas suksesit
- [ ] **Create Product** — form (title, description, category, brand, size, color, condition, price, deri 10 foto)
- [ ] **My Profile** — tabs: Të Dhëna / Produktet e Mia / Blerjet / Shitjet / Favoritet

### Integrim
- [ ] Auth flow i plotë (register → verify email → login → logout)
- [ ] CRUD Products i lidhur me backend
- [ ] Upload imazhesh nga forma → backend → Cloudinary/S3
- [ ] Error handling & loading states (React Query)

## Vendime & Ndryshime

-

## Probleme / Çështje të Hapura

-
