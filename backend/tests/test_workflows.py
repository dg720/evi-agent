from types import SimpleNamespace

from agent import AgentSession
from extract import extract_profile, strip_profile_tag
from tools import safety_check


class StubResponses:
    def create(self, **_kwargs):
        return SimpleNamespace(output_text="[]", output=[], id="stub-response")


class StubClient:
    def __init__(self):
        self.responses = StubResponses()


def test_extract_profile_helpers():
    raw = "Hello <USER_PROFILE>{\"name\": \"A\", \"postcode\": \"NW8\"}</USER_PROFILE> world"
    parsed = extract_profile(raw)
    assert parsed == {"name": "A", "postcode": "NW8"}
    assert strip_profile_tag(raw) == "Hello  world".strip()


def test_onboarding_review_flow_and_validation():
    session = AgentSession(client_override=StubClient())

    reply = session.step("onboarding")
    assert "What's your name?" in reply

    session.step("skip")
    session.step("25-34")
    session.step("1 year")
    session.step("NW8 9HU")
    session.step("student visa")

    reply = session.step("maybe")
    assert "yes or no" in reply.lower()

    session.step("Yes")
    session.step("skip")
    session.step("skip")
    session.step("sleep and stress")
    reply = session.step("skip")

    assert "Please review your profile" in reply
    assert "Reply 'yes' to save" in reply

    session.step("yes")
    assert session.user_profile["gp_registered"] == "Yes"
    assert session.user_profile["postcode_full"] == "NW8 9HU"
    assert session.user_profile["postcode_area"] == "NW8"


def test_routing_response_structure():
    session = AgentSession(client_override=StubClient())
    triage_result = {
        "status": "final",
        "severity_level": "medium",
        "suggested_service": "GP",
        "rationale": "Stable symptoms that should be checked soon.",
        "postcode_full": "NW8 9HU",
        "should_lookup": True,
    }
    services = [
        {"name": "Clinic A", "distance": "0.5 miles", "address": "1 Main St", "phone": "020 0000 0000"},
    ]
    response = session._build_routing_response(triage_result, "Sore throat", services)
    assert "Recommendation" in response
    assert "Best option:" in response
    assert "What to do next" in response
    assert "What to say" in response
    assert "Safety net" in response
    assert "Clinic A" in response


def test_safety_check_keywords():
    assert safety_check("I have chest pain and feel dizzy") is True
    assert safety_check("I have a mild cough") is False
