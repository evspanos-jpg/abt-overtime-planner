def simulate_schedule(schedule):

    schedule = sorted(schedule, key=lambda x: x["start"])

    total_hours = 0
    continuous_hours = 0
    last_end = None

    continuous_ot_hours = 0

    # ✅ STEP 1 — CONTINUOUS OT (per segment)
    for block in schedule:

        start = block["start"]
        duration = block["duration"]
        end = start + duration

        total_hours += duration

        # ✅ Reset if break ≥ 1 hour
        if last_end is not None:
            gap = start - last_end
            if gap >= 1:
                continuous_hours = 0

        before = continuous_hours
        after = continuous_hours + duration

        # ✅ Only part AFTER 3h counts
        if after > 3:
            ot_add = after - max(before, 3)
            continuous_ot_hours += ot_add

        continuous_hours = after
        last_end = end

    # ✅ STEP 2 — DAILY TIERS (STACKING)

    if total_hours <= 4:
        return {
            "type": "SAFE",
            "hours": 0,
            "rate": 0,
            "pay": 0
        }

    # OT from 6 → 8
    daily_ot_65 = max(0, min(total_hours, 8) - 6)

    # Double OT after 8
    double_ot_90 = max(0, total_hours - 8)

    # ✅ STEP 3 — COMBINE CORRECTLY

    # Use the *larger* of continuous vs 6–8 band
    base_ot_65 = max(continuous_ot_hours, daily_ot_65)

    # ✅ FINAL PAY (STACKING)
    pay = (base_ot_65 * 65) + (double_ot_90 * 90)

    # ✅ LABELING
    if double_ot_90 > 0:
        return {
            "type": "DOUBLE OT",
            "hours": double_ot_90,
            "rate": 90,
            "pay": round(pay, 2)
        }

    if base_ot_65 > 0:
        return {
            "type": "OVERTIME",
            "hours": base_ot_65,
            "rate": 65,
            "pay": round(pay, 2)
        }

    return {
        "type": "SAFE",
        "hours": 0,
        "rate": 0,
        "pay": 0
    }
