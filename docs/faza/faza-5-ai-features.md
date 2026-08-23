# Faza 5 — AI Features (v2)

**Status:** 🟡 Në proces — 5.1 (Chat), 5.2 (auto-tag foto) dhe 5.4 (estimate-price) kanë kod funksional; 5.3 (visual search) e implementuar plotësisht në kod dhe e testuar kundër DB/Voyage AI lokale. Frontend s'ka ende UI për asnjërën.
**Varet nga:** Faza 1 (Products duhet të ekzistojnë), Faza 3 (endpoint-i `GET /products` me filtra, i ripërdorur nga 5.1)
**Referenca:** [`00-dokumentacion-master.md`](../00-dokumentacion-master.md) §7 (US-49→US-52), §9

## Qëllimi

Shtimi i veçorive AI mbi sistemin ekzistues të produkteve. Renditja e implementimit e vendosur më parë mbetet: **US-49 → US-50 → US-51 → US-52**, e ndarë në 4 nën-faza konkrete (5.1 → 5.4).

---

## 5.1 — AI Chat Assistant (US-49)

**Endpoint:** `POST /chat` *(në kod aktual — API contract origjinal thoshte `/ai/chat`, shih "Mospërputhje" më poshtë)*

### Statusi aktual

- [x] LLM provider: **Anthropic Claude API, `claude-haiku-4-5`** (klienti tani i përbashkët te `app/core/ai_client.py`, përdoret edhe nga 5.2)
- [x] Tool-calling: 10 tools (search/product-details/estimate-price/seller-reviews publike; favorites/orders/bids/conversation/notifications auth-only)
- [x] Rate-limiting bazik (in-memory)
- [x] 7 shtresa defense-in-depth kundër prompt injection + konfirmim i vërtetë në kod për veprime me efekte reale (`place_bid`, `start_conversation_with_seller`) — gjetur nga një security-review i kërkuar nga useri
- [x] Reply i strukturuar (`reply` + `products: list[ProductCard]`)

**Mospërputhje me API contract origjinal:** route `/chat` (jo `/ai/chat`) — **ende e hapur**, veçanërisht tani që 5.2/5.3/5.4 e reja ndjekin të gjitha konventën `/ai/...`.

