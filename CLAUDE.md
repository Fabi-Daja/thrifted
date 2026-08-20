# Thrifted — udhëzime për Claude Code

Marketplace full-stack për shitjen/blerjen e veshjeve të reja dhe të përdorura.
**Backend:** FastAPI + PostgreSQL + SQLAlchemy + Alembic. **Frontend:** React + TypeScript + Vite + TanStack + Tailwind (bun).

## Përpara se të fillosh çdo punë

1. Lexo [`docs/README.md`](docs/README.md) — indeksi i plotë i dokumentacionit dhe tabela e statuseve të fazave.
2. Për temën specifike mbi të cilën po punon, lexo dokumentin përkatës `docs/faza/faza-N-*.md` — ai përmban checklist-in, arkitekturën/vendimet e marra tashmë, dhe çështjet e hapura. Mos rifillo planifikimin nga zero — plani ekziston, ndiqe atë.
3. Për kontekst më të gjerë (vizion, rregulla biznesi, ERD, API contract origjinal), shiko [`docs/00-dokumentacion-master.md`](docs/00-dokumentacion-master.md) — por ky është "i ngrirë"; dokumentet `faza/` janë burimi më i freskët për detaje teknike.
4. Për veçoritë e pacaktuara ende në një fazë (Notifications, Admin Panel), shiko [`docs/v2-backlog.md`](docs/v2-backlog.md).

## Pas çdo pune të kryer (i detyrueshëm)

Dokumentacioni te `docs/faza/` është "living document" — përditësohet **në kohë reale**, jo si detyrë e ndarë në fund. Sapo mbaron ose ndryshon diçka:

1. Xhek-o kutinë `- [x]` te checklist-i i `docs/faza/faza-N-*.md` përkatës.
2. Shto një rresht të datuar te seksioni **"Vendime & Ndryshime"** të asaj faze — çfarë u bë, çfarë ndryshoi nga plani (p.sh. "2026-08-20 — Redis u hoq nga MVP").
3. Nëse statusi i përgjithshëm i fazës ndryshoi (filloi/mbaroi), përditëso fushën **Status** në krye të `faza-N-*.md` **dhe** rreshtin përkatës në tabelën e `docs/README.md`.
4. Nëse hasesh me një problem të hapur ose vendim që kërkon input nga useri, shtoje te **"Probleme / Çështje të Hapura"** — mos e lër pa u shënuar.

Qëllimi: kur të mbarojë projekti, dokumentacioni të jetë njëkohësisht i përfunduar — jo diçka që rikonstruktohet pas fundit.

## Rregulla të tjera

- Emrat, statuset, endpoint-et dhe fushat e ERD-së në `docs/faza/*.md` dhe `docs/00-dokumentacion-master.md` janë burimi i së vërtetës (source of truth) — nëse kodi devijon nga to, ose përditëso dokumentacionin (nëse vendimi ishte i qëllimshëm) ose kodin (nëse ishte gabim), por mos i lër të mospërputhen në heshtje.
- Mos vendos kurrë kredenciale/API keys reale (Cloudinary, Stripe, DB, JWT secret, etj.) brenda skedarëve `docs/*.md` apo README — vetëm në `.env` (i cili s'commitohet).
- `frontend/` është i lidhur me [Lovable](https://lovable.dev) (shih `frontend/AGENTS.md`) — shmang rewrite të historisë git (force-push, rebase/amend/squash mbi commits të pushuar) në branch-in e lidhur, pasi prish sinkronizimin me Lovable.
- Faza 5 (AI Features) tashmë ka një plan të detajuar në 4 nën-faza (5.1 Chat/tool-calling, 5.2 auto-tag nga foto, 5.3 visual search me CLIP+pgvector, 5.4 vlerësim çmimi dy-fazor) — shiko `docs/faza/faza-5-ai-features.md` §"Vendime të Hapura" për pikat që kërkojnë vendim para implementimit (LLM provider, hosting i embeddings, buxheti, privatësia e chat-it).
