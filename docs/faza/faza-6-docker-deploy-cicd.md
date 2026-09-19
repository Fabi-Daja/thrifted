# Faza 6 — Docker + Deploy + CI/CD

**Status:** 🟡 Në proces — hapat 1-5 dhe 7 të planit të kryer (Docker i plotë + Nginx reverse proxy lokal), stack i plotë (postgres+backend+frontend+nginx) testuar bashkë; mbetet QA manuale e rrjedhave (hapi 6, ende e hapur), HTTPS, VPS, CI/CD
**Varet nga:** Të gjitha fazat e mëparshme (të paktën MVP)
**Referenca:** [`00-dokumentacion-master.md`](../00-dokumentacion-master.md) §5, §11

## Qëllimi

Kontenerizimi i aplikacionit dhe vendosja në një server (VPS), me pipeline CI/CD.

## Radha e Zbatimit (plan hap-pas-hapi, 2026-08-27)

Checklist-i më poshtë liston ÇFARË duhet bërë; ky seksion përcakton RENDIN — secili hap varet nga i mëparshmi, dhe secili testohet **para** se të kalohet te tjetri. **Për Claude Code**: implemento një hap, verifiko, pastaj vazhdo te tjetri — mos i bëj të gjitha njëherësh.

1. **Përgatitje** — invento listën e plotë të variablave sekrete që ekzistojnë sot (`ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, `DATABASE_URL`, kredencialet Cloudinary, etj.) → shkruaj `.env.example` të plotë PA vlera reale.
2. **`backend/Dockerfile`, i vetëm** — paketon FastAPI + varësitë. Test: `docker build` + `docker run` i izoluar (pa docker-compose ende), backend-i niset pa krisur.
3. **Imazhi i databazës** — përdor një imazh **të gatshëm** `pgvector/pgvector` (postgres + pgvector të para-ndërtuar) në vend të ndërtimit nga burimi si lokalisht në Windows — kjo e eliminon krejtësisht dhimbjen e kaluar me Visual Studio Build Tools.
4. **`docker-compose.yml` (dev)** — lidh `backend` + `postgres` (+ `redis` nëse përdoret) në një rrjet të përbashkët, me **volume** për të dhënat e Postgres (të mos humbasin kur kontejneri rindërtohet). Test: `docker compose up`, pastaj `docker compose exec backend alembic upgrade head` brenda kontejnerit, verifiko lidhjen DB.
5. **`frontend/Dockerfile`** — build me `bun run build`, pastaj shërbim i statikëve me Nginx (multi-stage). Shtohet te `docker-compose.yml`.
6. **Test end-to-end lokal, brenda kontejnerëve** — rrjedhat kryesore (login, chat AI 5.1, kërkim me foto 5.3, etj.) funksionojnë identike si jashtë Docker-it, PARA se të shkohet te serveri real.
7. **Nginx si reverse proxy** — shtresë e re sipër frontend+backend: `/api/*` → backend, gjithçka tjetër → frontend statik. Test lokal.
8. **Provizionimi i VPS-së** — hapje VPS Linux, instalim Docker + Docker Compose atje, firewall (vetëm portat 22/80/443 hapur).
9. **HTTPS** — certbot/Let's Encrypt, i integruar te config-u Nginx (nga hapi 7), tani në serverin real.
10. **CI/CD (GitHub Actions)** — fillimisht: (a) xhiro testet në çdo push/PR. Pastaj: (b) build & push i imazheve Docker te një registry. Deploy-i fillestar mund të mbetet manual (me hapa të dokumentuar qartë), i automatizohet plotësisht vetëm pasi (a)+(b) të jenë stabël.
11. **Migrimet Alembic automatike** — si hap i vetë procesit të deploy-it (jo dev-i që hyn manualisht), zakonisht para se backend-i i ri të marrë trafik.
12. **Backup strategji Postgres** — `pg_dump` i planifikuar (cron/GitHub Action e planifikuar), i ruajtur JASHTË vetë VPS-së (s'ka kuptim backup që humbet bashkë me serverin që dështon).
13. **Monitoring/logs bazë** — të paktën `docker logs` të strukturuara + një healthcheck endpoint (`/health`); Loki/Grafana etj. mbeten përmirësim i mundshëm më vonë, jo kërkesë e MVP-së.

**Pse kjo radhë:** çdo hap testohet lokalisht (1-7) para se të prekë serverin real (8+), dhe CI/CD (10) automatizohet vetëm pasi vetë procesi manual (2-9) të jetë verifikuar të funksionojë — automatizimi i diçkaje që s'funksionon ende thjesht e përsërit dështimin më shpejt.

## Alternativë e shpejtë/ekonomike për afatin e dorëzimit të diplomës (2026-09-17)

Useri kërkoi eksplicitisht një rrugë deploy **sa më e shpejtë (pak kohë) dhe sa më ekonomike (pak para)**, meqë punimi i diplomës duhet dorëzuar. Plani 13-hapësh më sipër (VPS + Docker Compose + Nginx + Certbot + CI/CD) mbetet rruga "korrekte" afatgjatë, por kërkon shumë kohë konfigurimi (firewall, HTTPS manual, networking mes kontejnerëve) — jo e përshtatshme për një afat të shkurtër. **Rekomandimi për tani** është një ndarje mes tre shërbimeve të gatshme (PaaS), pa VPS dhe pa Docker fare, çka e bën çdo shtresë (HTTPS, restart, rrjet) përgjegjësi e platformës, jo e studentit:

| Shtresa | Shërbim i rekomanduar | Kosto (kontrolluar 2026-09-17) | Pse |
|---|---|---|---|
| Frontend (React/Vite build) | **Vercel** (plani Hobby) | **$0** | Falas për përdorim jo-komercial/personal; deploy direkt nga GitHub, HTTPS automatik. S'mbështet backend të përhershëm (funksione serverless, max 300s) — përdoret VETËM për frontend-in statik. |
| Backend (FastAPI + WebSocket) | **Railway** | **$0 muajin e parë** (30-ditë provë me $5 kredit), më pas **~$5/muaj minimumi** (Hobby, faturim sipas përdorimit real: memorie/CPU/volume/egress) | Kontejner i **përhershëm** (jo serverless) — i domosdoshëm sepse `ws_manager.py` mban lidhjet WebSocket në memorje të procesit; Render/Vercel falas do t'i vrisnin/fikninin kontejnerin pas pauzash dhe do të prishnin chat-in realtime. |
| Databaza (Postgres + pgvector) | **Neon** (plani falas) | **$0** (0.5GB ruajtje, 100 orë-CU/muaj) | pgvector është **ekstension i gatshëm, i aktivizueshëm me një komandë** (`CREATE EXTENSION vector`) — **eliminon plotësisht** dhimbjen e ndërtimit nga burimi që u hasi lokalisht në Windows (Visual Studio Build Tools, nmake/MSVC). |

**Kosto totale e pritshme për periudhën e dorëzimit:** **$0–5/muaj** (shumë nën kufirin e $5 krediti fillestar të Railway-t nëse trafiku mbetet i ulët, siç pritet për një demonstrim akademik). Krahasuar me VPS-në e planit 13-hapësh (~$4-6/muaj + orë të shumta konfigurimi manual: firewall, Nginx, certbot), kjo rrugë kursen kohë, jo domosdoshmërisht para — por koha është burimi më i kufizuar tani.

**Çfarë kërkon vetëm konfigurim (jo kod), mund ta bësh vetë nga dashboard-et e shërbimeve:**
- Krijimi i 3 llogarive (Vercel/Railway/Neon), lidhja me repo-n GitHub.
- Vendosja e ndryshoreve të mjedisit (env vars) te Railway: `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, `DATABASE_URL` (nga Neon), kredencialet Cloudinary, `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`, `JWT_SECRET`, `FRONTEND_URL` (domeni i Vercel-it). `SMS_PROVIDER_URL`/`_API_KEY` mund të mbeten bosh — verifikimi i telefonit mbetet fallback dev (log në konsolë), i pranueshëm sepse është plotësisht opsional (shih `faza-1-...md`).
- Ekzekutimi një-herësh i `alembic upgrade head` kundrejt `DATABASE_URL`-it të ri të Neon-it (nga shell-i i Railway-t, ose lokalisht duke e ndryshuar përkohësisht `.env`).
- Përditësimi i URL-së së webhook-ut te dashboard-i i Stripe-it, që të tregojë te domeni i ri i Railway-t (`https://.../webhooks/stripe`).

**Çfarë kërkon ndryshim kodi (⚠️ jashtë mundësisë sime — duhet Claude Code lokalisht):**
- Shtimi i domenit të Vercel-it te lista `CORS` në `app/main.py` (sot ka vetëm `127.0.0.1:8000`/`5173`, siç dokumentohet te `faza-5-ai-features.md`).
- Verifikimi që URL-ja e WebSocket-it (`WS /ws?token=...`) në frontend lexohet nga një ndryshore mjedisi (env) dhe jo e hardkoduar si `ws://localhost:8000` — nëse është e hardkoduar, duhet bërë config-urueshme përpara deploy-it.

**Pas dorëzimit të diplomës:** nëse projekti vazhdon drejt "prodhimit real" afatgjatë, plani 13-hapësh me VPS+Docker mbetet i vlefshëm dhe mund të ndiqet më vonë me qetësi — Railway/Vercel/Neon janë zgjidhje të shkëlqyera për demo/MVP, por një VPS vetjak jep kontroll më të plotë dhe kosto mujore më të parashikueshme në shkallë.

**Kujdes shtesë:** limiti 3 kërkesa/minutë i llogarisë falas të Voyage AI (dokumentuar te `faza-5-ai-features.md`) mbetet i pandryshuar pavarësisht platformës së hosting-ut — nëse jurie/testuesit provojnë kërkim me foto disa herë radhazi gjatë demonstrimit, mund të hasin `502`. Vlen të shtohet metodë pagese te dashboard-i i Voyage AI përpara mbrojtjes, nëse dëshirohet siguri shtesë (kosto minimale, faturim sipas përdorimit).

## Checklist

### Docker
- [x] `backend/Dockerfile` (krijuar dhe testuar: `docker build` + `docker run` i izoluar, `GET /` përgjigjet)
- [x] `frontend/Dockerfile` (multi-stage: `oven/bun:1` build → `node:20-slim` runtime, SSR si proces Node, jo statik+Nginx — shih Vendime më poshtë)
- [x] `docker-compose.yml` — postgres (pgvector) + backend + frontend, i plotë dhe testuar bashkë (+ Redis nëse përdoret ndonjëherë, s'përdoret ende)
- [x] `.env.example` i plotë për të gjitha shërbimet (backend — verifikuar konform kodit aktual: DATABASE_URL, SECRET_KEY, Cloudinary, Mailtrap, ANTHROPIC_API_KEY, VOYAGE_API_KEY, Stripe, SMS)

### Nginx / Networking
- [x] Nginx si reverse proxy (frontend + `/api` → backend) — `nginx/nginx.conf`, testuar plotësisht: `/api/*` → backend, gjithçka tjetër → frontend, WS `/api/ws` (handshake real i verifikuar: `101 Switching Protocols` me JWT të vlefshëm), `client_max_body_size 20M` (default-i 1M i Nginx do të bllokonte upload foto produkti/AI)
- [ ] HTTPS (Let's Encrypt / certbot)

### CI/CD
- [x] GitHub Actions: run tests në çdo push/PR — `.github/workflows/ci.yml` (shih Vendime më poshtë: s'ka teste automatike ende, kontroll minimal import+lint+build)
- [ ] GitHub Actions: build & push Docker images
- [ ] Deploy automatik në VPS (ose manual me dokumentim të qartë të hapave)

### Deploy
- [ ] Provizionim i VPS-së (Linux)
- [ ] Migrimet Alembic run në deploy
- [ ] Backup strategji për databazën
- [ ] Monitoring/logs bazë

## Vendime & Ndryshime

- 2026-09-19 — **Hapi 10a i planit (CI/CD - GitHub Actions).** Zbulim: projekti **s'ka asnjë test automatik** ende, as backend as frontend (vetëm teste të librave brenda `venv/`, jo të kodit tonë) — çështje tashmë e njohur te `faza-1-backend-db-auth-products.md` §"Probleme". Prandaj `.github/workflows/ci.yml` **NUK** xhiron `pytest`/teste (do të dështonte artificialisht - "no tests collected" - ose do të ishte teatër bosh) — në vend të kësaj bën kontrolle reale minimale që EKZISTOJNË: job `backend` (Python 3.10, `pip install`, `python -c "import app.main"` si kontroll importi/sintakse - zbulon gabime reale si import të thyer), job `frontend` (bun, `bun run lint` [ESLint, ekziston tashmë], `bun run build` [zbulon gabime TypeScript/build]). `DATABASE_URL`/`SECRET_KEY`/`FRONTEND_URL` janë vlera fiktive CI-specifike (jo sekrete reale) - të mjaftueshme që `app/core/database.py` (`create_engine`) të mos hedhë gabim në import-time; s'kërkohet DB reale e lidhur sepse SQLAlchemy lidhet "lazy" (vetëm në query të parë). Testuar lokalisht para push-it (simulim me imazhet Docker ekzistuese `thrifted-backend`/`oven/bun:1`, jo vetë GitHub Actions): import-checku i backend-it kaloi; `bun run build` (pa Docker, pa `VITE_API_URL`) kaloi pastër.
  **Zbulim gjatë testimit: `bun run lint` dështon me QINDRA gabime paraekzistuese** (të panderlidhura me këtë punë) — kryesisht `prettier/prettier` mbi line-endings CRLF (Windows) dhe mungesë pikëpresjesh, në dhjetra skedarë (`src/api/*.ts`, `src/components/**`, etj.). Të gjitha janë auto-fixable (`bunx eslint . --fix`), por do të prekshin qindra skedarë në një ndryshim gjigant, jashtë qëllimit të kontenerizimit dhe me rrezik fërkimi me sinkronizimin e Lovable-it (`frontend/AGENTS.md`). Useri vendosi: **`bun run lint` hiqet nga CI për tani** (shënuar te "Probleme" më poshtë si detyrë pastrimi e veçantë). CI mban vetëm `bun run build` (kap gabime reale TypeScript/build).
  **Qëllimisht jashtë scope-it të kësaj CI**: build+push i imazheve Docker (hapi 10b i planit) - mbetet hap i ardhshëm i veçantë, pasi (a) të jetë stabël, siç e thotë vetë plani.
- 2026-09-19 — **Hapi 7 i planit (Nginx).** Zbulim: backend-i dhe frontend-i kishin rrugë që përplasen (`GET /products/{id}` ekziston njëkohësisht si faqe SSR e frontend-it DHE si endpoint API i backend-it — asnjë router s'kishte prefiks `/api`). Nginx s'kishte si ta dallonte cilit shërbim t'i dërgonte kërkesën vetëm bazuar te path-i. Useri zgjodhi zgjidhjen **prefiks `/api` te backend-i** (jo ndarje me subdomain, e cila do ta shtynte testimin te hapi i domain-it real). Ndryshime:
  - `backend/app/main.py` — çdo `app.include_router(...)` tani ka `prefix="/api"` (16 routers). `GET /` mbetet i paprekur si healthcheck i brendshëm (funksionon vetëm i thirrur direkt te backend-i, jo përmes Nginx — atje `/` shkon te frontend-i, siç duhet).
  - `frontend/src/api/axiosInstance.ts` — `baseURL` tani dallon SSR nga browser-i: në SSR (`typeof window === "undefined"`, loaders që xhirojnë brenda procesit Node të vetë kontejnerit frontend) përdor `process.env.API_INTERNAL_URL` (runtime env, jo build-time si `VITE_*`) drejt hostname-it të brendshëm `http://backend:8000/api`; në browser përdor `import.meta.env.VITE_API_URL` (build-time, `/api` relative pas Nginx-it në docker-compose, ose absolute për dev lokal pa Docker).
  - `frontend/src/context/RealtimeContext.tsx` (`getWsUrl`) — përditësuar për prefiksin `/api/ws`, dhe rregulluar të zgjerojë URL relative (`/api`) me `window.location.origin` përpara se t'ia japë `new WebSocket(...)`, sepse WebSocket-i (ndryshe nga axios) **kërkon URL absolute me skemë `ws`/`wss`** — një path relativ do të hidhte `SyntaxError` në browser. (Thirret vetëm brenda `useEffect`, kështu që `window` ekziston gjithmonë atje — s'ka problem SSR.)
  - `docker-compose.yml` — shtuar shërbimi `nginx` (`nginx:alpine`, mount `nginx/nginx.conf`, portë `80:80`). `frontend`: build-arg `VITE_API_URL=/api` (relative, browser-i i userit) + runtime `environment: API_INTERNAL_URL=http://backend:8000/api` (SSR, brenda rrjetit të compose-it).
  - `nginx/nginx.conf` — `location /api/ws` (me `proxy_http_version 1.1` + headers `Upgrade`/`Connection` për WebSocket), `location /api/` (pjesa tjetër e backend-it), `location /` (frontend SSR).
  - `backend/.env.example` — koment i përditësuar (`stripe listen --forward-to .../api/webhooks/stripe`).
  **Testuar:** `docker compose up` me 4 shërbimet — `GET http://localhost/` (frontend, 200), `GET http://localhost/api/products` (backend përmes Nginx, 200 `[]`), `GET http://localhost/products/1` (SSR loader brenda kontejnerit frontend thirri backend-in me sukses përmes `API_INTERNAL_URL` — logu i backend-it e konfirmon: `172.18.0.4 - "GET /api/products/1" 422`; vetë 422-shi është i pritshëm dhe s'ka lidhje me Nginx-in, `product_id` pret UUID jo `"1"`).
  **Verifikime shtesë (të njëjtën ditë, pas pyetjes "a e mbaruam Nginx-in"):** (1) WebSocket real përmes Nginx-it — u regjistrua një user test, u mor JWT nga `/api/auth/login`, dhe handshake-u `GET /api/ws?token=...` (me headers `Connection: Upgrade`) ktheu `101 Switching Protocols` — identik kur testuar direkt te backend-i (portë 8000), pra Nginx e përcjell transparent. (2) `client_max_body_size` MUNGONTE fare — default-i i Nginx (1M) do të kishte bllokuar në heshtje çdo upload normal telefoni (produkte me shumë foto, `image_analysis`, `image_search` - të gjitha pranojnë `UploadFile`), pa u kapur nga asnjë test i mëparshëm sepse ato teste përdorën vetëm GET. U shtua `client_max_body_size 20M;`.
  **Shënim për dokumentacionin tjetër:** `docs/00-dokumentacion-master.md` (API contract origjinal) ende i liston rrugët PA `/api` — është dokument "i ngrirë" me qëllim (shih `docs/README.md`), kështu që s'përditësohet; kjo faqe (`faza-6`) është burimi i freskët për strukturën aktuale të rrugëve.
- 2026-09-19 — **Hapat 3-5 të planit.** `docker-compose.yml` (rrënjë): `postgres` (`pgvector/pgvector:pg16`, jo ndërtim nga burimi, siç u vendos më 2026-08-27) me volume `postgres_data` dhe healthcheck (`pg_isready`); `backend` varet nga `postgres` (`service_healthy`), `DATABASE_URL` mbishkruhet eksplicit te `environment:` (jo `.env`) që të tregojë te hostname-i i brendshëm `postgres`, jo `localhost`. Testuar: `docker compose up` + `docker compose exec backend alembic upgrade head` — 14 migrimet u aplikuan pa gabime brenda kontejnerit, `GET /` përgjigjet.
  **Zbulim i rëndësishëm gjatë frontend-it:** plani origjinal (2026-08-27) supozonte "frontend statik i shërbyer nga Nginx", por frontend-i (TanStack Start) është **SSR real**, jo SPA — `vite.config.ts` përdor nitro me preset default `cloudflare-module` (Cloudflare Workers), i konfirmuar nga `.output/server/wrangler.json` në një build ekzistues, me kod server-side për çdo rrugë (`_ssr/*.mjs`). Nginx-statik do të thyhej. Useri zgjodhi rrugën "Node SSR në kontejner": u shtua `nitro: { preset: "node-server" }` te `frontend/vite.config.ts` — e sigurt sepse wrapper-i `@lovable.dev/vite-tanstack-config` e mbishkruan me force në `cloudflare-module` kur zbulon `isSandbox` (build brenda vetë Lovable-it), pavarësisht ç'është te vite.config.ts — pra s'prish deploy-in ekzistues të Lovable/Cloudflare, ndikon vetëm build-et tona lokale/Docker/VPS. `frontend/Dockerfile` multi-stage: faza 1 `oven/bun:1` (bun install + `bun run build`, `ARG VITE_API_URL` sepse `VITE_*` futet në bundle-in e klientit në build-time, jo runtime), faza 2 `node:20-slim` (vetëm `.output/` i kopjuar, `CMD node .output/server/index.mjs`, user jo-root, `PORT=3000`/`HOST=0.0.0.0`). Testuar i izoluar: build OK, kontejneri niset, `GET /` kthen HTML të renderuar plotësisht server-side (200). Pastaj testuar gjithë stack-u bashkë (`docker compose up -d --build` me të tria shërbimet): `GET http://localhost:3000/login` → 200, backend `GET /` → 200 njëkohësisht.
  **Shtyrë për më vonë:** `docker-compose.yml` vendos `VITE_API_URL=http://localhost:8000` si build-arg fiks (i arritshëm nga browser-i i userit në dev; **do të duhet ndryshuar** kur të shtohet Nginx reverse proxy/domain publik te hapi 7-8, pasi `localhost:8000` s'do të funksionojë nga jashtë makinës së zhvillimit).
- 2026-09-19 — Filluar zbatimi i planit 13-hapësh (hapi 1 dhe 2). Verifikuar `.env.example` kundrejt kodit aktual — tashmë i plotë (asnjë ndryshim nevojitej). Krijuar `backend/Dockerfile` (bazë `python:3.10-slim`, njëjtë me versionin e `venv/` lokal; entrypoint `uvicorn app.main:app` — jo `main:app`, sepse app-i jeton te paketa `app/`; user jo-root). Krijuar edhe `backend/.dockerignore` (`venv/`, `.env`, `__pycache__/`, `tmp/`, `.git/`) — pa të, `COPY . .` do të fuste `.env`-në me sekrete reale brenda image-it. Docker Desktop u instalua nga useri (Microsoft Store). Testuar: `docker build -t thrifted-backend .` (~39s, imazhi ndërtohet pa gabime) + `docker run` i izoluar (env fiktiv `DATABASE_URL`/`SECRET_KEY`, port `8001:8000`) — kontejneri niset, `GET /` kthen `{"message":"Thrifted API po punon!"}`. Kontejneri i testit u hoq pas verifikimit (`docker rm -f`). **Shënim teknik:** CLI-ja e Docker (`C:\Users\User\AppData\Local\Programs\DockerDesktop\resources\bin`) u shtua te `PATH` i userit nga instaluesi, por proceset e terminalit ekzistues (të hapura para instalimit) s'e trashëgojnë automatikisht — nëse `docker` s'njihet si komandë, rifresko `$env:Path` nga regjistri (`Machine`+`User`) në sesionin aktual ose hap terminal të ri.
- 2026-08-27 — Useri kërkoi shpjegim të Docker-it (çfarë është, pse shërben, si do të përdoret te Thrifted) dhe një plan konkret hap-pas-hapi. U shtua seksioni "Radha e Zbatimit" (13 hapa, të renditur me varësi eksplicite: dev lokal brenda kontejnerëve para prekjes së VPS-së reale, CI/CD i automatizuar vetëm pasi procesi manual të jetë verifikuar). Vendim kyç: përdorimi i imazhit të gatshëm `pgvector/pgvector` në vend të ndërtimit nga burimi (siç u bë lokalisht në Windows) — eliminon plotësisht atë proces në serverin e prodhimit. **Vetëm plan, ende pa kod** (s'ka filluar zbatimi).

## Probleme / Çështje të Hapura

- 2026-09-19 — `bun run lint` (ESLint/Prettier) dështon me qindra gabime paraekzistuese në `frontend/src/**` — kryesisht CRLF (line-endings Windows) dhe pikëpresje mungesë, të panderlidhura me faza-6. Të gjitha auto-fixable me `bunx eslint . --fix`, por s'u aplikua sepse do të ishte një ndryshim gjigant (qindra skedarë) jashtë qëllimit të sotëm dhe me rrezik fërkimi me Lovable. **Mbetet detyrë e veçantë pastrimi** — deri atëherë, `bun run lint` s'është pjesë e `.github/workflows/ci.yml`. 2026-09-19 — Hapi 6 i planit ("Test end-to-end lokal... login, chat AI 5.1, kërkim me foto 5.3") është verifikuar vetëm pjesërisht: `GET /login` (SSR render) dhe `GET /` backend përgjigjen brenda compose-it, por rrjedhat funksionale reale (login me kredenciale, chat AI, image search, Stripe checkout) s'janë klikuar ende brenda kontejnerëve — kërkon QA manuale nga useri në browser përpara se hapi 6 të shënohet i plotë.
- ~~2026-09-19 — `VITE_API_URL` hardkoduar `http://localhost:8000`~~ — **zgjidhur më 2026-09-19** (hapi 7): tani `/api` relative, kalon përmes Nginx-it, funksionon njësoj lokalisht dhe pas domain-it real.
