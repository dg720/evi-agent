"""NHS/LBS chat agent session management, tools, and deterministic flows."""

import json
import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from openai import OpenAI, RateLimitError

from config import (
    ACTION_KEYWORDS,
    CANONICAL_LINKS,
    ONBOARDING_QUESTIONS,
    ONBOARDING_TRIGGER_PHRASES,
)
from extract import extract_profile, strip_profile_tag
from prompts import intro_prompt, build_system_prompt
from tools import (
    emergency_response,
    guided_search,
    nhs_111_live_triage,
    safety_check,
    tool_nearest_nhs_services,
    tool_safety,
    tools,
)

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)


# --- Tool Registry for Python-side Execution ---
def execute_tool(tool_name: str, arguments: Dict[str, Any]):
    """Dispatch supported tool calls by name."""
    if tool_name == "nearest_nhs_services":
        return tool_nearest_nhs_services(arguments)
    if tool_name == "trigger_safety_protocol":
        return tool_safety(arguments)
    if tool_name == "guided_search":
        return guided_search(arguments)
    if tool_name == "nhs_111_live_triage":
        return nhs_111_live_triage(arguments)
    return f"[Error: Unknown tool '{tool_name}']"


class AgentSession:
    """
    Shared agent runner for CLI and Streamlit.
    Maintains conversation + onboarding/triage state across turns.
    """

    def __init__(self, client_override: Optional[OpenAI] = None):
        self.client = client_override or client
        self.conversation_history: List[Dict[str, str]] = []
        self.user_profile: Dict[str, Any] = {}
        self.system_prompt = build_system_prompt(self.user_profile)

        self.onboarding_active = False
        self.onboarding_state: Optional[Dict[str, Any]] = None

        self.triage_active = False
        self.triage_known_answers: Dict[str, Any] = {}
        self.triage_question_count = 0

        self.prompt_suggestions: List[str] = []
        self.last_useful_links: List[Dict[str, str]] = []

        self.HISTORY_WINDOW = 15
        self.MAX_OUT = 250
        self.MAX_TOOL_ROUNDS = 4
        self.MAX_RETRIES = 2

    # -----------------------------
    # SAFE MODEL CALL (TPM-aware)
    # -----------------------------
    def safe_create(self, **kwargs):
        """Call OpenAI with retries and trimmed history if rate limited."""
        for attempt in range(self.MAX_RETRIES + 1):
            try:
                return self.client.responses.create(**kwargs)
            except RateLimitError:
                if "input" in kwargs and isinstance(kwargs["input"], list):
                    sys_and_pins = [x for x in kwargs["input"] if x.get("role") == "system"]
                    others = [x for x in kwargs["input"] if x.get("role") != "system"]
                    kwargs["input"] = sys_and_pins + others[-3:]
                kwargs["max_output_tokens"] = min(kwargs.get("max_output_tokens", self.MAX_OUT), 150)
                time.sleep(0.2)
        raise

    def set_user_profile(self, profile: Dict[str, Any]) -> None:
        """Set the profile from the UI and rebuild system prompt."""
        postcode_full, postcode_area = self._derive_postcode_fields(str(profile.get("postcode") or ""))
        if postcode_full:
            profile["postcode_full"] = postcode_full
        if postcode_area:
            profile["postcode_area"] = postcode_area
        self.user_profile = profile
        self.system_prompt = build_system_prompt(self.user_profile)
        self.conversation_history.append(
            {
                "role": "system",
                "content": f"Updated user profile for memory:\n{self.user_profile}",
            }
        )

    def _update_state_from_tool(self, tool_name: str, tool_result: Any):
        """Integrate tool outputs into triage state tracking."""
        parsed = None
        try:
            parsed = tool_result if isinstance(tool_result, dict) else json.loads(tool_result)
        except Exception:
            parsed = None

        if isinstance(parsed, dict):
            if parsed.get("status") == "need_more_info":
                self.triage_active = True
                self.triage_known_answers.update(parsed.get("known_answers_update", {}))
                self.triage_question_count = self.triage_question_count + 1
            elif parsed.get("status") == "final":
                self.triage_active = False
                self.triage_known_answers = {}
                self.triage_question_count = 0

        return parsed

    def _fallback_triage_result(self, postcode_full: str) -> Dict[str, Any]:
        return {
            "status": "final",
            "severity_level": "medium",
            "suggested_service": "NHS_111",
            "rationale": "I could not complete live triage, so I recommend NHS 111 for safe routing.",
            "postcode_full": postcode_full,
            "should_lookup": False,
        }

    # -----------------------------
    # ONBOARDING HELPERS
    # -----------------------------
    def _start_onboarding(self) -> None:
        self.onboarding_active = True
        self.onboarding_state = {
            "questions": ONBOARDING_QUESTIONS,
            "current_idx": 0,
            "answers": {},
            "expecting_answer": False,
            "reprompted": False,
        }
        self.triage_active = False

    def _onboarding_current_question(self) -> Optional[Dict[str, Any]]:
        """Return the current onboarding question or None if finished."""
        if not self.onboarding_state:
            return None
        idx = self.onboarding_state.get("current_idx", 0)
        questions = self.onboarding_state.get("questions") or []
        if idx >= len(questions):
            return None
        return questions[idx]

    def _prompt_next_onboarding_question(self) -> str:
        """Set expectation flag and surface the next onboarding question text."""
        question = self._onboarding_current_question()
        if not question:
            return self._finalize_onboarding_flow()
        self.onboarding_state["expecting_answer"] = True
        self.onboarding_state["reprompted"] = False
        return str(question.get("question", "")).strip()

    def _normalize_onboarding_answer(self, raw: str):
        """Normalize onboarding input and indicate if a reprompt is needed."""
        text = (raw or "").strip()
        if text == "":
            return None, True
        lowered = text.lower()
        if lowered in {"skip", "prefer not to say", "n/a", "na"}:
            return None, False
        return text, False

    def _derive_postcode_fields(self, postcode_raw: str) -> Tuple[Optional[str], Optional[str]]:
        text = (postcode_raw or "").strip().upper()
        if not text:
            return None, None

        compact = text.replace(" ", "")
        full_match = re.match(r"^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$", compact)
        if full_match:
            full = f"{compact[:-3]} {compact[-3:]}"
            area = full.split(" ")[0]
            return full, area

        area = text.split(" ")[0]
        return None, area

    def _finalize_onboarding_flow(self) -> str:
        """Persist profile, add deterministic eligibility summary, and close onboarding."""
        questions = self.onboarding_state.get("questions") if self.onboarding_state else []
        answers = self.onboarding_state.get("answers") if self.onboarding_state else {}
        profile = {q.get("key"): answers.get(q.get("key")) for q in (questions or [])}

        postcode_full, postcode_area = self._derive_postcode_fields(str(profile.get("postcode") or ""))
        if postcode_full:
            profile["postcode_full"] = postcode_full
        if postcode_area:
            profile["postcode_area"] = postcode_area

        profile_json = json.dumps(profile)
        completion_note = "Onboarding is complete. I have saved these details for future chats."
        eligibility = self._eligibility_summary_from_profile(profile)
        summary = f"{completion_note}\n\n{eligibility}" if eligibility else completion_note
        return f"<USER_PROFILE>{profile_json}</USER_PROFILE>\n{summary}"

    def _eligibility_summary_from_profile(self, profile: Dict[str, Any]) -> str:
        """Derive likely service eligibility based on stored onboarding answers."""
        stay = (profile.get("stay_length") or "").lower()
        visa = (profile.get("visa_status") or "").lower()
        postcode_full = profile.get("postcode_full") or ""
        postcode_area = profile.get("postcode_area") or ""
        gp_registered = str(profile.get("gp_registered") or "").lower()

        long_stay = any(k in stay for k in ["year", "yr", "6", "twelve", "12", "long", "permanent", "settled"])
        has_uk_status = any(k in visa for k in ["student", "work", "skilled", "settled", "ilr", "british", "uk"])

        gp_line = (
            "Likely eligible to register with a GP (typical for stays 6+ months). "
            "Use your UK address and bring ID/proof of address if asked."
            if long_stay or has_uk_status
            else "Short-term visitors may be asked about stay length for GP registration; urgent/111/A&E remain available."
        )
        urgent_line = "Urgent and emergency care (NHS 111, A&E) are available regardless of GP registration."
        registered_note = "You already have a GP registered." if "yes" in gp_registered else ""
        location_note = f"Postcode on file: {postcode_full}" if postcode_full else f"Area on file: {postcode_area}" if postcode_area else ""
        charges_note = (
            "Some services may have charges depending on visa/immigration status. "
            "If unsure, check NHS charging guidance or ask your university support team."
        )

        return "\n".join(
            [
                "Based on your details, here are likely options:",
                f"- {gp_line}",
                f"- {urgent_line}",
                f"- {charges_note}",
                f"- {registered_note}".strip(" -"),
                f"- {location_note}".strip(" -"),
                "If you'd like, I can look up nearby GP practices or urgent care options.",
            ]
        )

    def _handle_onboarding_answer(self, user_input: str) -> str:
        if not self.onboarding_state:
            return "I hit a snag loading the onboarding questions. Please say 'onboarding' to restart."

        question = self._onboarding_current_question()
        if not question:
            return self._finalize_onboarding_flow()

        answer, was_empty = self._normalize_onboarding_answer(user_input)
        if was_empty and not self.onboarding_state.get("reprompted", False):
            self.onboarding_state["reprompted"] = True
            self.onboarding_state["expecting_answer"] = True
            return f"I did not catch that. {question.get('question', '').strip()}"

        # store answer (None allowed for skips/empty after reprompt)
        self.onboarding_state["answers"][question.get("key")] = answer
        self.onboarding_state["current_idx"] += 1
        self.onboarding_state["expecting_answer"] = False
        self.onboarding_state["reprompted"] = False

        # ask next question or finish
        if self._onboarding_current_question():
            return self._prompt_next_onboarding_question()
        return self._finalize_onboarding_flow()

    def _contains_action(self, text: str) -> bool:
        lowered = (text or "").lower()
        return any(keyword in lowered for keyword in ACTION_KEYWORDS)

    def _select_useful_links(self, user_input: str, agent_reply: str) -> List[Dict[str, str]]:
        lowered = f"{user_input}\n{agent_reply}".lower()
        tags = set()

        if "gp" in lowered or "register" in lowered:
            tags.update(["gp", "register"])
        if "111" in lowered or "urgent" in lowered or "triage" in lowered:
            tags.add("111")
        if "a&e" in lowered or "a and e" in lowered or "emergency" in lowered:
            tags.update(["111", "services"])
        if "mental" in lowered or "wellbeing" in lowered:
            tags.update(["mental", "wellbeing", "lbs"])
        if "eligib" in lowered or "visa" in lowered:
            tags.update(["eligibility", "services"])
        if "nhs" in lowered:
            tags.add("services")

        if not tags and not self._contains_action(lowered):
            return []

        selected = []
        for link in CANONICAL_LINKS:
            if tags.intersection(link.get("tags", [])):
                selected.append({"title": link["title"], "url": link["url"]})

        if not selected:
            selected = [
                {"title": "NHS services guide", "url": "https://www.nhs.uk/using-the-nhs/nhs-services/"},
                {"title": "LBS health and wellbeing", "url": "https://www.london.edu/masters-experience/student-support"},
            ]

        return selected[:4]

    def _strip_useful_links(self, agent_reply: str) -> str:
        lines = agent_reply.splitlines()
        rebuilt = []
        idx = 0
        while idx < len(lines):
            line = lines[idx]
            if line.strip().lower().startswith("useful links"):
                idx += 1
                while idx < len(lines) and lines[idx].strip() != "":
                    idx += 1
                continue
            rebuilt.append(line)
            idx += 1
        return "\n".join(rebuilt).strip()

    def _process_final_reply(self, user_input: str, agent_reply: str) -> str:
        useful_links = self._select_useful_links(user_input, agent_reply)
        self.last_useful_links = useful_links

        clean_reply = self._strip_useful_links(strip_profile_tag(agent_reply))
        self.conversation_history.append({"role": "assistant", "content": clean_reply})

        maybe_profile = extract_profile(agent_reply)
        if maybe_profile:
            self.set_user_profile(maybe_profile)

            # reset modes
            self.onboarding_active = False
            self.onboarding_state = None
            self.triage_active = False
            self.triage_known_answers = {}

            follow_up = self._profile_followups()
            if follow_up:
                self.conversation_history.append({"role": "assistant", "content": follow_up})
                clean_reply = clean_reply + "\n\n" + follow_up

        return clean_reply

    def _profile_followups(self) -> str:
        if not self.user_profile:
            return ""

        prompt = (
            "Using the profile below, propose 3-5 concise follow-up suggestions tailored to the user. "
            "Keep it short (under ~120 words), use numbered bullets, and stay within wellbeing/health navigation "
            "topics relevant to UK NHS care. Do NOT ask for onboarding details again. "
            "End with a brief invitation to ask for help finding local services if relevant.\n\n"
            f"User profile: {json.dumps(self.user_profile)}"
        )

        try:
            resp = self.client.responses.create(
                model="gpt-4o-mini",
                input=prompt,
                max_output_tokens=220,
            )
            return resp.output_text or ""
        except Exception:
            fallback = (
                "Here are a few next steps you might find useful:\n"
                "1) Find nearby GP practices and register.\n"
                "2) Book a routine health check or vaccination if due.\n"
                "3) Explore local mental wellbeing resources.\n"
                "If you want, I can look up nearby services based on your postcode."
            )
            return fallback

    def _eligibility_response(self) -> str:
        """
        Deterministic, structured eligibility check with follow-up questions.
        """
        return (
            "Here's a structured check for NHS service eligibility:\n\n"
            "Key criteria:\n"
            "1) Residency/visa: UK resident, settled status, or valid visa (e.g., student or work).\n"
            "2) Location: Living within a UK postcode/catchment for local services (GP, urgent care).\n"
            "3) Duration: Planning to stay 6+ months (typical for GP registration).\n"
            "4) ID/proof: Ability to show ID plus address (e.g., bank statement/tenancy) if asked.\n"
            "5) Visitors: Short-stay visitors may still access urgent or emergency care.\n\n"
            "Want me to confirm with your details? I can start onboarding now to collect postcode, visa/status, "
            "UK stay length, and GP status, then I'll summarize what you're eligible for. Just say 'onboarding' to begin."
        )

    def _generate_prompt_suggestions(self, last_reply: str) -> List[str]:
        prompt = (
            "Generate 3 short follow-up prompts the user might want to ask next. "
            "Keep each under 80 characters. "
            "Return ONLY a JSON list of strings. "
            "Avoid duplicates. "
            f"User profile: {json.dumps(self.user_profile)}. "
            f"Last assistant reply: {last_reply}"
        )
        try:
            resp = self.client.responses.create(
                model="gpt-4o-mini",
                input=prompt,
                max_output_tokens=120,
            )
            raw = resp.output_text or "[]"
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                cleaned = [str(x).strip() for x in parsed if str(x).strip()]
                if cleaned:
                    return cleaned[:3]
        except Exception:
            pass

        # Fallback generic suggestions if LLM parsing fails
        fallback = [
            "Find nearby GP or A&E",
            "How to register with a GP",
            "What to do for my symptoms now",
        ]
        return fallback

    def _is_onboarding_request(self, user_input: str) -> bool:
        lowered = user_input.lower()
        return any(phrase in lowered for phrase in ONBOARDING_TRIGGER_PHRASES)

    def _is_search_request(self, user_input: str) -> bool:
        lowered = user_input.lower()
        return "search" in lowered or "find info" in lowered or "find information" in lowered

    def step(self, user_input: str) -> str:
        """
        Process a single user turn and return the assistant reply (profile tags stripped).
        """
        self.conversation_history.append({"role": "user", "content": user_input})

        if safety_check(user_input):
            reply = emergency_response()
            self.last_useful_links = []
            self.conversation_history.append({"role": "assistant", "content": reply})
            return reply

        # -------------------------------
        # SHORT-CIRCUIT: ONBOARDING TRIGGER
        # -------------------------------
        if self._is_onboarding_request(user_input) and not self.onboarding_active:
            self._start_onboarding()
            reply = self._prompt_next_onboarding_question()
            return self._process_final_reply(user_input, reply)

        # -------------------------------
        # SHORT-CIRCUIT: ACTIVE ONBOARDING
        # -------------------------------
        if self.onboarding_active and self.onboarding_state:
            if not self.onboarding_state.get("expecting_answer", False) and self.onboarding_state.get("current_idx", 0) == 0:
                reply = self._prompt_next_onboarding_question()
                return self._process_final_reply(user_input, reply)

            reply = self._handle_onboarding_answer(user_input)
            return self._process_final_reply(user_input, reply)

        # -------------------------------
        # SHORT-CIRCUIT: ELIGIBILITY QUERY
        # -------------------------------
        lower_input = user_input.lower()
        if "eligible" in lower_input or "eligibility" in lower_input:
            reply = self._eligibility_response()
            return self._process_final_reply(user_input, reply)

        # -------------------------------
        # PINNED CONTEXT (short!)
        # -------------------------------
        pinned = []

        if self.triage_active:
            pinned.append(
                {
                    "role": "system",
                    "content": (
                        "TRIAGE MODE IS ACTIVE. "
                        "Do NOT call onboarding unless user explicitly says 'onboarding'. "
                        f"Use nhs_111_live_triage with known_answers={json.dumps(self.triage_known_answers)}. "
                        "Ask only triage follow-up questions until triage status='final'. "
                        "Do NOT repeat topics already in known_answers (e.g., severity, onset, injury/trauma, functional ability, red flags already covered). "
                        f"You have already asked {self.triage_question_count} follow-ups. "
                        "Tailor follow-ups to the presenting issue, keep them concise, aim to finish within 5-8 questions, and NEVER exceed 10; if you already have 5 answers or 5 questions asked, move to a final decision."
                    ),
                }
            )

        # -------------------------------
        # FIRST MODEL CALL
        # -------------------------------
        toolset = tools
        if not self._is_search_request(user_input):
            toolset = [tool for tool in tools if tool.get("name") != "guided_search"]

        resp = self.safe_create(
            model="gpt-4o-mini",
            store=True,
            input=[{"role": "system", "content": self.system_prompt}, *pinned, *self.conversation_history[-self.HISTORY_WINDOW :]],
            tools=toolset,
            tool_choice="auto",
            max_output_tokens=self.MAX_OUT,
        )

        final_response = resp
        triage_called_this_turn = False
        tool_rounds = 0
        bailed_with_unresolved_calls = False
        triage_lookup_done = False

        # -------------------------------
        # BATCH TOOL HANDLING LOOP
        # -------------------------------
        while True:
            tool_rounds += 1
            if tool_rounds > self.MAX_TOOL_ROUNDS:
                bailed_with_unresolved_calls = True
                break

            tool_calls = [item for item in final_response.output if item.type == "function_call"]
            if not tool_calls:
                break

            # Guard: only one triage call per user turn
            if triage_called_this_turn and all(call.name == "nhs_111_live_triage" for call in tool_calls):
                bailed_with_unresolved_calls = True
                break

            outputs = [{"role": "system", "content": self.system_prompt}]

            for call in tool_calls:
                tool_name = call.name
                call_id = call.call_id
                raw_args = call.arguments

                if isinstance(raw_args, str):
                    try:
                        args = json.loads(raw_args)
                    except Exception:
                        args = {}
                else:
                    args = raw_args or {}

                tool_result = execute_tool(tool_name, args)

                if tool_name == "nhs_111_live_triage":
                    triage_called_this_turn = True

                parsed_tool = self._update_state_from_tool(tool_name, tool_result)

                if tool_name == "nhs_111_live_triage":
                    if not isinstance(parsed_tool, dict) or parsed_tool.get("status") not in {"need_more_info", "final"}:
                        parsed_tool = self._fallback_triage_result(args.get("postcode_full", "") or "")
                        tool_result = parsed_tool

                tool_output_str = tool_result if isinstance(tool_result, str) else json.dumps(tool_result)

                outputs.append(
                    {
                        "type": "function_call_output",
                        "call_id": call_id,
                        "output": tool_output_str,
                    }
                )

                # Auto-chain to nearest services when triage recommends GP or A&E and has a postcode.
                if (
                    tool_name == "nhs_111_live_triage"
                    and not triage_lookup_done
                    and isinstance(parsed_tool, dict)
                    and parsed_tool.get("status") == "final"
                    and parsed_tool.get("should_lookup")
                    and parsed_tool.get("postcode_full")
                    and parsed_tool.get("suggested_service") in {"GP", "A&E"}
                ):
                    try:
                        lookup = tool_nearest_nhs_services(
                            {
                                "postcode_full": parsed_tool.get("postcode_full", ""),
                                "service_type": parsed_tool.get("suggested_service"),
                                "n": 3,
                            }
                        )
                        outputs.append(
                            {
                                "type": "function_call_output",
                                "call_id": f"{call_id}__nearest_services",
                                "output": lookup if isinstance(lookup, str) else json.dumps(lookup),
                            }
                        )
                        triage_lookup_done = True
                    except Exception:
                        pass

            final_response = self.safe_create(
                model="gpt-4o-mini",
                previous_response_id=final_response.id,
                input=outputs,
                tools=toolset,
                tool_choice="auto",
                max_output_tokens=self.MAX_OUT,
            )

        # -------------------------------
        # FINAL TEXT RESPONSE
        # -------------------------------
        agent_reply = final_response.output_text or ""

        # If unresolved tool calls, force text-only reply
        if bailed_with_unresolved_calls:
            forced = self.safe_create(
                model="gpt-4o-mini",
                store=True,
                input=[
                    {"role": "system", "content": self.system_prompt},
                    *pinned,
                    *self.conversation_history[-self.HISTORY_WINDOW :],
                    {
                        "role": "system",
                        "content": (
                            "You MUST respond to the user now in plain text. "
                            "Do NOT call any tools. "
                            "If triage is incomplete, ask the next 1-3 triage follow-up questions. "
                            "If triage is complete, give routing and next steps."
                        ),
                    },
                ],
                tools=toolset,
                tool_choice="none",
                max_output_tokens=200,
            )
            agent_reply = forced.output_text or ""

        # Blank-response fix
        elif agent_reply.strip() == "":
            forced = self.safe_create(
                model="gpt-4o-mini",
                previous_response_id=final_response.id,
                input=[
                    {
                        "role": "system",
                        "content": (
                            self.system_prompt
                            + "\n\nYou MUST respond to the user now in plain text. "
                            "Do NOT call any tools. "
                            "If triage is incomplete, ask the next 1-3 triage follow-up questions. "
                            "If triage is complete, give routing and next steps."
                        ),
                    }
                ],
                tools=toolset,
                tool_choice="none",
                max_output_tokens=200,
            )
            agent_reply = forced.output_text or ""

        clean = self._process_final_reply(user_input, agent_reply)
        self.prompt_suggestions = self._generate_prompt_suggestions(clean)
        return clean


def run_cli():
    session = AgentSession()
    print(intro_prompt + "\n")
    print("You can continue asking questions now. Type 'exit' to stop.\n")

    while True:
        user_input = input("You: ").strip()
        if user_input.lower() in ["exit", "quit", "stop"]:
            print("Bye! Stay healthy.")
            break
        reply = session.step(user_input)
        print("\nAssistant:", reply, "\n")


if __name__ == "__main__":
    run_cli()
