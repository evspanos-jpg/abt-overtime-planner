from overtime_rules import continuous_span_exceptions, overtime_base_rules


BASE_RULES = overtime_base_rules()
CONTINUOUS_SPAN_EXCEPTIONS = continuous_span_exceptions()
DAILY_REGULAR_HOURS = float(BASE_RULES.get("daily_regular_hours", 3))
DAILY_NO_OVERTIME_LIMIT = float(BASE_RULES.get("daily_no_overtime_limit", 4))
DAILY_TIER_OT_END = float(BASE_RULES.get("daily_tier_ot_end", 8))
OT_RATE = float(BASE_RULES.get("ot_rate", 65))
DOUBLE_OT_RATE = float(BASE_RULES.get("double_ot_rate", 90))
CONTINUOUS_RESET_BREAK_HOURS = float(BASE_RULES.get("continuous_reset_break_hours", 1))
DAILY_RESET_BREAK_HOURS = float(BASE_RULES.get("daily_reset_break_hours", 1))


def continuous_span_extra_regular_allowance(previous_duration, gap, duration):
    for rule in CONTINUOUS_SPAN_EXCEPTIONS:
        if (
            abs(float(rule.get("previous_duration", 0)) - previous_duration) < 1e-9
            and abs(float(rule.get("gap", 0)) - gap) < 1e-9
            and abs(float(rule.get("duration", 0)) - duration) < 1e-9
        ):
            return float(rule.get("extra_regular_allowance", 0))
    return 0.0


def simulate_schedule(schedule):
    schedule = sorted(schedule, key=lambda x: float(x["start"]))
    total_worked_hours = sum(float(block.get("duration", block.get("dur", 0)) or 0) for block in schedule)

    if total_worked_hours <= DAILY_NO_OVERTIME_LIMIT:
        return {
            "type": "SAFE",
            "hours": 0,
            "rate": 0,
            "pay": 0,
        }

    continuous_hours = 0.0
    daily_hours = 0.0
    last_end = None
    previous_duration = 0.0

    continuous_ot_hours = 0.0
    daily_ot_65 = 0.0
    double_ot_90 = 0.0

    for block in schedule:
        start = float(block["start"])
        duration = float(block.get("duration", block.get("dur", 0)) or 0)
        end = start + duration
        extra_regular_allowance = 0.0

        if last_end is not None:
            gap = start - last_end
            extra_regular_allowance = continuous_span_extra_regular_allowance(previous_duration, gap, duration)
            if gap >= CONTINUOUS_RESET_BREAK_HOURS:
                continuous_hours = 0.0
            if gap >= DAILY_RESET_BREAK_HOURS:
                daily_hours = 0.0

        before = continuous_hours
        after = continuous_hours + duration
        if after > DAILY_REGULAR_HOURS:
            ot_add = max((after - max(before, DAILY_REGULAR_HOURS)) - extra_regular_allowance, 0.0)
            continuous_ot_hours += ot_add

        continuous_hours = after
        daily_before = daily_hours
        daily_after = daily_hours + duration
        daily_ot_65 += max(
            0.0,
            min(daily_after, DAILY_TIER_OT_END) - max(daily_before, DAILY_NO_OVERTIME_LIMIT),
        )
        double_ot_90 += max(0.0, daily_after - max(daily_before, DAILY_TIER_OT_END))
        daily_hours = daily_after
        last_end = end
        previous_duration = duration

    if continuous_ot_hours <= 0 and daily_ot_65 <= 0 and double_ot_90 <= 0:
        return {
            "type": "SAFE",
            "hours": 0,
            "rate": 0,
            "pay": 0,
        }

    base_ot_65 = max(continuous_ot_hours, daily_ot_65)
    pay = (base_ot_65 * OT_RATE) + (double_ot_90 * DOUBLE_OT_RATE)

    if double_ot_90 > 0:
        return {
            "type": "DOUBLE OT",
            "hours": double_ot_90,
            "rate": DOUBLE_OT_RATE,
            "pay": round(pay, 2),
        }

    if base_ot_65 > 0:
        return {
            "type": "OVERTIME",
            "hours": base_ot_65,
            "rate": OT_RATE,
            "pay": round(pay, 2),
        }

    return {
        "type": "SAFE",
        "hours": 0,
        "rate": 0,
        "pay": 0,
    }
