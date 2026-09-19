# Dokumentacioni i Thrifted

Ky folder mban dokumentacionin e projektit, të ndarë në dy lloje:

- **`00-dokumentacion-master.md`** — plani fillestar i konsoliduar (vizion, aktorë, rregulla biznesi, ERD, API contract, UX flow, strukturë). Është referencë e "ngrirë" nga faza e planifikimit — nuk përditësohet me çdo ndryshim të vogël.
- **`faza/`** — një file "living document" për secilën fazë të roadmap-it (§6 te dokumenti master). Këto file përditësohen **gjatë** zhvillimit: shëno çfarë u bë, çfarë ndryshoi nga plani, vendime të reja, probleme të hasura.

## Si të përdoret

1. Përpara se të fillosh një fazë, hap `faza/faza-N-*.md` përkatëse dhe shiko checklist-in.
2. Gjatë zhvillimit, shto shënime te seksioni **"Vendime & Ndryshime"** kur diçka ndryshon nga plani fillestar (p.sh. një endpoint u riemërua, një fushë u shtua në DB).
3. Kur mbaron një detyrë, xhek-o kutinë `- [x]`.
4. Në fund të fazës, plotëso **Status** dhe shto një përmbledhje të shkurtër — kjo bëhet "historiku" i projektit, i dobishëm kur rikthehesh pas kohësh ose kur dikush tjetër (ose një AI assistant) duhet të kuptojë shpejt ku ke mbetur.

## Fazat

| Fazë | Përmbajtja | Status |
|---|---|---|
| [Faza 1](faza/faza-1-backend-db-auth-products.md) | Backend + DB + Auth + Products | 🟡 Në proces — auth bazë/profile/products gati, mungon logout/reset-password/change-password + teste automatike |
| [Faza 2](faza/faza-2-frontend-integrimi.md) | Frontend + integrimi me backend | 🟡 Në proces — ekranet kryesore gati, mbetet vendimi "checkout i personalizuar" |
| [Faza 3](faza/faza-3-favorites-search-filters.md) | Favorites + Search + Filters | 🟡 Në proces — gati dhe testuar, mbetet indeksimi DB |
| [Faza 4](faza/faza-4-bids-chat.md) | Bids + Chat (chat është v2) | ✅ Kryer — Bids + Buying System + Chat (realtime WebSocket) |
| [Faza 5](faza/faza-5-ai-features.md) | AI Features (v2) | 🟡 Në proces (5.1/5.5 kanë backend+frontend; 5.2/5.3/5.4 vetëm backend) |
| [Faza 6](faza/faza-6-docker-deploy-cicd.md) | Docker + Deploy + CI/CD | 🟡 Në proces — stack i plotë (postgres+backend+frontend SSR+nginx) i konteinerizuar dhe testuar lokalisht (backend nën `/api`); mbetet QA manuale, HTTPS, VPS, CI/CD |

Shiko edhe [`v2-backlog.md`](v2-backlog.md) për Admin Panel dhe Notifications — janë v2 por nuk u caktuan ende në një fazë specifike.

> ⚠️ **Prefiksi `/api`:** që prej 2026-09-19 (faza-6, Nginx) çdo endpoint i backend-it ka prefiks `/api` (p.sh. `POST /auth/login` → `POST /api/auth/login`). Endpoint-et e dokumentuara te faza 1-5 (shkruar përpara këtij ndryshimi) **ende e lënë jashtë** `/api`-në — shto e prefiksin mendërisht kur i lexon, ose shih `docs/faza/faza-6-docker-deploy-cicd.md` §"Vendime & Ndryshime" për detaje.

> Përditëso tabelën e statuseve më sipër (🔲 Nuk ka filluar / 🟡 Në proces / ✅ Kryer) sa herë ndryshon statusi i një faze.
