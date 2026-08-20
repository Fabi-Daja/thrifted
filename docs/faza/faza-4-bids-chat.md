# Faza 4 — Bids + Chat

**Status:** ✅ Kryer — Buying System + Bids + Chat (me realtime WebSocket) gati
**Varet nga:** Faza 1, 2, 3
**Referenca:** [`00-dokumentacion-master.md`](../00-dokumentacion-master.md) §7 (US-25→US-39), §9

## Qëllimi

Sistemi i blerjes (Buy Now + Bids) dhe chat-i mes blerësit/shitësit (chat është pjesë v2 — mund të shtyhet nëse koha mungon).

## Checklist

### Buying System (US-25 → US-29)
- [x] Blerje me çmim fiks — jo `POST /products/{id}/buy` siç ishte planifikuar fillimisht, por `POST /products/{id}/checkout-session` (Stripe Checkout) + `GET /payments/session/{id}/confirm` + webhook `POST /webhooks/stripe`, të gjitha te `app/routers/order.py` / `app/routers/payment.py` / `app/services/payment_service.py`. Mbron nga jo-owner dhe nga blerja e diçkaje jo-"active".
- [x] Buy Now → status kalon direkt në `sold` (te `payment_service.finalize_checkout_session`)
- [x] `GET /users/me/purchases`, `GET /users/me/sales` — 2026-08-20, te `app/routers/users.py`, kthejnë `Order` + produkti i plotë (nested) + pala tjetër (username/emri/foto). Lidhur me tab-et "Blerjet"/"Shitjet" te `frontend/src/routes/me.tsx`.

### Bids (US-30 → US-35)
- [x] `POST /products/{id}/bids` (jo owner, jo nëse produkti është `fixed_price`)
- [x] `GET /products/{id}/bids` (owner)
- [x] `GET /users/me/bids`
- [x] `PATCH /bids/{id}/accept` → status `reserved`, ofertat e tjera pending refuzohen automatikisht; shitja finalizohet vetëm pas pagesës reale (jo direkt te accept)
- [x] `PATCH /bids/{id}/reject`
- [x] `DELETE /bids/{id}` (vetëm bidder, para pranimit/refuzimit)
- [x] UI: "Offers only"/"Fixed price"/"Both" trajtohen te `frontend/src/routes/products.$id.tsx` (`canBuy`/`canBid`)

