# Deployment (Railway)

This repo deploys as two Railway services: a FastAPI backend and a Next.js frontend.

## Prereqs
- Railway CLI installed and authenticated (`railway login`)
- Repo cloned locally
- Working directory is repo root

## 1) Create and link the Railway project

```bash
railway init -n evi-agent -w "Dhruv Gupta's Projects"
railway link --project <project-id> --environment production --workspace "Dhruv Gupta's Projects"
```

## 2) Create services

```bash
railway add --service evi-agent-api
railway add --service evi-agent-frontend
```

## 3) Deploy backend

```bash
railway service evi-agent-api
railway up backend --path-as-root -s evi-agent-api -d
```

Backend env vars:

```bash
railway service evi-agent-api
railway variables --set "OPENAI_API_KEY=sk-..."
railway variables --set "ALLOWED_ORIGINS=https://<frontend-domain>"
```

## 4) Deploy frontend

```bash
railway service evi-agent-frontend
railway up evi-healthcare-companion --path-as-root -s evi-agent-frontend -d
```

Frontend env vars:

```bash
railway service evi-agent-frontend
railway variables --set "NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>"
railway variables --set "BACKEND_API_BASE_URL=https://<backend-domain>"
```

## 5) Verify

```bash
curl https://<backend-domain>/api/health
open https://<frontend-domain>
```

## Debugging

```bash
railway logs -s evi-agent-frontend --build -n 200
railway logs -s evi-agent-frontend -n 200
railway logs -s evi-agent-api --build -n 200
railway logs -s evi-agent-api -n 200
```
