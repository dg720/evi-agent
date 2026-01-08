# Evi UK Healthcare Navigation Assistant

Evi is a conversational assistant that helps international students understand UK healthcare pathways, triage options, and GP registration. It is informational only and routes users to the right NHS entry points with clear safety guidance.

## Product snapshot
- **Audience:** International students and newcomers to the UK.
- **Outcome:** Faster, confident decisions on where to go (GP, NHS 111, A&E, pharmacy).
- **How it works:** A chat UI with onboarding and NHS-aligned triage rules (two short question batches followed by SMART guidance).
- **Safety:** Red-flag handling and explicit escalation to NHS 111 / 999.

## What's live
- Web chat with onboarding and triage routing.
- NHS link recommendations tailored to the conversation.
- Trust and governance disclosures via concise modals.

## Architecture (high level)
- **Frontend:** Next.js app (`evi-healthcare-companion/`).
- **Backend:** FastAPI service (`backend/`) orchestrating LLM and NHS tools.
- **Sessions:** In-memory only (no DB yet).

## Deployment
- Railway CLI guide: `docs/DEPLOY.md`.

## Technical notes for engineers
- See `docs/TECHNICAL.md` for setup and API details.
