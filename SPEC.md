# Evi - UK Healthcare Navigation Assistant Specification

This specification defines the product scope, architecture, and feature requirements for Evi, a standalone web app that helps international students and newcomers navigate the UK healthcare system. It replaces legacy content and reflects the current repo layout and docs.

## 1) Product summary

Evi is a conversational healthcare navigation assistant for LBS students and international newcomers. It provides onboarding, triage guidance, and NHS-focused next steps, with clear boundaries against diagnosis or treatment. The app is a FastAPI backend with a Next.js frontend.

## 2) Goals and non-goals

### Goals
- Reduce confusion about UK healthcare pathways.
- Increase user confidence and time-to-action.
- Provide safe, accurate guidance with citations and clear escalation.

### Non-goals
- No diagnosis or treatment plans.
- No prescriptions.
- No private healthcare integration.
- No paid services or monetization.

## 3) Users and scope

Primary users: international students and newcomers to the UK healthcare system. The product is a standalone web app (no mobile app requirement).

## 4) Architecture and runtime flow

### Repo structure
- `backend/`: FastAPI service, agent logic, tools, prompts.
- `evi-healthcare-companion/`: Next.js (App Router) frontend.

### Runtime flow
1) UI sends messages to `evi-healthcare-companion/app/api/chat/route.ts`.
2) The proxy forwards to backend `/api/chat` using `NEXT_PUBLIC_API_BASE_URL` or `BACKEND_API_BASE_URL`.
3) `AgentSession.step()` in `backend/agent.py` runs safety checks, onboarding, and triage rules.
4) OpenAI Responses API handles LLM calls and tool calls.
5) Backend returns `reply`, `prompt_suggestions`, `useful_links`, and `user_profile`.

### Session storage
Sessions are stored in memory in `backend/main.py`. There is no database; restarts wipe sessions.

## 5) Core features and requirements

### 5.1 Onboarding bug fix (high priority)

Problem: User profile fields are incorrectly mapped (for example, GP registration field receiving visa input).

Requirements:
- Enforce strict schema validation for onboarding responses.
- Each onboarding question maps to exactly one field.
- One question -> one field -> one validator.
- No free-text mapping to boolean fields.
- Add a final profile review step before saving.
- Display saved profile read-only in a sidebar.

Acceptance criteria:
- Validation fails on mismatched or missing fields.
- The review step lists all profile fields and values.
- After save, the profile sidebar shows read-only values.

### 5.2 Interactive roadmap

Problem: Roadmap cards are static and non-actionable.

Feature: Interactive "Your UK Healthcare Roadmap" driven by profile state.

Example steps:
1. Build your profile
2. Check NHS eligibility
3. Register with a GP
4. Understand care options
5. Know urgent vs emergency care

Behavior:
- Each step has state: `locked | available | completed`.
- Clicking a step launches a guided chat flow.
- Completion inferred from user actions (not manual toggles).
- Progress persists across sessions.

Acceptance criteria:
- At least 5 steps render with states.
- Clicking a step triggers a contextual chat prompt.
- Completion reflects user actions.
- State persists after reload (storage decision required).

### 5.3 Persistent chat history and exports

Feature: Users can revisit and export previous conversations.

Requirements:
- Store chat sessions per user with timestamp, topic tags, and profile snapshot.
- Export formats: PDF, Markdown, and plain text.
- UI includes chat history panel and "Export this conversation" action.
- Clear non-clinical disclaimer on exports.

Acceptance criteria:
- User can view previous sessions.
- Export produces correct format with timestamp and disclaimer.

### 5.4 Knowledge base / FAQ

Problem: Foundational questions are repeatedly asked.

Solution: Structured, searchable knowledge base.

Core sections:
- How the NHS works
- Registering with a GP
- GP vs Pharmacy vs NHS 111 vs A&E
- Prescriptions and costs
- Mental health services
- Common myths

