# Faza 6 — Docker + Deploy + CI/CD

**Status:** 🔲 Nuk ka filluar
**Varet nga:** Të gjitha fazat e mëparshme (të paktën MVP)
**Referenca:** [`00-dokumentacion-master.md`](../00-dokumentacion-master.md) §5, §11

## Qëllimi

Kontenerizimi i aplikacionit dhe vendosja në një server (VPS), me pipeline CI/CD.

## Checklist

### Docker
- [ ] `backend/Dockerfile`
- [ ] `frontend/Dockerfile`
- [ ] `docker-compose.yml` (backend + frontend + Postgres, + Redis nëse përdoret)
- [ ] `.env.example` i plotë për të gjitha shërbimet

### Nginx / Networking
- [ ] Nginx si reverse proxy (frontend + `/api` → backend)
- [ ] HTTPS (Let's Encrypt / certbot)

### CI/CD
- [ ] GitHub Actions: run tests në çdo push/PR
- [ ] GitHub Actions: build & push Docker images
- [ ] Deploy automatik në VPS (ose manual me dokumentim të qartë të hapave)

### Deploy
- [ ] Provizionim i VPS-së (Linux)
- [ ] Migrimet Alembic run në deploy
- [ ] Backup strategji për databazën
- [ ] Monitoring/logs bazë

## Vendime & Ndryshime

-

## Probleme / Çështje të Hapura

-
