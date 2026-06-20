from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from analyzer import simulate_schedule
from overtime_rules import regression_cases


def contiguous_blocks_from_durations(durations: list[float], gap: float = 0.0) -> list[dict]:
    start = 0.0
    schedule = []
    for duration in durations:
        schedule.append({"start": start, "duration": duration})
        start += duration + gap
    return schedule


def assert_ot_hours(label: str, schedule: list[dict], expected_hours: float) -> None:
    result = simulate_schedule(schedule)
    actual = float(result["hours"])
    assert abs(actual - expected_hours) < 1e-9, (
        f"{label}: expected {expected_hours} OT hours, got {actual} ({result})"
    )


def main() -> None:
    for case in regression_cases():
        assert_ot_hours(
            case["label"],
            contiguous_blocks_from_durations(case["durations"], gap=case["gap"]),
            case["expected_hours"],
        )
    print("ot regression check passed")


if __name__ == "__main__":
    main()
