# Faza 3 — Favorites + Search + Filters

**Status:** 🔲 Nuk ka filluar
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

-

## Probleme / Çështje të Hapura

-
