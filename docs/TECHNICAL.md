# Technical Notes

## Repo layout
- `backend/`: FastAPI service and agent logic.
- `evi-healthcare-companion/`: Next.js frontend.

## Local development

Backend:

```bash
cd backend
pip install -r requirements.txt
setx OPENAI_API_KEY "your_key_here"
uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd evi-healthcare-companion
npm install
setx NEXT_PUBLIC_API_BASE_URL "http://localhost:8000"
npm run dev
```

## API surface
- `POST /api/chat`: main chat entrypoint.
- `GET /api/health`: health check.

## Tests

Backend:

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```
