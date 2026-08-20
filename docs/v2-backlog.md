# V2 Backlog — Ende pa u caktuar në një fazë

Këto veçori janë shënuar "Version 2" te dokumenti master, por roadmap-i (§6) nuk u ka caktuar ende një fazë specifike. Shtoji si Faza 7+ kur të vendoset prioriteti, ose fute brenda një faze ekzistuese.

## 🔔 Notifications — ✅ Kryer (2026-08-20)
**Referenca:** §7 (US-40→US-44), §9

- [x] `GET /users/me/notifications`, `GET /users/me/notifications/unread-count`
- [x] `PATCH /notifications/{id}/read`, `PATCH /users/me/notifications/read-all`
- [x] In-app **live** nëpërmjet WebSocket (2026-08-20, shih `faza-4-bids-chat.md` §Vendime) — polling-u prej 20s mbetet vetëm si rrjet mbrojtës (60s); email mbetet shtesë e mëvonshme
- [x] Trigger-at e implementuara: ofertë e re (`bid_created`), ofertë e pranuar/refuzuar (`bid_accepted`/`bid_rejected`), produkt i shitur/paguar (`order_paid`), mesazh i ri (`message_received`)
- [x] Trigger për "mesazh i ri" — 2026-08-20, pasi u implementua chat-i (Faza 4)

## 🧑‍💼 Admin Panel
**Referenca:** §2, §7 (US-45→US-48), §9

- [ ] `GET /admin/users`, `PATCH /admin/users/{id}/block`
- [ ] `DELETE /admin/products/{id}`
- [ ] CRUD `/admin/categories`
- [ ] `GET /admin/reports`
- [ ] Admin menaxhohet përmes fushës `role` te tabela Users (jo tabelë e veçantë)

## Vendime & Ndryshime

- 2026-08-20 — Notifications u implementua plotësisht (tabelë `notifications` + endpoint-e + UI bell/dropdown), jashtë çdo faze specifike, sepse ishte bug i raportuar nga useri (shitësit s'e merrnin vesh kur vinte ofertë). Model: `recipient_id`, `actor_id`, `type`, `message`, `product_id`, `bid_id`, `is_read`. Backend: `app/models/notification.py`, `app/services/notification_service.py`, `app/routers/notification.py`, migrimi `a1b2c3d4e5f6`. Frontend: `NotificationBell.tsx`, `useNotifications.ts`. Klikimi mbi njoftimin "ofertë e re" navigon te produkti dhe hap automatikisht modalin e ofertave (`?offers=true`).