*(Detaje të plota të migrimit Groq→Claude dhe të 7 shtresave të Gap #4 mbeten në historinë e commit-eve, `git log -- backend/app/services/chat_service.py` — përmbledhur këtu për të mos e mbingarkuar skedarin.)*

---

## 5.2 — Auto-tag nga Foto (US-50)

**Endpoint:** `POST /ai/analyze-image` — **[x] IMPLEMENTUAR (2026-08-21)**

**Vendimi i provider-it** (ishte "Vendim i Hapur"): **Claude** (i njëjti si 5.1) — mbështet vision, konsistencë me pjesën tjetër të sistemit.

- `app/core/ai_client.py` — klienti `AsyncAnthropic` i përbashkët (5.1+5.2).
- `app/services/image_analysis_service.py` — 1-N foto → Claude vision + tool `suggest_product_fields` me `tool_choice` **të detyruar** (output strukturuar, jo tekst i parse-uar).
- **Fail-secure për foto të paqarta/multi-produkt:** `is_clear_single_item=false` (ose i pa-specifikuar fare nga modeli) → **të gjitha fushat kthehen bosh**, `confidence: "e ulet"` — kërkesë eksplicite e checklist-it origjinal.
- `app/routers/image_analysis.py` — auth e detyrueshme, limit `MAX_ANALYSIS_IMAGES = 5`.

**Testuar:** logjika fail-secure (teste njësie, pa API) + endpoint i plotë (auth, limiti i fotove, forma e përgjigjes) me `TestClient` + mock. **Ende e patestuar:** rrjedha reale kundrejt Claude live (kërkon kredite Anthropic).

---

## 5.3 — Kërkim me Foto / Visual Search (US-51)

**Endpoint:** `POST /ai/search-by-image` — **[x] IMPLEMENTUAR DHE TESTUAR (2026-08-23)**

**Embeddings:** **Voyage AI**, `voyage-multimodal-3.5` — useri krijoi llogari dhe dha API key (te `.env`). **Dimensioni real i embedding-ut u konfirmua me thirrje live: 1024** (s'ka parametër `output_dimension` te ky endpoint i Voyage, ndryshe nga embeddings-et e tyre të tekstit — u verifikua kundrejt API reference-it zyrtar përpara implementimit, jo hamendje).

### pgvector lokal — bllok i zgjidhur (2026-08-21 → 2026-08-23)

Postgres 18.3 (Windows) **s'e kishte fare** ekstensionin `pgvector` të disponueshëm (jo thjesht të çaktivizuar). U zgjidh:
1. U instaluan **Visual Studio Build Tools** (workload C++) via `winget`.
2. U klonua `pgvector` nga burimi zyrtar (github.com/pgvector/pgvector) dhe u ndërtua me `nmake`/MSVC kundrejt Postgres 18 — **pa gabime kompilimi**.
3. Kopjimi i skedarëve te `C:\Program Files\PostgreSQL\18\...` kërkonte leje admin që s'i kisha nga mjetet — useri e kreu vetë hapin final (elevated PowerShell).
4. Migrim Alembic (`c4d5e6f7a8b9`): `CREATE EXTENSION IF NOT EXISTS vector`, tabela `product_image_embeddings` (`product_id`, `image_id` UNIQUE, `embedding vector(1024)`), index **HNSW** (`vector_cosine_ops`) — ekzekutuar me sukses, verifikuar drejtpërdrejt kundër DB (`pg_extension`, `pg_indexes`).

**Arkitektura e implementuar:**
- `app/services/voyage_client.py` — thirrje REST direkte (httpx, jo SDK e re) kundrejt `api.voyageai.com/v1/multimodalembeddings`; kontroll eksplicit që embedding-u i kthyer ka saktësisht 1024 dimensione (jo supozim i heshtur).
- `app/models/product_image_embedding.py` — modeli SQLAlchemy (`pgvector.sqlalchemy.Vector`).
- `app/services/image_embedding_service.py`:
  - `generate_embedding_for_image()` — shkarkon foton nga Cloudinary, gjeneron embedding (`input_type="document"`), e ruan.
  - `search_by_image()` — embed foton e kërkimit (`input_type="query"` — Voyage rekomandon këtë dallim asimetrik për rezultate më të mira), `ORDER BY embedding <=> :query` (cosine distance, index HNSW), **dedup për produkt** (jo për foto - një produkt mund të ketë disa kënde/embeddings, merret distanca më e mirë).
- **Hook automatik** te `POST /products/{id}/images` (routers/product_image.py): çdo foto e re gjeneron embedding menjëherë. **Fail-secure e qëllimshme:** nëse Voyage dështon (429, kredite, etj.), upload-i i fotos **s'prishet** — vetëm ajo foto mbetet pa embedding (backfill-i e plotëson më vonë). Commit **për foto**, jo i grupuar (një dështim s'e "tërheq mbrapsht" embedding-un e suksesshëm të një fotoje tjetër të të njëjtit upload — defekt real i gjetur dhe rregulluar gjatë implementimit).
- `scripts/backfill_image_embeddings.py` — skript një-herësh për fotot ekzistuese pa embedding.
- `app/routers/image_search.py` — `POST /ai/search-by-image`, **publik** (Guest/User, sipas API contract origjinal — njësoj si `search_products`).

**Testuar konkretisht (jo vetëm teorikisht):**
- Thirrje live te Voyage AI me foto reale nga Cloudinary → embedding 1024-dim, konfirmuar.
- Backfill i ekzekutuar kundër DB lokale: **3 nga 3 foto ekzistuese** u indeksuan me sukses.
- Test end-to-end i `search_by_image()`: kërkim me **të njëjtën foto** të një produkti ekzistues → produkti i vet u kthye **i pari**, me distancë cosine ~0 (siç pritej matematikisht).
- **Zbulim gjatë testimit (jo defekt kodi):** llogaria Voyage AI e re ka limit të ulët (**3 kërkesa/minutë**) derisa të shtohet metodë pagese te dashboard-i i tyre — u kap saktë si `HTTPException(502)` me mesazhin real të Voyage-it, jo si crash i papërpunuar.

**Checklist:**
- [x] Instalo/aktivizo `pgvector` (lokalisht, me ndërtim nga burimi)
- [x] Migrim Alembic: tabela + index HNSW
- [x] Klienti Voyage AI
- [x] Hook automatik në upload të fotos
- [x] Backfill për fotot ekzistuese
- [x] `POST /ai/search-by-image`
- [x] Testo saktësinë (test i vetë-njohjes: foto → produkti i vet, distancë ~0)
- [ ] *(Më vonë)* Kalibrim i pragut minimal të distancës me raste reale të ndryshme produktesh (aktualisht kthehet vetëm top-N, pa prag të fiksuar — frontend/klienti mund të filtrojë vetë derisa të kalibrohet empirikisht)
- [ ] *(Më vonë)* Lidhje me chat assistant-in (5.1) — foto e bashkëngjitur në chat-box (kërkon ndryshim frontend)
- [ ] *(Më vonë)* "Hybrid search" (tekst + foto në të njëjtën hapësirë vektoriale Voyage)
- [ ] **Nëse databaza e prodhimit ndryshon nga Postgres lokal** (Render/Supabase/Neon/etj.): verifiko që pgvector mbështetet atje (shumica e ofruesve modernë e kanë të gatshëm, pa nevojë për ndërtim nga burimi si këtu)

---

## 5.4 — Vlerësim Çmimi (US-52)

**Endpoint:** `POST /ai/estimate-price` — **[x] IMPLEMENTUAR (2026-08-21)**

**Faza A (aktuale) — comps-based, jo LLM-based:** `app/services/price_estimate_service.py` — **shërbim i vetëm, i ripërdorur** nga tool-i `estimate_price` i chat-it (5.1) DHE endpoint-i i veçantë këtu (jo më logjikë e dyfishuar). Parametri `for_llm: bool` dallon vetëm nëse `note` përfshin udhëzim shtesë PËR MODELIN (kur s'ka mjaftueshëm comps) — pa kuptim për endpoint-in REST.
`app/routers/price_estimate.py` — auth e detyrueshme ("Qasje: User" sipas API contract, ndryshe nga tool-i homolog i chat-it që është publik brenda bisedës).

**Faza B (planifikuar, e patrajtuar):** regression/quantile mbi `Orders` reale, pasi të grumbullohen shitje mjaftueshme — kontrata e endpoint-it mbetet e njëjtë.

**Testuar:** funksioni i ndarë (≥3 comps dhe <3 comps, kundrejt DB lokale reale), dallimi `for_llm`, endpoint i plotë me `TestClient` (401/200/422).

---

## Vendime të Hapura (për t'u vendosur)

- [x] LLM provider 5.1 → Claude Haiku 4.5
- [x] Vision provider 5.2 → Claude
- [x] Embeddings 5.3 → Voyage AI (`voyage-multimodal-3.5`, 1024-dim, konfirmuar)
- [x] Buxheti/rate-limits 5.1 → in-memory 10 msg/60s
- [x] Format i `reply`-t → objekt i strukturuar
- [ ] **Privatësia e bisedave** të chat-it (5.1) — a ruhen, për sa kohë
- [ ] Route `/chat` vs `/ai/chat` — sinkronizim me API contract
- [ ] **pgvector në prodhim** — nëse databaza e prodhimit ndryshon nga Postgres lokal, verifiko mbështetjen atje

## Vendime & Ndryshime

- 2026-08-20 — Plan konkret nën-fazash (5.1–5.4).
- 2026-08-21 — 5.1 u soll në gjendje production-ready: migrim te Claude Haiku 4.5, auth opsionale, 10 tools, rate-limiting, 7 shtresa defense-in-depth (+ konfirmim i vërtetë kundër indirect prompt injection, gjetur nga security-review), reply i strukturuar.
- 2026-08-21 — Useri kërkoi zbatimin e 5.2/5.3/5.4. U implementuan **5.2** dhe **5.4** të plota (shih seksionet përkatëse). Për **5.3**: useri dha API key Voyage AI; u zbulua që `pgvector` s'ekzistonte fare lokalisht; useri zgjodhi ta ndërtojë nga burimi (Visual Studio Build Tools).
- 2026-08-23 — **5.3 u përfundua dhe u testua plotësisht.** Build Tools u instaluan, `pgvector` u ndërtua me sukses nga burimi; hapi final i instalimit (kopjim te Program Files) kërkoi leje admin që useri e kreu manualisht (2 tentativa - e para dështoi për shkak të "PowerShell execution policy" mbi skedarin `.ps1`, u zgjidh duke ngjitur komandat direkt në një sesion PowerShell Admin). Migrimi Alembic u ekzekutua me sukses (ekstensioni + tabela + index HNSW, verifikuar drejtpërdrejt kundër DB). U implementuan klienti Voyage AI, hook-u automatik i embeddings (me fail-secure - **u gjet dhe u rregullua një defekt real:** commit i grupuar do t'i "tërhiqte mbrapsht" embeddings e suksesshme kur njëra dështonte), skripti i backfill-it, dhe endpoint-i i kërkimit. Testuar plotësisht me thirrje reale: dimensioni i embedding-ut (1024, s'ka parametër konfigurimi për këtë endpoint të Voyage, verifikuar kundrejt API reference-it), backfill i 3 fotove ekzistuese, dhe një test "vetë-njohjeje" (kërkim me të njëjtën foto → produkti i vet, distancë ~0). U zbulua (jo defekt) që llogaria e re Voyage AI ka limit 3 req/min pa metodë pagese.

## Probleme / Çështje të Hapura

- Cold-start i vlerësimit të çmimit (5.4) — mbetet vendimi kur "mjaftueshëm të dhëna" konsiderohet i arritur për Fazën B.
- **pgvector në prodhim** — u zgjidh vetëm lokalisht (ndërtim nga burimi, Windows); nëse databaza e prodhimit ndryshon, duhet verifikuar mbështetja atje (shumica e ofruesve managed e kanë gati).
- Llogaria Voyage AI ka ende limit 3 kërkesa/minutë (pa metodë pagese) — mjafton për zhvillim/teste, jo për përdorim real me shumë produkte njëkohësisht.
- Frontend s'ka ende UI për asnjë nga 5.1/5.2/5.3/5.4 — mbetet punë e veçantë.

---

## Burimet (research bazë për këtë plan)

- [Build an AI Shopping Assistant: Architecture Guide](https://www.blockchain-council.org/ai/how-to-build-an-ai-shopping-assistant-architecture-llm-tools-recommendation-pipelines/)
- [Ximilar — How to Automate Product Descriptions](https://www.ximilar.com/blog/how-to-automate-product-descriptions/)
- [Alhena AI — Prompt Injection in Ecommerce AI: 6 Types](https://alhena.ai/blog/prompt-injection-ecommerce-ai-chatbot/)
- [Amio — E-commerce Chatbots: The Complete Guide for 2026](https://www.amio.io/blog/e-commerce-chatbots-the-complete-guide-for-2026)
- [Datadog — LLM Guardrails Best Practices](https://www.datadoghq.com/blog/llm-guardrails-best-practices/)
- [LogRocket — How to protect your AI agent from prompt injection attacks](https://blog.logrocket.com/protect-ai-agent-from-prompt-injection/)
- [Claude Platform Docs — Vision](https://platform.claude.com/docs/en/build-with-claude/vision)
- [Neon — Understanding vector search and HNSW index with pgvector](https://neon.com/blog/understanding-vector-search-and-hnsw-index-with-pgvector)
- [Voyage AI — Multimodal Embeddings docs](https://docs.voyageai.com/docs/multimodal-embeddings) + [API Reference](https://docs.voyageai.com/reference/multimodal-embeddings-api)
- [pgvector — Windows build instructions](https://github.com/pgvector/pgvector#windows)
- Kërkim i përgjithshëm mbi price prediction dhe memory patterns për conversational AI
