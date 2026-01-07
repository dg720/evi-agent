# Evi Product Spec (Current)

## 1) Overview
Evi is a web-based assistant that helps international students navigate UK healthcare services. It provides onboarding, symptom triage guidance aligned to NHS 111, and clear next-step recommendations. It is informational only (no diagnosis or treatment).

## 2) Core user flow
1. User lands on the homepage and starts a chat.
2. Optional onboarding collects basics (age, stay length, postcode, visa status, GP registration, etc.).
3. For symptoms/urgency, the agent runs triage and routes to the correct service.
4. The UI shows relevant NHS links and a triage disclaimer when triage is active.

## 3) Features in scope
- **Onboarding flow**
  - Multi-turn Q&A; strict question order.
  - Accepts specific age or age range.
- **Triage routing**
  - Uses NHS 111 triage tool.
  - Avoids repeating triage questions in a single flow.
  - Provides structured routing response (Recommendation, Why, Next steps, What to say, Safety net).
- **Related links**
  - Static onboarding links until profile is complete.
  - Dynamic links after onboarding based on conversation tags.
- **Trust & governance**
  - Modals that explain how Evi works, clinical boundaries, emergency handling, and data/privacy.
- **Safety**
  - Emergency keyword detection and escalation guidance.

## 4) Out of scope (for now)
- Knowledge base/FAQ search.
- Roadmap or checklist UI.
- Chat history, exports, or persistence beyond in-memory sessions.
- User authentication.

## 5) API contracts

### POST /api/chat
Request:
```json
{
  "session_id": "string or null",
  "message": "string"
}
```

Response:
```json
{
  "session_id": "string",
  "reply": "string",
  "prompt_suggestions": ["string"],
  "useful_links": [{"title": "string", "url": "string"}],
  "user_profile": {"fields": "updated profile"},
  "triage_active": true,
  "triage_notice": "string"
}
```

### GET /api/health
Response:
```json
{ "status": "ok" }
```

## 6) Non-functional requirements
- No medical diagnosis or treatment.
- Explicit escalation for emergencies.
- Minimal latency and clear UX for triage flow.

## 7) Success measures
- Higher completion rate for onboarding.
- Reduced confusion about where to go (measured by fewer repeated triage questions).
- Faster time-to-action (NHS 111, GP registration).
