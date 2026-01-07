"""FastAPI service exposing the Evi agent for the frontend."""

import os
import uuid
from threading import Lock
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import AgentSession


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    prompt_suggestions: List[str]
    useful_links: List[Dict[str, str]]
    user_profile: Dict[str, Any]
    triage_active: bool
    triage_notice: str


class ProfileRequest(BaseModel):
    session_id: Optional[str] = None
    profile: Dict[str, Any]


class ProfileResponse(BaseModel):
    session_id: str
    user_profile: Dict[str, Any]


app = FastAPI(title="Evi Healthcare Companion API")

TRIAGE_NOTICE = (
    "Note: This triage is experimental and not medical advice. "
    "For urgent concerns, use NHS 111 at https://111.nhs.uk/."
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_sessions: Dict[str, AgentSession] = {}
_session_lock = Lock()


def _get_or_create_session(session_id: Optional[str]) -> (str, AgentSession):
    with _session_lock:
        if session_id and session_id in _sessions:
            return session_id, _sessions[session_id]
        new_id = session_id or str(uuid.uuid4())
        _sessions[new_id] = AgentSession()
        return new_id, _sessions[new_id]


@app.get("/api/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured.")

    session_id, session = _get_or_create_session(payload.session_id)

    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        reply = session.step(message)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Agent error: {exc}") from exc

    return ChatResponse(
        session_id=session_id,
        reply=reply,
        prompt_suggestions=session.prompt_suggestions,
        useful_links=session.last_useful_links,
        user_profile=session.user_profile,
        triage_active=session.triage_active,
        triage_notice=TRIAGE_NOTICE if session.triage_active else "",
    )


@app.post("/api/profile", response_model=ProfileResponse)
def update_profile(payload: ProfileRequest) -> ProfileResponse:
    session_id, session = _get_or_create_session(payload.session_id)
    if not isinstance(payload.profile, dict):
        raise HTTPException(status_code=400, detail="Profile must be an object.")

    session.set_user_profile(payload.profile)
    return ProfileResponse(session_id=session_id, user_profile=session.user_profile)
