# Codex Notes (Read Before Changes)

This repo powers "Evi", a healthcare navigation assistant for LBS students. It has a FastAPI backend
and a Next.js frontend. Use this file as the first stop for context before making changes.

## High-level architecture
- Backend: `backend/` FastAPI service with an OpenAI-powered agent and tool calls.
- Frontend: `evi-healthcare-companion/` Next.js app (App Router) and UI.
- API proxy: Next.js API routes forward requests to the backend service.
- Deployment: `render.yaml` defines Render services.

## Core runtime flow
1) UI sends messages to `evi-healthcare-companion/app/api/chat/route.ts`.
2) The proxy forwards to the backend at `/api/chat` (via `NEXT_PUBLIC_API_BASE_URL` or `BACKEND_API_BASE_URL`).
3) Backend `AgentSession.step()` in `backend/agent.py` runs safety checks, onboarding, and triage rules.
4) OpenAI Responses API is used for LLM calls and tool calls.
5) Response returns `reply`, `prompt_suggestions`, `useful_links`, and `user_profile`.

Sessions are stored in memory in `backend/main.py`. There is no database; restarts wipe sessions.

## Backend overview
- `backend/main.py`: FastAPI app with `/api/chat` and `/api/profile`.
- `backend/agent.py`: Primary agent logic, onboarding, triage flow, tool handling, and prompts.
- `backend/tools.py`: Tool implementations (NHS search, triage, nearest services, safety).
- `backend/prompts.py`: System prompt rules and intro text.
- `backend/config.py`: Onboarding questions, trigger phrases, and canonical links.
- `backend/extract.py`: Profile tag extraction/stripping helpers.
- `backend/streamlit_app.py`: Legacy Streamlit UI (optional).

Important behavior notes:
- Onboarding is deterministic and only starts on explicit triggers.
- Triage uses `nhs_111_live_triage` via OpenAI web search tool.
- Safety check is a local keyword scan; emergency response bypasses LLM.
- Useful links are computed in `AgentSession._select_useful_links()` and returned to the UI.

## Frontend overview
- `evi-healthcare-companion/app/page.tsx`: Single-page UI with chat, onboarding profile form, and links.
- `evi-healthcare-companion/app/api/chat/route.ts`: Proxy to backend `/api/chat`.
- `evi-healthcare-companion/app/api/profile/route.ts`: Proxy to backend `/api/profile`.
- `evi-healthcare-companion/app/layout.tsx`: Global layout, fonts, metadata.

UI state:
- Session id is stored in memory on the page (not persisted).
- Profile form is editable; saving posts to `/api/profile` to update backend session profile.
- Useful links panel is updated from backend responses.

## Environment variables
Backend:
- `OPENAI_API_KEY` (required)
- `ALLOWED_ORIGINS` (optional CORS allowlist; default "*")

Frontend:
- `NEXT_PUBLIC_API_BASE_URL` or `BACKEND_API_BASE_URL` to point the proxy at the backend.

## Local dev
Backend:
- `cd backend`
- `pip install -r requirements.txt`
- `uvicorn main:app --reload --port 8000`

Frontend:
- `cd evi-healthcare-companion`
- `npm install`
- `npm run dev`

## Deployment
- Render blueprint: `render.yaml`
- Set `OPENAI_API_KEY` for backend service.
- Set `NEXT_PUBLIC_API_BASE_URL` (or `BACKEND_API_BASE_URL`) for frontend service.

## Notes and pitfalls
- Session memory is in-process only. Do not assume persistence.
- Tool calls depend on OpenAI web search tool availability.
- The frontend has a sample profile prefilled for demo; reset clears it.
- There is a zip file `evi-healthcare-companion.zip` in the repo root; avoid editing it.
