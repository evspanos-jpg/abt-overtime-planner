import json
from functools import lru_cache
from pathlib import Path


RULES_PATH = Path(__file__).resolve().parent / "static" / "overtime-rules.json"


@lru_cache(maxsize=1)
def load_overtime_rules() -> dict:
    return json.loads(RULES_PATH.read_text(encoding="utf-8"))


def overtime_base_rules() -> dict:
    return load_overtime_rules().get("base", {})


def continuous_span_exceptions() -> list[dict]:
    return load_overtime_rules().get("continuous_span_exceptions", [])


def regression_cases() -> list[dict]:
    return load_overtime_rules().get("regression_cases", [])
