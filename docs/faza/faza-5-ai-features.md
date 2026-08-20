# Faza 5 — AI Features (v2)

**Status:** 🔲 Nuk ka filluar
**Varet nga:** Faza 1 (Products duhet të ekzistojnë), Faza 3 (endpoint-i `GET /products` me filtra, i ripërdorur nga 5.1)
**Referenca:** [`00-dokumentacion-master.md`](../00-dokumentacion-master.md) §7 (US-49→US-52), §9

## Qëllimi

Shtimi i veçorive AI mbi sistemin ekzistues të produkteve. Renditja e implementimit e vendosur më parë mbetet: **US-49 → US-50 → US-51 → US-52**, tani e ndarë në 4 nën-faza konkrete (5.1 → 5.4) me arkitekturë të përcaktuar për secilën, bazuar në research të praktikave aktuale (shih **Burimet** në fund).

---

## 5.1 — AI Chat Assistant (US-49)

**Endpoint:** `POST /ai/chat`

**Arkitekturë:**
- Një LLM me **tool-calling / function-calling** (jo LLM që "di" produktet vetë) — LLM-i vetëm interpreton gjuhën natyrale dhe thërret si "tool" endpoint-in ekzistues `GET /products?category=&brand=&price_min=&price_max=&...` (Faza 3). LLM-i s'duhet të jetë autoritet mbi çmimet/inventarin — vetëm planifikues i kërkimit.
- Flow: mesazhi i userit → LLM ekstrakton filtra (kategori, çmim min/max, markë, madhësi, etj.) → thirret `/products` me ato filtra → rezultatet i kthehen LLM-it → LLM formulon përgjigje natyrale me produktet e gjetura.
- Konteksti i bisedës: për MVP mjafton historia e shkurtër e dërguar nga frontend me çdo kërkesë (jo domosdoshmërisht e ruajtur server-side); ruajtje server-side (Redis/DB) mund të shtohet më vonë nëse duhet histori afatgjatë.
- S'kërkon infrastrukturë të re përveç një API key për LLM provider.

**Checklist:**
- [ ] Vendos LLM provider (Anthropic Claude API ose OpenAI API) — shih *Vendime të Hapura*
- [ ] Përkufizo "tool schema" për `/products` (parametrat si funksion i thirrshëm nga LLM)
- [ ] `POST /ai/chat` — merr mesazhin + (opsionale) historinë, thërret LLM me tool-calling
- [ ] Ekzekuto thirrjen reale te `/products` kur LLM kërkon "tool use"
- [ ] Kthe përgjigje natyrale + listë produktesh të strukturuar (jo vetëm tekst i lirë)
- [ ] Rate-limiting bazik për të shmangur abuzim/kosto të papritur

---

## 5.2 — Auto-tag nga Foto (US-50)

**Endpoint:** `POST /ai/analyze-image`

**Arkitekturë:**
- Vision-capable LLM (p.sh. Claude me vision, ose GPT-4V/ekuivalent) merr foton(ë) e produktit + një prompt me **JSON schema** që përputhet me fushat e `Products` (title, category, brand, color, condition_rating i sugjeruar, description, price range i përafërt).
- Zero-shot — s'kërkon trajnim modeli. E njëjta rrugë upload-i si për foto normale produkti (Faza 1, `POST /products/{id}/images`), thjesht i kalohet edhe në endpoint-in AI para/pas ruajtjes.
- **E rëndësishme (vendim ekzistues nga dokumenti master):** çdo fushë e gjeneruar mbetet **e modifikueshme** nga useri te forma "Create Product" — AI vetëm parapopullon, s'garanton saktësi.

**Checklist:**
- [ ] Zgjidh vision model/provider (mund të jetë i njëjti si 5.1)
- [ ] Përkufizo JSON schema e output-it (fushat e Products)
- [ ] `POST /ai/analyze-image` — merr foto(t), kthen fushat e sugjeruara
- [ ] Frontend: parapopullo formën "Create Product" me rezultatin, të gjitha fushat editable
- [ ] Trajto rastin e fotove të paqarta/multi-produkt (confidence i ulët → fusha bosh, jo hamendje)

---

## 5.3 — Kërkim me Foto / Visual Search (US-51)

**Endpoint:** `POST /ai/search-by-image`

**Arkitekturë:**
- Model embeddings i familjes **CLIP** (p.sh. ViT-B/32) gjeneron një vektor për çdo foto produkti.
- **Ruajtja:** ekstensioni **pgvector mbi PostgreSQL-in ekzistues** (Faza 1) — pa infrastrukturë të re DB. Tabelë e re `product_image_embeddings` (product_id, image_id, embedding vector(512/768)).
- Gjenerimi i embeddings mund të bëhet: (a) përmes një **API të hostuar** (më e thjeshtë, pa GPU, kosto për thirrje), ose (b) **model CLIP lokal (ONNX)** brenda backend-it (kontroll kostoje, por kërkon burime CPU/GPU shtesë) — vendimi varet nga trafiku/buxheti, shih *Vendime të Hapura*.
- Flow kërkimi: foto query → embedding → **cosine similarity nearest-neighbor** kundrejt `product_image_embeddings` (pgvector) → kthe top-N produktet mbi një prag ngjashmërie (p.sh. ≥0.75).
- Embeddings gjenerohen automatikisht kur ngarkohet një foto e re produkti (hook mbi `POST /products/{id}/images`) + backfill një herë për produktet ekzistuese kur veçoria aktivizohet.

