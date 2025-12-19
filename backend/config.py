"""Shared constants for onboarding, links, and routing heuristics."""

from typing import Dict, List


ONBOARDING_QUESTIONS: List[Dict[str, object]] = [
    {"key": "name", "question": "What's your name? (optional - you can say 'skip')", "optional": True},
    {"key": "age_range", "question": "What's your age range?", "optional": False},
    {"key": "stay_length", "question": "How long will you stay in the UK?", "optional": False},
    {"key": "postcode", "question": "What's your London postcode / area?", "optional": False},
    {"key": "visa_status", "question": "Do you hold a UK visa/status (e.g., student, work, settled, visitor)?", "optional": False},
    {"key": "gp_registered", "question": "Do you already have a registered GP in the UK?", "optional": False},
    {"key": "conditions", "question": "Any long-term health conditions you'd like me to be aware of? (optional - say 'skip')", "optional": True},
    {"key": "medications", "question": "Do you take any regular medications or receive ongoing treatment? (optional - say 'skip')", "optional": True},
    {"key": "lifestyle_focus", "question": "Is there any lifestyle area you want to improve while in the UK?", "optional": False},
    {"key": "mental_wellbeing", "question": "How has your mental wellbeing been recently? (optional - say 'skip')", "optional": True},
]


CANONICAL_LINKS = [
    {"title": "Find a GP", "url": "https://www.nhs.uk/service-search/find-a-gp", "tags": ["gp", "register"]},
    {
        "title": "Register with a GP",
        "url": "https://www.nhs.uk/nhs-services/gps/how-to-register-with-a-gp-surgery/",
        "tags": ["gp", "register"],
    },
    {"title": "Use NHS 111 online", "url": "https://111.nhs.uk/", "tags": ["111", "urgent", "triage"]},
    {"title": "NHS services guide", "url": "https://www.nhs.uk/using-the-nhs/nhs-services/", "tags": ["nhs", "services", "eligibility"]},
    {"title": "LBS health and wellbeing", "url": "https://www.london.edu/masters-experience/student-support", "tags": ["lbs", "wellbeing"]},
    {
        "title": "LBS mental wellbeing support",
        "url": "https://www.london.edu/masters-experience/student-support/mental-health",
        "tags": ["mental", "wellbeing", "lbs"],
    },
]


ONBOARDING_TRIGGER_PHRASES = {
    "onboarding",
    "on board me",
    "onboard me",
    "set up my profile",
    "update my details",
    "redo onboarding",
    "start onboarding",
}


ACTION_KEYWORDS = [
    "register",
    "book",
    "call",
    "use nhs 111",
    "use 111",
    "go to a&e",
    "go to ae",
    "go to a and e",
    "find a gp",
    "find gp",
    "sign up",
    "contact your gp",
    "contact gp",
]
