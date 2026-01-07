# Railway CLI Deploy Guide (Template)

Use this template for new projects. It assumes a two-service setup (backend + frontend).
Replace all placeholders in <> with your values.

## Prereqs
- Railway CLI installed and authenticated (`railway login`)
- Repo cloned locally
- Working directory is repo root

## 0) Safety: do not overwrite an existing project
- If this directory is already linked, unlink first:

```bash
railway unlink
```

- Create a NEW project:

```bash
railway init -n <new-project-name> -w "<workspace-name>"
```

## 1) Link project and environment

```bash
railway link --project <project-id> --environment production --workspace "<workspace-name>"
```

Confirm the correct project before deploying:

```bash
railway status
```

## 2) Create services

```bash
railway add --service <backend-service-name>
railway add --service <frontend-service-name>
```

## 3) Deploy backend

Deploy from the backend subdirectory (monorepo-safe):

```bash
railway service <backend-service-name>
railway up <backend-root> --path-as-root -s <backend-service-name> -d
```

Backend start command (example Procfile):

```
web: uvicorn <module>:<app> --host 0.0.0.0 --port $PORT
```

## 4) Add persistent storage (optional)

```bash
railway service <backend-service-name>
railway volume add -m /data
railway variables --set "OUTPUT_DIR=/data/output"
```

## 5) Set backend env vars

```bash
railway service <backend-service-name>
railway variables --set "CORS_ORIGINS=https://<your-frontend-domain>"
railway variables --set "OPENAI_API_KEY=sk-..."
```

## 6) Deploy frontend

Deploy from the frontend subdirectory (monorepo-safe):

```bash
railway service <frontend-service-name>
railway up <frontend-root> --path-as-root -s <frontend-service-name> -d
```

## 7) Frontend env vars

Pick ONE package manager and keep it consistent. This template uses **npm**.

```bash
railway service <frontend-service-name>
railway variables --set "NEXT_PUBLIC_API_BASE_URL=https://<your-backend-domain>"
railway variables --set "BACKEND_API_BASE_URL=https://<your-backend-domain>"
```

If needed:

```bash
railway variables --set "NODE_OPTIONS=--max-old-space-size=512"
```

## 8) Verify services

Backend:

```bash
curl https://<your-backend-domain>/api/health
```

Frontend:

```bash
open https://<your-frontend-domain>
```

## 9) Build prerequisites

Monorepo deploys must use `--path-as-root`.

If using npm, keep `package-lock.json` in sync:

```bash
cd <frontend-root>
npm install
```

Commit the updated lockfile before deploying.

## 10) GitHub auto-deploy + CLI override

Enable auto-deploys from GitHub (recommended for future releases):
- Open the Railway dashboard (`railway open`)
- Service → Settings → Source → Connect GitHub repo/branch
- Enable auto-deploy on push

CLI override (deploy local changes without waiting for GitHub):

```bash
railway up <service-root> --path-as-root -s <service-name> -d
```

## 11) Debugging and logs

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

## 12) Common fixes
- Wrong root folder: deploy from `<backend-root>` or `<frontend-root>`.
- Lockfile out of date: run `npm install` (or the package manager you chose).
- Frontend hangs: backend base URL must include `https://` and be reachable.
