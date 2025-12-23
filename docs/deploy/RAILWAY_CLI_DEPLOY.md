# Railway CLI Deploy Guide (Frontend + Backend)

Codex usage: follow this file as a runbook. Execute the commands in order, fill in
the placeholders, and do not pause for confirmation unless a command fails or
needs missing information.

Use this checklist to deploy a simple two-service app (backend + frontend) on Railway
using the CLI. It is intentionally repo-agnostic.

## Prereqs

- Railway CLI installed and authenticated (`railway login`)
- Repo cloned locally
- Working directory is repo root

## 0) Safety: do not overwrite an existing project

- If this directory is already linked to a Railway project, unlink it first:

```bash
railway unlink
```

- Create a NEW project for this repo (do not reuse an existing one):

```bash
railway init -n <new-project-name> -w "<workspace-name>"
```

## 1) Link project and environment

```bash
railway link --project <project-id> --environment production --workspace "<workspace-name>"
```

Select the target workspace, project, and environment (usually `production`).

## 1b) Create services (new project only)

```bash
railway add --service <backend-service-name>
railway add --service <frontend-service-name>
```

## 2) Deploy backend (API)

Link the backend service and deploy from the repo root:

```bash
railway service <backend-service-name>
railway up backend --path-as-root -s <backend-service-name> -d
```

Backend start command (required):
- Add a Procfile in `backend/Procfile` with:

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

## 3) Add persistent storage for backend data

Attach a volume and point your backend data directory to it:

```bash
railway service <backend-service-name>
railway volume add -m /data
railway variables --set "OUTPUT_DIR=/data/output"
```

Optional: if your backend serves seed/demo data from a folder, set its path:

```bash
railway variables --set "SEED_DATA_DIR=/app/seed_data"
```

Recommended backend env vars:

```bash
railway variables --set "CORS_ORIGINS=https://<your-frontend-domain>"
railway variables --set "OPENAI_API_KEY=sk-..."
railway variables --set "WEBHOOK_SECRET=..."
```

## 4) Deploy frontend (Next.js)

Link the frontend service and deploy from the repo root:

```bash
railway service <frontend-service-name>
railway up evi-healthcare-companion --path-as-root -s <frontend-service-name> -d
```

## 5) Set frontend env vars

Point the frontend at the backend base URL (include https):

```bash
railway service <frontend-service-name>
railway variables --set "NEXT_PUBLIC_API_BASE_URL=https://<your-backend-domain>"
railway variables --set "BACKEND_API_BASE_URL=https://<your-backend-domain>"
```

If the frontend is memory constrained, cap Node memory:

```bash
railway variables --set "NODE_OPTIONS=--max-old-space-size=512"
```

## 6) Verify services

Backend API example:

```bash
curl https://<your-backend-domain>/api/health
```

Frontend:

```bash
open https://<your-frontend-domain>
```

## 6b) Build prerequisites (avoid build failures)

- This repo is a monorepo. You must deploy each service from its subdirectory using `--path-as-root`.
- Keep `evi-healthcare-companion/pnpm-lock.yaml` in sync with `package.json`.
  If you change dependencies, run:

```bash
cd evi-healthcare-companion
npx -y pnpm@9.15.9 install
```

Commit the updated lockfile before deploying.

## 7) Debugging and logs (CLI)

Build logs (last 200 lines):

```bash
railway logs -s <service-name> --build -n 200
```

Deploy/runtime logs:

```bash
railway logs -s <service-name> -n 200
```

List deployments and inspect a specific one:

```bash
railway deployment list -s <service-name>
railway logs --build <deployment-id>
railway logs <deployment-id>
```

Tip: build errors for this repo are typically caused by:
- Deploying from repo root instead of `backend/` or `evi-healthcare-companion/`
- Out-of-date `pnpm-lock.yaml` on the frontend

## 7) Common fixes

- Frontend hangs: backend base URL must include `https://` and be reachable.
- API data missing after redeploy: ensure a volume is attached and your data dir points to it.
- Seed data missing: verify the seed directory path and that it is present in the image.

## 8) Recommended repo structure

```
.
├─ backend/
│  ├─ app/                 # backend source code
│  ├─ tests/
│  ├─ requirements.txt     # or pyproject.toml / package.json
│  └─ README.md
├─ frontend/
│  ├─ app/                 # frontend source code
│  ├─ public/
│  ├─ package.json
│  └─ README.md
├─ docs/
│  ├─ deploy/              # deployment guides
│  ├─ architecture/        # diagrams, specs
│  └─ archived/            # deprecated guides/configs
├─ scripts/                # dev/ops helpers
├─ .env.example
├─ .gitignore
├─ README.md
└─ railway.json            # optional blueprint
```

Conventions:
- Keep backend and frontend in top-level folders.
- Put deploy guides under `docs/deploy/` and move old providers into `docs/archived/`.
- Store seed/demo data under `backend/seed_data/` and document it in the backend README.
- Keep environment variables in `.env.example` and reference in both READMEs.
- Use a single root `README.md` with short links to backend/frontend READMEs.
- Prefer scripts in `scripts/` over long README command blocks.
