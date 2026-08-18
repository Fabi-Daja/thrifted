# MARKETPLACE – DOKUMENTACION FINAL I PROJEKTIT

> Ky dokument konsolidon të gjithë procesin e planifikimit: nga vizioni fillestar deri te struktura e projektit, i ndërtuar hap-pas-hapi dhe i miratuar në çdo etapë.
>
> **Shënim:** Ky është dokumenti "master" i planifikimit fillestar (referencë e ngrirë). Progresi aktual, vendimet e reja gjatë zhvillimit dhe ndryshimet nga plani fillestar mbahen te `docs/faza/*.md`, jo këtu.

---

## 📑 Përmbajtja

1. [Vizioni i Projektit](#1-vizioni-i-projektit)
2. [Aktorët e Sistemit](#2-aktorët-e-sistemit)
3. [Rregulla Biznesi](#3-rregulla-biznesi)
4. [Statuset e Produktit](#4-statuset-e-produktit)
5. [Technical Stack](#5-technical-stack)
6. [Roadmap i Zhvillimit](#6-roadmap-i-zhvillimit)
7. [User Stories](#7-user-stories)
8. [ERD – Skema e Databazës](#8-erd--skema-e-databazës)
9. [API Contract](#9-api-contract)
10. [UX Flow](#10-ux-flow)
11. [Struktura e Projektit](#11-struktura-e-projektit)

---

## 1. Vizioni i Projektit

Marketplace për shitjen dhe blerjen e veshjeve të reja dhe të përdorura. Përdoruesit mund të:
- publikojnë produkte (veshje)
- blejnë produkte (Buy Now ose përmes ofertave/bids)
- komunikojnë mes tyre (v2)
- përdorin AI si ndihmë gjatë publikimit (v2)

Qëllimi: ndërtim i një sistemi full-stack modern, për mësim dhe portfolio, duke ndjekur procesin që përdorin ekipe profesionale.

---

## 2. Aktorët e Sistemit

| Aktor | Përshkrim |
|---|---|
| **Guest** | Shikon produkte dhe profile publike pa llogari |
| **User** | Regjistrohet, verifikon email, blen, shet, bën oferta, menaxhon profilin |
| **Admin** | Menaxhon sistemin (users, produkte, kategori, raportime) — Version 2 |

---

## 3. Rregulla Biznesi

- Email unik, username unik (i ndryshueshëm pas regjistrimit)
- Regjistrimi bëhet vetëm me email + password (jo social login)
- Email duhet **verifikuar** para se llogaria të jetë plotësisht aktive
- Password i ruajtur i hash-uar
- 1 User → shumë Products; 1 Product → 1 Owner
- Max 10 foto për produkt
- User s'mund të blejë produktin e vet
- Produkt "Sold" nuk riblihet
- Vetëm Owner edito n/fshin produktin e vet
- Rating i User bazohet te vlerësimet e marra nga shitjet (Reviews)

---

## 4. Statuset e Produktit

`Draft` → `Active` → `Reserved` → `Sold` / `Archived`

- **Buy Now** → kalon direkt në `Sold`
- **Bid i pranuar** → kalon në `Reserved` deri sa blerja finalizohet → pastaj `Sold`

---

## 5. Technical Stack

**Backend:** FastAPI, PostgreSQL, SQLAlchemy, Alembic, JWT authentication, Redis (opsional)
**Frontend:** React, TypeScript, Tailwind CSS, React Query, Axios
**Storage:** Cloudinary / S3 (imazhe)
**Realtime:** WebSockets (chat + bids) — v2
**DevOps:** Docker, Docker Compose, Nginx, GitHub Actions, Linux VPS deploy

---

## 6. Roadmap i Zhvillimit

| Fazë | Përmbajtja | Dokumenti i fazës |
|---|---|---|
| Faza 1 | Backend + DB + Auth + Products | [faza-1-backend-db-auth-products.md](faza/faza-1-backend-db-auth-products.md) |
| Faza 2 | Frontend + integrimi me backend | [faza-2-frontend-integrimi.md](faza/faza-2-frontend-integrimi.md) |
| Faza 3 | Favorites + Search + Filters | [faza-3-favorites-search-filters.md](faza/faza-3-favorites-search-filters.md) |
| Faza 4 | Bids + Chat | [faza-4-bids-chat.md](faza/faza-4-bids-chat.md) |
| Faza 5 | AI Features | [faza-5-ai-features.md](faza/faza-5-ai-features.md) |
| Faza 6 | Docker + Deploy + CI/CD | [faza-6-docker-deploy-cicd.md](faza/faza-6-docker-deploy-cicd.md) |

**MVP Scope:** Authentication, Profile, CRUD Products, Upload images, Browse products, Search + filters, Favorites, Basic buy system.

---

## 7. User Stories

### 🔐 Authentication
- **US-01**: Si Guest, dua të regjistrohem me email dhe password, që të bëhem User.
- **US-02**: Si User i sapo-regjistruar, dua të konfirmoj email-in tim (link në inbox), që të aktivizohet llogaria — **i detyrueshëm**, pas verifikimit vazhdon normalisht çdo aktivitet.
- **US-03**: Si User i verifikuar, dua të hyj me email + password.
- **US-04**: Si User i loguar, dua të dal nga llogaria.
- **US-05**: Si User, dua të ndryshoj të dhënat e profilit (emër, username, foto, bio, vendndodhje).
- **US-06**: Si User i loguar, dua të ndryshoj password-in (i vjetër + i ri).
- **US-07**: Si User që s'kujtohet password-i, dua ta resetoj përmes email-it.

### 👤 User Profile
- **US-08**: Si User, dua të shoh profilin tim (emër, username, foto, bio, vendndodhje, rating).
- **US-09**: Si User/Guest, dua të shoh profilin publik të një shitësi (emër, foto, rating, produkte aktive) — Guest **mund** ta shohë.
- **US-10**: Si User, dua të ngarkoj/ndryshoj foton e profilit.
- **US-11**: Si User, dua të shoh historikun tim (blerje/shitje).
- **Vendim:** Rating i userit bazohet te vlerësimet e shitjeve (lidhet me Reviews, §8).

### 🛍️ Products
- **US-12**: Si User i verifikuar, dua të krijoj listim (titull, përshkrim, kategori, markë, madhësi, ngjyrë, condition rating, çmim, deri 10 foto).
- **US-13**: Si Owner, dua të edito një listim ekzistues.
- **US-14**: Si Owner, dua të fshij një produkt.
- **US-15**: Si User/Guest, dua të shoh detajet e një produkti.
- **US-16**: Si Owner, dua të arkivoj një produkt (pa e fshirë përgjithmonë).
- **US-17**: Si Owner, dua që produkti të kalojë automatikisht në "Sold" pas blerjes.

### 💰 Marketplace
- **US-18**: Si User/Guest, dua të shfletoj produktet aktive.
- **US-19**: Si User/Guest, dua të kërkoj produkte me fjalë kyçe.
- **US-20**: Si User/Guest, dua të filtroj sipas kategori, markë, madhësi, çmim, condition rating.
- **US-21**: Si User/Guest, dua të rendis rezultatet (më i ri, çmim rritës/zbritës).

### ❤️ Favorites
- **US-22**: Si User, dua të shtoj produkt te favoritet.
- **US-23**: Si User, dua ta heq nga favoritet.
- **US-24**: Si User, dua të shoh listën time të favoriteve.
- **Vendim:** Vetëm për User të loguar; produkti "Sold" mbetet në listë, i shënuar si Sold (jo i fshirë automatikisht).

### 🛒 Buying System
- **US-25**: Si User, dua të blej menjëherë me çmim fiks (Buy Now).
- **US-26**: Si User, dua të shoh historikun e blerjeve.
- **US-27**: Si User, dua të shoh historikun e shitjeve.
- **US-28**: Sistemi parandalon blerjen e produktit tim.
- **US-29**: Sistemi parandalon blerjen e produktit "Sold".
- **Vendim:** Buy Now → status direkt `Sold`.

### 💸 Bids
- **US-30**: Si User, dua të bëj ofertë për produkt që lejon oferta.
- **US-31**: Si Owner, dua të pranoj një ofertë.
- **US-32**: Si Owner, dua të refuzoj një ofertë.
- **US-33**: Si User, dua të anuloj ofertën time (para pranimit/refuzimit).
- **US-34**: Si User, dua të shoh ofertat e mia (si blerës).
- **US-35**: Si Owner, dua të shoh ofertat për produktin tim.
- **Vendime:** Ofertë e pranuar → status `Reserved` deri në finalizim → pastaj `Sold`. "Offers only" → s'shfaqet Buy Now. Kur një ofertë pranohet, të tjerat refuzohen/anulohen automatikisht.

### 💬 Chat *(Version 2)*
- **US-36**: Si User, dua të filloj bisedë me shitësin.
- **US-37**: Si User, dua të dërgoj mesazhe në kohë reale.
- **US-38**: Si User, dua të shoh listën e bisedave të mia.
- **US-39**: Si User, dua të marr njoftim për mesazh të ri.
- **Vendim:** Biseda lidhet gjithmonë me një produkt specifik (jo bisedë e lirë).

### 🔔 Notifications *(Version 2)*
- **US-40**: Njoftim për ofertë të re (Owner).
- **US-41**: Njoftim për ofertë të pranuar (Bidder).
- **US-42**: Njoftim për produkt të shitur (Owner).
- **US-43**: Njoftim për mesazh të ri.
- **US-44**: Lista e të gjitha njoftimeve (lexuara/palexuara).
- **Vendim:** Fillimisht vetëm in-app; email notifications si shtesë e mëvonshme.

### 🧑‍💼 Admin Panel *(Version 2)*
- **US-45**: Menaxhon userat (shiko/bllokim/fshirje).
- **US-46**: Menaxhon produktet (fshin/fsheh që shkelin rregullat).
- **US-47**: Menaxhon kategoritë (CRUD).
- **US-48**: Modero raportimet e komunitetit.

### 🤖 AI System *(Version 2 — Faza 5)*
- **US-49**: Chat me AI asistent (kërkim natyror, p.sh. "gjej fustan të kuq nën 30€").
- **US-50**: Gjenerim automatik i të dhënave nga foto (markë, kategori, ngjyrë, përshkrim, interval çmimi) — të gjitha modifikueshme, AI s'garanton saktësi.
- **US-51**: Kërkim me foto (visual search / embeddings).
- **US-52**: Vlerësim çmimi (min–max + confidence score, bazuar te markë/kategori/condition).
- **Renditja e implementimit:** US-49 → US-50 → US-51 → US-52.

---

## 8. ERD – Skema e Databazës

### Bërthama (MVP + Reviews)

| Tabela | Fushat kryesore |
|---|---|
| **USERS** | id (PK), email, password_hash, is_email_verified, username, full_name, profile_photo_url, bio, location, rating_avg, rating_count, created_at |
| **CATEGORIES** | id (PK), name, parent_id (FK → self) |
| **PRODUCTS** | id (PK), owner_id (FK→Users), category_id (FK→Categories), title, description, brand, size, color, condition_rating, price, selling_type, status, created_at |
| **PRODUCT_IMAGES** | id (PK), product_id (FK→Products), url, order_index |
| **BIDS** | id (PK), product_id (FK), bidder_id (FK→Users), amount, status, created_at |
| **ORDERS** | id (PK), product_id (FK, 1:1), buyer_id (FK→Users), seller_id (FK→Users), final_price, status, created_at |
| **FAVORITES** | id (PK), user_id (FK), product_id (FK), created_at |
| **REVIEWS** | id (PK), order_id (FK→Orders), reviewer_id (FK→Users), reviewed_id (FK→Users), rating, comment, created_at |

**Relacione kryesore:**
- Users 1—N Products, Users 1—N Bids, Products 1—N Bids
- Products 1—1 Orders (nuk riblihet)
- Orders 1—N Reviews (vlerësimi lidhet me transaksionin, jo direkt me produktin)

### Shtesat Version 2

| Tabela | Fushat kryesore |
|---|---|
| **CONVERSATIONS** | id (PK), product_id (FK→Products), buyer_id (FK→Users), seller_id (FK→Users), created_at |
| **MESSAGES** | id (PK), conversation_id (FK), sender_id (FK→Users), content, is_read, created_at |
| **NOTIFICATIONS** | id (PK), user_id (FK→Users), type, reference_id, message, is_read, created_at |

**Shënim:** Admin menaxhohet përmes një fushe `role` te tabela Users (jo tabelë e veçantë). AI System nuk ka tabela të veta strukturore — thjesht ndihmon të plotësojë fushat e Products.

**Shënim mbi UUID:** Të gjitha ID-të (fusha `id`) janë tipi `UUID` (jo integer auto-increment) — zgjedhje standarde profesionale për siguri (shmang "ID enumeration attacks") dhe shkallëzueshmëri.

---

## 9. API Contract

### 🔐 Authentication
| Metodë | Endpoint | Qasje |
|---|---|---|
| POST | `/auth/register` | Guest |
| POST | `/auth/verify-email` | Guest |
| POST | `/auth/login` | Guest |
| POST | `/auth/logout` | User |
| POST | `/auth/forgot-password` | Guest |
| POST | `/auth/reset-password` | Guest (me token) |
| POST | `/auth/change-password` | User |

### 👤 User Profile
| Metodë | Endpoint | Qasje |
|---|---|---|
| GET | `/users/me` | User |
| PATCH | `/users/me` | User |
| GET | `/users/{id}` | Guest/User |
| GET | `/users/me/purchases` | User |
| GET | `/users/me/sales` | User |

### 🛍️ Products
| Metodë | Endpoint | Qasje |
|---|---|---|
| POST | `/products` | User (verifikuar) |
| GET | `/products/{id}` | Guest/User |
| PATCH | `/products/{id}` | Owner |
| DELETE | `/products/{id}` | Owner |
| PATCH | `/products/{id}/archive` | Owner |
| POST | `/products/{id}/images` | Owner |
| DELETE | `/products/{id}/images/{imageId}` | Owner |

### 💰 Marketplace
| Metodë | Endpoint | Qasje |
|---|---|---|
| GET | `/products?category=&brand=&size=&price_min=&price_max=&condition=&sort=&q=` | Guest/User |

### ❤️ Favorites
| Metodë | Endpoint | Qasje |
|---|---|---|
| POST | `/favorites/{productId}` | User |
| DELETE | `/favorites/{productId}` | User |
| GET | `/favorites` | User |

### 🛒 Buying System
| Metodë | Endpoint | Qasje |
|---|---|---|
| POST | `/products/{id}/buy` | User (jo owner) |

### 💸 Bids
| Metodë | Endpoint | Qasje |
|---|---|---|
| POST | `/products/{id}/bids` | User (jo owner) |
| GET | `/products/{id}/bids` | Owner |
| GET | `/users/me/bids` | User |
| PATCH | `/bids/{id}/accept` | Owner |
| PATCH | `/bids/{id}/reject` | Owner |
| DELETE | `/bids/{id}` | Bidder |

### 💬 Chat *(v2)*
| Metodë | Endpoint | Qasje |
|---|---|---|
| POST | `/conversations` | User |
| GET | `/conversations` | User |
| GET | `/conversations/{id}/messages` | User (pjesëmarrës) |
| POST | `/conversations/{id}/messages` | User (pjesëmarrës) |

### 🔔 Notifications *(v2)*
| Metodë | Endpoint | Qasje |
|---|---|---|
| GET | `/notifications` | User |
| PATCH | `/notifications/{id}/read` | User |

### 🧑‍💼 Admin Panel *(v2)*
| Metodë | Endpoint | Qasje |
|---|---|---|
| GET | `/admin/users` | Admin |
| PATCH | `/admin/users/{id}/block` | Admin |
| DELETE | `/admin/products/{id}` | Admin |
| GET/POST/PATCH/DELETE | `/admin/categories` | Admin |
| GET | `/admin/reports` | Admin |

### 🤖 AI System *(v2)*
| Metodë | Endpoint | Qasje |
|---|---|---|
| POST | `/ai/chat` | User |
| POST | `/ai/analyze-image` | User |
| POST | `/ai/search-by-image` | Guest/User |
| POST | `/ai/estimate-price` | User |

---

## 10. UX Flow

**Ekranet kryesore (MVP):**
1. **Home / Browse** *(Guest+User)* — produkte aktive, search, filtra
2. **Product Detail** — foto, çmim, condition, shitësi; Buy/Bid sipas `selling_type`
3. **Login / Register** — pas suksesit, kthehet automatikisht te ekrani i mëparshëm
4. **Create Product** *(User i verifikuar)* — form → pas ruajtjes shkon te Product Detail
5. **My Profile** — tabs: Të Dhëna / Produktet e Mia / Blerjet / Shitjet / Favoritet
6. **Favorites** — listë → klik → Product Detail

**Flow bazë (Guest → User):**
```
Home → Product Detail → [Guest: Login/Register] → kthehet te Product Detail → Buy/Bid
```

**Vendime:**
- Çdo ekran i thjeshtë dhe i veçantë (jo modal mbi modal)
- "Buy Now" dhe "Bëj Ofertë" shfaqen në Product Detail sipas `selling_type` (Fixed→Buy; Offers only→Bid; Both→të dy)

---

## 11. Struktura e Projektit

```
marketplace-project/
├── backend/
│   ├── app/
│   │   ├── models/          → Tabelat (nga ERD, §8)
│   │   ├── schemas/         → Pydantic request/response
│   │   ├── routers/         → Endpoints (nga API Contract, §9)
│   │   ├── services/        → Logjika e biznesit (§3)
│   │   ├── core/            → Config, JWT, security
│   │   └── main.py
│   ├── alembic/              → Migrimet e DB
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/            → Home, ProductDetail, Login, CreateProduct, Profile (nga UX Flow, §10)
│   │   ├── components/       → ProductCard, Navbar, etj.
│   │   ├── api/               → Axios calls
│   │   ├── hooks/             → React Query
│   │   └── App.tsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml         → backend + frontend + db (Postgres)
├── docs/                      → Dokumentacioni i fazave (shih docs/README.md)
└── README.md
```

---

*Dokument i konsoliduar nga procesi i planifikimit: Discovery → User Stories → ERD → API Contract → UX Flow → Struktura e Projektit. Hapi tjetër: Faza 1 e zhvillimit (Backend + DB + Auth + Products).*
