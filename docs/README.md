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
| [Faza 1](faza/faza-1-backend-db-auth-products.md) | Backend + DB + Auth + Products | 🔲 Nuk ka filluar |
| [Faza 2](faza/faza-2-frontend-integrimi.md) | Frontend + integrimi me backend | 🔲 Nuk ka filluar |
| [Faza 3](faza/faza-3-favorites-search-filters.md) | Favorites + Search + Filters | 🔲 Nuk ka filluar |
| [Faza 4](faza/faza-4-bids-chat.md) | Bids + Chat (chat është v2) | ✅ Kryer — Bids + Buying System + Chat (realtime WebSocket) |
| [Faza 5](faza/faza-5-ai-features.md) | AI Features (v2) | 🟡 Në proces (5.1 ka MVP në kod) |
| [Faza 6](faza/faza-6-docker-deploy-cicd.md) | Docker + Deploy + CI/CD | 🔲 Nuk ka filluar |

Shiko edhe [`v2-backlog.md`](v2-backlog.md) për Admin Panel dhe Notifications — janë v2 por nuk u caktuan ende në një fazë specifike.

> Përditëso tabelën e statuseve më sipër (🔲 Nuk ka filluar / 🟡 Në proces / ✅ Kryer) sa herë ndryshon statusi i një faze.
