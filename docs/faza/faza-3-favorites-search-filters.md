# Faza 3 — Favorites + Search + Filters

**Status:** 🟡 Në proces — Search (`GET /products` me filtra) dhe Favorites implementuar dhe testuar (2 bug real të rregulluar 2026-09-06); indeksimi DB për performancë kërkimi ende i paverifikuar
**Varet nga:** Faza 1 & 2
**Referenca:** [`00-dokumentacion-master.md`](../00-dokumentacion-master.md) §7 (US-18→US-24), §9

## Qëllimi

Shfletim i avancuar i produkteve (kërkim, filtra, renditje) dhe sistemi i favoriteve.

## Checklist

### Marketplace / Search (US-18 → US-21)
- [ ] `GET /products` me query params: `category, brand, size, price_min, price_max, condition, sort, q`
- [ ] Indeksim DB për performancë kërkimi (p.sh. index te `title`, `category_id`, `price`)
- [ ] UI: search bar + panel filtrash + dropdown renditje

### Favorites (US-22 → US-24)
- [ ] `POST /favorites/{productId}`
- [ ] `DELETE /favorites/{productId}`
- [ ] `GET /favorites`
- [ ] UI: buton "shto te favoritet" te Product Card / Product Detail
- [ ] Sjellje: produkti "Sold" mbetet në listën e favoriteve, shënuar si Sold

## Vendime & Ndryshime

- 2026-09-06 — **Dy bug-e reale të gjetura dhe rregulluara**, gjatë një kalimi testimi të kërkuar nga useri ("bëj testime në website") kundër backend+frontend real (jo TestClient - `uvicorn` + `vite dev`, user testues të përkohshëm, të fshirë plotësisht pas testit):
  1. **`POST`/`DELETE /favorites/{id}` deklaronin `response_model=list[FavoriteResponse]` por ktheenin `{"message": ...}`** — `ResponseValidationError` (500) në **çdo** thirrje të suksesshme (rreshti ruhej në DB, por API-ja s'kthente kurrë 200; frontend-i e trajtonte si CORS/network error, heart-i s'ndryshonte ngjyrë kurrë). Ky bug ishte i njohur që më parë (flag-uar te `faza-5-ai-features.md`, task background i pazgjidhur) por s'ishte rregulluar realisht deri tani. Rregulluar: `schemas/favorite.py::FavoriteMessageResponse` i ri (`{message: str}`), `routers/favorite.py` përditësuar (edhe emrat e funksioneve `get_favorites`/`get_favorites` të dublikuar - riemërtuar `add_favorite`/`list_favorites` për qartësi, pa ndryshim sjelljeje).
  2. **[I ri, i pazbuluar më parë] `GET /favorites` dështonte gjithmonë me `ResponseValidationError`** — `FavoriteResponse.added_at` s'ekziston si atribut te modeli `Favorite` (kolona reale është `created_at`), kështu që `from_attributes=True` s'e gjente kurrë fushën. Zbuluar VETËM pas rregullimit #1, kur u testua flow-i i plotë (favorite → refresh listë → heart duhej të mbetej i mbushur). Rregulluar me `@property added_at` mbi modelin `Favorite` (alias i `created_at`) - zero ndryshim i kontratës API, zero migrim.
  - **Testuar konkretisht**: DB u pastrua para/pas çdo testi (favorite → verifikuar në DB → GET → verifikuar në UI → unfavorite → verifikuar 0 rreshta), heart-i u pa vizualisht duke ndryshuar ngjyrë (bosh → i kuq të mbushur) pas rregullimit.

## Probleme / Çështje të Hapura

- **[I ri, i pazbuluar më parë, PA u rregulluar]** `notifications.recipient_id`/`notifications.actor_id` **s'kanë `ondelete="CASCADE"`** te FK drejt `users.id` — zbuluar gjatë pastrimit të një useri testues që kishte dërguar një mesazh (çka krijon një `Notification`): `DELETE` mbi `users` dështon me `ForeignKeyViolation` nëse useri ka qenë ndonjëherë `actor`/`recipient` i një njoftimi. E njëjta klasë defekti si `product_image_embeddings` (rregulluar më parë, `e1f2a3b4c5d6`) dhe `products.owner_id`/etj. (gjithashtu pa cascade - u verifikua indirekt gjatë pastrimit të produktit testues, kërkoi fshirje manuale të rreshtave "fëmijë" në radhën e duhur). Relevante nëse ndonjëherë implementohet "Fshi Llogarinë" (self-service, i përmendur te `thriftalflows.md` footer) - do të dështojë për çdo user me histori mesazhesh/produktesh pa migrim shtesë (`ondelete="CASCADE"` ose `SET NULL` te FK-të përkatëse).
