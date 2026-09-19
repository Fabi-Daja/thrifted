# Faza 5 — AI Features (v2)

**Status:** 🟡 Në proces — 5.1 (Chat), 5.2 (auto-tag foto) dhe 5.4 (estimate-price) kanë kod funksional; 5.3 (visual search) e implementuar plotësisht në kod dhe e testuar kundër DB/Voyage AI lokale. **5.5 (rekomandime të personalizuara) e implementuar dhe e testuar plotësisht, backend+frontend, 2026-08-27.** Frontend: **5.1 dhe 5.5 kanë UI funksionale** (widget global i chat-it; rreshti "Rekomanduar për ty" në faqen kryesore); 5.2/5.3/5.4 s'kanë ende UI.
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

### Frontend — 2026-08-26 — [x] IMPLEMENTUAR

Widget global (jo faqe e veçantë) - montuar një herë te `routes/__root.tsx`, i dukshëm në çdo faqe (buton "floating" bottom-right, sipër `ScrollToTop`-it që u zhvendos te `bottom-24` për të mos u mbivendosur).

- `components/chat/ChatWidget.tsx` — paneli i bisedës (mesazhe user/assistant, bubble "duke shkruar…", gabime të shfaqura si bubble + toast via `extractApiError`)
- `components/chat/ChatProductCard.tsx` — kartë kompakte produkti, e ndryshme nga `product/ProductCard.tsx` (ky merr `ProductResponse` të plotë; chat-i merr vetëm nënbashkësinë e fushave që kthen `schemas/chat.py::ProductCard`)
- `api/chatApi.ts` + `hooks/useAiChat.ts` — `POST /chat`, stateless nga ana e backend-it (klienti mban gjithë historinë në state lokal të komponentit, dërgon historinë e plotë çdo herë; s'ka persistence — rifreskimi i faqes fshin bisedën, i mjaftueshëm për MVP)
- Tipe të reja te `types/index.ts`, parashtesë `AiChat*` (jo `ChatMessage*`, që tashmë përdoret nga biseda blerës-shitës)
- **Zbulim gjatë verifikimit:** `schemas/chat.py::ChatMessage.role` kishte koment të vjetëruar (`"user" ose "model"`, mbetje nga para migrimit Groq→Claude) — rolet kalohen direkt te Anthropic Messages API, që pranon vetëm `"user"`/`"assistant"`; frontend-i përdor `"assistant"`, komenti u korrigjua.
- **Testuar:** `tsc --noEmit` dhe `eslint` kalojnë pa gabime; rrjedha e plotë e UI-t (hap/mbyll panelin, dërgim mesazhi, gjendja "duke shkruar…", rendering i gabimit) e verifikuar live kundër backend-it lokal (`POST /chat` u thirr saktë, gabimi u shfaq siç pritej — llogaria lokale Anthropic s'kishte kredite, kështu që rrjedha e suksesshme me `products` s'u pa live, por struktura e të dhënave përputhet 1-për-1 me `schemas/chat.py::ChatResponse`)

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

## 5.5 — Rekomandime të Personalizuara (i ri, propozuar 2026-08-26)

**Status:** ✅ Backend + Frontend të implementuara dhe të testuara (2026-08-27, testim shtesë 2026-08-29) — **[x]** IMPLEMENTUAR (jo pjesë e listës origjinale US-49→US-52 të API contract-it, prandaj s'ka numër US ende).

**Endpoint i propozuar:** `GET /users/me/recommendations` — **auth e detyrueshme** (personalizimi kërkon të dihet kush është useri, ndryshe nga `search-by-image` që është publik).

### Pse jo Collaborative Filtering klasik

Thrifted është marketplace second-hand: çdo artikull është një copë e vetme që zhduket pas shitjes. "Item-item collaborative filtering" (bazuar te blerje të përsëritura nga shumë përdorues) nuk ka mjaftueshëm përsëritje të dhënash për të funksionuar mirë këtu — qasja e duhur është **content-based**, e ndërtuar mbi infrastrukturën ekzistuese të embeddings nga 5.3.

### Ideja e arkitekturës (për t'u zbatuar nga Claude Code)

- **Tabelë e re** (emër propozuar `user_product_interactions`): `user_id`, `product_id`, `interaction_type` (view / favorite / purchase / search), `weight` (p.sh. view=1, favorite=5, purchase=10), `created_at`.
- **Service i ri** (emër propozuar `recommendation_service.py`): merr produktet me të cilat useri ka ndërvepruar pozitivisht, llogarit embedding-un mesatar/të ponderuar (sipas `weight`) nga `product_image_embeddings` (**ripërdorim direkt i tabelës së 5.3**, jo infrastrukturë e re AI), pastaj `cosine_distance` kundrejt gjithë embeddings-eve (i njëjti mekanizëm si `search_by_image()`, vetëm që query vector-i vjen nga historia e userit, jo nga një foto e re).
- **Filtra plotësues**: kategori/markë/rreze çmimi nga historia e userit, si sinjal shtesë përveç ngjashmërisë vizuale.
- **Cold start** (user pa histori): fallback te "trending"/më të rejat, njësoj si logjika e propozuar për 5.4 Faza B.

### Implementimi aktual (2026-08-27)

- Migrim Alembic `f2a3b4c5d6e7` (revises `e1f2a3b4c5d6`): tabela `user_product_interactions` (`user_id`, `product_id` - të dyja `ondelete="CASCADE"`, `interaction_type`, `weight`, `created_at`), indekse mbi `user_id` dhe `product_id`. Ekzekutuar kundër DB lokale dhe verifikuar drejtpërdrejt (`information_schema.columns`, `pg_constraint.confdeltype='c'`, `pg_indexes`).
- `app/models/user_product_interaction.py` — modeli SQLAlchemy, regjistruar te `app/models/__init__.py` dhe `alembic/env.py` (mungonte edhe `ProductImageEmbedding` te `__init__.py` - u shtua tani gjatë kalimit).
- `app/services/recommendation_service.py`:
  - `INTERACTION_WEIGHTS` — `view=1, favorite=5, purchase=10, search=1` (siç propozohej te plani). **`search` mbetet i papërdorur** - s'ka hook të lidhur ende (jo pjesë e checklist-it origjinal, shih "Probleme" më poshtë).
  - `log_interaction()` — fail-secure (njësoj si hook-u i embeddings-eve te 5.3): përdor `db.begin_nested()` (SAVEPOINT) në vend të `db.add()+commit()` të thjeshtë, që një dështim të mos rrëzojë transaksionin e caller-it (p.sh. `Favorite`-in e pa-commit-uar ende). Caller-i bën commit-in final.
  - `get_recommendations()` — mbledh `UserProductInteraction` të userit, ndërton embedding të ponderuar nga `product_image_embeddings` (mesatarizim brenda produktit për foto të shumëfishta, pastaj ponderim sipas `weight` mes produkteve), `cosine_distance` kundër katalogut (i njëjti mekanizëm si `search_by_image`), përjashton produktet me të cilat useri ka ndërvepruar tashmë. **Sinjale plotësuese** (kategori/markë/rreze çmimi nga historia e userit) aplikohen si **bonus i vogël në rirenditje** (`CATEGORY_MATCH_BONUS=0.10`, `BRAND_MATCH_BONUS=0.05`, `PRICE_RANGE_MATCH_BONUS=0.05`, tolerancë çmimi ±30%) - vlera **empirike**, të kalibrueshme më vonë, jo hard-filter (siç e kërkon plani).
  - `_trending_fallback()` — cold-start: produktet me më shumë `weight` të grumbulluar te `user_product_interactions` (të gjithë userat); nëse tabela është ende bosh (bootstrap), fallback më tej te produktet aktive më të reja.
- `GET /users/me/recommendations` te `app/routers/users.py` (jo router i veçantë - grupohet me `/me/purchases`, `/me/sales`, etj.), auth e detyrueshme, query param `limit` (default 10, i kufizuar 1-50).
- `app/schemas/recommendation.py::RecommendationResult` — nënbashkësi fushash produkti, njësoj në stil me `ImageSearchResult` (5.3) por pa `similarity_distance` (s'ka kuptim universal - fallback-u i trending s'ka distancë).
- **Hook-et e mbushjes** (vetëm view/favorite/purchase, jo `search`):
  - `favorite` (weight=5) — `app/routers/favorite.py`, brenda të njëjtit commit me krijimin e `Favorite`-it.
  - `purchase` (weight=10) — `app/services/payment_service.py::finalize_checkout_session`, brenda të njëjtit commit me krijimin e `Order`-it.
  - `view` (weight=1) — `app/routers/product.py::GET /products/{id}`, vetëm për userat e loguar (route-i mbetet publik/guest-friendly, tani me `get_current_user_optional`; guest-at nuk kanë `user_id` për të cilin të ndërtohet histori, kështu që s'logohen).
- **[BUG i pa-lidhur, gjetur dhe rregulluar gjatë testimit]** `app/routers/favorite.py` (POST `/favorites/{product_id}`) përdorte `Favorite.user.id` (AttributeError - `Favorite` s'ka relationship `user`, vetëm `product`) në vend të `Favorite.user_id`, kështu që endpoint-i dështonte me 500 në çdo thirrje, pavarësisht nga puna e 5.5. U rregullua (`Favorite.user_id`) që të verifikohej hook-u i `favorite` me një thirrje reale HTTP.

**Testuar konkretisht (kundër DB lokale reale, jo vetëm teorikisht):**
- Migrimi u ekzekutua me sukses (`alembic upgrade head`), skema/FK/indekset u verifikuan drejtpërdrejt kundër Postgres.
- `get_recommendations()`: cold-start (user pa histori) → fallback te më të rejat aktive; user me `favorite` mbi një produkt me embedding → rrugës vektoriale korrekte (u verifikua duke aktivizuar përkohësisht statusin e produktit të vetëm tjetër me embedding lokal brenda një transaksioni që u bë `rollback()` në fund, pa prekur DB-në reale) - rezultati i vetëm ishte saktësisht produkti tjetër i embeduar, i njëjtës kategori.
- Të tre hook-et (`view`, `favorite`, `purchase`) u thirrën përmes `TestClient`/thirrje direkte të service-it (për purchase, me një sesion Stripe të simuluar - s'kërkohet pagesë reale), u verifikua rreshti i saktë (`interaction_type`, `weight`) në DB, dhe u pastruan të dhënat e testit menjëherë pas.
- `GET /users/me/recommendations`: 401 pa token, 200 me token, `limit` respektohet.
- Baza lokale ka vetëm **2 embeddings ekzistuese** (nga 5.3) - i mjaftueshëm për të verifikuar mekanizmin, por s'ka mjaftueshëm volum për të vlerësuar cilësinë reale të rekomandimeve me shumë kandidatë.

### Frontend — 2026-08-27 — [x] IMPLEMENTUAR

Rresht i ri **"Rekomanduar për ty"** te faqja kryesore (`routes/index.tsx`), pozicionuar mes "Kategoritë" dhe "Të shtuara së fundmi" (personalizimi vjen para përmbajtjes gjenerike).

- `types/index.ts::RecommendationResult` — nënbashkësi fushash, e njëjta formë me `AiChatProductCard` (5.1) por tip i veçantë (jo ripërdorim), njësoj si te backend (`schemas/recommendation.py` i veçantë nga `schemas/chat.py::ProductCard`).
- `api/usersApi.ts::myRecommendations(limit?)` + `hooks/useRecommendations.ts` — `useQuery` me `enabled: isLoggedIn` (endpoint-i kërkon auth, s'ka kuptim ta thërrasim për guest).
- `components/product/RecommendationCard.tsx` + `RecommendationsRow.tsx` — komponentë të rinj, jo ripërdorim i `ProductCard`/`ProductRow` ekzistues sepse ata kërkojnë `ProductResponse` të plotë (`images[]`, `selling_type`, `size`) që `RecommendationResult` s'i ka. `RecommendationsRow` kthen `null` (jo mesazh bosh) kur s'ka rezultate, që rreshti të mos shfaqet fare për vizitorë të palogum.
- **Zbulim gjatë verifikimit:** backend-i lokal (`uvicorn`, port 8000) ishte duke xhiruar **pa `--reload`**, kështu që route-i i ri `GET /users/me/recommendations` kthente 404 përmes frontend-it edhe pse ekzistonte në kod (i verifikuar më parë vetëm me `TestClient` brenda procesit). U rifillua me `--reload` - mësim i dobishëm për ciklin e zhvillimit vazhdues.

**Testuar (live, në shfletues real, jo vetëm `TestClient`):** u krijua një user testues i përkohshëm (`e2e-recotest@example.com`), u kyç përmes UI, u verifikua (a) rreshti **s'shfaqet fare** për guest, (b) rreshti shfaqet me fallback "trending"/më të reja për user pa histori (cold-start, siç pritej), (c) klikimi mbi një kartë çon te faqja e produktit dhe **loget saktë** një ndërveprim `view` në `user_product_interactions`. User-i testues dhe të dhënat e tij u fshinë menjëherë pas testimit. U shtua edhe një konfigurim i dytë `frontend-preview` (port 5173) te `.claude/launch.json`, pasi porti 8080 ishte i zënë nga një sesion tjetër - `127.0.0.1:8000`/`5173` janë të dyja në listën `CORS` ekzistuese të backend-it (`app/main.py`), s'u ndryshua asgjë atje.

### Testim shtesë i thelluar — 2026-08-29

Useri kërkoi eksplicitisht një kalim testimi mbi 5.5. U shkrua një skript testesh (jo i commituar, jashtë repo-s - `scratchpad`) me 18 kontrolle, i ekzekutuar dy herë kundër DB lokale reale (jo mock), duke përfshirë `TestClient` (me `raise_server_exceptions=False` që bug-et ekzistuese të mos e ndalin ekzekutimin), thirrje direkte të `recommendation_service`/`payment_service`, dhe user testues të përkohshëm të fshirë plotësisht (përfshi `Conversation`/`Message`/`Notification` të krijuara anash nga `finalize_checkout_session`) pas çdo ekzekutimi.

**[BUG real i gjetur dhe i rregulluar]** `_trending_fallback()` **s'i përjashtonte produktet me të cilat useri kishte ndërvepruar tashmë** kur fallback-u thirrej për një user QË KA histori (jo bootstrap i vërtetë) - p.sh. useri favorizon/shikon/blen një produkt pa embedding (rasti i zakonshëm aktualisht, bazuar lokale ka vetëm 2/19 produkte me embedding), `get_recommendations()` bie te `_trending_fallback`, i cili **nuk dinte të përjashtonte** produktet e sapo-interaguara - dhe meqë "trending" llogaritet nga `SUM(weight)` mbi TË GJITHA ndërveprimet, ndërveprimi i vetë userit të sapo-krijuar mund ta "dominojë" renditjen globale (sidomos me tabelë të vogël ndërveprimesh, siç është rasti aktual) dhe t'i rekomandojë përsëri saktësisht atë që sapo bëri. I zbuluar nga testi #8 (kontroll eksplicit "rekomandimet duhet të përjashtojnë produktet e ndërvepruara"). **Rregullim:** `_trending_fallback()` tani pranon `exclude_product_ids` (default bosh); të katër vendet ku `get_recommendations()` bie te fallback-u tani i kalojnë `interacted_product_ids`. Rregulluar dhe riverifikuar - i njëjti skript testesh, **18/18 PASS** pas rregullimit (0/18 përpara).

**Rezultatet e plota të 18 kontrolleve** (401 pa token; cold-start → fallback jo-bosh; forma e `RecommendationResult`; `limit` respektohet dhe kufizohet; `log_interaction` fail-secure - SAVEPOINT mbron rreshtat e tjerë pending të sesionit edhe kur vetë interaction-i dështon nga FK violation e qëllimshme; hook-et `favorite`/`view`/`purchase` logojnë saktë weight-in përkatës [5/1/10]; `view` shtohet si rresht i ri për çdo thirrje, jo upsert; rekomandimet përjashtojnë të interaguarat; rruga vektoriale reale - favorite mbi një produkt të embeduar → produkti tjetër i embeduar shfaqet i pari, verifikuar me rollback të plotë): **18/18 PASS**, DB u la në gjendjen fillestare (16 users, 19 produkte, 0 rreshta `user_product_interactions`) pas çdo ekzekutimi.

### Checklist

- [x] Migrim Alembic: tabela `user_product_interactions`
- [x] Hook-e për të mbushur tabelën: favorite, purchase, view (`search` mbetet i papërcaktuar - shih "Probleme")
- [x] `recommendation_service.py` — llogaritja e embedding-ut të ponderuar + query cosine
- [x] `GET /users/me/recommendations` — endpoint i autentikuar
- [x] Fallback "trending" për cold-start
- [ ] Test: user me histori të qartë (p.sh. favorite vetëm këpucë) merr rekomandime nga e njëjta kategori/stil — **i pjesshëm**: u verifikua mekanizmi (histori → produkti tjetër i embeduar i së njëjtës kategori), por s'ka mjaftueshëm produkte/embeddings reale në DB lokale për një test me shumë kandidatë të ndryshëm (shih "Probleme")

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
- 2026-08-26 — **[BUG i rregulluar]** FK `product_image_embeddings.image_id -> product_images.id` s'kishte `ondelete="CASCADE"` (gjetur 2026-08-24, review i Cowork) → `DELETE /products/{id}/images` dështonte me `IntegrityError` sapo foto e fshirë kishte embedding. Zgjidhur me migrim të ri Alembic (`e1f2a3b4c5d6`, drop+recreate i FK-së me `ondelete="CASCADE"`) + `models/product_image_embedding.py` përditësuar. Ekzekutuar kundër DB lokale dhe verifikuar drejtpërdrejt (`pg_constraint.confdeltype = 'c'`) **dhe** me një fshirje reale të një fote ekzistuese me embedding (u fshi me sukses, embedding-u u fshi automatikisht në kaskadë, pa gabim).
- 2026-08-26 — **Frontend UI për 5.1 (AI Chat)** — widget global (shih seksionin "Frontend" te 5.1 më sipër). Zbulim gjatë punës: koment i vjetëruar te `schemas/chat.py::ChatMessage.role` (thoshte `"model"`, mbetje nga para migrimit Groq→Claude) - u korrigjua në `"assistant"`, e vetmja vlerë që pranon Anthropic Messages API.
- 2026-08-26 — **[PLAN i ri] 5.5 — Rekomandime të personalizuara.** Useri kërkoi shpjegim si ndërtohet një sistem rekomandimesh bazuar te useri; u diskutua pse collaborative filtering klasik s'i shkon marketplace second-hand (artikuj unikë, jo të përsëritur) dhe pse content-based mbi `product_image_embeddings` ekzistuese (nga 5.3) është qasja e duhur. U shtua seksioni i plotë 5.5 me arkitekturën e propozuar (tabelë e re `user_product_interactions`, service i ri, endpoint `GET /users/me/recommendations`, fallback trending për cold-start) — **vetëm plan, ende pa kod.**
- 2026-08-27 — **5.5 u implementua dhe u testua (backend).** Migrim Alembic `f2a3b4c5d6e7` (tabela `user_product_interactions`, FK-të me `ondelete="CASCADE"` që në fillim - mësimi nga bug-u i mëparshëm i `product_image_embeddings`), `app/services/recommendation_service.py` (embedding i ponderuar + cosine + bonus i vogël kategori/markë/çmim si sinjal shtesë, jo hard-filter + fallback trending), `GET /users/me/recommendations` te `app/routers/users.py`, hook-e te `favorite.py`/`payment_service.py`/`product.py` (jo `search` - mbetet pa hook). Testuar drejtpërdrejt kundër DB lokale reale (migrim, skemë/FK/indekse, cold-start, rrugë vektoriale me rollback të qëllimshëm për të mos prekur të dhëna reale, tre hook-et, endpoint-i me TestClient). **Gjatë testimit u gjet dhe u rregullua** një bug i pa-lidhur në `favorite.py` (`Favorite.user.id` → `Favorite.user_id`, AttributeError që prishte çdo thirrje POST `/favorites/{id}`) - i domosdoshëm për të verifikuar hook-un e `favorite`. U gjet (por s'u rregullua, jashtë qëllimit të 5.5) edhe një `ResponseValidationError` i pavarur në të njëjtin endpoint (response_model s'përputhet me atë çka kthehet realisht) - flag-uar veçmas (task i dërguar në background, `task_221c0e32`). **[x] Rregulluar më vonë, 2026-09-06** - shih `faza-3-favorites-search-filters.md` (kërkoi edhe një bug të dytë, të pazbuluar më parë, te `GET /favorites`).
- 2026-08-27 — **5.5 Frontend.** Useri kërkoi që rekomandimet të dalin edhe në frontend. U shtua rreshti "Rekomanduar për ty" te `routes/index.tsx` (mes "Kategoritë" dhe "Të shtuara së fundmi") + `types/index.ts::RecommendationResult`, `api/usersApi.ts::myRecommendations`, `hooks/useRecommendations.ts`, `components/product/RecommendationCard.tsx` + `RecommendationsRow.tsx` (komponentë të rinj, jo ripërdorim i `ProductCard`/`ProductRow` - shih arsyetimin te seksioni "Frontend" i 5.5 më sipër). Testuar live në shfletues real (jo vetëm `TestClient`): user testues i përkohshëm, i fshirë menjëherë pas testit. **Zbulim:** backend-i lokal ekzistues xhironte pa `--reload`, kështu që route-i i ri kthente 404 nga frontend-i - u rifillua serveri me `--reload`. U shtua konfigurim `frontend-preview` (port 5173, brenda listës `CORS` ekzistuese) te `.claude/launch.json` sepse porti 8080 ishte i zënë nga një sesion tjetër.
- 2026-08-31 — **Rifinim vizual i widget-it të AI Chat (5.1 frontend)**, kërkuar nga useri me skill-in `/frontend-design`. Nuk ndryshoi funksionaliteti/kontrata me backend-in — vetëm `components/chat/ChatWidget.tsx` + `ChatProductCard.tsx` + keyframe të reja te `styles.css`, brenda tokenave ekzistuese të design-it (asnjë ngjyrë/font i ri): (1) `ThriftyMark` — badge i përbashkët me ikonë `Tag` (jo "sparkle" gjenerike AI), i ripërdorur te butoni floating dhe header-i i panelit, si "identitet" i qëndrueshëm i asistentit; (2) chips sugjerimesh ("Gjej një xhaketë prej xhins", "Sa vlen një bluzë Zara e përdorur?", "Si funksionon blerja e sigurt?") të shfaqura vetëm në gjendjen bosh, të njëjtin stil "chip" si pjesa tjetër e site-it; (3) status "online" (pikë jeshile) te header-i; (4) animacion hyrës i panelit (`animate-chat-pop`) + një pulsim i vetëm, jo i pafundëm, rreth butonit floating në montim (`animate-chat-pulse`, 2 iterime, ndalet vetvetiu) — respekton `prefers-reduced-motion` global ekzistues; (5) lift i lehtë hover te `ChatProductCard`. Provuar: `tsc --noEmit` dhe `eslint` kalojnë pa gabime; rrjedha e plotë e UI (hapje panel, chip → mesazh, gabim i shfaqur si bubble+toast) verifikuar live në browser (desktop + mobile 375px), duke përfshirë rastin pa backend (gabimi tregohet saktë). Referenca fillestare e userit ishte një mockup te Claude Design (`claude.ai/design/...`) — s'u arrit të shihej (linku kërkon login), kështu që rifinimi u bazua vetëm te sistemi ekzistues i tokenave (`styles.css`) dhe `docs/faza/faza-*.md`, siç konfirmoi useri.
- 2026-08-29 — **Testim shtesë i thelluar i 5.5**, kërkuar eksplicitisht nga useri ("bej testime se si funksionon ky funksionalitet"). Skript testesh me 18 kontrolle kundër DB lokale reale (shih seksionin "Testim shtesë i thelluar" te 5.5 më sipër). **[BUG real i gjetur dhe i rregulluar]** `_trending_fallback()` s'i përjashtonte produktet me të cilat useri kishte ndërvepruar tashmë kur fallback-u aktivizohej për një user QË KA histori (jo bootstrap i vërtetë) - mund ta "rekomandonte" përsëri saktësisht produktin që sapo favorizoi/pa/bleu. Rregulluar duke shtuar parametrin `exclude_product_ids` te `_trending_fallback()` dhe duke e kaluar `interacted_product_ids` në të katër vendet e `get_recommendations()` që bien te fallback-u. Riverifikuar me të njëjtin skript: 18/18 PASS.

## Probleme / Çështje të Hapura

- Cold-start i vlerësimit të çmimit (5.4) — mbetet vendimi kur "mjaftueshëm të dhëna" konsiderohet i arritur për Fazën B.
- **pgvector në prodhim** — u zgjidh vetëm lokalisht (ndërtim nga burimi, Windows); nëse databaza e prodhimit ndryshon, duhet verifikuar mbështetja atje (shumica e ofruesve managed e kanë gati).
- Llogaria Voyage AI ka ende limit 3 kërkesa/minutë (pa metodë pagese) — mjafton për zhvillim/teste, jo për përdorim real me shumë produkte njëkohësisht.
- Frontend s'ka ende UI për 5.2 (auto-tag foto), 5.3 (visual search), 5.4 (estimate-price) — 5.1 (chat) tashmë ka UI (2026-08-26). Mbetet punë e veçantë.
- **Verifikim jo i plotë i 5.1 frontend** — ritestuar 2026-09-06 (kërkuar nga useri, "bëj testime"): llogaria lokale Anthropic **ende s'ka kredite** (`credit balance too low`), kështu që rrjedha e suksesshme (reply + karta produkti) mbetet e paverifikuar me përgjigje reale të Claude-it. **Por gjatë këtij testimi u gjet dhe u rregullua** një bug real i pavarur: `chat_service.py` (rreshti ~751) e kalonte mesazhin e papërpunuar të `anthropic.APIStatusError` (`e.message` - përfshin JSON të plotë, "Claude", ID kërkese, madje edhe tekstin e faturimit "Your credit balance is too low...") **direkt te useri fundor** brenda vetë bisedës së chat-it, në vend të një mesazhi të pastër. Rregulluar: gabimi i plotë loget server-side (`logger.error`), useri merr "Thrifty s'po përgjigjet dot tani. Provo përsëri pak më vonë." Verifikuar drejtpërdrejt në browser (mesazh real i dërguar, u pa teksti i pastër te UI, u konfirmua logu i detajuar në anën e serverit).
- **5.5 — hook `search` i papërcaktuar** — `INTERACTION_WEIGHTS` e `recommendation_service.py` përfshin `search`, por s'ka ende asnjë vend në kod që e thërret `log_interaction(..., "search")` (as `search_products`, as `search_by_image`). Vendim i hapur: a ka kuptim ta lidhim (dhe me çfarë "produkti" - rezultatet e para të një kërkimi tekst/foto?), apo ta heqim fare nga `INTERACTION_WEIGHTS` derisa të vendoset.
- **5.5 — kalibrim bonusesh kategori/markë/çmim** — `CATEGORY_MATCH_BONUS`/`BRAND_MATCH_BONUS`/`PRICE_RANGE_MATCH_BONUS` te `recommendation_service.py` janë vlera empirike fillestare (njësoj si `DEFAULT_SIMILARITY_LIMIT` te 5.3), pa kalibrim kundër përdorimit real - baza lokale ka vetëm 2 embeddings, e pamjaftueshme për ta testuar me shumë kandidatë të ndryshëm.
- **5.5 — `GET /products/{id}` tani bën një `db.commit()` shtesë** për userat e loguar (logimi i `view`-it) - endpoint i cili më parë ishte read-only. Pa efekt anësor real (nuk ndryshon vetë produktin), por ia vlen mbajtur parasysh nëse ky endpoint del ndonjëherë "hot path" me shumë trafik njëkohësisht (write i vogël por i shpeshtë).
- **[BUG i pa-lidhur, i gjetur gjatë 5.5, PA u rregulluar - flag-uar veçmas]** `app/routers/favorite.py`: POST dhe DELETE `/favorites/{product_id}` deklarojnë `response_model=list[FavoriteResponse]` por kthejnë një `dict` të thjeshtë (`{"message": ...}`), duke shkaktuar `ResponseValidationError` (500) në çdo thirrje të suksesshme. I pavarur nga logjika e 5.5 (ndodh pas commit-it, gjatë serializimit të përgjigjes) - vetë hook-u i `favorite` u verifikua të funksionojë saktë (rreshti në DB ekziston) pavarësisht këtij gabimi.
- **Backend-i lokal duhet xhiruar me `--reload`** për zhvillim vazhdues - u gjet gjatë verifikimit të frontend-it të 5.5 që procesi ekzistues (`uvicorn app.main:app --host 127.0.0.1 --port 8000`, pa `--reload`) s'e kishte marrë route-in e ri edhe pse kodi ishte shkruar prej kohësh (404 përmes frontend-it). U rifillua me `--reload`.

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
