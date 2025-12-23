# Evi – Standalone Feature Implementation Spec (v1)

## Scope & Constraints
- Product: **Evi – UK Healthcare Navigation Assistant**
- Target users: International students & newcomers to the UK
- Deployment: Standalone web app
- Explicitly out of scope:
  - No Evida Baseline
  - No wearables
  - No paid services
  - No clinical decision-making
- Primary goals:
  - Reduce confusion
  - Increase confidence
  - Drive correct next actions

---

## 1. Fix Onboarding Bug (High Priority)

### Problem
User profile fields are incorrectly mapped (e.g. GP registration field receiving visa input).

### Requirements
- Enforce **strict schema validation** for onboarding responses
- Each onboarding question must map to exactly one field

### Implementation Notes
- One question → one field → one validator
- No free-text mapping to boolean fields
- Add a final **profile review step** before saving
- Display saved profile read-only in a sidebar

---

## 2. Interactive Roadmap

### Problem
Roadmap cards are static and non-actionable.

### Feature
An **interactive “Your UK Healthcare Roadmap”** driven by profile state.

### Example Steps
1. Build your profile  
2. Check NHS eligibility  
3. Register with a GP  
4. Understand care options  
5. Know urgent vs emergency care  

### Behaviour
- Each step has a state: `locked | available | completed`
- Clicking a step launches a guided chat flow
- Completion inferred from user actions, not manual toggles
- Progress persists across sessions

---

## 3. Persistent Chat History & Exports

### Feature
Users can revisit and export previous conversations.

### Requirements
- Store chat sessions per user
- Each session includes:
  - Timestamp
  - Topic tags (e.g. GP, NHS 111, A&E)
  - Profile snapshot

### Export Options
- PDF (human-readable)
- Markdown
- Plain text

### UX
- Chat history panel
- “Export this conversation” action
- Clear non-clinical disclaimer

---

## 4. Knowledge Base / FAQ

### Problem
Foundational questions are repeatedly asked.

### Solution
A **structured, searchable knowledge base**.

### Core Sections
- How the NHS works
- Registering with a GP
- GP vs Pharmacy vs NHS 111 vs A&E
- Prescriptions & costs
- Mental health services
- Common myths

### Behaviour
- Articles are searchable
- Linked directly from chat responses
- Versioned and timestamped
- NHS sources clearly referenced

---

## 5. Contextual Quick Replies

### Feature
Dynamic quick-reply buttons based on context.

### Examples
After symptoms:
- “Is this urgent?”
- “Where should I go?”

After GP discussion:
- “Find a GP near me”
- “What documents do I need?”

### Rules
- Max 4 quick replies
- Generated from:
  - User intent
  - Roadmap step
  - Profile context

---

## 6. Make “Where Should I Go?” Operational

### Problem
Users receive advice but lack concrete next steps.

### Required Response Structure

**1. Recommendation**
> Best option: GP / Pharmacy / NHS 111 / A&E

**2. Why**
Short explanation tied to UK system norms.

**3. What To Do Next**
- Nearest services (if location known)
- Opening hours
- Booking vs walk-in guidance

**4. What To Say**
Short script users can reuse.

**5. Safety Net**
Clear escalation criteria (e.g. go to A&E, call 999).

---

## 7. Trust & Governance Layer

### Goal
Make boundaries, safety, and credibility explicit.

### Required Pages
- How Evi Works (sources, approach)
- Clinical Boundaries (what Evi does not do)
- Emergency Handling
- Data & Privacy

### UI Elements
- Persistent “Not for emergencies” banner
- Inline source citations
- Clear emergency escalation messaging

---

## Non-Goals
- No diagnosis
- No treatment plans
- No prescriptions
- No private healthcare integration
- No monetisation

---

## Success Metrics
- Roadmap completion rate
- Reduction in repeated triage questions
- Time-to-action after recommendations
- Self-reported confidence score

---

## Open Questions
- Anonymous vs authenticated users?
- Local vs server-side persistence?
- GDPR consent timing?
