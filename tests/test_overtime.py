"""Unit tests for the overtime calculation engine (analyzer.simulate_schedule).

The OT estimate is the whole point of the app, so this locks the math down:
- every regression case shipped in static/overtime-rules.json is replayed, and
- explicit cases pin the SAFE / OVERTIME / DOUBLE OT tiers, the rates/pay, the
  continuous-span reset break, and the continuous-span exception allowance.

Run with:  python -m pytest tests/test_overtime.py
"""
import sys
from pathlib import Path

import pytest

# Make the project root importable when pytest is run from anywhere.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from analyzer import (  # noqa: E402
    DAILY_NO_OVERTIME_LIMIT,
    DOUBLE_OT_RATE,
    OT_RATE,
    simulate_schedule,
)
from overtime_rules import regression_cases  # noqa: E402


def schedule_from(durations, gap, start=10.0):
    """Build a sorted schedule of back-to-back blocks separated by `gap` hours."""
    blocks = []
    t = start
    for d in durations:
        blocks.append({"start": t, "duration": d})
        t += d + gap
    return blocks


# --- Regression cases from static/overtime-rules.json ----------------------

REGRESSION = regression_cases()


def test_regression_cases_present():
    # Guard against the rules file losing its cases (which would make the
    # parametrized test silently pass with nothing to check).
    assert len(REGRESSION) >= 5


@pytest.mark.parametrize("case", REGRESSION, ids=[c["label"] for c in REGRESSION])
def test_regression_case_overtime_hours(case):
    schedule = schedule_from(case["durations"], case["gap"])
    result = simulate_schedule(schedule)
    assert result["hours"] == pytest.approx(case["expected_hours"], abs=1e-6)


# --- Explicit tier behaviour ------------------------------------------------

def test_at_or_below_no_overtime_limit_is_safe():
    result = simulate_schedule(schedule_from([DAILY_NO_OVERTIME_LIMIT], 0))
    assert result["type"] == "SAFE"
    assert result["pay"] == 0


def test_just_over_limit_is_overtime():
    # 4.5h continuous: 1.5h over the 3h regular threshold -> OT at the OT rate.
    result = simulate_schedule(schedule_from([4.5], 0))
    assert result["type"] == "OVERTIME"
    assert result["hours"] == pytest.approx(1.5)
    assert result["rate"] == OT_RATE
    assert result["pay"] == pytest.approx(1.5 * OT_RATE)


def test_long_day_triggers_double_overtime():
    # 9h continuous: hours past the 8h tier are double-OT; pay mixes both rates.
    result = simulate_schedule(schedule_from([9.0], 0))
    assert result["type"] == "DOUBLE OT"
    assert result["hours"] == pytest.approx(1.0)  # reported hours = double-OT hours
    assert result["rate"] == DOUBLE_OT_RATE
    assert result["pay"] == pytest.approx(6 * OT_RATE + 1 * DOUBLE_OT_RATE)


def test_one_hour_break_resets_the_span():
    # 3h + (1h break) + 3h: each sub-span stays at/under the 3h regular limit,
    # so the break resets the running total and there is no overtime.
    result = simulate_schedule(schedule_from([3.0, 3.0], 1.0))
    assert result["type"] == "SAFE"
    assert result["pay"] == 0


def test_short_break_does_not_reset_the_span():
    # Same hours but only a 0.5h break -> the span keeps running and 3h of OT
    # accrues (6h continuous, 3h over the regular threshold).
    result = simulate_schedule(schedule_from([3.0, 3.0], 0.5))
    assert result["type"] == "OVERTIME"
    assert result["hours"] == pytest.approx(3.0)


def test_continuous_span_exception_grants_extra_regular_allowance():
    # 2.5h + 0.5h break + 2.5h matches the configured exception, shaving 0.5h
    # off what would otherwise be 2.0h of OT.
    result = simulate_schedule(schedule_from([2.5, 2.5], 0.5))
    assert result["hours"] == pytest.approx(1.5)


def test_dur_alias_is_accepted():
    # The simulator accepts "dur" as well as "duration" (frontend uses "dur").
    result = simulate_schedule([{"start": 10.0, "dur": 4.5}])
    assert result["type"] == "OVERTIME"
    assert result["hours"] == pytest.approx(1.5)


def test_empty_schedule_is_safe():
    assert simulate_schedule([])["type"] == "SAFE"
