(function(){
    const CUSTOM_OVERTIME_RULES_KEY = "abtOvertimePlannerCustomOvertimeRules"
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
        regression_cases: []
    }

    function normalizeCustomRules(value){
        return {
            continuous_span_exceptions:Array.isArray(value?.continuous_span_exceptions) ? value.continuous_span_exceptions : [],
            regression_cases:Array.isArray(value?.regression_cases) ? value.regression_cases : []
        }
    }

    function cloneValue(value){
        return JSON.parse(JSON.stringify(value))
    }

    function mergeRules(baseRules,customRules){
        let normalizedCustom = normalizeCustomRules(customRules)
        return {
            base:{...(baseRules.base || {})},
            continuous_span_exceptions:[
                ...cloneValue(baseRules.continuous_span_exceptions || []),
                ...cloneValue(normalizedCustom.continuous_span_exceptions || [])
            ],
            regression_cases:[
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

    let baseRules = fallbackRules

    try{
        const request = new XMLHttpRequest()
        request.open("GET", "static/overtime-rules.json", false)
        request.send(null)
        if(request.status >= 200 && request.status < 300){
            baseRules = JSON.parse(request.responseText)
        }else{
            console.warn("Could not load overtime rules JSON.", request.status)
        }
    }catch(error){
        console.warn("Could not load overtime rules JSON.", error)
    }

    window.customOvertimeRulesStorageKey = CUSTOM_OVERTIME_RULES_KEY
    window.overtimeRulesBase = baseRules
    window.overtimeRulesCustom = loadCustomRules()
    window.overtimeRules = mergeRules(baseRules, window.overtimeRulesCustom)
})()
