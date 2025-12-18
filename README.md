# Evi - LBS Healthcare Companion

Evi helps international students navigate the UK healthcare system with onboarding, triage, and NHS guidance.
This repo includes a FastAPI backend and a Next.js frontend built from the v0 UI.

## Repo map
- `backend/` - FastAPI service and core agent logic (onboarding, triage, tools).
- `evi-healthcare-companion/` - Next.js frontend UI.
- `render.yaml` - Render Blueprint for deploying frontend + backend.

## Quick start (local)
Backend:
1) `cd backend`
2) `pip install -r requirements.txt`
3) `setx OPENAI_API_KEY "your_key_here"` (PowerShell) or set it in your environment
4) `uvicorn main:app --reload --port 8000`

Frontend:
1) `cd evi-healthcare-companion`
2) `npm install`
3) `setx NEXT_PUBLIC_API_BASE_URL "http://localhost:8000"`
4) `npm run dev`

Optional Streamlit UI (legacy):
- `streamlit run backend/streamlit_app.py`

## Render deployment (Blueprint)
- Use `render.yaml` from the repo root.
- Set `OPENAI_API_KEY` for the backend service.
- Set `NEXT_PUBLIC_API_BASE_URL` for the frontend service to the backend public URL.

## Notes
- The FastAPI endpoint is `POST /api/chat` and returns `{ session_id, reply, prompt_suggestions }`.
- The frontend stores a session id in memory for multi-turn chat.