**Checklist:**
- [ ] Instalo/aktivizo ekstensionin `pgvector` në PostgreSQL
- [ ] Migrim Alembic: tabela `product_image_embeddings`
- [ ] Vendos qasjen e gjenerimit të embeddings (API e hostuar vs. model lokal)
- [ ] Hook: gjenero embedding automatikisht në upload të fotos së produktit
- [ ] Backfill embeddings për produktet ekzistuese (skript një-herësh)
- [ ] `POST /ai/search-by-image` — embed query image + similarity search + prag minimal
- [ ] Testo saktësinë me disa raste reale (foto e njëjtë nga kënde/dritë të ndryshme)

---

## 5.4 — Vlerësim Çmimi (US-52)

**Endpoint:** `POST /ai/estimate-price`

**Problemi i "cold start":** në fillim s'ka të dhëna historike shitjesh (`Orders`) nga platforma jonë për të trajnuar një model. Prandaj një qasje **dy-fazore**:

**Faza A — herët (pak të dhëna):** vlerësim i bazuar në LLM — prompt me markë/kategori/condition/madhësi, LLM kthen një interval min–max + një **confidence score i ulët/heuristik**, gjithmonë i etiketuar qartë si "vlerësim, jo garanci" (siç e ka vendosur edhe dokumenti master te US-50/US-52).

**Faza B — pasi grumbullohen mjaftueshëm shitje reale** (p.sh. disa qindra produkte "Sold" për kategori): trajnim i një modeli të lehtë regression/gradient-boosting (ose **quantile regression** për të nxjerrë drejtpërdrejt p10–p90 si min–max) mbi të dhënat reale nga `Orders` (brand, category, condition_rating, size, final_price). Kjo jep një interval i bazuar statistikisht dhe një confidence score real (bazuar te madhësia e mostrës/varianca e modelit).

**E rëndësishme:** kontrata e `POST /ai/estimate-price` (input/output) mbetet e njëjtë mes Fazës A dhe B — ndryshon vetëm implementimi i brendshëm, kështu frontend s'prekët kur kalojmë nga A në B.

**Checklist:**
- [ ] Implemento Fazën A (LLM-based estimate) si version fillestar
- [ ] `POST /ai/estimate-price` — kthen `{price_min, price_max, confidence_score}`
- [ ] Përcakto prag (numër shitjesh/kategori) kur kalohet te Faza B
- [ ] (Më vonë) Trajno model regression/quantile mbi `Orders` reale
- [ ] (Më vonë) Krahaso saktësinë Faza A vs. Faza B para se të hiqet plotësisht LLM fallback

---

## Vendime të Hapura (për t'u vendosur para se të fillojë zhvillimi)

- [ ] **LLM provider** për 5.1/5.2: Anthropic Claude API apo OpenAI API? (ndikon kosto, cilësi vision, rate limits)
- [ ] **Embeddings 5.3**: API e hostuar (më pak infrastrukturë) apo model CLIP lokal (ONNX, më pak kosto rrjedhëse)?
- [ ] **Buxheti/rate-limits** për thirrjet AI (veçanërisht 5.1 chat, që mund të thirret shpesh)
- [ ] **Privatësia e bisedave** të chat-it (5.1) — a ruhen, për sa kohë, a përdoren për përmirësim modeli

## Vendime & Ndryshime

- 2026-08-20 — U hartua plan konkret nën-fazash (5.1–5.4) me arkitekturë të përcaktuar për secilën, bazuar në research të praktikave aktuale të industrisë. Radha e implementimit (US-49→52) e vendosur më parë u ruajt e pandryshuar.

## Probleme / Çështje të Hapura

- Cold-start i vlerësimit të çmimit (5.4) — zgjidhur me qasjen dy-fazore më sipër, por kërkon vendim kur "mjaftueshëm të dhëna" konsiderohet i arritur.

---

## Burimet (research bazë për këtë plan)

- [Build an AI Shopping Assistant: Architecture Guide](https://www.blockchain-council.org/ai/how-to-build-an-ai-shopping-assistant-architecture-llm-tools-recommendation-pipelines/) — arkitektura LLM + tool-calling + product feed
- [Ximilar — How to Automate Product Descriptions](https://www.ximilar.com/blog/how-to-automate-product-descriptions/) — auto-tagging nga foto → JSON strukturuar
- [Build Local Image Search with Quarkus, ONNX, and pgvector](https://www.the-main-thread.com/p/quarkus-onnx-pgvector-image-search-tutorial) — CLIP + pgvector, embeddings 768-dim, similarity search
- [Vecstore — How to Build a Reverse Image Search Engine](https://vecstore.app/blog/how-to-build-reverse-image-search) — CLIP/SigLIP + opsione vector DB (pgvector, Pinecone, Weaviate, Qdrant)
- Kërkim i përgjithshëm mbi price prediction për artikuj second-hand (regression/quantile regression mbi shitje krahasuese, confidence intervals)