### Chat *(v2 — u implementua më 2026-08-20, me realtime)*
- [x] `POST /conversations` — gjen ose krijon bisedën për (produkt, blerës); shitësi rrjedh nga `product.owner_id`
- [x] `GET /conversations` — lista ime, e renditur sipas mesazhit të fundit
- [x] `GET /conversations/{id}` — detajet e një bisede (shtesë e planit fillestar, i duhej frontend-it për header-in e thread-it)
- [x] `GET /conversations/{id}/messages` — dhe i shënon si "të lexuara" mesazhet e palës tjetër
- [x] `POST /conversations/{id}/messages`
- [x] WebSocket për realtime — `WS /ws?token=<jwt>` (autentikim me query-param, jo header, sepse browser-i s'lejon header të personalizuar te handshake i WS); shih "Vendime & Ndryshime" për arkitekturën
- [x] Biseda lidhet gjithmonë me një produkt specifik (`UniqueConstraint(product_id, buyer_id)`)
- [x] **Ofertat shfaqen direkt në chat** — çdo ofertë e re/pranuar/refuzuar krijon automatikisht një mesazh (`Message.bid_id`), i renderuar si kartë interaktive te `frontend/src/routes/messages_.$id.tsx`, me butona Prano/Refuzo brenda vetë bisedës (jo vetëm te modali "Shiko Ofertat")

## Vendime & Ndryshime

- 2026-08-20 — Blerja me çmim fiks u zbatua përmes Stripe Checkout (session + confirm + webhook) në vend të një `POST /buy` sintetik — lejon pagesë reale me kartë, jo thjesht ndryshim statusi.
- 2026-08-20 — U shtua `GET /users/me/purchases` dhe `GET /users/me/sales` (mungonin krejtësisht më parë; tab-et përkatëse te `/me` ishin placeholder bosh). Bashkë me këtë, sistemi i **njoftimeve in-app** (jashtë kësaj faze, shih `docs/v2-backlog.md`) u lidh me trigger-at `bid_created`/`bid_accepted`/`bid_rejected`/`order_paid`, që zgjidh problemin që shitësi s'e merrte vesh kur i vinte ofertë.
- 2026-08-20 — **Bugfix: leja e vlerësimeve (Reviews, §8 e dokumentit master) s'kishte fare UI.** Backend-i (`POST /orders/{id}/reviews`, `GET /users/{id}/reviews`) ekzistonte që më parë, po frontend-i s'kishte asnjë komponent që ta thërriste — prandaj useri s'mund të linte review kurrë, ndonëse endpoint-i ishte gati. Gjatë kësaj u zbulua edhe një bug i dytë, më i thellë: `User.rating_avg`/`rating_count` s'ishin përditësuar **kurrë** nga asnjë pjesë e kodit (mbetën gjithmonë 0.0/0 që nga krijimi i userit), ndonëse `UserBadge`/`RatingDisplay` i lexojnë pikërisht këto dy fusha kudo (navbar, `/me`, `/users/{id}`). U shtuan: (1) buton "Lëre një vlerësim" te tab-i "Blerjet" i `/me` (vetëm për porosi `completed` pa review ekzistues — `has_review` i ri te `OrderDetailResponse`), me modal yjesh + koment; (2) `review_service._sync_user_rating()` që rillogarit e ruan `rating_avg`/`rating_count` te `User` çdo herë që krijohet një review; (3) seksion "Vlerësimet" te `/users/{id}` që shfaq listën reale të komenteve (më parë vetëm numri mesatar shfaqej, pa asnjë koment të dukshëm gjëkundi).

- 2026-08-20 — **Chat + Realtime WebSocket u implementuan së bashku**, sipas kërkesës së userit ("bid të shkojë direkt në chat" + "njoftimet të vijnë në kohë reale"). Modele të reja `Conversation`/`Message` (migrimi `b2c3d4e5f6a7`). Arkitektura e realtime-it: `app/core/ws_manager.py` mban lidhjet WS aktive në memorje (`dict[user_id, set[WebSocket]]`); meqë shumica e routers/services ekzistues janë sinkronë (jo `async def`), `ConnectionManager.push()` planifikon dërgimin real me `asyncio.run_coroutine_threadsafe()` te event loop kryesor (referenca e loop-it kapet në `@app.on_event("startup")`) — kështu s'u desh të rishkruhej asnjë router ekzistues në async. `notification_service.create_notification()` tani i shtyn TË GJITHA njoftimet (bid_created/accepted/rejected/order_paid/message_received) live nëpërmjet kësaj, jo vetëm ato të reja për chat-in. Frontend: `RealtimeContext.tsx` mban një lidhje WS për sesion, invalidon query-t e React Query kur vjen event; polling-u i vjetër i njoftimeve (`useNotifications.ts`) mbetet vetëm si rrjet mbrojtës, u rrit nga 20s në 60s.
- 2026-08-20 — Faqet `/messages` (listë bisedash) dhe `/messages/$id` (thread) — skedari i dytë quhet `messages_.$id.tsx` (jo `messages.$id.tsx`) për të shmangur pikërisht bug-un e routing-ut të ndërthurur të zgjidhur më herët këtë fazë te `products.$id_.edit.tsx` (shih `faza-2-frontend-integrimi.md`).
- 2026-08-20 — Butoni "Kontakto shitësin" te faqja e produktit, dhe navigim automatik te chat-i pas dërgimit të një oferte (`BidModal` → `POST /conversations` → `navigate("/messages/$id")`).

## Probleme / Çështje të Hapura

- Testimi i realtime-it me shumë përdorues në browser kërkon kujdes: `localStorage` (ku ruhet JWT) ndahet mes TË GJITHA tab-eve të të njëjtit origin — dy tab-e me dy login-e të ndryshme "grinden" mbi njëri-tjetrin (i fundit i loguar fiton kudo). Për testim real multi-user duhet browser-a/profile të veçanta, ose simulim i njërës palë përmes API-t direkt (curl), jo dy tab-e të thjeshtë.
- WebSocket-i është single-server, në memorje (`ws_manager.py` mban lidhjet si `dict` brenda procesit Python) — nuk shkallëzohet automatikisht në shumë instanca/worker (do duhej Redis pub/sub ose i ngjashëm nëse backend-i vihet pas load balancer-i me >1 worker).