Behavior:
- Articles are searchable.
- Linked directly from chat responses.
- Versioned and timestamped.
- NHS sources clearly referenced.

Acceptance criteria:
- Search returns relevant articles.
- Chat responses can link to KB articles.

### 5.5 Contextual quick replies

Feature: Dynamic quick-reply buttons based on context.

Rules:
- Max 4 quick replies.
- Generated from user intent, roadmap step, and profile context.

Examples:
- After symptoms: "Is this urgent?", "Where should I go?"
- After GP discussion: "Find a GP near me", "What documents do I need?"

Acceptance criteria:
- Quick replies update based on conversation context.
- No more than 4 rendered at a time.

### 5.6 "Where should I go?" response format

Problem: Users receive advice but lack concrete next steps.

Required response structure:
1. Recommendation: GP / Pharmacy / NHS 111 / A&E
2. Why: short explanation tied to UK system norms
3. What to do next:
   - Nearest services (if location known)
   - Opening hours
   - Booking vs walk-in guidance
4. What to say: short script users can reuse
5. Safety net: clear escalation criteria (for example, go to A&E or call 999)

Acceptance criteria:
- Responses follow the structure above.
- Safety net always present.

### 5.7 Trust and governance layer

Goal: Make boundaries, safety, and credibility explicit.

Required pages:
- How Evi Works (sources, approach)
- Clinical Boundaries (what Evi does not do)
- Emergency Handling
- Data and Privacy

UI elements:
- Persistent "Not for emergencies" banner.
- Inline source citations.
- Clear emergency escalation messaging.

Acceptance criteria:
- All pages exist and are linked from the UI.
- Banner is visible across primary flows.

## 6) API contracts

### POST /api/chat

Request (frontend to backend proxy):
```json
{
  "session_id": "string or null",
  "message": "string",
  "user_profile": {
    "fields": "varies by onboarding schema"
  }
}
```

Response:
```json
{
  "session_id": "string",
  "reply": "string",
  "prompt_suggestions": ["string"],
  "useful_links": [
    {
      "label": "string",
      "url": "string",
      "source": "string"
    }
  ],
  "user_profile": {
    "fields": "updated profile"
  }
}
```

### POST /api/profile

Request:
```json
{
  "session_id": "string",
  "user_profile": {
    "fields": "full or partial profile"
  }
}
```

Response:
```json
{
  "session_id": "string",
  "user_profile": {
    "fields": "updated profile"
  }
}
```

## 7) Data and persistence

Current behavior:
- Sessions are in-memory only and reset on backend restart.

Decisions required for new features:
- Roadmap state and chat history persistence (local storage vs server storage).
- Export generation method (client-side vs server-side).

## 8) UX and UI behavior

Core UI expectations:
- Single-page chat UI with onboarding profile form and useful links panel.
- Roadmap panel with step states.
- Knowledge base search entry points and in-chat links.
- Persistent safety banner.

## 9) Quality gates

Minimum requirements before marking a feature done:
- Matches acceptance criteria in this spec.
- No obvious UI console errors.
- API endpoints return expected JSON shape and status.
- A minimal automated smoke test exists covering:
  - backend health check
  - one core end-to-end user flow
- Build is reproducible from a clean checkout.

## 10) Deployment

- Deployment target: Railway.
- Follow `RAILWAY_CLI_DEPLOY.md` step-by-step.
- Required env vars:
  - Backend: `OPENAI_API_KEY`, optional `ALLOWED_ORIGINS`.
  - Frontend: `NEXT_PUBLIC_API_BASE_URL` or `BACKEND_API_BASE_URL`.

## 11) Success metrics

- Roadmap completion rate.
- Reduction in repeated triage questions.
- Time-to-action after recommendations.
- Self-reported confidence score.

## 12) Open questions

- Anonymous vs authenticated users?
- Local vs server-side persistence?
- GDPR consent timing?
