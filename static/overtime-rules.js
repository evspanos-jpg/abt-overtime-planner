(function(){
    const CUSTOM_OVERTIME_RULES_KEY = "abtOvertimePlannerCustomOvertimeRules"

    // Complete rule set embedded here so the app never needs a blocking network call.
    // The JSON file (overtime-rules.json) is still the source of truth for the Python
    // server and is fetched asynchronously below to pick up any live edits.
    const fallbackRules = {
        base: {
            daily_regular_hours: 3,
            daily_no_overtime_limit: 4,
            daily_tier_ot_start: 6,
            daily_tier_ot_end: 8,
            ot_rate: 65,
            double_ot_rate: 90,
            billing_increment: 0.5,
            work_break_limit_hours: 5 / 60,
            daily_reset_break_hours: 1,
            continuous_reset_break_hours: 1
        },
        continuous_span_exceptions: [
            {
                name: "two_point_five_half_hour_break_two_point_five",
                previous_duration: 2.5,
                gap: 0.5,
                duration: 2.5,
                extra_regular_allowance: 0.5
            }
        ],
        regression_cases: [
            { label: "five_continuous_hours_is_two_ot", durations: [5.0], gap: 0.0, expected_hours: 2.0 },
            { label: "fragmented_continuous_five_hours_is_two_ot", durations: [1.0, 0.5, 0.5, 0.5, 0.5, 1.0, 1.0], gap: 0.0, expected_hours: 2.0 },
            { label: "short_breaks_under_one_hour_keep_same_ot_span", durations: [1.0, 0.5, 0.5, 0.5, 0.5, 1.0, 1.0], gap: 0.5, expected_hours: 2.0 },
            { label: "two_point_five_half_hour_break_two_point_five_exception", durations: [2.5, 2.5], gap: 0.5, expected_hours: 1.5 },
            { label: "three_plus_one_with_one_hour_break_is_no_ot", durations: [3.0, 1.0], gap: 1.0, expected_hours: 0.0 },
            { label: "two_plus_two_with_one_hour_break_is_no_ot", durations: [2.0, 2.0], gap: 1.0, expected_hours: 0.0 },
            { label: "one_plus_one_plus_one_plus_one_with_one_hour_breaks_is_no_ot", durations: [1.0, 1.0, 1.0, 1.0], gap: 1.0, expected_hours: 0.0 }
        ]
    }

    function normalizeCustomRules(value){
        return {
            continuous_span_exceptions: Array.isArray(value?.continuous_span_exceptions) ? value.continuous_span_exceptions : [],
            regression_cases: Array.isArray(value?.regression_cases) ? value.regression_cases : []
        }
    }

    function cloneValue(value){
        return JSON.parse(JSON.stringify(value))
    }

    function mergeRules(baseRules, customRules){
        let normalizedCustom = normalizeCustomRules(customRules)
        return {
            base: {...(baseRules.base || {})},
            continuous_span_exceptions: [
                ...cloneValue(baseRules.continuous_span_exceptions || []),
                ...cloneValue(normalizedCustom.continuous_span_exceptions || [])
            ],
            regression_cases: [
                ...cloneValue(baseRules.regression_cases || []),
                ...cloneValue(normalizedCustom.regression_cases || [])
            ]
        }
    }

    function loadCustomRules(){
        try{
            return normalizeCustomRules(JSON.parse(localStorage.getItem(CUSTOM_OVERTIME_RULES_KEY) || "{}"))
        }catch(error){
            console.warn("Could not read custom overtime rules.", error)
            return normalizeCustomRules({})
        }
    }

    // Set globals synchronously so planner-app.js can read them immediately.
    window.customOvertimeRulesStorageKey = CUSTOM_OVERTIME_RULES_KEY
    window.overtimeRulesBase = fallbackRules
    window.overtimeRulesCustom = loadCustomRules()
    window.overtimeRules = mergeRules(fallbackRules, window.overtimeRulesCustom)

    // Async fetch to pick up any live edits to overtime-rules.json.
    // planner-app.js reads the globals at load time so constants are already set;
    // this update is only relevant if the user reloads after editing the JSON.
    if(typeof fetch === "function"){
        fetch("static/overtime-rules.json")
            .then(function(response){
                if(!response.ok) return null
                return response.json()
            })
            .then(function(loaded){
                if(!loaded || typeof loaded !== "object") return
                window.overtimeRulesBase = loaded
                window.overtimeRules = mergeRules(loaded, window.overtimeRulesCustom)
            })
            .catch(function(error){
                console.warn("Could not load overtime rules JSON.", error)
            })
    }
})()
