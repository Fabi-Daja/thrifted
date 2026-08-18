# Faza 4 — Bids + Chat

**Status:** 🔲 Nuk ka filluar
**Varet nga:** Faza 1, 2, 3
**Referenca:** [`00-dokumentacion-master.md`](../00-dokumentacion-master.md) §7 (US-25→US-39), §9

## Qëllimi

Sistemi i blerjes (Buy Now + Bids) dhe chat-i mes blerësit/shitësit (chat është pjesë v2 — mund të shtyhet nëse koha mungon).

## Checklist

### Buying System (US-25 → US-29)
- [ ] `POST /products/{id}/buy` (jo owner, jo nëse "Sold")
- [ ] Buy Now → status kalon direkt në `Sold`
- [ ] `GET /users/me/purchases`, `GET /users/me/sales` (nëse s'u mbyllën në Fazën 1)

### Bids (US-30 → US-35)
- [ ] `POST /products/{id}/bids` (jo owner)
- [ ] `GET /products/{id}/bids` (owner)
- [ ] `GET /users/me/bids`
- [ ] `PATCH /bids/{id}/accept` → status `Reserved`, ofertat e tjera refuzohen/anulohen automatikisht
- [ ] `PATCH /bids/{id}/reject`
- [ ] `DELETE /bids/{id}` (vetëm bidder, para pranimit/refuzimit)
- [ ] UI: "Offers only" → fsheh Buy Now; "Both" → shfaq të dyja

### Chat *(v2 — opsionale për këtë fazë)*
- [ ] `POST /conversations`
- [ ] `GET /conversations`
- [ ] `GET /conversations/{id}/messages`
- [ ] `POST /conversations/{id}/messages`
- [ ] WebSocket për realtime (nëse implementohet)
- [ ] Biseda lidhet gjithmonë me një produkt specifik

## Vendime & Ndryshime

-

## Probleme / Çështje të Hapura

-
