import json
import re
from typing import Any, Dict, Optional


PROFILE_TAG_RE = re.compile(r"<USER_PROFILE>.*?</USER_PROFILE>", re.DOTALL)


def extract_profile(text: str) -> Optional[Dict[str, Any]]:
    m = re.search(r"<USER_PROFILE>(.*?)</USER_PROFILE>", text, re.DOTALL)
    if not m:
        return None

    raw = m.group(1)
    if not raw:
        return None

    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def strip_profile_tag(text: str) -> str:
    return PROFILE_TAG_RE.sub("", text).strip()
