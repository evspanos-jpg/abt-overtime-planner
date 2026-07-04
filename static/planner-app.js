const timeline = document.getElementById("timeline")

const HOURS = 13
const START_HOUR = 10
const SNAP = 5 / 60 // 5-minute snapping/increments
const OVERTIME_RULES = window.overtimeRules || {}
const OVERTIME_RULES_BASE = window.overtimeRulesBase || OVERTIME_RULES
const CUSTOM_OVERTIME_RULES_KEY = window.customOvertimeRulesStorageKey || "abtOvertimePlannerCustomOvertimeRules"
const CUSTOM_OVERTIME_RULES_HISTORY_KEY = "abtOvertimePlannerCustomOvertimeRulesHistory"
const OVERTIME_BASE = OVERTIME_RULES.base || {}
const CONTINUOUS_SPAN_EXCEPTIONS = Array.isArray(OVERTIME_RULES.continuous_span_exceptions) ? OVERTIME_RULES.continuous_span_exceptions : []
const OVERTIME_REGRESSION_CASES = Array.isArray(OVERTIME_RULES.regression_cases) ? OVERTIME_RULES.regression_cases : []
const DAILY_REGULAR_HOURS = Number(OVERTIME_BASE.daily_regular_hours ?? 3)
const DAILY_NO_OVERTIME_LIMIT = Number(OVERTIME_BASE.daily_no_overtime_limit ?? 4)
const DAILY_TIER_OT_END = Number(OVERTIME_BASE.daily_tier_ot_end ?? 8)
const OT_RATE = Number(OVERTIME_BASE.ot_rate ?? 65)
const DOUBLE_OT_RATE = Number(OVERTIME_BASE.double_ot_rate ?? 90)
const BILLING_INCREMENT = Number(OVERTIME_BASE.billing_increment ?? 0.5)
const WORK_BREAK_LIMIT_HOURS = Number(OVERTIME_BASE.work_break_limit_hours ?? (5 / 60))
const DAILY_RESET_BREAK_HOURS = Number(OVERTIME_BASE.daily_reset_break_hours ?? 1)
const CONTINUOUS_RESET_BREAK_HOURS = Number(OVERTIME_BASE.continuous_reset_break_hours ?? DAILY_RESET_BREAK_HOURS)
const STORAGE_KEY = "abtOvertimePlannerState"
const AUTOSAVE_ENABLED_KEY = "abtOvertimePlannerAutosaveEnabled"
const TOOLBAR_SETTINGS_KEY = "abtOvertimePlannerToolbarSettings"
const THEME_MODE_KEY = "abtOvertimePlannerThemeMode"
const WORKSPACE_LAYOUT_KEY = "abtOvertimePlannerWorkspaceLayout"
const TIMELINE_ZOOM_KEY = "abtOvertimePlannerTimelineZoom"
const TIMELINE_LAYOUT_MODE_KEY = "abtOvertimePlannerTimelineLayoutMode"
const MODE_BADGE_VISIBLE_KEY = "abtOvertimePlannerModeBadgeVisible"
const DEFAULT_VIEW_KEY = "abtOvertimePlannerDefaultView"
const DAY_VISIBILITY_FILTER_KEY = "abtOvertimePlannerDayVisibilityFilter"
const SEARCH_SCOPE_FILTER_KEY = "abtOvertimePlannerSearchScopeFilter"
const SEARCH_SOURCE_FILTER_KEY = "abtOvertimePlannerSearchSourceFilter"
const SEARCH_DURATION_FILTER_KEY = "abtOvertimePlannerSearchDurationFilter"
const FULL_SEARCH_FIELD_FILTER_KEY = "abtOvertimePlannerFullSearchFieldFilter"
const AGENDA_SOURCE_FILTER_KEY = "abtOvertimePlannerAgendaSourceFilter"
const AGENDA_DURATION_FILTER_KEY = "abtOvertimePlannerAgendaDurationFilter"
const AGENDA_SEARCH_FIELD_FILTER_KEY = "abtOvertimePlannerAgendaSearchFieldFilter"
const TIMELINE_ZOOM_MIN = 0.75
const TIMELINE_ZOOM_MAX = 1.5
const TIMELINE_ZOOM_STEP = 0.125
const MOBILE_LAYOUT_QUERY = "(max-width: 760px)"
const TABLET_LAYOUT_QUERY = "(min-width: 761px) and (max-width: 1366px)"
const DESKTOP_LAYOUT_QUERY = "(min-width: 1367px)"
const TOUCH_CAPABLE_QUERY = "(any-pointer: coarse), (pointer: coarse)"
const PROJECT_FILE_VERSION = 1
const PROJECT_FILE_TYPE = "abt-overtime-planner"
const PROJECT_FILENAME_KEY = "abtOvertimePlannerProjectName"
const ABT_IMPORT_PATTERNS = [
    /\bABT\b/i,
    /(^|[^A-Z0-9])A\s*\.?\s*B\s*\.?\s*T\.?([^A-Z0-9]|$)/i,
    /\bAmerican Ballet Theat(?:re|er)\b/i,
    /\bVariations?\b/i,
    /\bVariation\s+\d+\b/i,
    /\bPas\s+de\s+Deux\b/i,
    /\bPDD\b/i,
    /\bCoda\b/i,
    /\bSwan\s+Lake\b/i,
    /\bGiselle\b/i,
    /\bDon\s+Quixote\b/i,
    /\bSleeping\s+Beauty\b/i,
    /\bNutcracker\b/i,
    /\bRomeo\s+(?:and|&)\s+Juliet\b/i,
    /\bLa\s+Bayad[eè]re\b/i,
    /\bLe\s+Corsaire\b/i,
    /\bRaymonda\b/i,
    /\bCopp[eé]lia\b/i,
    /\bPaquita\b/i,
    /\bEsmeralda\b/i,
    /\bDiana\s+(?:and|&)\s+Actaeon\b/i,
    /\bHarlequinade\b/i,
    /\bFlames\s+of\s+Paris\b/i,
    /\bTalisman\b/i,
    /\bSylvia\b/i,
    /\bCinderella\b/i,
    /\bManon\b/i,
    /\bMayerling\b/i,
    /\bOnegin\b/i,
    /\bEtudes\b/i,
    /\bBallet\s+Imperial\b/i,
    /\bSerenade\b/i,
    /\bJewels\b/i,
    /\bApollo\b/i,
    /\bLa\s+Sylphide\b/i,
    /\bLa\s+Fille\s+mal\s+gard[eé]e\b/i,
    /\bThe\s+Dream\b/i
]
const DAY_ORDER = ["mon","tue","wed","thu","fri","sat","sun"]
const TOOLBAR_DEFAULTS = [
    {key:"file", label:"File", visible:true},
    {key:"edit", label:"Edit", visible:true},
    {key:"calendar", label:"Calendar", visible:true},
    {key:"view", label:"View", visible:true},
    {key:"tools", label:"Tools", visible:true}
]
const DAY_LABELS = {
    mon:"Mon",
    tue:"Tue",
    wed:"Wed",
    thu:"Thu",
    fri:"Fri",
    sat:"Sat",
    sun:"Sun"
}
const TIMELINE_VIEWS = ["week","workweek","three-day","day"]
const PLANNER_VIEWS = [...TIMELINE_VIEWS,"month"]

let weekData = {mon:[],tue:[],wed:[],thu:[],fri:[],sat:[],sun:[]}
let currentDay = "mon"
let draggedBlock = null
let selectedBlock = null
let selectedBlocks = new Set()
let selectionBox = null
let suppressTimelineClick = false
let blockClipboard = null
let plannerView = "week"
let monthEvents = {}
let monthAnchorDate = new Date()
let selectedWeekStartKey = null
let importSummaryText = ""
let importedEventCount = 0
let skippedNonAbtCount = 0
let isRestoringState = false
let isInitializingState = true
let undoStack = []
let redoStack = []
let editingBlock = null
let customImportKeywords = []
let customImportPatterns = []
let lastTimelinePointerType = "mouse"
let touchTimelineStart = null
let suppressNextTouchTimelineClick = false
let penTimelineTap = null
let cachedTimelineHeight = null
let resizeUpdateTimer = null
let orientationSettleTimer = null
let viewportUpdateTimer = null
let lastViewportWidth = null
let lastViewportHeight = null
window.modeBadgeVisible = false
let projectFileHandle = null
let currentProjectName = "abt-overtime-planner.abt-planner.json"
let pendingCloudImportProvider = ""
let selectedMonthEvents = new Set()
let autosaveEnabled = true
let toolbarSettings = cloneToolbarDefaults()
let themeMode = "dark"
let timelineZoom = 1
let timelineLayoutMode = "fit"
let defaultPlannerView = "week"
let dayVisibilityFilter = "all"
let searchScopeFilter = "all"
let searchSourceFilter = "all"
let searchDurationFilter = "all"
let fullSearchFieldFilter = "all"
let agendaSourceFilter = "all"
let agendaDurationFilter = "all"
let agendaSearchFieldFilter = "all"
let exportOtRangeStartKey = ""
let exportOtRangeEndKey = ""
let overtimeInspectorDateOverrideKey = ""
let toastTimer = null

//--------------------------------
// BUILD TIMELINE
//--------------------------------
function buildTimeline(){
    timeline.innerHTML=""
    cachedTimelineHeight = null
    let visibleDays = visibleTimelineDays()
    document.body.dataset.timelineDays = String(visibleDays.length)
    let header=document.createElement("div")
    header.className="week-grid-header"

    let gutterHead=document.createElement("div")
    gutterHead.className="time-gutter-heading"
    header.appendChild(gutterHead)

    let weekStart = selectedWeekStartKey ? parseDateKey(selectedWeekStartKey) : null
    visibleDays.forEach((day,i)=>{
        let btn=document.createElement("button")
        btn.type="button"
        btn.className="day-heading"
        btn.dataset.day=day
        let dayIndex = DAY_ORDER.indexOf(day)
        let dateNum = weekStart ? addDays(weekStart,dayIndex).getDate() : ""
        btn.innerHTML=`<span>${DAY_LABELS[day]}${dateNum !== "" ? " <em>"+dateNum+"</em>" : ""}</span><strong id="${day}-total">$0</strong>`
        btn.onclick=()=>{
            if(draggedBlock) return
            if(plannerView === "three-day" || plannerView === "day"){
                saveAllDays({persist:false})
                currentDay=day
                buildTimeline()
                applyTimelineZoom({render:false})
                renderWeek()
            }else{
                currentDay=day
            }
            updateActiveDay()
            update()
        }
        header.appendChild(btn)
    })

    let body=document.createElement("div")
    body.className="week-grid-body"

    let ruler=document.createElement("div")
    ruler.id="timeRuler"

    let columns=document.createElement("div")
    columns.id="dayColumns"

    visibleDays.forEach(day=>{
        let col=document.createElement("div")
        col.className="day-column"
        col.dataset.day=day
        columns.appendChild(col)
    })

    body.appendChild(ruler)
    body.appendChild(columns)
    timeline.appendChild(header)
    timeline.appendChild(body)

    // Draw a line at every SNAP step (5 min). Hours and quarter-hours are
    // labelled; the in-between 5-minute lines render as faint "minor" ticks so
    // the grid reads at 5-minute resolution without label clutter.
    let stepMinutes = Math.max(1, Math.round(SNAP * 60))
    let totalSteps = Math.round((HOURS * 60) / stepMinutes)

    for(let i=0;i<=totalSteps;i++){
        let totalMinutes = i * stepMinutes
        let hourOffset = totalMinutes / 60
        let hour = START_HOUR + Math.floor(totalMinutes / 60)
        let minute = totalMinutes % 60
        let isHour = minute === 0
        let isQuarter = minute % 15 === 0
        let tier = isHour ? "hour" : (isQuarter ? "quarter" : "minor")

        let line=document.createElement("div")
        line.className="time-line "+tier
        line.style.top=(hourOffset/HOURS*100)+"%"
        if(isHour || isQuarter) line.innerText=formatTime(hour + (minute / 60))
        ruler.appendChild(line)

        let gridLine=document.createElement("div")
        gridLine.className="grid-line "+tier
        gridLine.style.top=(hourOffset/HOURS*100)+"%"
        columns.appendChild(gridLine)
    }
}

//--------------------------------
// SNAP
//--------------------------------
function snapHours(h){
    return Math.round(h/SNAP)*SNAP
}

function hoursToPixels(hours){
    return (hours/HOURS)*timelineHeight()
}

function pixelsToSnappedHours(pixels){
    return snapHours((pixels/timelineHeight())*HOURS)
}

function clampTimelineZoom(value){
    return Math.min(Math.max(Number(value) || 1,TIMELINE_ZOOM_MIN),TIMELINE_ZOOM_MAX)
}

function isMobileLayout(){
    return window.matchMedia(MOBILE_LAYOUT_QUERY).matches
}

function isPhoneLayout(){
    if(window.matchMedia("(max-width: 760px)").matches) return true
    // Landscape phone: width > 760 but short dimension is still phone-sized
    let minDim = Math.min(window.innerWidth, window.innerHeight)
    return minDim <= 550 && !(typeof window.isIpadDevice === "function" && window.isIpadDevice())
}

function isTabletLayout(){
    return window.matchMedia(TABLET_LAYOUT_QUERY).matches
}

function isDesktopLayout(){
    return window.matchMedia(DESKTOP_LAYOUT_QUERY).matches
}

function isTouchCapable(){
    return window.matchMedia(TOUCH_CAPABLE_QUERY).matches || navigator.maxTouchPoints > 0
}

function isDesktopTouchLayout(){
    return isDesktopLayout() && isTouchCapable()
}

function timelineBaseHeight(){
    return isMobileLayout() ? 1180 : 1300
}

function normalizePlannerView(view){
    if(view === "3day") return "three-day"
    if(view === "dayfocus") return "day"
    return PLANNER_VIEWS.includes(view) ? view : "week"
}

function mobileFriendlyView(view){
    view = normalizePlannerView(view)
    if(!isPhoneLayout()) return view
    if(view === "week" || view === "workweek") return "three-day"
    return view
}

function currentDayIndex(){
    return Math.max(0,DAY_ORDER.indexOf(currentDay))
}

function visibleTimelineDays(view=plannerView){
    view = normalizePlannerView(view)
    if(view === "workweek") return DAY_ORDER.slice(0,6)
    if(view === "three-day"){
        let start = Math.min(currentDayIndex(),DAY_ORDER.length - 3)
        return DAY_ORDER.slice(start,start + 3)
    }
    if(view === "day") return [DAY_ORDER[currentDayIndex()]]
    return DAY_ORDER
}

function normalizeDayVisibilityFilter(value){
    return value === "overtime" ? "overtime" : "all"
}

function normalizeSearchScopeFilter(value){
    return ["all","week","month"].includes(value) ? value : "all"
}

function normalizeSourceFilter(value){
    return ["all","planner","imported"].includes(value) ? value : "all"
}

function normalizeDurationFilter(value){
    return ["all","short","standard","long"].includes(value) ? value : "all"
}

function normalizeFullSearchFieldFilter(value){
    return ["all","title","location","notes","time","date","source"].includes(value) ? value : "all"
}

function normalizeAgendaSearchFieldFilter(value){
    return ["all","title","location","notes","time","date"].includes(value) ? value : "all"
}

function overtimeBaseConfigFromSource(source){
    let base = source?.base || source || {}
    return {
        dailyRegularHours:Number(base.daily_regular_hours ?? DAILY_REGULAR_HOURS),
        dailyNoOvertimeLimit:Number(base.daily_no_overtime_limit ?? DAILY_NO_OVERTIME_LIMIT),
        dailyTierOtEnd:Number(base.daily_tier_ot_end ?? DAILY_TIER_OT_END),
        otRate:Number(base.ot_rate ?? OT_RATE),
        doubleOtRate:Number(base.double_ot_rate ?? DOUBLE_OT_RATE),
        continuousResetBreakHours:Number(base.continuous_reset_break_hours ?? CONTINUOUS_RESET_BREAK_HOURS),
        dailyResetBreakHours:Number(base.daily_reset_break_hours ?? DAILY_RESET_BREAK_HOURS)
    }
}

function continuousSpanExtraRegularAllowance(previousDuration,gap,duration,exceptions=CONTINUOUS_SPAN_EXCEPTIONS){
    let match = (exceptions || []).find(rule=>
        Math.abs(Number(rule.previous_duration || 0) - previousDuration) < 0.0001 &&
        Math.abs(Number(rule.gap || 0) - gap) < 0.0001 &&
        Math.abs(Number(rule.duration || 0) - duration) < 0.0001
    )
    return Number(match?.extra_regular_allowance || 0)
}

function calculateOvertimeSummaryWithConfig(schedule,ruleConfig={}){
    let blocks = (schedule || [])
        .map(block=>({
            start:Number(block.start) || 0,
            duration:Number(block.duration ?? block.dur) || 0
        }))
        .filter(block=>block.duration > 0)
        .sort((a,b)=>a.start - b.start)

    let base = overtimeBaseConfigFromSource(ruleConfig.base)
    let exceptions = Array.isArray(ruleConfig.continuous_span_exceptions) ? ruleConfig.continuous_span_exceptions : CONTINUOUS_SPAN_EXCEPTIONS
    let totalWorkedHours = blocks.reduce((total,block)=>total + block.duration,0)
    if(totalWorkedHours <= base.dailyNoOvertimeLimit + 0.0001){
        return {type:"SAFE", hours:0, rate:0, pay:0}
    }

    let continuousHours = 0
    let dailyHours = 0
    let lastEnd = null
    let continuousOtHours = 0
    let dailyOt65 = 0
    let doubleOt90 = 0
    let previousDuration = 0

    blocks.forEach(block=>{
        let start = block.start
        let duration = block.duration
        let end = start + duration

        let extraRegularAllowance = 0

        if(lastEnd !== null){
            let gap = start - lastEnd
            // Breaks under 1 hour stay in the same continuous OT span.
            // Example: 1 + 0.5 + 0.5 + 0.5 + 0.5 + 1 + 1 = 5h total, so 2h OT.
            // Explicit exceptions are stored in static/overtime-rules.json.
            extraRegularAllowance = continuousSpanExtraRegularAllowance(previousDuration,gap,duration,exceptions)
            if(gap >= base.continuousResetBreakHours) continuousHours = 0
            if(gap >= base.dailyResetBreakHours) dailyHours = 0
        }

        let continuousBefore = continuousHours
        let continuousAfter = continuousHours + duration
        if(continuousAfter > base.dailyRegularHours){
            continuousOtHours += Math.max(
                (continuousAfter - Math.max(continuousBefore,base.dailyRegularHours)) - extraRegularAllowance,
                0
            )
        }

        continuousHours = continuousAfter

        let dailyBefore = dailyHours
        let dailyAfter = dailyHours + duration
        dailyOt65 += Math.max(0,Math.min(dailyAfter,base.dailyTierOtEnd) - Math.max(dailyBefore,base.dailyNoOvertimeLimit))
        doubleOt90 += Math.max(0,dailyAfter - Math.max(dailyBefore,base.dailyTierOtEnd))
        dailyHours = dailyAfter
        lastEnd = end
        previousDuration = duration
    })

    let baseOt65 = Math.max(continuousOtHours,dailyOt65)
    let pay = (baseOt65 * base.otRate) + (doubleOt90 * base.doubleOtRate)

    if(doubleOt90 > 0) return {type:"DOUBLE OT", hours:doubleOt90, rate:base.doubleOtRate, pay:Math.round(pay * 100) / 100}
    if(baseOt65 > 0) return {type:"OVERTIME", hours:baseOt65, rate:base.otRate, pay:Math.round(pay * 100) / 100}
    return {type:"SAFE", hours:0, rate:0, pay:0}
}

function calculateOvertimeSummary(schedule){
    return calculateOvertimeSummaryWithConfig(schedule,{
        base:OVERTIME_BASE,
        continuous_span_exceptions:CONTINUOUS_SPAN_EXCEPTIONS
    })
}

function hasOvertimeForDay(day){
    let schedule = getSchedule(day)
    if(!schedule.length) schedule = storedSchedule(day)
    return calculateOvertimeSummary(schedule).pay > 0
}

function hasOvertimeForDateKey(eventDateKey){
    return calculateOvertimeSummary(monthDayItems(eventDateKey)).pay > 0
}

function blockMatchesDayVisibilityFilter(block){
    if(dayVisibilityFilter !== "overtime" || !block) return true
    if(block.dateKey) return hasOvertimeForDateKey(block.dateKey)
    return hasOvertimeForDay(block.day)
}

function updateDayVisibilityFilterControl(){
    ;["overtimeDayFilter","agendaOvertimeFilter"].forEach(id=>{
        let input = document.getElementById(id)
        if(input) input.value = dayVisibilityFilter
    })
    syncAgendaFilterMenu("overtime")
}

function updateSearchScopeFilterControl(){
    let input = document.getElementById("searchScopeFilter")
    if(input) input.value = searchScopeFilter
}

function updateSearchSourceFilterControl(){
    let input = document.getElementById("searchSourceFilter")
    if(input) input.value = searchSourceFilter
}

function updateSearchDurationFilterControl(){
    let input = document.getElementById("searchDurationFilter")
    if(input) input.value = searchDurationFilter
}

function updateFullSearchFieldFilterControl(){
    let input = document.getElementById("fullSearchFieldFilter")
    if(input) input.value = fullSearchFieldFilter
}

function updateAgendaSourceFilterControl(){
    let input = document.getElementById("agendaSourceFilter")
    if(input) input.value = agendaSourceFilter
    syncAgendaFilterMenu("source")
}

function updateAgendaDurationFilterControl(){
    let input = document.getElementById("agendaDurationFilter")
    if(input) input.value = agendaDurationFilter
    syncAgendaFilterMenu("duration")
}

function updateAgendaSearchFieldFilterControl(){
    let input = document.getElementById("agendaSearchFieldFilter")
    if(input) input.value = agendaSearchFieldFilter
    syncAgendaFilterMenu("field")
}

function agendaFilterConfig(filter){
    return {
        overtime:{selectId:"agendaOvertimeFilter", buttonId:"agendaOvertimeFilterButton", menuId:"agendaOvertimeFilterMenu", onSelect:setDayVisibilityFilter},
        source:{selectId:"agendaSourceFilter", buttonId:"agendaSourceFilterButton", menuId:"agendaSourceFilterMenu", onSelect:setAgendaSourceFilter},
        field:{selectId:"agendaSearchFieldFilter", buttonId:"agendaSearchFieldFilterButton", menuId:"agendaSearchFieldFilterMenu", onSelect:setAgendaSearchFieldFilter},
        duration:{selectId:"agendaDurationFilter", buttonId:"agendaDurationFilterButton", menuId:"agendaDurationFilterMenu", onSelect:setAgendaDurationFilter}
    }[filter] || null
}

function closeAgendaFilterMenus(except=""){
    document.querySelectorAll(".agenda-filter-popup").forEach(popup=>{
        let active = popup.dataset.agendaFilter === except
        popup.classList.toggle("is-open",active)
        let trigger = popup.querySelector(".agenda-filter-trigger")
        if(trigger) trigger.setAttribute("aria-expanded",String(active))
    })
}

function toggleAgendaFilterMenu(filter){
    let config = agendaFilterConfig(filter)
    if(!config) return
    let popup = document.querySelector(`.agenda-filter-popup[data-agenda-filter="${filter}"]`)
    if(!popup) return
    let isOpen = popup.classList.contains("is-open")
    closeAgendaFilterMenus(isOpen ? "" : filter)
}

function selectAgendaFilterValue(filter,value){
    let config = agendaFilterConfig(filter)
    if(!config) return
    config.onSelect(value)
    closeAgendaFilterMenus()
}

function syncAgendaFilterMenu(filter){
    let config = agendaFilterConfig(filter)
    if(!config) return
    let select = document.getElementById(config.selectId)
    let button = document.getElementById(config.buttonId)
    let menu = document.getElementById(config.menuId)
    if(!select || !button || !menu) return

    let option = Array.from(select.options).find(item=>item.value === select.value) || select.options[0]
    button.textContent = option?.textContent || ""
    button.setAttribute("data-value",select.value)

    menu.querySelectorAll(".agenda-filter-option").forEach(item=>{
        let active = item.dataset.value === select.value
        item.classList.toggle("is-selected",active)
        item.setAttribute("aria-pressed",String(active))
    })
}

function initAgendaFilterMenus(){
    ;["overtime","source","field","duration"].forEach(syncAgendaFilterMenu)
    document.addEventListener("pointerdown",event=>{
        if(event.target.closest(".agenda-filter-popup")) return
        closeAgendaFilterMenus()
    })
    document.addEventListener("keydown",event=>{
        if(event.key === "Escape") closeAgendaFilterMenus()
    })
}

function applyOvertimeFilterToTimeline(){
    if(plannerView === "month") return

    let filterEnabled = dayVisibilityFilter === "overtime" && TIMELINE_VIEWS.includes(plannerView)
    let activeDays = visibleTimelineDays().filter(day=>!filterEnabled || hasOvertimeForDay(day))
    let header = document.querySelector(".week-grid-header")
    let body = document.querySelector(".week-grid-body")
    let columns = document.getElementById("dayColumns")
    let container = document.getElementById("timeline-container")

    document.querySelectorAll(".day-heading").forEach(node=>{
        let visible = activeDays.includes(node.dataset.day)
        node.hidden = !visible
        if(visible) node.style.removeProperty("display")
        else node.style.display = "none"
    })
    document.querySelectorAll(".day-column").forEach(node=>{
        let visible = activeDays.includes(node.dataset.day)
        node.hidden = !visible
        if(visible) node.style.removeProperty("display")
        else node.style.display = "none"
    })

    if(header) header.style.gridTemplateColumns = activeDays.length ? `72px repeat(${activeDays.length}, minmax(112px, 1fr))` : "72px"
    if(body) body.style.gridTemplateColumns = activeDays.length ? `72px minmax(${activeDays.length * 112}px, 1fr)` : "72px 0px"
    if(columns){
        columns.style.gridTemplateColumns = activeDays.length ? `repeat(${activeDays.length}, minmax(112px, 1fr))` : "0px"
        columns.style.width = activeDays.length ? "" : "0px"
    }
    if(container) container.classList.toggle("is-empty-overtime",filterEnabled && activeDays.length === 0)
}

function applyOvertimeFilterToMonth(){
    let grid = document.getElementById("monthGrid")
    if(!grid) return

    let filterEnabled = dayVisibilityFilter === "overtime" && plannerView === "month"
    let visibleCount = 0

    document.querySelectorAll(".month-day").forEach(node=>{
        let keep = !filterEnabled || hasOvertimeForDateKey(node.dataset.dateKey)
        node.classList.toggle("is-filtered-out",!keep)
        if(keep) visibleCount++
    })

    grid.classList.toggle("is-filtering-overtime",filterEnabled)
    grid.classList.toggle("is-empty-overtime",filterEnabled && visibleCount === 0)
}

function applyOvertimeFilterToViews(){
    updateDayVisibilityFilterControl()
    updateSearchScopeFilterControl()
    updateSearchSourceFilterControl()
    updateSearchDurationFilterControl()
    updateFullSearchFieldFilterControl()
    updateAgendaSourceFilterControl()
    updateAgendaDurationFilterControl()
    updateAgendaSearchFieldFilterControl()
    applyOvertimeFilterToTimeline()
    applyOvertimeFilterToMonth()
    updateOutlookPanels({forceAgenda:true})
    if(!document.getElementById("fullSearchBackdrop")?.classList.contains("is-hidden")){
        renderFullSearchResults()
    }
}

function setDayVisibilityFilter(value){
    let next = normalizeDayVisibilityFilter(value)
    let changed = next !== dayVisibilityFilter
    dayVisibilityFilter = next
    try{
        localStorage.setItem(DAY_VISIBILITY_FILTER_KEY,dayVisibilityFilter)
    }catch(error){
        console.warn("Day visibility filter could not be saved.",error)
    }
    applyOvertimeFilterToViews()
    if(changed) showAppToast(dayVisibilityFilter === "overtime" ? "Showing overtime days only" : "Showing all days")
}

function loadDayVisibilityFilter(){
    try{
        dayVisibilityFilter = normalizeDayVisibilityFilter(localStorage.getItem(DAY_VISIBILITY_FILTER_KEY))
    }catch(error){
        dayVisibilityFilter = "all"
    }
    updateDayVisibilityFilterControl()
}

function setSearchScopeFilter(value){
    searchScopeFilter = normalizeSearchScopeFilter(value)
    try{
        localStorage.setItem(SEARCH_SCOPE_FILTER_KEY,searchScopeFilter)
    }catch(error){
        console.warn("Search scope filter could not be saved.",error)
    }
    updateSearchScopeFilterControl()
    renderFullSearchResults()
}

function loadSearchScopeFilter(){
    try{
        searchScopeFilter = normalizeSearchScopeFilter(localStorage.getItem(SEARCH_SCOPE_FILTER_KEY))
    }catch(error){
        searchScopeFilter = "all"
    }
    updateSearchScopeFilterControl()
}

function setSearchSourceFilter(value){
    searchSourceFilter = normalizeSourceFilter(value)
    try{
        localStorage.setItem(SEARCH_SOURCE_FILTER_KEY,searchSourceFilter)
    }catch(error){
        console.warn("Search source filter could not be saved.",error)
    }
    updateSearchSourceFilterControl()
    renderFullSearchResults()
}

function loadSearchSourceFilter(){
    try{
        searchSourceFilter = normalizeSourceFilter(localStorage.getItem(SEARCH_SOURCE_FILTER_KEY))
    }catch(error){
        searchSourceFilter = "all"
    }
    updateSearchSourceFilterControl()
}

function setSearchDurationFilter(value){
    searchDurationFilter = normalizeDurationFilter(value)
    try{
        localStorage.setItem(SEARCH_DURATION_FILTER_KEY,searchDurationFilter)
    }catch(error){
        console.warn("Search duration filter could not be saved.",error)
    }
    updateSearchDurationFilterControl()
    renderFullSearchResults()
}

function loadSearchDurationFilter(){
    try{
        searchDurationFilter = normalizeDurationFilter(localStorage.getItem(SEARCH_DURATION_FILTER_KEY))
    }catch(error){
        searchDurationFilter = "all"
    }
    updateSearchDurationFilterControl()
}

function setFullSearchFieldFilter(value){
    fullSearchFieldFilter = normalizeFullSearchFieldFilter(value)
    try{
        localStorage.setItem(FULL_SEARCH_FIELD_FILTER_KEY,fullSearchFieldFilter)
    }catch(error){
        console.warn("Full search field filter could not be saved.",error)
    }
    updateFullSearchFieldFilterControl()
    renderFullSearchResults()
}

function loadFullSearchFieldFilter(){
    try{
        fullSearchFieldFilter = normalizeFullSearchFieldFilter(localStorage.getItem(FULL_SEARCH_FIELD_FILTER_KEY))
    }catch(error){
        fullSearchFieldFilter = "all"
    }
    updateFullSearchFieldFilterControl()
}

function setAgendaSourceFilter(value){
    agendaSourceFilter = normalizeSourceFilter(value)
    try{
        localStorage.setItem(AGENDA_SOURCE_FILTER_KEY,agendaSourceFilter)
    }catch(error){
        console.warn("Agenda source filter could not be saved.",error)
    }
    updateAgendaSourceFilterControl()
    updateOutlookPanels({forceAgenda:true})
}

function loadAgendaSourceFilter(){
    try{
        agendaSourceFilter = normalizeSourceFilter(localStorage.getItem(AGENDA_SOURCE_FILTER_KEY))
    }catch(error){
        agendaSourceFilter = "all"
    }
    updateAgendaSourceFilterControl()
}

function setAgendaDurationFilter(value){
    agendaDurationFilter = normalizeDurationFilter(value)
    try{
        localStorage.setItem(AGENDA_DURATION_FILTER_KEY,agendaDurationFilter)
    }catch(error){
        console.warn("Agenda duration filter could not be saved.",error)
    }
    updateAgendaDurationFilterControl()
    updateOutlookPanels({forceAgenda:true})
}

function loadAgendaDurationFilter(){
    try{
        agendaDurationFilter = normalizeDurationFilter(localStorage.getItem(AGENDA_DURATION_FILTER_KEY))
    }catch(error){
        agendaDurationFilter = "all"
    }
    updateAgendaDurationFilterControl()
}

function setAgendaSearchFieldFilter(value){
    agendaSearchFieldFilter = normalizeAgendaSearchFieldFilter(value)
    try{
        localStorage.setItem(AGENDA_SEARCH_FIELD_FILTER_KEY,agendaSearchFieldFilter)
    }catch(error){
        console.warn("Agenda search field filter could not be saved.",error)
    }
    updateAgendaSearchFieldFilterControl()
    updateOutlookPanels({forceAgenda:true})
}

function loadAgendaSearchFieldFilter(){
    try{
        agendaSearchFieldFilter = normalizeAgendaSearchFieldFilter(localStorage.getItem(AGENDA_SEARCH_FIELD_FILTER_KEY))
    }catch(error){
        agendaSearchFieldFilter = "all"
    }
    updateAgendaSearchFieldFilterControl()
}

function plannerViewLabel(view=plannerView){
    view = normalizePlannerView(view)
    if(view === "workweek") return "Work Week"
    if(view === "three-day") return "3 Day"
    if(view === "day") return "Day Focus"
    if(view === "month") return "Month"
    return "Week"
}

function normalizeViewLabel(label){
    let key = String(label || "").trim().toLowerCase().replace(/\s+/g,"")
    if(key === "3day") return "three-day"
    if(key === "day" || key === "dayfocus") return "day"
    return key
}

function agendaRangeLabelForView(weekLabel){
    if(plannerView === "month") return monthName(monthAnchorDate)
    if(plannerView === "workweek") return weekLabel+" - Mon-Sat"
    if(plannerView === "three-day"){
        let days = visibleTimelineDays()
        return weekLabel+" - "+DAY_LABELS[days[0]]+"-"+DAY_LABELS[days[days.length - 1]]
    }
    if(plannerView === "day") return weekLabel+" - "+DAY_LABELS[currentDay]
    return weekLabel
}

function timelineZoomPercent(){
    return Math.round(timelineZoom * 100)
}

function updateTimelineZoomControls(){
    let status = document.getElementById("zoomStatus")
    if(status) status.textContent = timelineZoomPercent()+"%"
    let settingsZoom = document.getElementById("settingsZoomLabel")
    if(settingsZoom) settingsZoom.textContent = timelineZoomPercent()+"%"
    document.getElementById("zoomMenuButton")?.querySelector?.(".button-label")?.replaceChildren(document.createTextNode("Zoom "+timelineZoomPercent()+"%"))
    document.getElementById("zoomInButton")?.toggleAttribute("disabled",timelineZoom >= TIMELINE_ZOOM_MAX - 0.001)
    document.getElementById("zoomOutButton")?.toggleAttribute("disabled",timelineZoom <= TIMELINE_ZOOM_MIN + 0.001)
    document.getElementById("resetZoomButton")?.classList.toggle("active-view",Math.abs(timelineZoom - 1) < 0.001)
}

function applyTimelineZoom(options={}){
    timelineZoom = clampTimelineZoom(timelineZoom)
    let height = Math.round(timelineBaseHeight() * timelineZoom)
    document.documentElement.style.setProperty("--timeline-zoom",String(timelineZoom))
    document.documentElement.style.setProperty("--timeline-height",height+"px")
    ;[document.getElementById("timeRuler"),document.getElementById("dayColumns")].forEach(node=>{
        if(node) node.style.height = height+"px"
    })
    cachedTimelineHeight = null
    updateTimelineZoomControls()
    if(options.render !== false){
        renderWeek()
        update({persist:false})
    }
}

function saveTimelineZoom(){
    try{
        localStorage.setItem(TIMELINE_ZOOM_KEY,String(timelineZoom))
    }catch(error){
        console.warn("Timeline zoom could not be saved.",error)
    }
}

function setTimelineZoom(value){
    let previous = timelineZoom
    timelineZoom = clampTimelineZoom(value)
    applyTimelineZoom()
    if(Math.abs(previous - timelineZoom) > 0.001){
        saveTimelineZoom()
        showAppToast("Timeline zoom "+timelineZoomPercent()+"%")
    }
}

function zoomInTimeline(){
    setTimelineZoom(timelineZoom + TIMELINE_ZOOM_STEP)
}

function zoomOutTimeline(){
    setTimelineZoom(timelineZoom - TIMELINE_ZOOM_STEP)
}

function resetTimelineZoom(){
    setTimelineZoom(1)
}

function loadTimelineZoom(){
    try{
        timelineZoom = clampTimelineZoom(localStorage.getItem(TIMELINE_ZOOM_KEY) || 1)
    }catch(error){
        timelineZoom = 1
    }
}

function applyTimelineLayoutMode(){
    timelineLayoutMode = timelineLayoutMode === "comfort" ? "comfort" : "fit"
    document.body.classList.toggle("timeline-comfort-scroll",timelineLayoutMode === "comfort")
    document.getElementById("settingsFitButton")?.classList.toggle("active-view",timelineLayoutMode === "fit")
    document.getElementById("settingsComfortButton")?.classList.toggle("active-view",timelineLayoutMode === "comfort")
    document.getElementById("timelineFitButton")?.classList.toggle("active-view",timelineLayoutMode === "fit")
    document.getElementById("timelineComfortButton")?.classList.toggle("active-view",timelineLayoutMode === "comfort")
}

function setTimelineLayoutMode(mode){
    let previous = timelineLayoutMode
    timelineLayoutMode = mode === "comfort" ? "comfort" : "fit"
    applyTimelineLayoutMode()
    try{
        localStorage.setItem(TIMELINE_LAYOUT_MODE_KEY,timelineLayoutMode)
    }catch(error){
        console.warn("Timeline layout mode could not be saved.",error)
    }
    if(previous !== timelineLayoutMode) showAppToast(timelineLayoutMode === "comfort" ? "Comfort scroll enabled" : "Fit 7 days enabled")
}

function loadTimelineLayoutMode(){
    try{
        timelineLayoutMode = localStorage.getItem(TIMELINE_LAYOUT_MODE_KEY) === "comfort" ? "comfort" : "fit"
    }catch(error){
        timelineLayoutMode = "fit"
    }
    applyTimelineLayoutMode()
}

function timelineHeight(){
    if(cachedTimelineHeight === null){
        cachedTimelineHeight = document.querySelector(".day-column")?.offsetHeight || 1300
    }

    return cachedTimelineHeight
}

function getDayColumn(day){
    return document.querySelector(`.day-column[data-day="${day}"]`)
}

function getDayColumnAtPoint(x,y){
    let directHit = document.elementFromPoint(x,y)?.closest(".day-column")
    if(directHit) return directHit

    return [...document.querySelectorAll(".day-column")].find(column=>{
        let rect = column.getBoundingClientRect()
        return x>=rect.left && x<=rect.right && y>=rect.top && y<=rect.bottom
    }) || null
}

function setBlockPosition(el,y){
    el.dataset.y=y
    el.dataset.start=String(START_HOUR + pixelsToSnappedHours(y))
    el.style.transform=`translateY(${y}px)`
}

function setBlockHeight(el,h){
    el.dataset.dur=String(pixelsToSnappedHours(h))
    el.style.height=h+"px"
}

function getBlockData(el){
    let start = parseFloat(el.dataset.start)
    let dur = parseFloat(el.dataset.dur)

    return {
        y: Number.isFinite(start) ? hoursToPixels(start - START_HOUR) : (parseFloat(el.dataset.y) || 0),
        h: Number.isFinite(dur) ? hoursToPixels(dur) : el.offsetHeight,
        start: Number.isFinite(start) ? start : undefined,
        dur: Number.isFinite(dur) ? dur : undefined,
        day: el.dataset.day || currentDay,
        title: el.dataset.title || "Block",
        location: el.dataset.location || "",
        description: el.dataset.description || ""
    }
}

function getSelectedBlocks(){
    return [...selectedBlocks].filter(el => el.isConnected)
}

function clearSelection(){
    selectedBlocks.forEach(el=>el.classList.remove("selected"))
    selectedBlocks.clear()
    document.querySelectorAll(".month-event.selected").forEach(el=>el.classList.remove("selected"))
    selectedMonthEvents.clear()
    selectedBlock = null
    updateSelectionStatus()
}

function selectBlock(el,mode="replace"){
    if(!el){
        clearSelection()
        return
    }

    if(mode==="toggle"){
        if(selectedBlocks.has(el)){
            selectedBlocks.delete(el)
            el.classList.remove("selected")
            selectedBlock = getSelectedBlocks().at(-1) || null
            updateSelectionStatus()
            return
        }
    }else if(mode!=="add"){
        clearSelection()
    }else{
        clearMonthSelection()
    }

    selectedBlocks.add(el)
    selectedBlock = el
    selectedBlock.classList.add("selected")
    updateSelectionStatus()
}

function monthSelectionKey(dateKeyValue,index){
    return dateKeyValue+"|"+index
}

function clearMonthSelection(){
    document.querySelectorAll(".month-event.selected").forEach(el=>el.classList.remove("selected"))
    selectedMonthEvents.clear()
    updateSelectionStatus()
}

function selectMonthEvent(el,mode="replace"){
    if(!el) return

    let key = monthSelectionKey(el.dataset.dateKey,el.dataset.eventIndex)

    if(mode === "toggle"){
        if(selectedMonthEvents.has(key)){
            selectedMonthEvents.delete(key)
            el.classList.remove("selected")
            updateSelectionStatus()
            return
        }
    }else if(mode !== "add"){
        clearSelection()
    }else{
        selectedBlocks.forEach(block=>block.classList.remove("selected"))
        selectedBlocks.clear()
        selectedBlock = null
    }

    selectedMonthEvents.add(key)
    el.classList.add("selected")
    updateSelectionStatus()
}

function getSelectedMonthEvents(){
    return [...selectedMonthEvents]
        .map(key=>{
            let [eventDateKey,indexValue] = key.split("|")
            let index = Number(indexValue)
            let event = monthDayItems(eventDateKey)?.[index]
            return event ? {dateKey:eventDateKey,index,event} : null
        })
        .filter(Boolean)
}

function getSelectionSummary(){
    let weekCount = getSelectedBlocks().length
    let monthCount = getSelectedMonthEvents().length
    let total = weekCount + monthCount

    if(total === 0) return "No selection"
    if(monthCount && !weekCount) return monthCount+" calendar event"+(monthCount === 1 ? "" : "s")+" selected"
    if(weekCount && !monthCount) return weekCount+" block"+(weekCount === 1 ? "" : "s")+" selected"
    return total+" items selected"
}

function updateSelectionStatus(){
    let status = document.getElementById("selectionStatus")
    if(status) status.textContent = getSelectionSummary()
}

function rectsIntersect(a,b){
    return a.left <= b.right &&
        a.right >= b.left &&
        a.top <= b.bottom &&
        a.bottom >= b.top
}

function updateSelectionFromBox(boxRect,baseSelection,additive){
    clearSelection()

    if(additive){
        baseSelection.forEach(el=>{
            if(el.isConnected) selectBlock(el,"add")
        })
    }

    document.querySelectorAll(".event").forEach(el=>{
        if(rectsIntersect(el.getBoundingClientRect(),boxRect)){
            selectBlock(el,"add")
        }
    })
}

function cloneEventsMap(eventsMap){
    return Object.keys(eventsMap || {}).reduce((copy,key)=>{
        copy[key] = (eventsMap[key] || []).map(event=>({...event}))
        return copy
    },{})
}

function snapshotWeekFromDom(){
    return DAY_ORDER.reduce((snapshot,day)=>{
        snapshot[day] = getSchedule(day).map(block=>({
            start:block.start,
            dur:block.dur,
            title:block.title,
            location:block.location,
            description:block.description
        }))
        return snapshot
    }, emptyWeekData())
}

function snapshotPlannerState(){
    return {
        weekData:snapshotWeekFromDom(),
        monthEvents:cloneEventsMap(monthEvents),
        currentDay,
        selectedWeekStartKey,
        monthAnchorDate:dateKey(monthAnchorDate),
        exportOtRangeStartKey,
        exportOtRangeEndKey,
        importSummaryText,
        importedEventCount,
        skippedNonAbtCount,
        plannerView
    }
}

function pushUndoState(){
    undoStack.push(snapshotPlannerState())
    redoStack = []
    if(undoStack.length > 20) undoStack.shift()
    updateHistoryButtons()
}

function updateHistoryButtons(){
    let canUndo = undoStack.length === 0
    let canRedo = redoStack.length === 0
    let undoButton = document.getElementById("undoButton")
    let redoButton = document.getElementById("redoButton")
    if(undoButton) undoButton.disabled = canUndo
    if(redoButton) redoButton.disabled = canRedo
    document.querySelectorAll('[data-history="undo"]').forEach(button=>{ button.disabled = canUndo })
    document.querySelectorAll('[data-history="redo"]').forEach(button=>{ button.disabled = canRedo })
}

function updateUndoButton(){
    updateHistoryButtons()
}

function restorePlannerSnapshot(state){
    weekData = state.weekData
    monthEvents = state.monthEvents
    currentDay = state.currentDay
    selectedWeekStartKey = state.selectedWeekStartKey
    monthAnchorDate = parseDateKey(state.monthAnchorDate)
    exportOtRangeStartKey = state.exportOtRangeStartKey || exportOtRangeStartKey
    exportOtRangeEndKey = state.exportOtRangeEndKey || exportOtRangeEndKey
    importSummaryText = state.importSummaryText
    importedEventCount = state.importedEventCount
    skippedNonAbtCount = state.skippedNonAbtCount
    plannerView = state.plannerView

    closeBlockEditor()
    loadDay()
    updateActiveDay()
    updateWeekHeader()
    updateImportSummary()
    renderMonthView()
    setPlannerView(plannerView)
    savePlannerState()
    updateHistoryButtons()
}

function undoLastChange(){
    let state = undoStack.pop()
    if(!state){
        alert("Nothing to undo.")
        return
    }

    redoStack.push(snapshotPlannerState())
    if(redoStack.length > 20) redoStack.shift()
    restorePlannerSnapshot(state)
}

function redoLastChange(){
    let state = redoStack.pop()
    if(!state){
        alert("Nothing to redo.")
        return
    }

    undoStack.push(snapshotPlannerState())
    if(undoStack.length > 20) undoStack.shift()
    restorePlannerSnapshot(state)
}

function normalizeImportKeyword(value){
    return String(value || "").trim().replace(/\s+/g," ")
}

function escapeRegExp(value){
    return String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")
}

function rebuildCustomImportPatterns(){
    customImportPatterns = customImportKeywords.map(keyword=>new RegExp(escapeRegExp(keyword),"i"))
}

function getCustomImportKeywordsFromInput(){
    let input = document.getElementById("customImportKeywordsInput")
    if(!input) return []

    let seen = new Set()
    return input.value
        .split(/\n+/)
        .map(normalizeImportKeyword)
        .filter(Boolean)
        .filter(keyword=>{
            let key = keyword.toLowerCase()
            if(seen.has(key)) return false
            seen.add(key)
            return true
        })
}

function isImportRelevantEvent(title, location, description){
    let haystack = [title, location, description].filter(Boolean).join(" ")
    let matchesDefault = ABT_IMPORT_PATTERNS.some(pattern=>pattern.test(haystack))
    let matchesCustom = customImportPatterns.some(pattern=>pattern.test(haystack))

    return matchesDefault || matchesCustom
}

function openImportFilterEditor(){
    let input = document.getElementById("customImportKeywordsInput")
    if(input) input.value = customImportKeywords.join("\n")

    document.getElementById("importFilterBackdrop")?.classList.remove("is-hidden")
    input?.focus()
}

function closeImportFilterEditor(){
    document.getElementById("importFilterBackdrop")?.classList.add("is-hidden")
}

function saveImportFilters(){
    customImportKeywords = getCustomImportKeywordsFromInput()
    rebuildCustomImportPatterns()
    savePlannerState()
    closeImportFilterEditor()
}

function clearImportFilters(){
    let input = document.getElementById("customImportKeywordsInput")
    if(input) input.value = ""
}

//--------------------------------
// CREATE BLOCK
//--------------------------------
function createBlock(y,h,details={}){

    let el=document.createElement("div")
    el.className="event"
    let day = details.day || currentDay
    let start = details.start ?? (START_HOUR + pixelsToSnappedHours(y))
    let dur = details.dur ?? pixelsToSnappedHours(h)

    el.dataset.y=y
    el.dataset.day=day
    el.dataset.start=String(start)
    el.dataset.dur=String(dur)
    el.dataset.title=details.title || "Block"
    el.dataset.location=details.location || ""
    el.dataset.description=details.description || ""
    if(details.gcalId) el.dataset.gcalId=details.gcalId
    el.style.height=h+"px"
    el.style.transform=`translateY(${y}px)`

    ;(getDayColumn(day) || getDayColumn(currentDay)).appendChild(el)

    attachBlockPointerControls(el)
    el.addEventListener("click", e=>{
        e.stopPropagation()
        currentDay = el.dataset.day || currentDay
        updateActiveDay()
        if(el.dataset.skipClickSelect){
            delete el.dataset.skipClickSelect
            update()
            return
        }
        if(e.ctrlKey || e.metaKey) selectBlock(el,"toggle")
        else if(e.shiftKey) selectBlock(el,"add")
        else selectBlock(el)
        update()
    })
    el.addEventListener("dblclick", e=>{
        e.stopPropagation()
        selectBlock(el)
        openBlockEditor(el)
    })

    el.addEventListener("contextmenu", e=>{
        e.preventDefault()
        e.stopPropagation()
        openOvertimeInspectorForDay(day)
    })

    return el
}

// Block quick-menu (long-press on touch)
let quickMenuBlock = null

function showBlockQuickMenu(x, y, block){
    const menu = document.getElementById("blockQuickMenu")
    if(!menu) return
    quickMenuBlock = block
    menu.classList.remove("is-hidden")
    const mw = 210, mh = 80
    let left = Math.min(x - mw / 2, window.innerWidth - mw - 8)
    left = Math.max(8, left)
    let top = y - mh - 18
    if(top < 8) top = y + 18
    menu.style.left = left + "px"
    menu.style.top = top + "px"
    navigator.vibrate?.(14)
}

function hideBlockQuickMenu(){
    const menu = document.getElementById("blockQuickMenu")
    if(menu) menu.classList.add("is-hidden")
    quickMenuBlock = null
}

function blockQuickDelete(){
    if(!quickMenuBlock?.isConnected){ hideBlockQuickMenu(); return }
    pushUndoState()
    quickMenuBlock.remove()
    hideBlockQuickMenu()
    saveDay()
    update()
}

function blockQuickEdit(){
    const block = quickMenuBlock
    hideBlockQuickMenu()
    if(block) openBlockEditor(block)
}

function blockQuickCopy(){
    if(!quickMenuBlock){ hideBlockQuickMenu(); return }
    selectBlock(quickMenuBlock)
    copySelectedBlock()
    hideBlockQuickMenu()
}

function attachBlockPointerControls(el){
    el.addEventListener("pointerdown", e=>{
        if(e.button !== 0) return

        e.preventDefault()
        if(el.setPointerCapture){
            el.setPointerCapture(e.pointerId)
        }
        draggedBlock = el
        currentDay = el.dataset.day || currentDay
        updateActiveDay()

        if(e.ctrlKey || e.metaKey){
            selectBlock(el,"toggle")
        }else if(e.shiftKey){
            selectBlock(el,"add")
        }else if(!selectedBlocks.has(el)){
            selectBlock(el)
        }

        let rect = el.getBoundingClientRect()
        let edgeSize = blockResizeEdgeSize(e)
        let mode = "drag"

        if(e.clientY - rect.top <= edgeSize) mode = "resize-top"
        else if(rect.bottom - e.clientY <= edgeSize) mode = "resize-bottom"

        let startClientX = e.clientX
        let startClientY = e.clientY
        let startY = parseFloat(el.dataset.y) || 0
        let startHeight = el.offsetHeight
        let minHeight = Math.max(40,hoursToPixels(SNAP))
        let undoRecorded = false
        let pointerMoved = false

        // Long-press: 420ms hold on touch/pen opens quick-action menu
        let longPressTimer = null
        let longPressActivated = false
        if(isDirectPointer(e) && mode === "drag"){
            longPressTimer = setTimeout(()=>{
                longPressTimer = null
                longPressActivated = true
                el.classList.remove("is-moving")
                document.body.classList.remove("dragging-block")
                showBlockQuickMenu(e.clientX, e.clientY, el)
            }, 420)
        }

        el.classList.add("is-moving")
        document.body.classList.add("dragging-block")

        function onPointerMove(moveEvent){
            moveEvent.preventDefault()

            let dy = moveEvent.clientY - startClientY
            let y = startY
            let h = startHeight

            // Cancel long-press if the finger moves
            if(longPressTimer && (Math.abs(moveEvent.clientX - startClientX) > 6 || Math.abs(dy) > 6)){
                clearTimeout(longPressTimer)
                longPressTimer = null
            }

            if(longPressActivated) return

            if(!undoRecorded && Math.abs(dy) > pointerMoveThreshold(e)){
                pushUndoState()
                undoRecorded = true
                pointerMoved = true
                el.dataset.skipClickSelect = "1"
            }

            if(mode === "drag"){
                y = startY + dy
                y = Math.max(0,Math.min(y,timelineHeight()-startHeight))
                y = hoursToPixels(pixelsToSnappedHours(y))
            }

            if(mode === "resize-bottom"){
                h = Math.max(minHeight,startHeight + dy)
                h = Math.min(h,timelineHeight()-startY)
                h = hoursToPixels(pixelsToSnappedHours(h))
            }

            if(mode === "resize-top"){
                let bottom = startY + startHeight
                y = Math.max(0,Math.min(startY + dy,bottom-minHeight))
                y = hoursToPixels(pixelsToSnappedHours(y))
                h = Math.max(minHeight,bottom-y)
                h = hoursToPixels(pixelsToSnappedHours(h))
            }

            setBlockPosition(el,y)
            setBlockHeight(el,h)
            updateDayDropTarget(moveEvent.clientX,moveEvent.clientY)
            update({persist:false})
        }

        function onPointerUp(upEvent){
            clearTimeout(longPressTimer)
            longPressTimer = null

            if(el.hasPointerCapture && el.hasPointerCapture(upEvent.pointerId)){
                el.releasePointerCapture(upEvent.pointerId)
            }
            el.classList.remove("is-moving")
            document.body.classList.remove("dragging-block")
            document.removeEventListener("pointermove",onPointerMove)
            document.removeEventListener("pointerup",onPointerUp)
            document.removeEventListener("pointercancel",onPointerUp)

            // Don't treat finger-lift as a tap when long-press opened the menu
            if(longPressActivated){
                draggedBlock = null
                return
            }

            let dayButton = getDayButtonAtPoint(upEvent.clientX,upEvent.clientY)
            clearDayDropTargets()

            if(dayButton && dayButton.dataset.day !== currentDay){
                moveBlockToDay(el,dayButton.dataset.day)
            }else if(undoRecorded){
                saveDay()
                update()
                if(mode === "resize-top" || mode === "resize-bottom"){
                    let startDur = pixelsToSnappedHours(startHeight)
                    let endDur = pixelsToSnappedHours(el.offsetHeight)
                    if(Math.abs(endDur - startDur) > 0.001) notifyDurationChange(startDur,endDur)
                }else if(mode === "drag"){
                    let finalY = parseFloat(el.dataset.y) || 0
                    if(Math.abs(finalY - startY) > 0.5){
                        notifyBlockMove(formatTime(START_HOUR + pixelsToSnappedHours(finalY)))
                    }
                }
            }else if(isDirectPointer(upEvent) && !pointerMoved){
                el.dataset.skipClickSelect = "1"
                selectBlock(el)
                update()
                openBlockEditor(el)
            }

            draggedBlock = null
        }

        document.addEventListener("pointermove",onPointerMove)
        document.addEventListener("pointerup",onPointerUp)
        document.addEventListener("pointercancel",onPointerUp)
    })
}

function getDayButtonAtPoint(x,y){
    let targets = [...document.querySelectorAll(".day-heading, .day-column")]
    let directHit = targets.find(target=>{
            let rect = target.getBoundingClientRect()
            return x>=rect.left && x<=rect.right && y>=rect.top && y<=rect.bottom
        })

    if(directHit) return directHit

    return null
}

function clearDayDropTargets(){
    document.querySelectorAll(".day-heading, .day-column")
        .forEach(target=>target.classList.remove("drop-target"))
}

function updateDayDropTarget(x,y){
    clearDayDropTargets()

    let btn = getDayButtonAtPoint(x,y)
    if(btn && btn.dataset.day !== currentDay){
        btn.classList.add("drop-target")
    }
}

function moveBlockToDay(el,targetDay){
    let movingBlocks = selectedBlocks.has(el) ? getSelectedBlocks() : [el]
    let blocks = movingBlocks.map(getBlockData)

    pushUndoState()
    movingBlocks.forEach(block=>block.remove())
    saveDay()

    currentDay = targetDay
    clearSelection()
    blocks.forEach(block=>{
        block.day = targetDay
        let created = createBlock(block.y,block.h,block)
        selectBlock(created,"add")
    })
    saveDay()
    update()
    updateActiveDay()

    // Safety: confirm the day change with a one-tap Undo.
    let firstStart = Number.isFinite(blocks[0]?.start)
        ? blocks[0].start
        : START_HOUR + pixelsToSnappedHours(blocks[0]?.y || 0)
    let moveLabel = blocks.length === 1
        ? DAY_LABELS[targetDay]+" "+formatTime(firstStart)
        : blocks.length+" blocks → "+DAY_LABELS[targetDay]
    notifyBlockMove(moveLabel)
}

function copySelectedBlock(){
    let monthSelections = getSelectedMonthEvents()
    if(monthSelections.length){
        blockClipboard = monthSelections.map(({event})=>({
            start:event.start,
            dur:event.dur,
            y:hoursToPixels(event.start - START_HOUR),
            h:hoursToPixels(event.dur),
            title:event.title,
            location:event.location,
            description:event.description
        }))
        return
    }

    let blocks = getSelectedBlocks()
    if(blocks.length===0){
        alert("Select one or more blocks first.")
        return
    }

    blockClipboard = blocks.map(getBlockData)
}

function cutSelectedBlock(){
    let monthSelections = getSelectedMonthEvents()
    if(monthSelections.length){
        blockClipboard = monthSelections.map(({event})=>({
            start:event.start,
            dur:event.dur,
            y:hoursToPixels(event.start - START_HOUR),
            h:hoursToPixels(event.dur),
            title:event.title,
            location:event.location,
            description:event.description
        }))
        deleteSelectedMonthEvents(monthSelections)
        return
    }

    let blocks = getSelectedBlocks()
    if(blocks.length===0){
        alert("Select one or more blocks first.")
        return
    }

    pushUndoState()
    blockClipboard = blocks.map(getBlockData)
    blocks.forEach(el=>el.remove())
    clearSelection()
    saveDay()
    update()
}

function deleteSelectedBlocks(){
    let monthSelections = getSelectedMonthEvents()
    if(monthSelections.length){
        if(!confirm("Delete "+monthSelections.length+" selected calendar event"+(monthSelections.length === 1 ? "" : "s")+"?")) return
        deleteSelectedMonthEvents(monthSelections)
        return
    }

    let blocks = getSelectedBlocks()
    if(blocks.length===0) return
    if(!confirm("Delete "+blocks.length+" selected block"+(blocks.length === 1 ? "" : "s")+"?")) return

    pushUndoState()
    blocks.forEach(el=>el.remove())
    clearSelection()
    saveDay()
    update()
}

function deleteSelectedMonthEvents(monthSelections=getSelectedMonthEvents()){
    if(monthSelections.length===0) return

    pushUndoState()

    let byDate = monthSelections.reduce((map,item)=>{
        if(!map[item.dateKey]) map[item.dateKey] = []
        map[item.dateKey].push(item.index)
        return map
    },{})

    Object.keys(byDate).forEach(eventDateKey=>{
        let indexes = byDate[eventDateKey].sort((a,b)=>b-a)
        indexes.forEach(index=>monthEvents[eventDateKey]?.splice(index,1))
        if(!monthEvents[eventDateKey]?.length) delete monthEvents[eventDateKey]
    })

    selectedMonthEvents.clear()
    if(selectedWeekStartKey) loadWeekFromMonth(selectedWeekStartKey)
    renderMonthView()
    updateImportSummary()
    savePlannerState()
    updateUndoButton()
    updateSelectionStatus()
}

function pasteBlock(){
    if(!blockClipboard){
        alert("Copy or cut a block first.")
        return
    }

    pushUndoState()
    clearSelection()

    blockClipboard.forEach(item=>{
        let y = Math.min(
            item.y + hoursToPixels(SNAP),
            timelineHeight() - item.h
        )
        item.day = currentDay

        let block = createBlock(y,item.h,item)
        selectBlock(block,"add")
    })

    saveDay()
    update()
}

function selectAllBlocks(){
    clearSelection()
    if(plannerView === "month"){
        selectAllCalendarEvents()
        return
    }

    document.querySelectorAll(".event").forEach(el=>selectBlock(el,"add"))
    updateSelectionStatus()
}

function selectAllCalendarEvents(){
    clearSelection()

    Object.keys(monthEvents).forEach(eventDateKey=>{
        ;(monthEvents[eventDateKey] || []).forEach((event,index)=>{
            selectedMonthEvents.add(monthSelectionKey(eventDateKey,index))
        })
    })

    document.querySelectorAll(".month-event").forEach(el=>{
        let key = monthSelectionKey(el.dataset.dateKey,el.dataset.eventIndex)
        el.classList.toggle("selected",selectedMonthEvents.has(key))
    })
    updateSelectionStatus()
}

function editSelectedBlock(){
    let block = selectedBlock || getSelectedBlocks()[0]
    if(!block){
        alert("Select a block first.")
        return
    }

    openBlockEditor(block)
}

function hoursToTimeValue(hourValue){
    let hour = Math.floor(hourValue)
    let minute = Math.round((hourValue - hour) * 60)

    if(minute === 60){
        hour++
        minute = 0
    }

    return String(hour).padStart(2,"0")+":"+String(minute).padStart(2,"0")
}

function timeValueToHours(value){
    let [hour,minute] = String(value || "").split(":").map(Number)
    if(!Number.isFinite(hour)) hour = START_HOUR
    if(!Number.isFinite(minute)) minute = 0
    return hour + (minute / 60)
}

function setDurationInputValue(value){
    let input = document.getElementById("blockDurationInput")
    let rounded = String(Math.round(value * 100) / 100)
    if(!input) return

    if(![...input.options].some(option=>option.value === rounded)){
        let option = document.createElement("option")
        option.value = rounded
        option.innerText = value+" hours"
        input.appendChild(option)
    }

    input.value = rounded
}

function openBlockEditor(el){
    if(!el) return

    let data = getBlockData(el)
    editingBlock = el

    document.getElementById("blockTitleInput").value = data.title || ""
    document.getElementById("blockDayInput").value = data.day || currentDay
    document.getElementById("blockStartInput").value = hoursToTimeValue(data.start ?? START_HOUR)
    document.getElementById("blockLocationInput").value = data.location || ""
    document.getElementById("blockDescriptionInput").value = data.description || ""
    setDurationInputValue(data.dur || SNAP)

    document.getElementById("blockEditorBackdrop")?.classList.remove("is-hidden")
    document.getElementById("blockTitleInput")?.focus()
}

function closeBlockEditor(){
    editingBlock = null
    document.getElementById("blockEditorBackdrop")?.classList.add("is-hidden")
}

function saveEditedBlock(){
    if(!editingBlock || !editingBlock.isConnected) return

    pushUndoState()

    let previousDur = parseFloat(editingBlock.dataset.dur) || 0
    let day = document.getElementById("blockDayInput").value || currentDay
    let start = Math.max(START_HOUR,Math.min(START_HOUR + HOURS - SNAP,timeValueToHours(document.getElementById("blockStartInput").value)))
    let dur = Math.max(SNAP,parseFloat(document.getElementById("blockDurationInput").value) || SNAP)
    dur = Math.min(dur,START_HOUR + HOURS - start)

    editingBlock.dataset.title = document.getElementById("blockTitleInput").value.trim() || "Block"
    editingBlock.dataset.location = document.getElementById("blockLocationInput").value.trim()
    editingBlock.dataset.description = document.getElementById("blockDescriptionInput").value.trim()
    editingBlock.dataset.day = day
    editingBlock.dataset.start = String(Math.round(start * 100) / 100)
    editingBlock.dataset.dur = String(Math.round(dur * 100) / 100)

    let y = hoursToPixels(start - START_HOUR)
    let h = hoursToPixels(dur)
    editingBlock.dataset.y = y
    editingBlock.style.transform = `translateY(${y}px)`
    editingBlock.style.height = h+"px"

    let destinationColumn = getDayColumn(day)
    if(destinationColumn){
        destinationColumn.appendChild(editingBlock)
        currentDay = day
        selectBlock(editingBlock)
    }else{
        let movedBlock = getBlockData(editingBlock)
        saveAllDays({persist:false})
        editingBlock.remove()
        weekData[day] = [...(weekData[day] || []),{
            start:movedBlock.start,
            dur:movedBlock.dur,
            title:movedBlock.title,
            location:movedBlock.location,
            description:movedBlock.description
        }].sort((a,b)=>a.start-b.start)
        currentDay = day
        clearSelection()
        renderWeek()
    }
    closeBlockEditor()
    saveDay()
    update()
    updateActiveDay()

    // Safety: surface duration changes with a one-tap Undo.
    if(Math.abs(dur - previousDur) > 0.001 && previousDur > 0){
        notifyDurationChange(previousDur,dur)
    }
}

function notifyDurationChange(fromHours,toHours){
    showAppToast(
        "Duration changed: "+formatDurationLabel(fromHours)+" → "+formatDurationLabel(toHours),
        {label:"Undo", handler:undoLastChange}
    )
}

// Safety: surface an accidental drag (reposition or day change) with a one-tap Undo.
function notifyBlockMove(label){
    showAppToast("Moved to "+label, {label:"Undo", handler:undoLastChange})
}

function deleteEditedBlock(){
    if(!editingBlock || !editingBlock.isConnected) return

    pushUndoState()
    editingBlock.remove()
    closeBlockEditor()
    clearSelection()
    saveDay()
    update()
}

//--------------------------------
// SAVE / LOAD DAY
//--------------------------------
function saveDay(){
    saveAllDays()
}

function saveAllDays(options={}){
    if(!TIMELINE_VIEWS.includes(plannerView)) return

    visibleTimelineDays().forEach(day=>{
        weekData[day] = getSchedule(day).map(b=>({
            start:b.start,
            dur:b.dur,
            title:b.title,
            location:b.location,
            description:b.description,
            ...(b.gcalId && {gcalId:b.gcalId})
        }))
    })

    if(options.persist !== false){
        syncSelectedWeekToMonth()
        savePlannerState()
    }

    updateOutlookPanels()
}

function loadDay(options={}){
    let expectedDays = visibleTimelineDays()
    let renderedDays = [...document.querySelectorAll(".day-column")].map(column=>column.dataset.day)
    if(JSON.stringify(renderedDays) !== JSON.stringify(expectedDays)){
        buildTimeline()
        applyTimelineZoom({render:false})
    }
    renderWeek(options)
}

function renderWeek(options={}){
    clearSelection()
    timeline.querySelectorAll(".event").forEach(e=>e.remove())

    visibleTimelineDays().forEach(day=>{
        weekData[day].forEach(b=>{
            let y=((b.start-START_HOUR)/HOURS)*timelineHeight()
            let h=(b.dur/HOURS)*timelineHeight()
            createBlock(y,h,{...b,day})
        })
    })

    update(options)
    applyOvertimeFilterToViews()
}

//--------------------------------
// CONTROLS
//--------------------------------
function addBlock(){
    pushUndoState()
    let block = createBlock(0,120,{day:currentDay})
    selectBlock(block)
    saveDay()
    update()
}

function addBlockAndOpenEditor(){
    pushUndoState()
    let now = new Date()
    let hour = now.getHours() + now.getMinutes() / 60
    hour = Math.max(START_HOUR, Math.min(hour, START_HOUR + HOURS - 1))
    let y = hoursToPixels(snapHours(hour - START_HOUR))
    y = Math.max(0, Math.min(y, timelineHeight() - hoursToPixels(1)))
    let block = createBlock(y, hoursToPixels(1), {day: currentDay})
    selectBlock(block)
    saveDay()
    update()
    openBlockEditor(block)
}

function showMobileDatePicker(){
    let input = document.createElement("input")
    input.type = "date"
    let activeDate = addDays(selectedWeekStartDate(), currentDayIndex())
    input.value = dateKey(activeDate)
    input.style.cssText = "opacity:0;position:fixed;top:50%;left:50%;width:1px;height:1px;pointer-events:none"
    document.body.appendChild(input)
    input.addEventListener("change", ()=>{
        let parts = (input.value || "").split("-").map(Number)
        let y = parts[0], m = parts[1], d = parts[2]
        if(!y || !m || !d){ input.remove(); return }
        let targetDate = new Date(y, m - 1, d)
        selectedWeekStartKey = dateKey(startOfPlannerWeek(targetDate))
        monthAnchorDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
        currentDay = DAY_ORDER[(targetDate.getDay() + 6) % 7]
        loadWeekFromMonth(selectedWeekStartKey, {currentDay})
        renderMonthView()
        setPlannerView(plannerView)
        input.remove()
    })
    input.addEventListener("blur", ()=>{ setTimeout(()=>{ if(document.body.contains(input)) input.remove() }, 300) })
    try{ input.showPicker?.() }catch(e){ input.click() }
}

function addBlockAtTimelinePoint(event,openEditor=false){
    let dayColumn = event.target?.closest?.(".day-column") || getDayColumnAtPoint(event.clientX,event.clientY)
    if(!dayColumn) return

    let h = hoursToPixels(1)
    let y = event.clientY - dayColumn.getBoundingClientRect().top
    y = hoursToPixels(pixelsToSnappedHours(y))
    y = Math.max(0,Math.min(y,timelineHeight()-h))

    pushUndoState()
    currentDay = dayColumn.dataset.day || currentDay
    clearSelection()

    let block = createBlock(y,h,{day:currentDay})
    selectBlock(block)
    saveDay()
    update()
    updateActiveDay()

    if(openEditor) openBlockEditor(block)
}

function resetAll(){
    pushUndoState()
    weekData[currentDay]=[]
    clearSelection()
    loadDay()
}

function removeImportedCalendar(){
    let calendarEventCount = Object.values(monthEvents || {}).reduce((total,events)=>total + (events || []).length,0)
    if(!calendarEventCount && !importedEventCount){
        alert("There is no imported calendar to remove.")
        return
    }

    let summary = "Remove "+calendarEventCount+" imported calendar event"+(calendarEventCount === 1 ? "" : "s")+"?"
    if(!confirm(summary)) return

    pushUndoState()
    monthEvents = {}
    weekData = emptyWeekData()
    importSummaryText = ""
    importedEventCount = 0
    skippedNonAbtCount = 0
    selectedWeekStartKey = null
    clearSelection()
    closeBlockEditor()
    loadDay()
    updateWeekHeader()
    updateImportSummary()
    renderMonthView()
    savePlannerState()
    updateUndoButton()
}

function commitImportedCalendar(importedMonthEvents, importedWeekData, options={}){
    let {
        importedCount = 0,
        skippedNonAbt = 0,
        firstImportedDay = null,
        firstImportedDate = null,
        input = null,
        sourceLabel = "calendar"
    } = options

    let previousImportedCount = importedEventCount
    let replacingExistingImport = Boolean(previousImportedCount || Object.keys(monthEvents || {}).length)

    pushUndoState()
    weekData = emptyWeekData()
    selectedWeekStartKey = null
    monthEvents = importedMonthEvents

    if(firstImportedDate){
        monthAnchorDate = new Date(firstImportedDate.getFullYear(),firstImportedDate.getMonth(),1)
        selectedWeekStartKey = dateKey(startOfPlannerWeek(firstImportedDate))
        weekData = buildWeekDataFromMonthEntries(parseDateKey(selectedWeekStartKey),monthEvents)
        currentDay = firstImportedDay || currentDay || "mon"
        loadDay({persist:false})
        updateActiveDay()
        updateWeekHeader()
    }else{
        weekData = importedWeekData
        currentDay = firstImportedDay || currentDay
        loadDay()
        updateActiveDay()
    }

    importedEventCount = importedCount
    skippedNonAbtCount = skippedNonAbt
    importSummaryText = buildImportSummary()
    clearSelection()
    closeBlockEditor()
    setPlannerView("month")
    renderMonthView()
    updateImportSummary()
    applyThemeMode(themeMode)
    savePlannerState()
    updateUndoButton()

    let actionLabel = replacingExistingImport ? "replaced" : "imported"
    showAppToast(importedCount+" "+sourceLabel+" event"+(importedCount===1 ? "" : "s")+" "+actionLabel)
    if(input) input.value = ""
}

function deleteAllBlocks(){
    let weekBlockCount = DAY_ORDER.reduce((total,day)=>total + (weekData[day] || []).length,0)
    let calendarEventCount = Object.values(monthEvents || {}).reduce((total,events)=>total + (events || []).length,0)
    let summary = calendarEventCount
        ? "Delete "+calendarEventCount+" calendar event"+(calendarEventCount === 1 ? "" : "s")+" and clear the current week?"
        : "Delete "+weekBlockCount+" block"+(weekBlockCount === 1 ? "" : "s")+" from the planner?"

    if(!confirm(summary)) return

    pushUndoState()
    weekData = emptyWeekData()
    monthEvents = {}
    importSummaryText = ""
    importedEventCount = 0
    skippedNonAbtCount = 0
    selectedWeekStartKey = null
    clearSelection()
    closeBlockEditor()
    loadDay()
    updateWeekHeader()
    updateImportSummary()
    renderMonthView()
    savePlannerState()
    updateUndoButton()
}

function ensureDeleteAllButton(){
    if(document.querySelector("[data-delete-all-button]")) return

    const firstGroup = document.querySelector("#controls .tool-group")
    if(!firstGroup) return

    const button = document.createElement("button")
    button.type = "button"
    button.className = "danger"
    button.dataset.deleteAllButton = "true"
    button.textContent = "Delete All"
    button.onclick = deleteAllBlocks
    firstGroup.appendChild(button)
}

function ensureDeleteSelectedButton(){
    if(document.querySelector("[data-delete-selected-button]")) return

    const group = document.querySelectorAll("#controls .tool-group")[1]
    if(!group) return

    const button = document.createElement("button")
    button.type = "button"
    button.className = "danger"
    button.dataset.deleteSelectedButton = "true"
    button.textContent = "Delete Selected"
    button.onclick = deleteSelectedBlocks
    group.appendChild(button)
}

function ensureSelectAllCalendarButton(){
    if(document.querySelector("[data-select-calendar-button]")) return

    const group = document.querySelectorAll("#controls .tool-group")[1]
    if(!group) return

    const button = document.createElement("button")
    button.type = "button"
    button.className = "secondary"
    button.dataset.selectCalendarButton = "true"
    button.textContent = "Select Calendar"
    button.onclick = selectAllCalendarEvents
    group.appendChild(button)
}

function cloneToolbarDefaults(){
    return TOOLBAR_DEFAULTS.map(item=>({...item}))
}

function normalizeToolbarSettings(value){
    const saved = Array.isArray(value) ? value : []
    const savedByKey = new Map(saved.map(item=>[item?.key,item]))
    const validKeys = new Set(TOOLBAR_DEFAULTS.map(item=>item.key))
    const ordered = []

    saved.forEach(item=>{
        if(!validKeys.has(item?.key) || ordered.some(existing=>existing.key === item.key)) return
        const fallback = TOOLBAR_DEFAULTS.find(defaultItem=>defaultItem.key === item.key)
        ordered.push({
            key:item.key,
            label:String(item.label || fallback.label).trim() || fallback.label,
            visible:item.visible !== false
        })
    })

    TOOLBAR_DEFAULTS.forEach(defaultItem=>{
        if(ordered.some(item=>item.key === defaultItem.key)) return
        const savedItem = savedByKey.get(defaultItem.key)
        ordered.push({
            ...defaultItem,
            label:String(savedItem?.label || defaultItem.label).trim() || defaultItem.label,
            visible:savedItem?.visible === false ? false : defaultItem.visible
        })
    })

    if(!ordered.some(item=>item.visible)) ordered[0].visible = true
    return ordered
}

function loadToolbarCustomization(){
    try{
        toolbarSettings = normalizeToolbarSettings(JSON.parse(localStorage.getItem(TOOLBAR_SETTINGS_KEY) || "null"))
    }catch(error){
        toolbarSettings = cloneToolbarDefaults()
    }
}

function persistToolbarCustomization(){
    try{
        localStorage.setItem(TOOLBAR_SETTINGS_KEY,JSON.stringify(toolbarSettings))
    }catch(error){
        console.warn("Toolbar customization could not be saved.",error)
    }
}

function toolbarLabel(key){
    return toolbarSettings.find(item=>item.key === key)?.label || TOOLBAR_DEFAULTS.find(item=>item.key === key)?.label || key
}

function openToolbarCustomizer(){
    renderToolbarCustomizer()
    document.getElementById("toolbarCustomizeBackdrop")?.classList.remove("is-hidden")
}

function closeToolbarCustomizer(){
    document.getElementById("toolbarCustomizeBackdrop")?.classList.add("is-hidden")
}

function renderToolbarCustomizer(){
    const list = document.getElementById("toolbarCustomizerList")
    if(!list) return

    list.innerHTML = ""
    toolbarSettings.forEach((item,index)=>{
        const row = document.createElement("div")
        row.className = "toolbar-customizer-row"
        row.dataset.key = item.key

        const visibleLabel = document.createElement("label")
        visibleLabel.className = "toolbar-customizer-toggle"
        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.checked = item.visible
        checkbox.dataset.toolbarVisible = item.key
        visibleLabel.appendChild(checkbox)
        const toggleText = document.createElement("span")
        toggleText.textContent = "Show"
        visibleLabel.appendChild(toggleText)
        row.appendChild(visibleLabel)

        const nameLabel = document.createElement("label")
        nameLabel.className = "toolbar-customizer-name"
        const nameText = document.createElement("span")
        nameText.textContent = TOOLBAR_DEFAULTS.find(defaultItem=>defaultItem.key === item.key)?.label || item.key
        nameLabel.appendChild(nameText)
        const nameInput = document.createElement("input")
        nameInput.type = "text"
        nameInput.value = item.label
        nameInput.dataset.toolbarLabel = item.key
        nameInput.maxLength = 18
        nameLabel.appendChild(nameInput)
        row.appendChild(nameLabel)

        const moves = document.createElement("div")
        moves.className = "toolbar-customizer-moves"
        const up = document.createElement("button")
        up.type = "button"
        up.className = "secondary icon-button"
        up.textContent = "↑"
        up.disabled = index === 0
        up.setAttribute("aria-label","Move "+item.label+" left")
        up.addEventListener("click",()=>moveToolbarCustomizerItem(index,-1))
        moves.appendChild(up)

        const down = document.createElement("button")
        down.type = "button"
        down.className = "secondary icon-button"
        down.textContent = "↓"
        down.disabled = index === toolbarSettings.length - 1
        down.setAttribute("aria-label","Move "+item.label+" right")
        down.addEventListener("click",()=>moveToolbarCustomizerItem(index,1))
        moves.appendChild(down)
        row.appendChild(moves)

        list.appendChild(row)
    })
}

function moveToolbarCustomizerItem(index,offset){
    const nextIndex = index + offset
    if(nextIndex < 0 || nextIndex >= toolbarSettings.length) return
    const next = [...toolbarSettings]
    const [item] = next.splice(index,1)
    next.splice(nextIndex,0,item)
    toolbarSettings = next
    renderToolbarCustomizer()
}

function saveToolbarCustomization(){
    const next = toolbarSettings.map(item=>{
        const labelInput = document.querySelector(`[data-toolbar-label="${item.key}"]`)
        const visibleInput = document.querySelector(`[data-toolbar-visible="${item.key}"]`)
        const fallback = TOOLBAR_DEFAULTS.find(defaultItem=>defaultItem.key === item.key)?.label || item.label
        return {
            key:item.key,
            label:String(labelInput?.value || fallback).trim() || fallback,
            visible:visibleInput?.checked !== false
        }
    })

    toolbarSettings = normalizeToolbarSettings(next)
    persistToolbarCustomization()
    closeToolbarCustomizer()
    rebuildToolbar()
}

function resetToolbarCustomization(){
    toolbarSettings = cloneToolbarDefaults()
    persistToolbarCustomization()
    renderToolbarCustomizer()
    rebuildToolbar()
}

function applyThemeMode(mode){
    themeMode = mode === "light" ? "light" : "dark"
    document.documentElement.dataset.theme = themeMode
    document.getElementById("themeColorMeta")?.setAttribute("content",themeMode === "light" ? "#f6f4ee" : "#0d1116")
    updateThemeButtons()
}

function loadThemeMode(){
    try{
        applyThemeMode(localStorage.getItem(THEME_MODE_KEY) || "dark")
    }catch(error){
        applyThemeMode("dark")
    }
}

function setThemeMode(mode){
    applyThemeMode(mode)
    try{
        localStorage.setItem(THEME_MODE_KEY,themeMode)
    }catch(error){
        console.warn("Theme preference could not be saved.",error)
    }
}

function toggleThemeMode(){
    setThemeMode(themeMode === "light" ? "dark" : "light")
}

function updateThemeButtons(){
    document.querySelectorAll("[data-theme-mode]").forEach(button=>{
        button.classList.toggle("active-view",button.dataset.themeMode === themeMode)
    })

    const toggle = document.getElementById("themeToggleButton")
    const label = toggle?.querySelector?.(".button-label")
    if(label) label.textContent = themeMode === "light" ? "Light Mode" : "Dark Mode"
    document.getElementById("settingsDarkButton")?.classList.toggle("active-view",themeMode === "dark")
    document.getElementById("settingsLightButton")?.classList.toggle("active-view",themeMode === "light")
}

function loadDefaultPlannerView(){
    try{
        let value = localStorage.getItem(DEFAULT_VIEW_KEY)
        defaultPlannerView = normalizePlannerView(value)
    }catch(error){
        defaultPlannerView = "week"
    }
}

function setDefaultPlannerView(view){
    defaultPlannerView = normalizePlannerView(view)
    try{
        localStorage.setItem(DEFAULT_VIEW_KEY,defaultPlannerView)
    }catch(error){
        console.warn("Default view could not be saved.",error)
    }
    syncSettingsControls()
}

function cloneJsonValue(value){
    return JSON.parse(JSON.stringify(value ?? {}))
}

function normalizeCustomOvertimeRules(value){
    return {
        continuous_span_exceptions:Array.isArray(value?.continuous_span_exceptions) ? value.continuous_span_exceptions : [],
        regression_cases:Array.isArray(value?.regression_cases) ? value.regression_cases : []
    }
}

function normalizeCustomOvertimeRuleHistory(value){
    return Array.isArray(value)
        ? value.map(entry=>normalizeCustomOvertimeRules(entry))
        : []
}

function readCustomOvertimeRulesFromStorage(){
    try{
        return normalizeCustomOvertimeRules(JSON.parse(localStorage.getItem(CUSTOM_OVERTIME_RULES_KEY) || "{}"))
    }catch(error){
        console.warn("Custom overtime rules could not be read.",error)
        return normalizeCustomOvertimeRules({})
    }
}

function readCustomOvertimeRuleHistory(){
    try{
        return normalizeCustomOvertimeRuleHistory(JSON.parse(localStorage.getItem(CUSTOM_OVERTIME_RULES_HISTORY_KEY) || "[]"))
    }catch(error){
        console.warn("Custom overtime rule history could not be read.",error)
        return []
    }
}

function writeCustomOvertimeRuleHistory(history){
    let normalizedHistory = normalizeCustomOvertimeRuleHistory(history).slice(-12)
    try{
        if(normalizedHistory.length) localStorage.setItem(CUSTOM_OVERTIME_RULES_HISTORY_KEY,JSON.stringify(normalizedHistory))
        else localStorage.removeItem(CUSTOM_OVERTIME_RULES_HISTORY_KEY)
    }catch(error){
        console.warn("Custom overtime rule history could not be saved.",error)
    }
}

function baseContinuousSpanExceptions(){
    return Array.isArray(OVERTIME_RULES_BASE.continuous_span_exceptions) ? OVERTIME_RULES_BASE.continuous_span_exceptions : []
}

function baseRegressionCases(){
    return Array.isArray(OVERTIME_RULES_BASE.regression_cases) ? OVERTIME_RULES_BASE.regression_cases : []
}

function applyCustomOvertimeRulesState(customRules){
    let normalized = normalizeCustomOvertimeRules(customRules)
    window.overtimeRulesCustom = normalized
    let mergedExceptions = [...baseContinuousSpanExceptions(), ...normalized.continuous_span_exceptions]
    let mergedCases = [...baseRegressionCases(), ...normalized.regression_cases]
    CONTINUOUS_SPAN_EXCEPTIONS.splice(0,CONTINUOUS_SPAN_EXCEPTIONS.length,...mergedExceptions)
    OVERTIME_REGRESSION_CASES.splice(0,OVERTIME_REGRESSION_CASES.length,...mergedCases)
    OVERTIME_RULES.continuous_span_exceptions = CONTINUOUS_SPAN_EXCEPTIONS
    OVERTIME_RULES.regression_cases = OVERTIME_REGRESSION_CASES
}

function persistCustomOvertimeRules(customRules,options={}){
    let normalized = normalizeCustomOvertimeRules(customRules)
    if(options.recordHistory !== false){
        let previous = normalizeCustomOvertimeRules(window.overtimeRulesCustom || {})
        let previousJson = JSON.stringify(previous)
        let nextJson = JSON.stringify(normalized)
        if(previousJson !== nextJson){
            let history = readCustomOvertimeRuleHistory()
            history.push(previous)
            writeCustomOvertimeRuleHistory(history)
        }
    }
    try{
        if(normalized.continuous_span_exceptions.length || normalized.regression_cases.length){
            localStorage.setItem(CUSTOM_OVERTIME_RULES_KEY,JSON.stringify(normalized))
        }else{
            localStorage.removeItem(CUSTOM_OVERTIME_RULES_KEY)
        }
    }catch(error){
        console.warn("Custom overtime rules could not be saved.",error)
    }
    applyCustomOvertimeRulesState(normalized)
}

function undoCustomOvertimeRuleChange(){
    let history = readCustomOvertimeRuleHistory()
    if(!history.length){
        setOtRuleStatus("No saved OT rule changes are available to undo.","info")
        return
    }
    let previous = normalizeCustomOvertimeRules(history.pop())
    writeCustomOvertimeRuleHistory(history)
    persistCustomOvertimeRules(previous,{recordHistory:false})
    setOtRuleStatus("Restored the previous OT rule set.","success")
    syncProposedOvertimeRulePreview()
    syncSettingsControls()
    overtimeRulesNeedUiRefresh()
}

function overtimeRulesNeedUiRefresh(){
    if(plannerView === "month") renderMonthView()
    else update()
    updateOutlookPanels({forceAgenda:true})
}

function formatHoursCompact(hours){
    let value = Math.round(Number(hours || 0) * 100) / 100
    let text = value.toFixed(2).replace(/\.00$/,"").replace(/(\.\d)0$/,"$1")
    return text + "h"
}

function contiguousBlocksFromDurations(durations,gap=0){
    let start = 0
    return durations.map(duration=>{
        let block = {start,duration:Number(duration || 0)}
        start += Number(duration || 0) + Number(gap || 0)
        return block
    })
}

function buildAutoOvertimeRuleName(previousDuration,gap,duration,expectedHours){
    return [
        "rule",
        String(previousDuration).replace(".","_"),
        "break",
        String(gap).replace(".","_"),
        String(duration).replace(".","_"),
        "ot",
        String(expectedHours).replace(".","_")
    ].join("_")
}

function prefillOvertimeRuleForm(previousDuration,gap,duration,expectedHours){
    let values = {
        otRulePreviousDurationInput:previousDuration,
        otRuleGapInput:gap,
        otRuleDurationInput:duration,
        otRuleExpectedHoursInput:expectedHours
    }
    Object.entries(values).forEach(([id,value])=>{
        let input = document.getElementById(id)
        if(input) input.value = String(value)
    })
    syncProposedOvertimeRulePreview()
}

function startNewOvertimeRule(){
    prefillOvertimeRuleForm(0,0,0,0)
    setOtRuleStatus("Enter the new OT pattern, then check conflicts before saving.","info")
    document.getElementById("otRulePreviousDurationInput")?.focus()
}

function syncProposedOvertimeRulePreview(){
    let preview = document.getElementById("otRuleDerivedPreview")
    if(!preview) return
    let candidate = buildProposedOvertimeRuleCandidate()
    if(candidate.error){
        preview.textContent = candidate.error
        preview.dataset.status = "error"
        return
    }
    let baselineHours = candidate.baselineHours
    let derivedAllowance = candidate.exception.extra_regular_allowance
    if(Math.abs(derivedAllowance) < 0.0001){
        preview.textContent =
            "This example already matches current OT rules: " +
            formatHoursCompact(candidate.exception.previous_duration) + " + " +
            formatHoursCompact(candidate.exception.gap) + " break + " +
            formatHoursCompact(candidate.exception.duration) + " = " +
            formatHoursCompact(candidate.regressionCase.expected_hours) + " OT."
        preview.dataset.status = "info"
        return
    }
    preview.textContent =
        "Derived adjustment: " +
        formatHoursCompact(candidate.exception.previous_duration) + " + " +
        formatHoursCompact(candidate.exception.gap) + " break + " +
        formatHoursCompact(candidate.exception.duration) +
        " currently gives " + formatHoursCompact(baselineHours) +
        " OT. Saving this would add " + formatHoursCompact(derivedAllowance) +
        " regular time so it becomes " + formatHoursCompact(candidate.regressionCase.expected_hours) + " OT."
    preview.dataset.status = "success"
}

function buildProposedOvertimeRuleCandidate(){
    let previousDuration = Number(document.getElementById("otRulePreviousDurationInput")?.value)
    let gap = Number(document.getElementById("otRuleGapInput")?.value)
    let duration = Number(document.getElementById("otRuleDurationInput")?.value)
    let expectedHours = Number(document.getElementById("otRuleExpectedHoursInput")?.value)

    if([previousDuration,gap,duration,expectedHours].some(value=>!Number.isFinite(value) || value < 0)){
        return {error:"All OT rule values must be valid positive numbers or zero."}
    }

    let baselineHours = calculateOvertimeSummaryWithConfig(
        contiguousBlocksFromDurations([previousDuration,duration],gap),
        {
            base:OVERTIME_BASE,
            continuous_span_exceptions:CONTINUOUS_SPAN_EXCEPTIONS
        }
    ).hours
    let extraRegularAllowance = Math.round((baselineHours - expectedHours) * 100) / 100

    if(extraRegularAllowance < -0.0001){
        return {error:"This simplified OT exception form can only reduce OT from the current baseline. Enter a case with expected OT at or below the current result."}
    }

    let exceptionName = buildAutoOvertimeRuleName(previousDuration,gap,duration,expectedHours)

    return {
        exception:{
            name:exceptionName,
            previous_duration:previousDuration,
            gap,
            duration,
            extra_regular_allowance:Math.max(extraRegularAllowance,0)
        },
        regressionCase:{
            label:exceptionName+"_case",
            durations:[previousDuration,duration],
            gap,
            expected_hours:expectedHours
        },
        baselineHours
    }
}

function validateOvertimeRuleCandidate(candidate){
    let currentCustom = normalizeCustomOvertimeRules(window.overtimeRulesCustom || {})
    let existingNames = new Set([
        ...baseContinuousSpanExceptions().map(rule=>String(rule.name || "").trim()),
        ...currentCustom.continuous_span_exceptions.map(rule=>String(rule.name || "").trim())
    ])

    if(existingNames.has(candidate.exception.name)){
        return {ok:false, message:"A rule with that name already exists. Rename it or reset custom rules first.", conflicts:[]}
    }

    let exceptions = [...baseContinuousSpanExceptions(), ...currentCustom.continuous_span_exceptions, candidate.exception]
    let cases = [...baseRegressionCases(), ...currentCustom.regression_cases, candidate.regressionCase]
    let conflicts = []

    cases.forEach(ruleCase=>{
        let schedule = contiguousBlocksFromDurations(ruleCase.durations || [], Number(ruleCase.gap || 0))
        let actual = calculateOvertimeSummaryWithConfig(schedule,{
            base:OVERTIME_BASE,
            continuous_span_exceptions:exceptions
        }).hours
        let expected = Number(ruleCase.expected_hours || 0)
        if(Math.abs(actual - expected) > 0.0001){
            conflicts.push(ruleCase.label + " expected " + formatHoursCompact(expected) + " but got " + formatHoursCompact(actual))
        }
    })

    if(conflicts.length){
        return {
            ok:false,
            message:"Conflict detected. This exception would break existing approved OT examples.",
            conflicts
        }
    }

    return {
        ok:true,
        message:"No OT conflicts found. This exception is compatible with all approved examples.",
        conflicts:[]
    }
}

function validateImportedCustomOvertimeRules(customRules){
    let normalized = normalizeCustomOvertimeRules(customRules)
    let existingBaseNames = new Set(baseContinuousSpanExceptions().map(rule=>String(rule.name || "").trim()).filter(Boolean))
    let importedNames = new Set()
    let importedCaseLabels = new Set()

    for(let rule of normalized.continuous_span_exceptions){
        let name = String(rule?.name || "").trim()
        if(!name) return {ok:false, message:"Every imported OT exception needs a rule name.", conflicts:[]}
        if(existingBaseNames.has(name)) return {ok:false, message:"Imported OT exception duplicates a built-in rule: " + name, conflicts:[]}
        if(importedNames.has(name)) return {ok:false, message:"Imported OT exceptions contain the same rule twice: " + name, conflicts:[]}
        if([rule.previous_duration,rule.gap,rule.duration,rule.extra_regular_allowance].some(value=>!Number.isFinite(Number(value)) || Number(value) < 0)){
            return {ok:false, message:"Imported OT exception has invalid numeric values: " + name, conflicts:[]}
        }
        importedNames.add(name)
    }

    for(let ruleCase of normalized.regression_cases){
        let label = String(ruleCase?.label || "").trim()
        if(!label) return {ok:false, message:"Every imported OT regression case needs a label.", conflicts:[]}
        if(importedCaseLabels.has(label)) return {ok:false, message:"Imported OT regression cases contain the same label twice: " + label, conflicts:[]}
        if(!Array.isArray(ruleCase?.durations) || !ruleCase.durations.length) return {ok:false, message:"Imported OT regression case is missing durations: " + label, conflicts:[]}
        if(ruleCase.durations.some(value=>!Number.isFinite(Number(value)) || Number(value) < 0)) return {ok:false, message:"Imported OT regression case has invalid durations: " + label, conflicts:[]}
        if(!Number.isFinite(Number(ruleCase.expected_hours)) || Number(ruleCase.expected_hours) < 0) return {ok:false, message:"Imported OT regression case has an invalid expected OT value: " + label, conflicts:[]}
        if(!Number.isFinite(Number(ruleCase.gap || 0)) || Number(ruleCase.gap || 0) < 0) return {ok:false, message:"Imported OT regression case has an invalid break value: " + label, conflicts:[]}
        importedCaseLabels.add(label)
    }

    let exceptions = [...baseContinuousSpanExceptions(), ...normalized.continuous_span_exceptions]
    let cases = [...baseRegressionCases(), ...normalized.regression_cases]
    let conflicts = []

    cases.forEach(ruleCase=>{
        let schedule = contiguousBlocksFromDurations(ruleCase.durations || [], Number(ruleCase.gap || 0))
        let actual = calculateOvertimeSummaryWithConfig(schedule,{
            base:OVERTIME_BASE,
            continuous_span_exceptions:exceptions
        }).hours
        let expected = Number(ruleCase.expected_hours || 0)
        if(Math.abs(actual - expected) > 0.0001){
            conflicts.push(ruleCase.label + " expected " + formatHoursCompact(expected) + " but got " + formatHoursCompact(actual))
        }
    })

    if(conflicts.length){
        return {
            ok:false,
            message:"Imported OT rules conflict with approved examples.",
            conflicts
        }
    }

    return {
        ok:true,
        message:"Imported OT rules passed validation.",
        conflicts:[]
    }
}

function setOtRuleStatus(message,type="info"){
    let status = document.getElementById("otRuleStatusMessage")
    if(!status) return
    status.textContent = message
    status.dataset.status = type
}

function setOvertimeRuleSelfTestResults(lines,type="info"){
    let results = document.getElementById("otRuleSelfTestResults")
    if(!results) return
    if(!lines?.length){
        results.hidden = true
        results.textContent = ""
        delete results.dataset.status
        return
    }
    results.hidden = false
    results.dataset.status = type
    results.textContent = lines.join("\n")
}

function validateProposedOvertimeRule(){
    let candidate = buildProposedOvertimeRuleCandidate()
    if(candidate.error){
        setOtRuleStatus(candidate.error,"error")
        return false
    }
    if(candidate.exception.extra_regular_allowance <= 0.0001){
        setOtRuleStatus("This example already matches current OT rules. No new exception is needed.","info")
        return true
    }
    let validation = validateOvertimeRuleCandidate(candidate)
    let suffix = validation.conflicts.length ? " " + validation.conflicts.join(" | ") : ""
    setOtRuleStatus(validation.message + suffix, validation.ok ? "success" : "error")
    return validation.ok
}

function exportCustomOvertimeRules(){
    let currentCustom = normalizeCustomOvertimeRules(window.overtimeRulesCustom || {})
    let exportPayload = {
        exported_at:new Date().toISOString(),
        source:"ABT Overtime Planner",
        custom_rules:currentCustom
    }
    downloadTextFile(JSON.stringify(exportPayload,null,2),"abt-overtime-custom-rules.json")
    setOtRuleStatus("Custom OT rules exported as JSON.","success")
}

function importCustomOvertimeRules(){
    let input = document.createElement("input")
    input.type = "file"
    input.accept = ".json,application/json"
    input.addEventListener("change",async ()=>{
        let file = input.files?.[0]
        if(!file) return
        try{
            let raw = JSON.parse(await file.text())
            let normalized = normalizeCustomOvertimeRules(raw?.custom_rules ?? raw)
            let validation = validateImportedCustomOvertimeRules(normalized)
            if(!validation.ok){
                let suffix = validation.conflicts.length ? " " + validation.conflicts.join(" | ") : ""
                setOtRuleStatus(validation.message + suffix,"error")
                setOvertimeRuleSelfTestResults(validation.conflicts,"error")
                return
            }
            persistCustomOvertimeRules(normalized)
            setOtRuleStatus("Imported custom OT rules and applied them locally.","success")
            setOvertimeRuleSelfTestResults(["Imported " + normalized.continuous_span_exceptions.length + " exceptions and " + normalized.regression_cases.length + " custom regression cases."],"success")
            syncProposedOvertimeRulePreview()
            syncSettingsControls()
            overtimeRulesNeedUiRefresh()
        }catch(error){
            console.warn("Custom OT rules could not be imported.",error)
            setOtRuleStatus("The selected file is not a valid OT rules JSON export.","error")
            setOvertimeRuleSelfTestResults([String(error?.message || error)],"error")
        }
    },{once:true})
    input.click()
}

function runBrowserOvertimeRuleSelfTest(){
    let failures = []
    let passes = []
    OVERTIME_REGRESSION_CASES.forEach(ruleCase=>{
        let schedule = contiguousBlocksFromDurations(ruleCase.durations || [], Number(ruleCase.gap || 0))
        let actual = calculateOvertimeSummaryWithConfig(schedule,{
            base:OVERTIME_BASE,
            continuous_span_exceptions:CONTINUOUS_SPAN_EXCEPTIONS
        }).hours
        let expected = Number(ruleCase.expected_hours || 0)
        if(Math.abs(actual - expected) > 0.0001) failures.push(ruleCase.label + ": expected " + formatHoursCompact(expected) + ", got " + formatHoursCompact(actual))
        else passes.push(ruleCase.label + ": " + formatHoursCompact(actual))
    })

    if(failures.length){
        setOtRuleStatus("Browser OT self-test found " + failures.length + " failing cases.","error")
        setOvertimeRuleSelfTestResults(failures,"error")
        return false
    }

    setOtRuleStatus("Browser OT self-test passed " + passes.length + " approved examples.","success")
    setOvertimeRuleSelfTestResults(passes,"success")
    return true
}

function saveProposedOvertimeRule(){
    let candidate = buildProposedOvertimeRuleCandidate()
    if(candidate.error){
        setOtRuleStatus(candidate.error,"error")
        return
    }
    if(candidate.exception.extra_regular_allowance <= 0.0001){
        setOtRuleStatus("This example already matches current OT rules. Nothing new was saved.","info")
        return
    }
    let validation = validateOvertimeRuleCandidate(candidate)
    if(!validation.ok){
        let suffix = validation.conflicts.length ? " " + validation.conflicts.join(" | ") : ""
        setOtRuleStatus(validation.message + suffix,"error")
        return
    }

    let currentCustom = normalizeCustomOvertimeRules(window.overtimeRulesCustom || {})
    currentCustom.continuous_span_exceptions.push(candidate.exception)
    currentCustom.regression_cases.push(candidate.regressionCase)
    persistCustomOvertimeRules(currentCustom)
    setOtRuleStatus("Custom OT exception saved locally and applied to the planner.","success")
    setOvertimeRuleSelfTestResults([], "info")
    syncSettingsControls()
    overtimeRulesNeedUiRefresh()
}

function removeCustomOvertimeRule(ruleName){
    let name = String(ruleName || "").trim()
    if(!name) return
    let currentCustom = normalizeCustomOvertimeRules(window.overtimeRulesCustom || {})
    currentCustom.continuous_span_exceptions = currentCustom.continuous_span_exceptions.filter(rule=>String(rule.name || "").trim() !== name)
    currentCustom.regression_cases = currentCustom.regression_cases.filter(rule=>String(rule.label || "").trim() !== name+"_case")
    persistCustomOvertimeRules(currentCustom)
    setOtRuleStatus("Custom OT rule removed: " + name,"info")
    setOvertimeRuleSelfTestResults([], "info")
    syncSettingsControls()
    overtimeRulesNeedUiRefresh()
}

function resetCustomOvertimeRules(){
    persistCustomOvertimeRules({})
    setOtRuleStatus("Custom OT rules cleared. Base planner OT rules are active again.","info")
    setOvertimeRuleSelfTestResults([], "info")
    syncProposedOvertimeRulePreview()
    syncSettingsControls()
    overtimeRulesNeedUiRefresh()
}

function syncOvertimeRulesSettings(){
    let currentCustom = normalizeCustomOvertimeRules(window.overtimeRulesCustom || {})
    let exceptions = CONTINUOUS_SPAN_EXCEPTIONS
    let cases = OVERTIME_REGRESSION_CASES
    let regularSpan = document.getElementById("otRulesRegularSpanValue")
    let resetBreak = document.getElementById("otRulesResetBreakValue")
    let exceptionCount = document.getElementById("otRulesExceptionCountValue")
    let caseCount = document.getElementById("otRulesCaseCountValue")
    let exceptionList = document.getElementById("otRulesExceptionList")
    let regressionList = document.getElementById("otRulesRegressionList")

    if(regularSpan) regularSpan.textContent = formatHoursCompact(DAILY_REGULAR_HOURS) + " before OT"
    if(resetBreak) resetBreak.textContent = formatHoursCompact(CONTINUOUS_RESET_BREAK_HOURS) + " resets OT span"
    if(exceptionCount) exceptionCount.textContent = exceptions.length + " total / " + currentCustom.continuous_span_exceptions.length + " custom"
    if(caseCount) caseCount.textContent = cases.length + " total / " + currentCustom.regression_cases.length + " custom"
    syncProposedOvertimeRulePreview()

    if(exceptionList){
        exceptionList.innerHTML = ""
        if(!exceptions.length){
            let empty = document.createElement("p")
            empty.className = "ot-rule-item is-empty"
            empty.textContent = "No OT exceptions configured."
            exceptionList.appendChild(empty)
        }else{
            exceptions.forEach(rule=>{
                let item = document.createElement("div")
                item.className = "ot-rule-item"
                let isCustom = currentCustom.continuous_span_exceptions.some(custom=>custom.name === rule.name)
                item.innerHTML = "<strong>" + (rule.name || "rule") + "</strong><span>" +
                    formatHoursCompact(rule.previous_duration) + " + " +
                    formatHoursCompact(rule.gap) + " break + " +
                    formatHoursCompact(rule.duration) + " => +" +
                    formatHoursCompact(rule.extra_regular_allowance) + " regular</span>"
                if(isCustom){
                    item.classList.add("is-custom")
                    let removeButton = document.createElement("button")
                    removeButton.type = "button"
                    removeButton.className = "secondary ot-rule-remove-button"
                    removeButton.textContent = "Remove"
                    removeButton.addEventListener("click",()=>removeCustomOvertimeRule(rule.name))
                    item.appendChild(removeButton)
                }
                exceptionList.appendChild(item)
            })
        }
    }

    if(regressionList){
        regressionList.innerHTML = ""
        if(!cases.length){
            let empty = document.createElement("p")
            empty.className = "ot-rule-item is-empty"
            empty.textContent = "No approved OT examples configured."
            regressionList.appendChild(empty)
        }else{
            cases.forEach(ruleCase=>{
                let item = document.createElement("div")
                item.className = "ot-rule-item"
                item.innerHTML = "<strong>" + ruleCase.label + "</strong><span>" +
                    (ruleCase.durations || []).map(formatHoursCompact).join(" + ") +
                    (Number(ruleCase.gap || 0) > 0 ? " with " + formatHoursCompact(ruleCase.gap) + " breaks" : "") +
                    " => " + formatHoursCompact(ruleCase.expected_hours) + " OT</span>"
                if(currentCustom.regression_cases.some(custom=>custom.label === ruleCase.label)) item.classList.add("is-custom")
                regressionList.appendChild(item)
            })
        }
    }
}

function currentInspectorDate(){
    if(overtimeInspectorDateOverrideKey) return parseDateKey(overtimeInspectorDateOverrideKey)
    let index = Math.max(DAY_ORDER.indexOf(currentDay),0)
    return addDays(selectedWeekStartDate(),index)
}

function currentInspectorSchedule(){
    if(overtimeInspectorDateOverrideKey){
        return cloneScheduleForPay(monthDayItems(overtimeInspectorDateOverrideKey))
    }
    let schedule = getSchedule(currentDay)
    if(!schedule.length) schedule = storedSchedule(currentDay)
    return cloneScheduleForPay(schedule)
}

function openOvertimeInspectorForDateKey(dateKeyValue){
    if(!dateKeyValue) return
    overtimeInspectorDateOverrideKey = dateKeyValue
    openSettings()
}

function openOvertimeInspectorForDay(day){
    if(!day) return
    let index = Math.max(DAY_ORDER.indexOf(day),0)
    overtimeInspectorDateOverrideKey = dateKey(addDays(selectedWeekStartDate(),index))
    openSettings()
}

function calculateOvertimeDayInspector(schedule){
    let blocks = (schedule || [])
        .map(block=>({
            start:Number(block.start) || 0,
            dur:Number(block.dur ?? block.duration) || 0,
            title:block.title || "Untitled",
            location:block.location || "",
            description:block.description || ""
        }))
        .filter(block=>block.dur > 0)
        .sort((a,b)=>a.start - b.start)

    if(!blocks.length){
        return {
            worked:0,
            billable:0,
            overtime:0,
            doubleOvertime:0,
            pay:0,
            exceptions:[],
            blocks:[]
        }
    }

    applyDailyOvertime(blocks)
    let exceptions = []
    blocks.forEach((block,index)=>{
        if(index === 0) return
        let previousBlock = blocks[index - 1]
        let gap = block.start - (previousBlock.start + previousBlock.dur)
        let extra = continuousSpanExtraRegularAllowance(previousBlock.billableDur || 0,gap,block.billableDur || 0)
        if(extra > 0){
            exceptions.push(
                formatHoursCompact(previousBlock.billableDur || 0) + " + " +
                formatHoursCompact(gap) + " break + " +
                formatHoursCompact(block.billableDur || 0) + " => +" +
                formatHoursCompact(extra) + " regular"
            )
        }
    })

    return {
        worked:blocks.reduce((total,block)=>total + Number(block.dur || 0),0),
        billable:blocks.reduce((total,block)=>total + Number(block.billableDur || 0),0),
        overtime:blocks.reduce((total,block)=>total + Number(block.overtimeHours || 0),0),
        doubleOvertime:blocks.reduce((total,block)=>total + Number(block.doubleOvertimeHours || 0),0),
        pay:blocks.reduce((total,block)=>total + calculateBlockPay(block),0),
        exceptions,
        blocks
    }
}

function syncOvertimeDayInspector(){
    let dayValue = document.getElementById("otInspectorDayValue")
    let workedValue = document.getElementById("otInspectorWorkedValue")
    let billableValue = document.getElementById("otInspectorBillableValue")
    let otValue = document.getElementById("otInspectorOtValue")
    let payValue = document.getElementById("otInspectorPayValue")
    let exceptionValue = document.getElementById("otInspectorExceptionValue")
    let blockList = document.getElementById("otInspectorBlockList")
    let inspectDate = currentInspectorDate()
    let summary = calculateOvertimeDayInspector(currentInspectorSchedule())

    if(dayValue) dayValue.textContent = inspectDate.toLocaleDateString(undefined,{weekday:"short", month:"short", day:"numeric"})
    if(workedValue) workedValue.textContent = formatHoursCompact(summary.worked)
    if(billableValue) billableValue.textContent = formatHoursCompact(summary.billable)
    if(otValue) otValue.textContent = formatHoursCompact(summary.overtime) + " / " + formatHoursCompact(summary.doubleOvertime)
    if(payValue) payValue.textContent = formatCurrencyAmount(summary.pay)
    if(exceptionValue) exceptionValue.textContent = summary.exceptions.length ? summary.exceptions.join(" | ") : "None"

    if(blockList){
        blockList.innerHTML = ""
        if(!summary.blocks.length){
            let empty = document.createElement("p")
            empty.className = "ot-rule-item is-empty"
            empty.textContent = "No blocks on the selected day."
            blockList.appendChild(empty)
        }else{
            summary.blocks.forEach(block=>{
                let item = document.createElement("div")
                item.className = "ot-rule-item"
                item.innerHTML = "<strong>" + (block.title || "Untitled") + "</strong><span>" +
                    formatTime(block.start) + " - " + formatTime(block.start + block.dur) +
                    " | worked " + formatHoursCompact(block.dur) +
                    " | billable " + formatHoursCompact(block.billableDur) +
                    " | OT " + formatHoursCompact(block.overtimeHours) +
                    " | Double " + formatHoursCompact(block.doubleOvertimeHours) +
                    "</span>"
                blockList.appendChild(item)
            })
        }
    }
}

function syncSettingsControls(){
    updateThemeButtons()
    updateTimelineZoomControls()
    applyTimelineLayoutMode()
    let autosave = document.getElementById("settingsAutosaveInput")
    if(autosave) autosave.checked = autosaveEnabled
    let defaultView = document.getElementById("settingsDefaultViewInput")
    if(defaultView) defaultView.value = isPhoneLayout() ? mobileFriendlyView(defaultPlannerView) : defaultPlannerView
    let modeBadge = document.getElementById("settingsModeBadgeInput")
    if(modeBadge) modeBadge.checked = Boolean(window.modeBadgeVisible)
    if(typeof syncDeviceDiagnostics === "function") syncDeviceDiagnostics()
    if(typeof gcalLoadIcsUrl === "function") gcalLoadIcsUrl()
    syncOvertimeRulesSettings()
    syncOvertimeDayInspector()
}

function openSettings(){
    closeOpenFileMenus()
    closeMobileSheet()
    closeFullSearch()
    syncSettingsControls()
    document.getElementById("settingsBackdrop")?.classList.remove("is-hidden")
    document.querySelectorAll("[data-mobile-nav]").forEach(button=>button.classList.toggle("active-view",button.dataset.mobileNav === "settings"))
}

function closeSettings(){
    document.getElementById("settingsBackdrop")?.classList.add("is-hidden")
    overtimeInspectorDateOverrideKey = ""
    updateMobileNav()
}

function triggerProjectOpen(){
    let input = document.createElement("input")
    input.type = "file"
    input.accept = ".abt-planner.json,.json,application/json"
    input.addEventListener("change",()=>openProjectFile(input.files?.[0] || null),{once:true})
    if(typeof input.showPicker === "function"){
        try{
            input.showPicker()
            return
        }catch(error){}
    }
    input.click()
}

function triggerCalendarFilePicker(){
    let input = document.createElement("input")
    input.type = "file"
    input.accept = ".ics,.ical,.ifb,.cal,.csv,text/calendar,text/csv"
    input.addEventListener("change",()=>importICS(input.files?.[0] || null),{once:true})
    if(typeof input.showPicker === "function"){
        try{
            input.showPicker()
            return
        }catch(error){}
    }
    input.click()
}

function closeOpenFileMenus(){
    document.querySelectorAll(".toolbar-menu-wrap.is-open, .file-menu-wrap.is-open").forEach(menu=>{
        menu.classList.remove("is-open")
        menu.querySelector(".file-menu, .toolbar-menu")?.classList.remove("is-mobile-open")
        menu.querySelector("[aria-expanded]")?.setAttribute("aria-expanded","false")
    })
    document.querySelectorAll(".file-menu.is-mobile-open, .toolbar-menu.is-mobile-open").forEach(menu=>menu.classList.remove("is-mobile-open"))
    document.querySelector(".outlook-topbar")?.classList.remove("ribbon-menu-open")
    resetRibbonFlyoutOverflow()
}

function closeMobileSheet(){
    document.body.classList.remove("mobile-agenda-open","mobile-actions-open")
    document.querySelectorAll("[data-mobile-nav]").forEach(button=>{
        if(button.dataset.mobileNav === "agenda") button.classList.remove("active-view")
        if(button.dataset.mobileNav === "actions") button.classList.remove("active-view")
    })
}

function openMobileSheet(sheet){
    if(sheet === "agenda"){
        closeOpenFileMenus()
        closeFullSearch()
        hideBlockQuickMenu()
        document.body.classList.remove("mobile-actions-open")
        document.body.classList.add("mobile-agenda-open")
        updateOutlookPanels({forceAgenda:true})
        updateMobileNav()
        if(!isMobileLayout()) setTimeout(()=>document.getElementById("agendaSearchInput")?.focus({preventScroll:true}),80)
    }else if(sheet === "actions"){
        closeOpenFileMenus()
        closeFullSearch()
        hideBlockQuickMenu()
        document.body.classList.remove("mobile-agenda-open")
        buildMobileActionsSheet()
        document.body.classList.add("mobile-actions-open")
        updateMobileNav()
    }
}

const EXPORT_SCOPE_OPTIONS = [
    ["week","Selected week"],
    ["month","Full month"],
    ["selected-month-ot","Selected month OT"],
    ["ot-date-range","OT Date Range"]
]

// Mirrors the desktop ribbon's export-scope selector inside the phone actions
// sheet. The desktop #exportScope select is the single source of truth (it is
// built on load and kept in the DOM even on phone), so changes here write back
// to it and persist via the same state path used everywhere else.
function appendMobileExportScope(parent){
    const field = document.createElement("label")
    field.className = "mobile-action-scope"

    const labelText = document.createElement("span")
    labelText.textContent = "Export scope"
    field.appendChild(labelText)

    const select = document.createElement("select")
    select.id = "mobileExportScope"
    EXPORT_SCOPE_OPTIONS.forEach(([value,label])=>{
        const option = document.createElement("option")
        option.value = value
        option.textContent = label
        select.appendChild(option)
    })
    select.value = getExportScope()
    select.addEventListener("change",()=>{
        const desktopSelect = document.getElementById("exportScope")
        if(desktopSelect) desktopSelect.value = select.value
        savePlannerState()
    })
    field.appendChild(select)
    parent.appendChild(field)
}

// Single source of truth for the Google Calendar menu actions so the desktop
// ribbon and the phone actions sheet stay identical. Each entry is rendered by
// the caller with whatever menu-item helper that surface uses.
function googleCalendarMenuEntries(){
    const hasIcsUrl = !!localStorage.getItem(GCAL_ICS_URL_KEY)
    const entries = []
    if(hasIcsUrl){
        entries.push({label:"Sync This Week", handler:()=>gcalIcsPull(false), iconClass:"icon-cloud-download"})
        entries.push({label:"Sync This Month", handler:gcalIcsPullMonth, iconClass:"icon-cloud-download"})
        entries.push({label:"Sync Full Calendar", handler:gcalIcsPullAll, iconClass:"icon-cloud-download"})
    }
    if(gcalConnected){
        entries.push({label:"Sync now (2-way)", handler:gcalSyncNow, iconClass:"icon-cloud-upload"})
        entries.push({label:"Pull from Google", handler:gcalPull, iconClass:"icon-cloud-download"})
        entries.push({label:"Push to Google", handler:gcalPushAll, iconClass:"icon-cloud-upload"})
    }
    // Always end with a clear link to the single setup location (Settings), so
    // it reads as "sync here, configure there" rather than a duplicate setup.
    entries.push({
        label: hasIcsUrl || gcalConnected ? "Settings…" : "Set up in Settings…",
        handler:()=>{
            openSettings()
            setTimeout(()=>document.getElementById("settingsGcalSection")?.scrollIntoView({behavior:"smooth", block:"start"}), 120)
        },
        iconClass:"icon-settings"
    })
    return entries
}

function buildMobileActionsSheet(){
    const body = document.getElementById("mobileActionsBody")
    if(!body) return
    body.innerHTML = ""

    function section(label){
        const el = document.createElement("div")
        el.className = "mobile-action-section"
        el.textContent = label
        body.appendChild(el)
    }

    function item(label, handler, options={}){
        const btn = document.createElement("button")
        btn.type = "button"
        btn.className = "mobile-action-item" + (options.danger ? " danger" : "")
        if(options.iconClass){
            const icon = document.createElement("span")
            icon.className = "button-icon " + options.iconClass
            icon.setAttribute("aria-hidden","true")
            btn.appendChild(icon)
        }
        const text = document.createElement("span")
        text.textContent = label
        btn.appendChild(text)
        btn.addEventListener("click",()=>{ closeMobileSheet(); handler() })
        body.appendChild(btn)
        return btn
    }

    section("Navigate")
    item("Go to Date", showMobileDatePicker, {iconClass:"icon-calendar"})
    item("Go to Today", goToCurrentWeek, {iconClass:"icon-current-week"})
    item("Previous Period", ()=>changeMobilePeriod(-1), {iconClass:"icon-prev"})
    item("Next Period", ()=>changeMobilePeriod(1), {iconClass:"icon-next"})

    section("Blocks")
    item("Add Block", addBlockAndOpenEditor, {iconClass:"icon-add"})
    item("Edit Selected", editSelectedBlock, {iconClass:"icon-edit"})
    item("Undo", undoLastChange, {iconClass:"icon-undo"})
    item("Redo", redoLastChange, {iconClass:"icon-redo"})
    item("Delete Selected", deleteSelectedBlocks, {iconClass:"icon-trash", danger:true})
    item("Delete All", deleteAllBlocks, {iconClass:"icon-trash", danger:true})

    section("Clipboard")
    item("Copy", copySelectedBlock, {iconClass:"icon-copy"})
    item("Cut", cutSelectedBlock, {iconClass:"icon-cut"})
    item("Paste", pasteBlock, {iconClass:"icon-paste"})

    section("Selection")
    item("Select All", selectAllBlocks, {iconClass:"icon-select-all"})
    item("All Calendar Events", selectAllCalendarEvents, {iconClass:"icon-calendar-check"})
    item("Clear Selection", clearSelection, {iconClass:"icon-clear"})

    section("Calendar")
    item("Import Calendar", triggerCalendarFilePicker, {iconClass:"icon-import"})
    item("Import Filters", openImportFilterEditor, {iconClass:"icon-filter"})
    item("Review Conflicts", openConflictReviewFromImport, {iconClass:"icon-calendar-check"})
    item("Remove Imported Calendar", removeImportedCalendar, {iconClass:"icon-trash", danger:true})

    section("Calendar Sync")
    googleCalendarMenuEntries().forEach(entry=>item(entry.label, entry.handler, {iconClass:entry.iconClass}))

    section("Export")
    appendMobileExportScope(body)
    item("Export PDF", exportPDF, {iconClass:"icon-pdf"})
    item("Export PDF (OT only)", exportWeekOtPDF, {iconClass:"icon-pdf"})
    item("Export CSV", exportCSV, {iconClass:"icon-export"})
    item("Export Calendar (.ics)", exportICS, {iconClass:"icon-export"})

    section("File")
    item("Save", saveProject, {iconClass:"icon-save"})
    item("Save As", saveProjectAs, {iconClass:"icon-save-as"})
    item("Open / Restore Backup", triggerProjectOpen, {iconClass:"icon-open"})
    item("Back up a Copy", backupProjectCopy, {iconClass:"icon-cloud-upload"})
}

function updateMobileNav(){
    let today = new Date()
    let settingsOpen = !document.getElementById("settingsBackdrop")?.classList.contains("is-hidden")
    document.querySelectorAll("[data-mobile-nav]").forEach(button=>{
        let nav = button.dataset.mobileNav
        if(nav === "week"){
            let label = button.querySelector("span:last-child")
            if(label) label.textContent = isPhoneLayout() ? "3 Day" : "Week"
        }
        let actionsOpen = document.body.classList.contains("mobile-actions-open")
        button.classList.toggle("active-view",
            (nav === "today" && isDateInSelectedWeek(today)) ||
            (nav === "week" && ["week","workweek","three-day"].includes(plannerView) && !document.body.classList.contains("mobile-agenda-open") && !actionsOpen) ||
            (nav === "day" && plannerView === "day" && !document.body.classList.contains("mobile-agenda-open") && !actionsOpen) ||
            (nav === "month" && plannerView === "month") ||
            (nav === "agenda" && document.body.classList.contains("mobile-agenda-open")) ||
            (nav === "actions" && actionsOpen) ||
            (nav === "settings" && settingsOpen)
        )
    })
}

function rebuildToolbar(){
    const controls = document.getElementById("controls")
    if(!controls) return

    const exportScopeValue = document.getElementById("exportScope")?.value || "week"
    controls.innerHTML = ""
    controls.classList.add("optimized-controls")

    function group(className){
        const node = document.createElement("div")
        node.className = "tool-group " + className
        controls.appendChild(node)
        return node
    }

    function button(parent,label,className,handler,id="",options={}){
        const node = document.createElement("button")
        node.type = "button"
        node.className = className
        if(options.iconClass){
            node.classList.add("icon-text-button")
            const icon = document.createElement("span")
            icon.className = "button-icon " + options.iconClass
            icon.setAttribute("aria-hidden","true")
            node.appendChild(icon)

            const text = document.createElement("span")
            text.className = "button-label"
            text.textContent = label
            node.appendChild(text)
        }else{
            node.textContent = label
        }
        node.setAttribute("aria-label",options.ariaLabel || label)
        if(options.title) node.title = options.title
        if(id) node.id = id
        node.addEventListener("click",event=>{
            handler(event)
            if(parent.closest?.(".toolbar-menu")) closeFileMenu()
        })
        parent.appendChild(node)
        return node
    }

    function filePicker(parent,label,id,accept,onChange){
        const picker = document.createElement("label")
        picker.className = "file-picker"

        const text = document.createElement("span")
        text.textContent = label
        picker.appendChild(text)

        const input = document.createElement("input")
        input.type = "file"
        input.id = id
        input.accept = accept
        input.addEventListener("change",onChange)
        picker.appendChild(input)
        parent.appendChild(picker)

        return picker
    }

    function addGlyph(node,iconClass,label){
        if(iconClass){
            node.classList.add("icon-text-button")
            const icon = document.createElement("span")
            icon.className = "button-icon " + iconClass
            icon.setAttribute("aria-hidden","true")
            node.appendChild(icon)

            const text = document.createElement("span")
            text.className = "button-label"
            text.textContent = label
            node.appendChild(text)
        }else{
            node.textContent = label
        }
    }

    function menuItem(parent,label,handler,id="",options={}){
        const node = document.createElement("button")
        node.type = "button"
        node.className = "file-menu-item"
        addGlyph(node,options.iconClass,label)
        if(id) node.id = id
        if(options.className) node.classList.add(...options.className.split(" ").filter(Boolean))
        node.addEventListener("click",event=>{
            event.stopPropagation()
            handler()
            closeFileMenu()
        })
        parent.appendChild(node)
        return node
    }

    function menuSection(parent,label){
        const node = document.createElement("div")
        node.className = "file-menu-section"
        node.textContent = label
        parent.appendChild(node)
        return node
    }

    function closeFileMenu(){
        closeOpenFileMenus()
    }

    function menuButton(parent,label,id="",iconClass=""){
        const wrap = document.createElement("div")
        wrap.className = "toolbar-menu-wrap file-menu-wrap"
        parent.appendChild(wrap)

        const trigger = document.createElement("button")
        trigger.type = "button"
        if(id) trigger.id = id
        trigger.className = "secondary file-menu-button toolbar-menu-button"
        addGlyph(trigger,iconClass,label)
        trigger.setAttribute("aria-haspopup","true")
        trigger.setAttribute("aria-expanded","false")
        trigger.addEventListener("click",event=>{
            event.stopPropagation()
            revealRibbon()
            const wasOpen = wrap.classList.contains("is-open")
            closeOpenFileMenus()
            wrap.classList.toggle("is-open",!wasOpen)
            trigger.setAttribute("aria-expanded",String(!wasOpen))
            document.querySelector(".outlook-topbar")?.classList.toggle("ribbon-menu-open",!wasOpen)
            if(!wasOpen) enforceRibbonFlyout(menu,trigger)
        })
        wrap.appendChild(trigger)

        const menu = document.createElement("div")
        menu.className = "file-menu toolbar-menu ribbon-window-menu"
        menu.setAttribute("role","menu")
        menu.addEventListener("click",event=>event.stopPropagation())
        wrap.appendChild(menu)

        return menu
    }

    function appendExportScope(parent){
        const exportScope = document.createElement("label")
        exportScope.className = "export-scope file-menu-scope"
        const exportLabel = document.createElement("span")
        exportLabel.textContent = "Scope"
        exportScope.appendChild(exportLabel)
        const exportSelect = document.createElement("select")
        exportSelect.id = "exportScope"
        EXPORT_SCOPE_OPTIONS.forEach(([value,label])=>{
            const option = document.createElement("option")
            option.value = value
            option.textContent = label
            exportSelect.appendChild(option)
        })
        exportSelect.value = exportScopeValue
        exportSelect.addEventListener("change",savePlannerState)
        exportScope.appendChild(exportSelect)
        parent.appendChild(exportScope)
    }

    const builders = {
        file(item){
            const fileGroup = group("file-tools")
            const fileMenu = menuButton(fileGroup,item.label,"fileMenuButton","icon-file-menu")
            fileMenu.classList.add("file-backstage-menu")

            menuSection(fileMenu,"Project")
            menuItem(fileMenu,"Save",saveProject,"",{iconClass:"icon-save"})
            menuItem(fileMenu,"Save As",saveProjectAs,"",{iconClass:"icon-save-as"})
            menuItem(fileMenu,"Set Save Location",chooseSaveLocation,"",{iconClass:"icon-folder"})
            menuItem(fileMenu,autosaveEnabled ? "Autosave On" : "Autosave Off",toggleAutosave,"autosaveMenuButton",{iconClass:"icon-autosave"})
            menuItem(fileMenu,"Open / Restore Backup",triggerProjectOpen,"",{iconClass:"icon-open"})

            menuSection(fileMenu,"Backup")
            menuItem(fileMenu,"Back up a Copy",backupProjectCopy,"",{iconClass:"icon-cloud-upload"})

            const saveStatus = document.createElement("span")
            saveStatus.className = "save-status file-menu-status"
            saveStatus.id = "saveStatus"
            saveStatus.textContent = "Autosaved locally"
            fileMenu.appendChild(saveStatus)
        },
        edit(item){
            const editGroup = group("edit-tools")
            const editMenu = menuButton(editGroup,item.label,"","icon-edit")
            menuSection(editMenu,"Blocks")
            menuItem(editMenu,"Add Block",addBlock,"",{iconClass:"icon-add"})
            menuItem(editMenu,"Edit Selected",editSelectedBlock,"",{iconClass:"icon-edit"})
            menuItem(editMenu,"Undo",undoLastChange,"undoButton",{iconClass:"icon-undo"})
            menuItem(editMenu,"Redo",redoLastChange,"redoButton",{iconClass:"icon-redo"})
            menuItem(editMenu,"Delete Selected",deleteSelectedBlocks,"",{iconClass:"icon-trash",className:"danger"})
            menuItem(editMenu,"Delete All",deleteAllBlocks,"",{iconClass:"icon-trash",className:"danger"})
            menuSection(editMenu,"Selection")
            menuItem(editMenu,"Select All",selectAllBlocks,"",{iconClass:"icon-select-all"})
            menuItem(editMenu,"All Calendar",selectAllCalendarEvents,"",{iconClass:"icon-calendar-check"})
            menuItem(editMenu,"Clear Selection",clearSelection,"",{iconClass:"icon-clear"})
            menuSection(editMenu,"Clipboard")
            menuItem(editMenu,"Copy",copySelectedBlock,"",{iconClass:"icon-copy"})
            menuItem(editMenu,"Cut",cutSelectedBlock,"",{iconClass:"icon-cut"})
            menuItem(editMenu,"Paste",pasteBlock,"",{iconClass:"icon-paste"})
            const selectionStatus = document.createElement("span")
            selectionStatus.className = "selection-status"
            selectionStatus.id = "selectionStatus"
            selectionStatus.textContent = "No selection"
            editMenu.appendChild(selectionStatus)
        },
        calendar(item){
            const calendarGroup = group("calendar-tools")
            const calendarMenu = menuButton(calendarGroup,item.label,"calendarMenuButton","icon-calendar")
            menuSection(calendarMenu,"Import")
            menuItem(calendarMenu,"Import Calendar",triggerCalendarFilePicker,"",{iconClass:"icon-import"})
            menuItem(calendarMenu,"Import Filters",openImportFilterEditor,"",{iconClass:"icon-filter"})
            menuSection(calendarMenu,"Review")
            menuItem(calendarMenu,"Review Conflicts",openConflictReviewFromImport,"",{iconClass:"icon-calendar-check"})
            menuSection(calendarMenu,"Calendar Sync")
            googleCalendarMenuEntries().forEach(entry=>menuItem(calendarMenu,entry.label,entry.handler,"",{iconClass:entry.iconClass}))
            menuSection(calendarMenu,"Export")
            menuItem(calendarMenu,"Export Calendar",exportICS,"",{iconClass:"icon-export"})
            menuItem(calendarMenu,"Export PDF",exportPDF,"",{iconClass:"icon-pdf"})
            menuItem(calendarMenu,"Export PDF (OT only)",exportWeekOtPDF,"",{iconClass:"icon-pdf"})
            menuItem(calendarMenu,"Export CSV",exportCSV,"",{iconClass:"icon-export"})
            appendExportScope(calendarMenu)
            menuSection(calendarMenu,"Remove")
            menuItem(calendarMenu,"Remove Imported Calendar",removeImportedCalendar,"",{iconClass:"icon-trash",className:"danger"})
        },
        view(item){
            const viewGroup = group("view-tools")
            const viewMenu = menuButton(viewGroup,item.label,"viewMenuButton","icon-view")
            menuSection(viewMenu,"Navigate")
            button(viewMenu,"Current Week","secondary file-menu-item",goToCurrentWeek,"",{iconClass:"icon-current-week",title:"Jump to current week"})
            button(viewMenu,"Previous Month","secondary file-menu-item",()=>changeMonth(-1),"",{iconClass:"icon-prev",ariaLabel:"Previous month",title:"Previous month"})
            button(viewMenu,"Next Month","secondary file-menu-item",()=>changeMonth(1),"",{iconClass:"icon-next",ariaLabel:"Next month",title:"Next month"})
            menuSection(viewMenu,"Views")
            button(viewMenu,"Work Week","secondary file-menu-item",()=>setPlannerView("workweek"),"workWeekViewButton",{iconClass:"icon-week-view",ariaLabel:"Work week view",title:"Work week view"})
            button(viewMenu,"Week","secondary file-menu-item",()=>setPlannerView("week"),"weekViewButton",{iconClass:"icon-week-view",ariaLabel:"Week view",title:"Week view"})
            button(viewMenu,"3 Day","secondary file-menu-item",()=>setPlannerView("three-day"),"threeDayViewButton",{iconClass:"icon-week-view",ariaLabel:"3 day view",title:"3 day view"})
            button(viewMenu,"Day Focus","secondary file-menu-item",()=>setPlannerView("day"),"dayViewButton",{iconClass:"icon-week-view",ariaLabel:"Day focus view",title:"Day focus view"})
            button(viewMenu,"Month","secondary file-menu-item",()=>setPlannerView("month"),"monthViewButton",{iconClass:"icon-month-view",ariaLabel:"Month view",title:"Month view"})
            menuSection(viewMenu,"Zoom")
            menuItem(viewMenu,"Zoom In",zoomInTimeline,"zoomInButton",{iconClass:"icon-zoom-in"})
            menuItem(viewMenu,"Zoom Out",zoomOutTimeline,"zoomOutButton",{iconClass:"icon-zoom-out"})
            menuItem(viewMenu,"Reset Zoom",resetTimelineZoom,"resetZoomButton",{iconClass:"icon-zoom-reset"})
            const zoomStatus = document.createElement("span")
            zoomStatus.className = "zoom-status"
            zoomStatus.id = "zoomStatus"
            zoomStatus.textContent = "100%"
            viewMenu.appendChild(zoomStatus)
            menuSection(viewMenu,"Find")
            menuItem(viewMenu,"Open Search",openFullSearch,"fullSearchButton",{iconClass:"icon-search"})
        },
        tools(item){
            const toolsGroup = group("tools-tools")
            const toolsMenu = menuButton(toolsGroup,item.label,"toolsMenuButton","icon-settings")
            menuSection(toolsMenu,"Appearance")
            const darkButton = menuItem(toolsMenu,"Dark Mode",()=>setThemeMode("dark"),"",{iconClass:"icon-moon"})
            darkButton.dataset.themeMode = "dark"
            const lightButton = menuItem(toolsMenu,"Light Mode",()=>setThemeMode("light"),"",{iconClass:"icon-sun"})
            lightButton.dataset.themeMode = "light"
            menuItem(toolsMenu,"Toggle Theme",toggleThemeMode,"",{iconClass:"icon-theme"})
            menuSection(toolsMenu,"Settings")
            menuItem(toolsMenu,"Settings",openSettings,"settingsButton",{iconClass:"icon-settings"})
            menuItem(toolsMenu,"Customize Toolbar",openToolbarCustomizer,"toolbarCustomizeButton",{iconClass:"icon-settings"})
        }
    }

    toolbarSettings
        .filter(item=>item.visible && builders[item.key])
        .forEach(item=>builders[item.key](item))

    updateHistoryButtons()
    document.getElementById("weekViewButton")?.classList.toggle("active-view",plannerView === "week")
    document.getElementById("workWeekViewButton")?.classList.toggle("active-view",plannerView === "workweek")
    document.getElementById("threeDayViewButton")?.classList.toggle("active-view",plannerView === "three-day")
    document.getElementById("dayViewButton")?.classList.toggle("active-view",plannerView === "day")
    document.getElementById("monthViewButton")?.classList.toggle("active-view",plannerView === "month")
    updateAutosaveButton()
    updateThemeButtons()
    updateSelectionStatus()
}

//--------------------------------
// GET SCHEDULE
//--------------------------------
function getSchedule(dayKey=null){
    let height=timelineHeight()

    return [...document.querySelectorAll(".event")]
        .filter(e=>!dayKey || e.dataset.day===dayKey)
        .map(e=>{
            let y=parseFloat(e.dataset.y)||0
            let h=e.offsetHeight

            let start=e.dataset.start !== undefined
                ? parseFloat(e.dataset.start)
                : START_HOUR+(y/height)*HOURS
            let dur=e.dataset.dur !== undefined
                ? parseFloat(e.dataset.dur)
                : (h/height)*HOURS

            return {
                start:Math.round(start*100)/100,
                dur:Math.round(dur*100)/100,
                day:e.dataset.day || currentDay,
                title:e.dataset.title || "Block",
                location:e.dataset.location || "",
                description:e.dataset.description || "",
                gcalId:e.dataset.gcalId || "",
                el:e
            }
        })
        .sort((a,b)=>a.start-b.start)
}

function storedSchedule(day){
    return (weekData[day] || [])
        .map(block=>({
            start:Number(block.start) || START_HOUR,
            dur:Number(block.dur) || 1,
            day,
            title:block.title || "Block",
            location:block.location || "",
            description:block.description || ""
        }))
        .sort((a,b)=>a.start-b.start)
}

function roundBillableHours(hours){
    if(hours <= 0) return 0
    return Math.ceil((hours - 0.0001) / BILLING_INCREMENT) * BILLING_INCREMENT
}

function getWorkedBreakAfter(schedule,index){
    let block = schedule[index]
    let next = schedule[index + 1]
    if(!next) return 0

    let gap = next.start - (block.start + block.dur)
    return gap > 0 && gap <= WORK_BREAK_LIMIT_HOURS + 0.0001 ? gap : 0
}

function applyDailyOvertime(schedule){
    let totalWorkedHours = schedule.reduce((total,block)=>total + block.dur,0)

    schedule.forEach((block,index)=>{
        block.workedBreakAfter = getWorkedBreakAfter(schedule,index)
        block.billableDur = roundBillableHours(block.dur + block.workedBreakAfter)
        block.continuousOvertimeHours = 0
        block.dailyTierOvertimeHours = 0
        block.doubleOvertimeHours = 0
        block.overtimeHours = 0
        block.premiumHours = 0
        block.regularHours = block.billableDur
    })

    if(totalWorkedHours <= DAILY_NO_OVERTIME_LIMIT + 0.0001){
        return schedule
    }

    let dailyTierOvertime = 0
    let regularRemaining = DAILY_REGULAR_HOURS
    let previousBlock = null
    let continuousOvertime = 0
    let dailyElapsed = 0

    schedule.forEach(block=>{
        let extraRegularAllowance = 0
        if(previousBlock){
            let gap = block.start - (previousBlock.start + previousBlock.dur)
            // Keep fragmented blocks in one OT span until there is a full 1-hour break.
            // Explicit exceptions are stored in static/overtime-rules.json.
            extraRegularAllowance = continuousSpanExtraRegularAllowance(previousBlock.billableDur || 0,gap,block.billableDur)
            if(gap >= CONTINUOUS_RESET_BREAK_HOURS - 0.0001){
                regularRemaining = DAILY_REGULAR_HOURS
            }
            if(gap >= DAILY_RESET_BREAK_HOURS - 0.0001){
                dailyElapsed = 0
            }
        }

        let continuousRegular = Math.min(block.billableDur,regularRemaining + extraRegularAllowance)
        block.continuousOvertimeHours = Math.max(block.billableDur - continuousRegular,0)
        continuousOvertime += block.continuousOvertimeHours
        regularRemaining = Math.max(regularRemaining - Math.max(continuousRegular - extraRegularAllowance,0),0)

        let blockStart = dailyElapsed
        let blockEnd = dailyElapsed + block.billableDur
        let overtimeStart = Math.max(blockStart,DAILY_NO_OVERTIME_LIMIT)
        let overtimeEnd = Math.min(blockEnd,DAILY_TIER_OT_END)
        block.dailyTierOvertimeHours = Math.max(0,overtimeEnd - overtimeStart)
        let doubleOvertimeStart = Math.max(blockStart,DAILY_TIER_OT_END)
        block.doubleOvertimeHours = Math.max(0,blockEnd - doubleOvertimeStart)
        dailyTierOvertime += block.dailyTierOvertimeHours
        dailyElapsed = blockEnd
        previousBlock = block
    })

    let useDailyTier = dailyTierOvertime > continuousOvertime
    schedule.forEach(block=>{
        block.overtimeHours = useDailyTier ? block.dailyTierOvertimeHours : block.continuousOvertimeHours
        block.premiumHours = Math.max(block.overtimeHours,block.doubleOvertimeHours || 0)
        block.regularHours = Math.max(block.billableDur - block.premiumHours,0)
    })

    return schedule
}

function calculateBlockOvertime(block){
    return block.overtimeHours ?? (
        block.dur > DAILY_REGULAR_HOURS
            ? Math.max(block.dur-DAILY_REGULAR_HOURS,0)
            : 0
    )
}

function calculateBlockDoubleOvertime(block){
    return block.doubleOvertimeHours || 0
}

function calculateBlockPay(block){
    return (calculateBlockOvertime(block)*OT_RATE) + (calculateBlockDoubleOvertime(block)*DOUBLE_OT_RATE)
}

function calculateDailyPay(schedule){
    applyDailyOvertime(schedule)

    return schedule.reduce((daily,b)=>{
        return daily + calculateBlockPay(b)
    },0)
}

function calculateWeeklyPay(){
    return DAY_ORDER.reduce((total,day)=>{
        return total + calculateDailyPay(getSchedule(day))
    },0)
}

function markScheduleOverlaps(schedule){
    let latestEndingBlock = null

    schedule.forEach(block=>{
        block.hasOverlap = false

        if(latestEndingBlock && block.start < latestEndingBlock.start + latestEndingBlock.dur - 0.0001){
            block.hasOverlap = true
            latestEndingBlock.hasOverlap = true
        }

        if(!latestEndingBlock || block.start + block.dur > latestEndingBlock.start + latestEndingBlock.dur){
            latestEndingBlock = block
        }
    })
}

//--------------------------------
// OT UPDATE
//--------------------------------
function update(options={}){
    let activeDaily=0
    let weeklyTotal=0
    let visibleDays = new Set(visibleTimelineDays())
    let currentDayHasOT = false
    let weekHasOT = false

    DAY_ORDER.forEach(day=>{
        let schedule=visibleDays.has(day) ? getSchedule(day) : storedSchedule(day)
        markScheduleOverlaps(schedule)
        let daily=calculateDailyPay(schedule)
        weeklyTotal += daily

        if(visibleDays.has(day)){
            weekData[day] = schedule.map(b=>({
                start:b.start,
                dur:b.dur,
                title:b.title,
                location:b.location,
                description:b.description
            }))
        }

        schedule.forEach(block=>{
            if(block.el) renderBlock(block)
        })

        let dayOT = schedule.some(b=>(b.overtimeHours||0)>0)
        if(dayOT) weekHasOT = true
        let dayTotal = document.getElementById(day+"-total")
        if(dayTotal) dayTotal.innerText="$"+daily.toFixed(0)
        if(day===currentDay){ activeDaily=daily; currentDayHasOT=dayOT }
    })

    document.getElementById("daily").innerText="$"+activeDaily.toFixed(0)
    document.getElementById("weekly").innerText="$"+weeklyTotal.toFixed(0)
    document.getElementById("daily")?.closest(".earnings-card")?.classList.toggle("has-ot", currentDayHasOT)
    document.getElementById("weekly")?.closest(".earnings-card")?.classList.toggle("has-ot", weekHasOT)

    let monthly = calculateMonthlyTotals()
    let monthlyEl = document.getElementById("monthly")
    if(monthlyEl){
        monthlyEl.innerText="$"+monthly.total.toFixed(0)
        monthlyEl.closest(".earnings-card")?.classList.toggle("has-ot", monthly.hasOT)
    }

    if(options.persist !== false){
        syncSelectedWeekToMonth()
        savePlannerState()
    }
}

//--------------------------------
// RENDER BLOCK
//--------------------------------
function renderBlock(block){

    const el=block.el
    el.innerHTML=""
    el.dataset.dateKey = block.dateKey || ""
    el.classList.toggle("overlap",Boolean(block.hasOverlap))

    let dur=block.dur
    let billableDur=block.billableDur || dur
    let overtime=calculateBlockOvertime(block)
    let premium=block.premiumHours ?? Math.max(overtime,calculateBlockDoubleOvertime(block))
    let regular=block.regularHours ?? (premium>0 ? Math.max(billableDur-premium,0) : dur)

    if(regular>0){
        let d=document.createElement("div")
        d.className="segment"
        d.style.height=(regular/billableDur*100)+"%"
        d.style.background="linear-gradient(135deg, #0f766e 0%, #14b8a6 48%, #86efac 100%)"
        el.appendChild(d)
    }

    if(premium>0){
        let d=document.createElement("div")
        d.className="segment"
        d.style.top=(regular/billableDur*100)+"%"
        d.style.height=(premium/billableDur*100)+"%"
        d.style.background="linear-gradient(135deg, #be185d 0%, #ec4899 48%, #a78bfa 100%)"
        el.appendChild(d)
    }

    let topHandle=document.createElement("div")
    topHandle.className="resize-handle resize-handle-top"
    topHandle.setAttribute("aria-hidden","true")
    el.appendChild(topHandle)

    let bottomHandle=document.createElement("div")
    bottomHandle.className="resize-handle resize-handle-bottom"
    bottomHandle.setAttribute("aria-hidden","true")
    el.appendChild(bottomHandle)

    let editButton=document.createElement("button")
    editButton.type="button"
    editButton.className="event-edit-button"
    editButton.innerText="Edit"
    editButton.setAttribute("aria-label","Edit block")
    editButton.addEventListener("pointerdown",event=>event.stopPropagation())
    editButton.addEventListener("click",event=>{
        event.stopPropagation()
        selectBlock(el)
        openBlockEditor(el)
    })
    el.appendChild(editButton)

    let copyButton=document.createElement("button")
    copyButton.type="button"
    copyButton.className="event-edit-button event-copy-button"
    copyButton.innerText="Copy"
    copyButton.setAttribute("aria-label","Copy block details to clipboard")
    copyButton.addEventListener("pointerdown",event=>event.stopPropagation())
    copyButton.addEventListener("click",event=>{
        event.stopPropagation()
        openBlockCopyMenu(block,copyButton)
    })
    el.appendChild(copyButton)

    let label=document.createElement("div")
    label.className="label"

    let title=document.createElement("div")
    title.className="event-title"
    title.innerText=block.title || "Block"
    label.appendChild(title)

    let time=document.createElement("div")
    time.className="event-meta"
    time.innerText=formatTime(block.start)+" - "+formatTime(block.start+block.dur)+" | $"+calculateBlockPay(block).toFixed(0)
    label.appendChild(time)

    if(block.hasOverlap){
        let warning=document.createElement("div")
        warning.className="overlap-warning"
        warning.innerText="Overlaps another block"
        label.appendChild(warning)
    }

    if(block.location){
        let location=document.createElement("div")
        location.className="event-detail"
        location.innerText=block.location
        label.appendChild(location)
    }

    if(block.description){
        let description=document.createElement("div")
        description.className="event-detail"
        description.innerText=block.description
        label.appendChild(description)
    }

    el.title=[
        block.title || "Block",
        formatTime(block.start)+" - "+formatTime(block.start+block.dur),
        block.hasOverlap ? "Overlaps another block" : "",
        block.location,
        block.description
    ].filter(Boolean).join("\n")

    el.appendChild(label)
}

// Resolve a block's calendar date: from its own dateKey, else the selected
// week's date for the block's weekday (week-view blocks carry `day`, not dateKey).
function blockDate(block){
    if(block.dateKey){
        let d = parseDateKey(block.dateKey)
        if(d && !isNaN(d.getTime())) return d
    }
    if(block.day){
        let idx = DAY_ORDER.indexOf(block.day)
        let ws = selectedWeekStartKey ? parseDateKey(selectedWeekStartKey) : startOfPlannerWeek(new Date())
        if(idx >= 0 && ws && !isNaN(ws.getTime())) return addDays(ws, idx)
    }
    return null
}

// Build the clipboard payload for a single block, matching what the block shows.
// Returns both plain text (for plain fields) and HTML (for rich paste into
// email / Word / Slack).
function eventClipboardPayload(block){
    let timeRange = formatTime(block.start)+" - "+formatTime(block.start+block.dur)
    let pay = calculateBlockPay(block)
    let dateLabel = ""
    let d = blockDate(block)
    if(d) dateLabel = d.toLocaleDateString([], {weekday:"long", month:"long", day:"numeric", year:"numeric"})
    let ot = calculateBlockOvertime(block)
    let dbl = calculateBlockDoubleOvertime(block)

    let payLine = "Pay: "+formatCurrencyAmount(pay)
    let otBits = []
    if(ot > 0) otBits.push((+ot.toFixed(2))+"h OT")
    if(dbl > 0) otBits.push((+dbl.toFixed(2))+"h double OT")
    if(otBits.length) payLine += " ("+otBits.join(", ")+")"

    let lines = [block.title || "Block"]
    let subLine = [dateLabel,timeRange].filter(Boolean).join(" · ")
    if(subLine) lines.push(subLine)
    if(block.location) lines.push(block.location)
    if(block.description) lines.push(block.description)
    lines.push(payLine)
    let text = lines.join("\n")

    let esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    let htmlLines = ["<strong>"+esc(block.title || "Block")+"</strong>"]
    let htmlSub = [dateLabel,timeRange].filter(Boolean).map(esc).join(" &middot; ")
    if(htmlSub) htmlLines.push(htmlSub)
    if(block.location) htmlLines.push(esc(block.location))
    if(block.description) htmlLines.push(esc(block.description))
    htmlLines.push(esc(payLine))
    let html = "<div>"+htmlLines.join("<br>")+"</div>"

    return {text,html}
}

async function writeRichClipboard(text,html){
    try{
        if(navigator.clipboard && window.ClipboardItem){
            await navigator.clipboard.write([new ClipboardItem({
                "text/plain": new Blob([text],{type:"text/plain"}),
                "text/html":  new Blob([html],{type:"text/html"})
            })])
            return true
        }
    }catch(e){ /* fall through to plain text */ }
    try{
        if(navigator.clipboard && navigator.clipboard.writeText){
            await navigator.clipboard.writeText(text)
            return true
        }
    }catch(e){ /* fall through to legacy */ }
    try{
        let ta = document.createElement("textarea")
        ta.value = text
        ta.setAttribute("readonly","")
        ta.style.position = "fixed"
        ta.style.top = "-1000px"
        ta.style.opacity = "0"
        document.body.appendChild(ta)
        ta.select()
        let ok = document.execCommand("copy")
        document.body.removeChild(ta)
        return ok
    }catch(e){ return false }
}

async function copyPlainText(text){
    try{
        if(navigator.clipboard && navigator.clipboard.writeText){
            await navigator.clipboard.writeText(text)
            return true
        }
    }catch(e){ /* fall through to legacy */ }
    try{
        let ta = document.createElement("textarea")
        ta.value = text
        ta.setAttribute("readonly","")
        ta.style.position = "fixed"
        ta.style.top = "-1000px"
        ta.style.opacity = "0"
        document.body.appendChild(ta)
        ta.select()
        let ok = document.execCommand("copy")
        document.body.removeChild(ta)
        return ok
    }catch(e){ return false }
}

// URL of the ABT Overtime Submission JotForm the user fills from these blocks.
const OVERTIME_FORM_URL = "https://form.jotform.com/240808251184050"

// Per-user details prepended to the copy menu so the whole form is one paste
// pass. These are entered per device in Settings and stored in localStorage
// (key "abtOvertimeProfile") — never hardcoded, since each app user is different.
const FORM_PROFILE_DEFAULT = {
    firstName: "",
    lastName: "",
    email: "",
    position: ""
}

function getFormProfile(){
    try{
        let saved = JSON.parse(localStorage.getItem("abtOvertimeProfile") || "null")
        if(saved && typeof saved === "object") return {...FORM_PROFILE_DEFAULT, ...saved}
    }catch(e){ /* fall back to defaults */ }
    return FORM_PROFILE_DEFAULT
}

function loadFormProfile(){
    let p = getFormProfile()
    let set = (id,val)=>{ let el = document.getElementById(id); if(el) el.value = val || "" }
    set("otFormFirstName", p.firstName)
    set("otFormLastName", p.lastName)
    set("otFormEmail", p.email)
    set("otFormPosition", p.position)
}

function saveFormProfile(){
    let get = id => (document.getElementById(id)?.value || "").trim()
    let profile = {
        firstName: get("otFormFirstName"),
        lastName:  get("otFormLastName"),
        email:     get("otFormEmail"),
        position:  get("otFormPosition")
    }
    try{ localStorage.setItem("abtOvertimeProfile", JSON.stringify(profile)) }catch(e){}
}

// One entry per pasteable field, so a block can be filled into the overtime
// JotForm one field at a time. The form's per-event fields (Date of Work,
// Schedule, Comments) are listed first and labelled to match the form; the rest
// are extra values that may be useful. Only fields with a value are included.
function blockCopyFields(block){
    let timeRange = formatTime(block.start)+" - "+formatTime(block.start + block.dur)
    let dateMDY = ""
    let dayName = ""
    let d = blockDate(block)
    if(d){
        dateMDY  = d.toLocaleDateString("en-US")
        dayName  = d.toLocaleDateString("en-US",{weekday:"long"})
    }
    let comments = block.title || "Block"
    if(block.location) comments += " ("+block.location+")"

    let profile = getFormProfile()
    let fields = []
    if(profile.firstName) fields.push({label:"First Name", value: profile.firstName})
    if(profile.lastName)  fields.push({label:"Last Name",  value: profile.lastName})
    if(profile.email)     fields.push({label:"Email",      value: profile.email})
    if(profile.position)  fields.push({label:"Position",   value: profile.position})
    if(dateMDY) fields.push({label:"Date of Work", value: dateMDY})
    fields.push({label:"Schedule", value: timeRange})
    fields.push({label:"Comments", value: comments})
    fields.push({label:"Title", value: block.title || "Block"})
    if(dayName) fields.push({label:"Day", value: dayName})
    fields.push({label:"Start", value: formatTime(block.start)})
    fields.push({label:"End", value: formatTime(block.start + block.dur)})
    fields.push({label:"Hours", value: String(+block.dur.toFixed(2))})
    if(block.location) fields.push({label:"Location", value: block.location})
    if(block.description) fields.push({label:"Notes", value: block.description})
    let ot = calculateBlockOvertime(block)
    if(ot > 0) fields.push({label:"OT hours", value: String(+ot.toFixed(2))})
    let dbl = calculateBlockDoubleOvertime(block)
    if(dbl > 0) fields.push({label:"Double OT hours", value: String(+dbl.toFixed(2))})
    let pay = calculateBlockPay(block)
    if(pay > 0) fields.push({label:"OT pay", value: formatCurrencyAmount(pay)})
    return fields
}

let blockCopyMenuEl = null

function closeBlockCopyMenu(){
    if(!blockCopyMenuEl) return
    blockCopyMenuEl.remove()
    blockCopyMenuEl = null
    document.removeEventListener("pointerdown", _blockCopyMenuOutside, true)
    document.removeEventListener("keydown", _blockCopyMenuKey, true)
    window.removeEventListener("resize", closeBlockCopyMenu)
    document.getElementById("timeline-container")?.removeEventListener("scroll", closeBlockCopyMenu)
}

function _blockCopyMenuOutside(e){
    if(blockCopyMenuEl && !blockCopyMenuEl.contains(e.target)) closeBlockCopyMenu()
}

function _blockCopyMenuKey(e){
    if(e.key === "Escape") closeBlockCopyMenu()
}

function _flagFieldCopied(btn, ok){
    let status = btn.querySelector(".block-copy-status")
    if(!status){
        status = document.createElement("span")
        status.className = "block-copy-status"
        btn.appendChild(status)
    }
    status.textContent = ok ? "✓" : "Ctrl+C"
    setSaveStatus(ok ? "Copied to clipboard" : "Couldn't copy — clipboard blocked")
    clearTimeout(btn._copyTimer)
    btn._copyTimer = setTimeout(()=>{ if(status) status.textContent = "" }, 1500)
}

function openBlockCopyMenu(block, anchorBtn){
    closeBlockCopyMenu()

    let menu = document.createElement("div")
    menu.className = "block-copy-menu"
    menu.setAttribute("role","menu")

    let heading = document.createElement("div")
    heading.className = "block-copy-menu-title"
    heading.textContent = "Copy a field"
    menu.appendChild(heading)

    let allBtn = document.createElement("button")
    allBtn.type = "button"
    allBtn.className = "block-copy-menu-item block-copy-menu-all"
    let allLabel = document.createElement("span")
    allLabel.className = "block-copy-field"
    allLabel.textContent = "Everything"
    allBtn.appendChild(allLabel)
    allBtn.addEventListener("click", async ()=>{
        let {text,html} = eventClipboardPayload(block)
        _flagFieldCopied(allBtn, await writeRichClipboard(text,html))
    })
    menu.appendChild(allBtn)

    blockCopyFields(block).forEach(f=>{
        let item = document.createElement("button")
        item.type = "button"
        item.className = "block-copy-menu-item"
        let lab = document.createElement("span")
        lab.className = "block-copy-field"
        lab.textContent = f.label
        let val = document.createElement("span")
        val.className = "block-copy-value"
        val.textContent = f.value
        item.appendChild(lab)
        item.appendChild(val)
        item.addEventListener("click", async ()=>{
            _flagFieldCopied(item, await copyPlainText(f.value))
        })
        menu.appendChild(item)
    })

    let formLink = document.createElement("a")
    formLink.className = "block-copy-menu-link"
    formLink.href = OVERTIME_FORM_URL
    formLink.target = "_blank"
    formLink.rel = "noopener"
    formLink.textContent = "Open overtime form ↗"
    menu.appendChild(formLink)

    document.body.appendChild(menu)

    let rect = (anchorBtn || document.body).getBoundingClientRect()
    let mw = menu.offsetWidth
    let mh = menu.offsetHeight
    let left = Math.min(rect.left, window.innerWidth - mw - 8)
    let top = rect.bottom + 6
    if(top + mh > window.innerHeight - 8) top = Math.max(8, rect.top - mh - 6)
    menu.style.left = Math.max(8, left) + "px"
    menu.style.top = Math.max(8, top) + "px"

    blockCopyMenuEl = menu
    setTimeout(()=>{
        document.addEventListener("pointerdown", _blockCopyMenuOutside, true)
        document.addEventListener("keydown", _blockCopyMenuKey, true)
        window.addEventListener("resize", closeBlockCopyMenu)
        document.getElementById("timeline-container")?.addEventListener("scroll", closeBlockCopyMenu)
    }, 0)
}

function formatTime(value){
    let hour=Math.floor(value)
    let minute=Math.round((value-hour)*60)

    if(minute===60){
        hour++
        minute=0
    }

    let suffix=hour>=12 ? "PM" : "AM"
    let displayHour=hour%12 || 12

    return displayHour+":"+String(minute).padStart(2,"0")+" "+suffix
}

function formatTimeRange(start, end){
    let startH = Math.floor(start), startM = Math.round((start-startH)*60)
    if(startM===60){startH++;startM=0}
    let endH = Math.floor(end), endM = Math.round((end-endH)*60)
    if(endM===60){endH++;endM=0}
    let endSuffix = endH >= 12 ? "PM" : "AM"
    let startDisp = (startH%12||12)+":"+(String(startM).padStart(2,"0"))
    let endDisp = (endH%12||12)+":"+(String(endM).padStart(2,"0"))+" "+endSuffix
    return startDisp+"–"+endDisp
}

//--------------------------------
timeline.addEventListener("click", e=>{
    if(suppressTimelineClick){
        suppressTimelineClick = false
        return
    }
    if(lastTimelinePointerType === "touch" && suppressNextTouchTimelineClick){
        suppressNextTouchTimelineClick = false
        return
    }
    if(lastTimelinePointerType === "pen" && penTimelineTap){
        penTimelineTap = null
        return
    }

    if(!e.target.closest(".event") && getDayColumnAtPoint(e.clientX,e.clientY)){
        addBlockAtTimelinePoint(e,isDirectPointer({pointerType:lastTimelinePointerType}))
        return
    }

    if(!e.target.closest(".event")){
        selectBlock(null)
    }
})

timeline.addEventListener("pointerdown", e=>{
    lastTimelinePointerType = e.pointerType || "mouse"

    if(isTouchPointer(e) && !e.target.closest(".event")){
        let scroller = document.getElementById("timeline-container")
        touchTimelineStart = {
            x:e.clientX,
            y:e.clientY,
            scrollLeft:scroller?.scrollLeft || 0,
            scrollTop:scroller?.scrollTop || 0
        }
    }

    if(e.button !== 0 || e.target.closest(".event")) return
    if(isTouchPointer(e)) return

    e.preventDefault()

    let dayColumn = e.target.closest(".day-column")
    if(dayColumn){
        currentDay = dayColumn.dataset.day
        updateActiveDay()
        update()
    }

    let timelineRect = timeline.getBoundingClientRect()
    let startX = e.clientX - timelineRect.left
    let startY = e.clientY - timelineRect.top
    let baseSelection = new Set(getSelectedBlocks())
    let additive = e.shiftKey || e.ctrlKey || e.metaKey
    let didDragSelection = false
    let selectionStarted = false
    let startPointer = {
        x:e.clientX,
        y:e.clientY,
        pointerType:e.pointerType || "mouse"
    }

    if(!additive) clearSelection()

    function ensureSelectionBox(){
        if(selectionStarted) return
        selectionStarted = true
        selectionBox = document.createElement("div")
        selectionBox.className = "selection-box"
        selectionBox.style.left = startX+"px"
        selectionBox.style.top = startY+"px"
        selectionBox.style.width = "0px"
        selectionBox.style.height = "0px"
        timeline.appendChild(selectionBox)
        document.body.classList.add("selecting-blocks")
    }

    function onPointerMove(moveEvent){
        moveEvent.preventDefault()

        let currentX = moveEvent.clientX - timelineRect.left
        let currentY = moveEvent.clientY - timelineRect.top
        let left = Math.min(startX,currentX)
        let top = Math.min(startY,currentY)
        let width = Math.abs(currentX-startX)
        let height = Math.abs(currentY-startY)
        didDragSelection = didDragSelection || width > pointerMoveThreshold(startPointer) || height > pointerMoveThreshold(startPointer)
        if(!didDragSelection) return
        ensureSelectionBox()

        selectionBox.style.left = left+"px"
        selectionBox.style.top = top+"px"
        selectionBox.style.width = width+"px"
        selectionBox.style.height = height+"px"

        updateSelectionFromBox(selectionBox.getBoundingClientRect(),baseSelection,additive)
    }

    function onPointerUp(){
        document.body.classList.remove("selecting-blocks")
        document.removeEventListener("pointermove",onPointerMove)
        document.removeEventListener("pointerup",onPointerUp)
        document.removeEventListener("pointercancel",onPointerUp)

        if(selectionBox){
            selectionBox.remove()
            selectionBox = null
        }

        if(isPenPointer(startPointer) && !didDragSelection && getDayColumnAtPoint(startPointer.x,startPointer.y)){
            penTimelineTap = true
            addBlockAtTimelinePoint(startPointer,true)
            suppressTimelineClick = true
            return
        }

        suppressTimelineClick = didDragSelection
    }

    document.addEventListener("pointermove",onPointerMove)
    document.addEventListener("pointerup",onPointerUp)
    document.addEventListener("pointercancel",onPointerUp)
})

timeline.addEventListener("pointerup", e=>{
    if(e.pointerType !== "touch" || !touchTimelineStart) return
    let scroller = document.getElementById("timeline-container")
    let moved = Math.hypot(e.clientX - touchTimelineStart.x,e.clientY - touchTimelineStart.y)
    let scrolled = Math.abs((scroller?.scrollLeft || 0) - touchTimelineStart.scrollLeft) + Math.abs((scroller?.scrollTop || 0) - touchTimelineStart.scrollTop)
    suppressNextTouchTimelineClick = moved > 18 || scrolled > 8
    touchTimelineStart = null
},{passive:true})

timeline.addEventListener("pointercancel", e=>{
    if(e.pointerType !== "touch") return
    suppressNextTouchTimelineClick = true
    touchTimelineStart = null
},{passive:true})

timeline.addEventListener("dblclick", e=>{
    if(e.target.closest(".event")) return

    if(getDayColumnAtPoint(e.clientX,e.clientY)){
        e.preventDefault()
    }
})

// ---------------------------------------------------------------------------
// Google Calendar two-way sync
// ---------------------------------------------------------------------------

let gcalConnected = false

async function initGCal(){
    gcalLoadIcsUrl()
    try{
        let resp = await fetch("/gcal/status")
        if(!resp.ok) return
        let data = await resp.json()
        gcalConnected = data.connected || false
        _gcalUpdateUI(data)
        if(new URLSearchParams(location.search).get("gcal_error") === "not_configured"){
            _gcalShowResult("Google Calendar credentials are not yet configured on the server.", true)
            history.replaceState(null,"",location.pathname)
        }
    }catch(e){
        // Running as file:// or server not available — hide gcal UI silently
    }
    if(gcalIcsHasUrl()){
        if(gcalIcsAutoSyncEnabled()){
            startGcalIcsAutoSync()
            setTimeout(()=> gcalIcsAutoSyncTick("open"), 800)   // initial month pull on open
        }else{
            setTimeout(()=> gcalIcsPull(true), 800)             // one-time week pull when auto-sync is off
        }
    }
}

// Re-sync when the user returns to the planner tab (throttled inside the tick).
document.addEventListener("visibilitychange", ()=>{
    if(document.visibilityState === "visible") gcalIcsAutoSyncTick("refocus")
})
window.addEventListener("focus", ()=> gcalIcsAutoSyncTick("refocus"))

const GCAL_ICS_URL_KEY = "gcalIcsUrl"
const GCAL_ICS_AUTO_SYNC_KEY = "gcalIcsAutoSync"
const GCAL_ICS_LAST_SYNC_KEY = "gcalIcsLastSync"
const GCAL_ICS_AUTO_SYNC_INTERVAL_MS = 30 * 60 * 1000   // 30 minutes
const GCAL_ICS_REFOCUS_MIN_GAP_MS = 5 * 60 * 1000       // don't re-pull on focus more than once / 5 min
let gcalIcsAutoSyncTimer = null
let gcalIcsAutoSyncing = false
let gcalIcsLastAutoSyncAt = 0

function gcalIcsHasUrl(){
    return Boolean(localStorage.getItem(GCAL_ICS_URL_KEY))
}

function gcalIcsAutoSyncEnabled(){
    return localStorage.getItem(GCAL_ICS_AUTO_SYNC_KEY) === "1" && gcalIcsHasUrl()
}

function _gcalSetIcsControlsDisabled(){
    let hasUrl = gcalIcsHasUrl()
    ;["gcalIcsPullButton","gcalIcsPullMonthButton","gcalIcsPullAllButton"].forEach(id=>{
        let btn = document.getElementById(id)
        if(btn) btn.disabled = !hasUrl
    })
    let toggle = document.getElementById("gcalIcsAutoSyncInput")
    if(toggle){
        toggle.disabled = !hasUrl
        toggle.checked = hasUrl && localStorage.getItem(GCAL_ICS_AUTO_SYNC_KEY) === "1"
    }
}

function gcalLoadIcsUrl(){
    let url = localStorage.getItem(GCAL_ICS_URL_KEY) || ""
    let input = document.getElementById("gcalIcsUrl")
    if(input) input.value = url
    _gcalSetIcsControlsDisabled()
    updateGcalIcsLastSyncLabel()
}

function gcalSaveIcsUrl(){
    let url = (document.getElementById("gcalIcsUrl")?.value || "").trim()
    if(url) localStorage.setItem(GCAL_ICS_URL_KEY, url)
    else localStorage.removeItem(GCAL_ICS_URL_KEY)
    _gcalSetIcsControlsDisabled()
    // Clearing the URL turns auto-sync off so a stale timer can't keep firing.
    if(!url) stopGcalIcsAutoSync()
    else if(gcalIcsAutoSyncEnabled()) startGcalIcsAutoSync()
    updateGcalIcsLastSyncLabel()
}

function gcalToggleIcsAutoSync(enabled){
    localStorage.setItem(GCAL_ICS_AUTO_SYNC_KEY, enabled ? "1" : "")
    if(enabled && gcalIcsHasUrl()){
        startGcalIcsAutoSync()
        gcalIcsAutoSyncTick("enabled")   // sync immediately on enable
    }else{
        stopGcalIcsAutoSync()
    }
    updateGcalIcsLastSyncLabel()
}

function startGcalIcsAutoSync(){
    stopGcalIcsAutoSync()
    if(!gcalIcsAutoSyncEnabled()) return
    gcalIcsAutoSyncTimer = setInterval(()=> gcalIcsAutoSyncTick("interval"), GCAL_ICS_AUTO_SYNC_INTERVAL_MS)
}

function stopGcalIcsAutoSync(){
    if(gcalIcsAutoSyncTimer){
        clearInterval(gcalIcsAutoSyncTimer)
        gcalIcsAutoSyncTimer = null
    }
}

async function gcalIcsAutoSyncTick(reason){
    if(!gcalIcsAutoSyncEnabled()) return
    if(gcalIcsAutoSyncing) return
    if(typeof navigator !== "undefined" && navigator.onLine === false) return
    if(document.visibilityState === "hidden") return
    // Refocus/open triggers are throttled so tab-flipping can't spam the server.
    if(reason === "refocus" && Date.now() - gcalIcsLastAutoSyncAt < GCAL_ICS_REFOCUS_MIN_GAP_MS) return

    gcalIcsAutoSyncing = true
    try{
        await gcalIcsPull(true, true)   // silent, current month
    }catch(e){
        console.warn("iCal auto-sync failed:", e)
    }finally{
        gcalIcsAutoSyncing = false
    }
}

function updateGcalIcsLastSyncLabel(){
    let el = document.getElementById("gcalIcsLastSync")
    if(!el) return
    if(!gcalIcsHasUrl()){ el.textContent = ""; return }
    let auto = localStorage.getItem(GCAL_ICS_AUTO_SYNC_KEY) === "1"
    let iso = localStorage.getItem(GCAL_ICS_LAST_SYNC_KEY)
    let last = iso
        ? "Last auto-synced " + new Date(iso).toLocaleString([], {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"})
        : "Not auto-synced yet on this device"
    el.textContent = auto ? last : "Auto-sync is off — using the buttons above pulls on demand."
}

async function gcalIcsPull(silent = false, range = false){
    let url = (document.getElementById("gcalIcsUrl")?.value || "").trim()
    if(!url){ if(!silent) _gcalShowResult("Paste an iCal URL first.", true); return }

    // range: false/'week' = current week, true/'month' = current month, 'all' = full calendar
    let rangeMode = range === "all" ? "all" : (range ? "month" : "week")
    let scopeLabel = rangeMode === "all" ? "calendar" : rangeMode
    let monthRange = rangeMode !== "week" // events outside the current week land in monthEvents

    let anchorDate = selectedWeekStartKey ? parseDateKey(selectedWeekStartKey) : startOfPlannerWeek(new Date())
    let rangeStart, rangeEnd
    if(rangeMode === "all"){
        rangeStart = new Date(anchorDate.getFullYear() - 1, 0, 1)
        rangeEnd   = new Date(anchorDate.getFullYear() + 2, 0, 1)
    }else if(rangeMode === "month"){
        // Span every month the visible week touches, not just the month of the
        // week's Monday. Otherwise a week straddling a boundary (e.g. Jun 29–Jul 5)
        // — or any sync run on the 1st of a month — pulls the previous month and
        // silently drops the days the user is actually looking at, since the
        // server filters events to [start, end). See analyzer/_parse_ics window.
        let weekEndDate = addDays(anchorDate, 6)
        rangeStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
        rangeEnd   = new Date(weekEndDate.getFullYear(), weekEndDate.getMonth() + 1, 1)
    }else{
        rangeStart = anchorDate
        rangeEnd   = addDays(anchorDate, 7)
    }

    if(!silent) setSaveStatus("Fetching "+scopeLabel+" iCal events…")
    let resp
    try{
        resp = await fetch(
            `/gcal/ics-pull?url=${encodeURIComponent(url)}&start=${encodeURIComponent(rangeStart.toISOString())}&end=${encodeURIComponent(rangeEnd.toISOString())}`
        )
    }catch(e){
        if(!silent){ setSaveStatus("iCal fetch failed"); _gcalShowResult("Network error — could not reach server.", true) }
        return
    }
    if(!resp.ok){
        if(!silent){
            let err = await resp.json().catch(()=>({}))
            _gcalShowResult(err.error || "Failed to fetch iCal events.", true)
            setSaveStatus("iCal sync failed")
        }
        return
    }

    let data = await resp.json()
    // Record a successful fetch so the auto-sync label and refocus throttle stay current.
    gcalIcsLastAutoSyncAt = Date.now()
    try{ localStorage.setItem(GCAL_ICS_LAST_SYNC_KEY, new Date().toISOString()) }catch(e){}
    updateGcalIcsLastSyncLabel()

    let events = data.events || []
    let existingIds = _gcalExistingIds()
    let existingSignatures = _gcalExistingSignatures(anchorDate)
    let added = 0

    let weekStart = anchorDate
    let weekEnd   = addDays(weekStart, 7)

    for(let event of events){
        if(!event.start?.dateTime) continue
        if(!isImportRelevantEvent(event.summary || "", event.location || "", event.description || "")) continue
        // Skip events already present by calendar UID (re-syncing the same feed).
        if(event.id && existingIds.has(event.id)) continue

        let startDate  = new Date(event.start.dateTime)
        let endDate    = new Date(event.end?.dateTime || event.start.dateTime)
        let dayIndex   = (startDate.getDay() + 6) % 7
        let day        = DAY_ORDER[dayIndex]
        let eventDKey  = dateKey(startDate)
        let startHour  = startDate.getHours() + startDate.getMinutes() / 60
        let durHours   = Math.max(SNAP, (endDate - startDate) / 3600000)
        let block = {
            start:startHour, dur:durHours,
            title:event.summary || "Block",
            location:event.location || "",
            description:event.description || "",
            gcalId:event.id
        }

        // Semantic guard: same date + time + duration + title means it's the
        // same event even if its UID changed or it was imported from a file.
        let signature = eventDKey + "|" + plannerBlockSignature(block)
        if(existingSignatures.has(signature)) continue

        if(startDate >= weekStart && startDate < weekEnd){
            if(!weekData[day]) weekData[day] = []
            weekData[day].push(block)
        }else if(monthRange){
            if(!monthEvents[eventDKey]) monthEvents[eventDKey] = []
            monthEvents[eventDKey].push(block)
        }else{
            continue
        }
        if(event.id) existingIds.add(event.id)
        existingSignatures.add(signature)
        added++
    }

    if(added > 0){
        buildTimeline()
        renderWeek()
        savePlannerState()
        if(!silent) setSaveStatus(`Pulled ${added} event${added === 1 ? "" : "s"} from Google Calendar`)
        _gcalShowResult(`Added ${added} new block${added === 1 ? "" : "s"}.`)
    }else if(!silent){
        setSaveStatus("iCal sync — no new ABT events found")
        _gcalShowResult(rangeMode === "all"
            ? "No new matching events in your calendar."
            : `No new matching events in this ${scopeLabel}.`)
    }
}

async function gcalIcsPullAll(){
    await gcalIcsPull(false, "all")
}

async function gcalIcsPullMonth(){
    await gcalIcsPull(false, true)
}

function _gcalUpdateUI(data){
    let connectedPanel = document.getElementById("gcalConnectedPanel")
    let disconnectedPanel = document.getElementById("gcalDisconnectedPanel")
    let emailEl = document.getElementById("gcalEmail")
    if(data && data.connected){
        connectedPanel?.classList.remove("is-hidden")
        disconnectedPanel?.classList.add("is-hidden")
        if(emailEl) emailEl.textContent = data.email || ""
        updateGcalLastSyncLabel()
    }else{
        connectedPanel?.classList.add("is-hidden")
        disconnectedPanel?.classList.remove("is-hidden")
        if(emailEl) emailEl.textContent = ""
    }
}

function _gcalShowResult(text, isError){
    let el = document.getElementById("gcalSyncResult")
    if(!el) return
    el.textContent = text
    el.classList.remove("is-hidden","gcal-result-error")
    if(isError) el.classList.add("gcal-result-error")
}

function gcalConnect(){
    window.location.href = "/gcal/connect"
}

async function gcalDisconnect(){
    try{
        await fetch("/gcal/disconnect",{method:"POST"})
    }catch(e){ /* ignore */ }
    gcalConnected = false
    _gcalUpdateUI({connected:false})
    setSaveStatus("Disconnected from Google Calendar")
}

// Collect every gcalId already stored in weekData and monthEvents
function _gcalExistingIds(){
    let ids = new Set()
    for(let day of DAY_ORDER){
        for(let block of (weekData[day] || [])){
            if(block.gcalId) ids.add(block.gcalId)
        }
    }
    Object.values(monthEvents).forEach(dayEvents => {
        ;(dayEvents || []).forEach(e => { if(e.gcalId) ids.add(e.gcalId) })
    })
    return ids
}

// Date-aware semantic signatures of every block already in the planner, so a
// re-sync of the same calendar never adds a duplicate even when the calendar
// UID changed or the event was previously imported from a file.
function _gcalExistingSignatures(weekStart){
    let signatures = new Set()
    DAY_ORDER.forEach((day,index) => {
        let dKey = dateKey(addDays(weekStart,index))
        ;(weekData[day] || []).forEach(block => signatures.add(dKey + "|" + plannerBlockSignature(block)))
    })
    Object.entries(monthEvents).forEach(([dKey,dayEvents]) => {
        ;(dayEvents || []).forEach(block => signatures.add(dKey + "|" + plannerBlockSignature(block)))
    })
    return signatures
}

// Pull Google Calendar events for the current planner week and add matching blocks
async function gcalPull(){
    if(!gcalConnected){
        alert("Connect Google Calendar first in Settings.")
        return
    }
    let weekStart = selectedWeekStartKey ? parseDateKey(selectedWeekStartKey) : startOfPlannerWeek(new Date())
    let weekEnd = addDays(weekStart,7)
    let startISO = weekStart.toISOString()
    let endISO = weekEnd.toISOString()

    setSaveStatus("Syncing from Google Calendar…")
    let resp
    try{
        resp = await fetch(`/gcal/pull?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`)
    }catch(e){
        setSaveStatus("Google Calendar pull failed")
        _gcalShowResult("Network error — could not reach server.", true)
        return
    }
    if(resp.status === 401){
        gcalConnected = false
        _gcalUpdateUI({connected:false})
        _gcalShowResult("Session expired — reconnect Google Calendar.", true)
        return
    }
    if(!resp.ok){
        _gcalShowResult("Google Calendar returned an error.", true)
        return
    }

    let data = await resp.json()
    let events = data.events || []
    let existingIds = _gcalExistingIds()
    let existingSignatures = _gcalExistingSignatures(weekStart)
    let added = 0

    for(let event of events){
        if(!event.start?.dateTime) continue  // skip all-day events
        if(!isImportRelevantEvent(event.summary || "", event.location || "", event.description || "")) continue
        if(event.id && existingIds.has(event.id)) continue

        let startDate = new Date(event.start.dateTime)
        let endDate = new Date(event.end?.dateTime || event.start.dateTime)
        let dayIndex = (startDate.getDay() + 6) % 7  // 0=Mon…6=Sun
        let day = DAY_ORDER[dayIndex]

        // Confirm the event falls within this planner week
        if(dateKey(addDays(weekStart, dayIndex)) !== dateKey(startDate)) continue

        let startHour = startDate.getHours() + startDate.getMinutes() / 60
        let durHours = Math.max(SNAP, (endDate - startDate) / 3600000)
        let block = {
            start: startHour,
            dur: durHours,
            title: event.summary || "Block",
            location: event.location || "",
            description: event.description || "",
            gcalId: event.id
        }

        // Same date + time + duration + title means it is the same event even
        // if the calendar reissued its id, so never add it twice.
        let signature = dateKey(startDate) + "|" + plannerBlockSignature(block)
        if(existingSignatures.has(signature)) continue

        if(!weekData[day]) weekData[day] = []
        weekData[day].push(block)
        if(event.id) existingIds.add(event.id)
        existingSignatures.add(signature)
        added++
    }

    if(added > 0){
        buildTimeline()
        renderWeek()
        savePlannerState()
        setSaveStatus(`Pulled ${added} event${added === 1 ? "" : "s"} from Google Calendar`)
        _gcalShowResult(`Added ${added} new block${added === 1 ? "" : "s"}.`)
    }else{
        setSaveStatus("Google Calendar — no new ABT events found")
        _gcalShowResult("No new matching events in this week.")
    }
}

// Convert a planner block + date to a Google Calendar event body
function _gcalEventBody(block, date){
    let tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    let ds = dateKey(date)
    function hhmm(decimal){
        let h = Math.floor(decimal)
        let m = Math.round((decimal % 1) * 60)
        if(m === 60){ h++; m = 0 }
        return String(h).padStart(2,"0") + ":" + String(m).padStart(2,"0") + ":00"
    }
    let endDecimal = (block.start || 0) + (block.dur || 0)
    return {
        summary: block.title || "Block",
        location: block.location || "",
        description: block.description || "",
        start: { dateTime: `${ds}T${hhmm(block.start || 0)}`, timeZone: tz },
        end:   { dateTime: `${ds}T${hhmm(endDecimal)}`,        timeZone: tz }
    }
}

// Push a single block; returns the GCal event id
async function gcalPushBlock(block, date){
    let body = { event: _gcalEventBody(block, date) }
    if(block.gcalId) body.event_id = block.gcalId
    let resp = await fetch("/gcal/push",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body)
    })
    if(!resp.ok) throw new Error("push failed " + resp.status)
    let result = await resp.json()
    return result.id
}

// Push all blocks in the current planner week to Google Calendar
async function gcalPushAll(){
    if(!gcalConnected){
        alert("Connect Google Calendar first in Settings.")
        return
    }
    let weekStart = selectedWeekStartKey ? parseDateKey(selectedWeekStartKey) : startOfPlannerWeek(new Date())
    let created = 0, updated = 0, errors = 0

    setSaveStatus("Pushing to Google Calendar…")
    for(let [i, day] of DAY_ORDER.entries()){
        let date = addDays(weekStart, i)
        for(let block of (weekData[day] || [])){
            try{
                let newId = await gcalPushBlock(block, date)
                if(block.gcalId) updated++
                else{ block.gcalId = newId; created++ }
            }catch(e){
                console.warn("GCal push failed:", e)
                errors++
            }
        }
    }

    savePlannerState()
    let parts = []
    if(created) parts.push(`${created} created`)
    if(updated) parts.push(`${updated} updated`)
    if(errors)  parts.push(`${errors} failed`)
    let summary = parts.length ? parts.join(", ") : "nothing to push"
    setSaveStatus("Google Calendar: " + summary)
    _gcalShowResult(summary + ".", errors > 0)
}

const GCAL_LAST_SYNC_KEY = "gcalLastSync"

// One-tap cross-device sync: push this week's blocks up to Google, then pull
// anything new (e.g. added on another device) back down. Run on each device to
// keep them aligned. OAuth-only (the iCal URL path is read-only).
async function gcalSyncNow(){
    if(!gcalConnected){
        _gcalShowResult("Connect Google Calendar in Settings first — then Sync now keeps every device in step.", true)
        openSettings()
        setTimeout(()=>document.getElementById("settingsGcalSection")?.scrollIntoView({behavior:"smooth", block:"start"}), 120)
        return
    }
    setSaveStatus("Syncing with Google Calendar…")
    try{
        await gcalPushAll()
        if(!gcalConnected) return  // push detected an expired session
        await gcalPull()
        let now = new Date()
        try{ localStorage.setItem(GCAL_LAST_SYNC_KEY, now.toISOString()) }catch(e){}
        updateGcalLastSyncLabel()
        setSaveStatus("Google Calendar sync complete")
        _gcalShowResult("Two-way sync complete at " + now.toLocaleTimeString([], {hour:"numeric", minute:"2-digit"}) + ".")
    }catch(e){
        console.warn("Google Calendar sync failed:", e)
        setSaveStatus("Google Calendar sync hit an error")
        _gcalShowResult("Sync could not finish — check your connection and try again.", true)
    }
}

function updateGcalLastSyncLabel(){
    let el = document.getElementById("gcalLastSync")
    if(!el) return
    let iso = localStorage.getItem(GCAL_LAST_SYNC_KEY)
    el.textContent = iso
        ? "Last synced " + new Date(iso).toLocaleString([], {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"})
        : "Not synced yet on this device"
}

// Phone: swipe the mobile calendar bar left/right to navigate periods
;(function(){
    const SWIPE_THRESHOLD = 42
    const SWIPE_RATIO = 1.5
    let swipeStart = null

    document.addEventListener("pointerdown", e=>{
        if(!isPhoneLayout()) return
        if(!e.target.closest(".mobile-calendar-bar")) return
        if(e.target.closest("button")) return
        swipeStart = {x: e.clientX, y: e.clientY, id: e.pointerId}
    }, {passive: true})

    document.addEventListener("pointermove", e=>{
        if(!swipeStart || e.pointerId !== swipeStart.id) return
        let dx = e.clientX - swipeStart.x
        let dy = e.clientY - swipeStart.y
        if(Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) >= Math.abs(dy) * SWIPE_RATIO){
            let direction = dx < 0 ? 1 : -1
            swipeStart = null
            changeMobilePeriod(direction)
        }
    }, {passive: true})

    document.addEventListener("pointerup", ()=>{ swipeStart = null }, {passive: true})
    document.addEventListener("pointercancel", ()=>{ swipeStart = null }, {passive: true})
})()

// Phone: swipe the main timeline body left/right to navigate periods (day & 3-day views)
;(function(){
    const SWIPE_THRESHOLD = 60
    const SWIPE_RATIO = 2.5
    let swipeStart = null

    document.addEventListener("pointerdown", e=>{
        if(!isPhoneLayout() || e.pointerType !== "touch") return
        if(e.target.closest(".mobile-calendar-bar")) return
        if(!e.target.closest("#timeline-container")) return
        if(e.target.closest(".event")) return
        let scroller = document.getElementById("timeline-container")
        swipeStart = {x:e.clientX, y:e.clientY, id:e.pointerId, scrollTop:scroller?.scrollTop||0}
    },{passive:true})

    document.addEventListener("pointermove", e=>{
        if(!swipeStart || e.pointerId !== swipeStart.id) return
        let dx = e.clientX - swipeStart.x
        let dy = e.clientY - swipeStart.y
        let scroller = document.getElementById("timeline-container")
        let scrolled = Math.abs((scroller?.scrollTop||0) - swipeStart.scrollTop)
        if(scrolled > 12 || Math.abs(dy) > Math.abs(dx) * 0.8){ swipeStart = null; return }
        if(Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) >= Math.abs(dy) * SWIPE_RATIO){
            let direction = dx < 0 ? 1 : -1
            swipeStart = null
            changeMobilePeriod(direction)
        }
    },{passive:true})

    document.addEventListener("pointerup", ()=>{ swipeStart = null },{passive:true})
    document.addEventListener("pointercancel", ()=>{ swipeStart = null },{passive:true})
})()

function isEditableShortcutTarget(target){
    if(!target) return false
    if(target.isContentEditable) return true
    if(target.closest?.("[contenteditable='true'], [contenteditable='plaintext-only']")) return true

    if(target.tagName === "TEXTAREA") return true

    if(target.tagName === "INPUT"){
        return !["button","checkbox","color","file","radio","range","reset","submit"].includes(String(target.type || "text").toLowerCase())
    }

    return false
}

function hasShortcutModifier(event){
    return event.ctrlKey || event.metaKey || event.getModifierState?.("Control") || event.getModifierState?.("Meta")
}

function shortcutKey(event){
    let key = String(event.key || "").toLowerCase()
    let code = String(event.code || "").toLowerCase()
    let keyCode = event.keyCode || event.which

    if(key === "z" || code === "keyz" || keyCode === 90) return "z"
    if(key === "a" || code === "keya" || keyCode === 65) return "a"
    if(key === "c" || code === "keyc" || keyCode === 67) return "c"
    if(key === "x" || code === "keyx" || keyCode === 88) return "x"
    if(key === "v" || code === "keyv" || keyCode === 86) return "v"
    if(key === "+" || key === "=" || code === "equal" || code === "numpadadd" || keyCode === 187 || keyCode === 107) return "+"
    if(key === "-" || key === "_" || code === "minus" || code === "numpadsubtract" || keyCode === 189 || keyCode === 109) return "-"
    if(key === "0" || code === "digit0" || code === "numpad0" || keyCode === 48 || keyCode === 96) return "0"
    if(key === "delete" || key === "del" || code === "delete" || keyCode === 46) return "delete"
    if(key === "backspace" || code === "backspace" || keyCode === 8) return "backspace"

    return key
}

function handleKeyboardShortcut(event){
    if(event.defaultPrevented) return

    if(event.key === "Escape"){
        closeOpenFileMenus()
        closeBlockEditor()
        closeImportFilterEditor()
        closeToolbarCustomizer()
        closeFullSearch()
        closeSettings()
        closeConflictReview()
        closeMobileSheet()
        return
    }

    let target = event.target || document.activeElement
    if(isEditableShortcutTarget(target)) return

    let key = shortcutKey(event)
    let shortcut = hasShortcutModifier(event) && !event.altKey

    if(shortcut && key === "z" && !event.shiftKey){
        event.preventDefault()
        event.stopPropagation()
        undoLastChange()
        return
    }

    if((shortcut && key === "z" && event.shiftKey) || (shortcut && key === "y")){
        event.preventDefault()
        event.stopPropagation()
        redoLastChange()
        return
    }

    if(shortcut && key === "c"){
        event.preventDefault()
        event.stopPropagation()
        copySelectedBlock()
        return
    }

    if(shortcut && key === "x"){
        event.preventDefault()
        event.stopPropagation()
        cutSelectedBlock()
        return
    }

    if(shortcut && key === "v"){
        event.preventDefault()
        event.stopPropagation()
        pasteBlock()
        return
    }

    if(shortcut && key === "a"){
        event.preventDefault()
        event.stopPropagation()
        selectAllBlocks()
        return
    }

    if(shortcut && key === "+"){
        event.preventDefault()
        event.stopPropagation()
        zoomInTimeline()
        return
    }

    if(shortcut && key === "-"){
        event.preventDefault()
        event.stopPropagation()
        zoomOutTimeline()
        return
    }

    if(shortcut && key === "0"){
        event.preventDefault()
        event.stopPropagation()
        resetTimelineZoom()
        return
    }

    if(!hasShortcutModifier(event) && (key === "delete" || key === "backspace")){
        let blocks = getSelectedBlocks()
        if(blocks.length || getSelectedMonthEvents().length){
            event.preventDefault()
            event.stopPropagation()
            deleteSelectedBlocks()
        }
    }
}

window.addEventListener("keydown", handleKeyboardShortcut, true)

document.addEventListener("click",event=>{
    if(!event.target.closest(".file-menu-wrap")) closeOpenFileMenus()
    if(!event.target.closest(".outlook-topbar")) hideRibbonPeek()
})

document.addEventListener("keydown",event=>{
    if(event.key !== "Escape") return
    closeOpenFileMenus()
    hideRibbonPeek()
})

document.getElementById("blockEditorBackdrop")?.addEventListener("click", event=>{
    if(event.target.id === "blockEditorBackdrop") closeBlockEditor()
})

document.getElementById("importFilterBackdrop")?.addEventListener("click", event=>{
    if(event.target.id === "importFilterBackdrop") closeImportFilterEditor()
})

document.getElementById("toolbarCustomizeBackdrop")?.addEventListener("click", event=>{
    if(event.target.id === "toolbarCustomizeBackdrop") closeToolbarCustomizer()
})

document.getElementById("fullSearchBackdrop")?.addEventListener("click", event=>{
    if(event.target.id === "fullSearchBackdrop") closeFullSearch()
})

document.getElementById("settingsBackdrop")?.addEventListener("click", event=>{
    if(event.target.id === "settingsBackdrop") closeSettings()
})

document.getElementById("otDateRangeExportBackdrop")?.addEventListener("click", event=>{
    if(event.target.id === "otDateRangeExportBackdrop") closeOtDateRangeExportDialog()
})

document.getElementById("conflictReviewBackdrop")?.addEventListener("click", event=>{
    if(event.target.id === "conflictReviewBackdrop") closeConflictReview()
})

// Dismiss block quick-menu when tapping outside it
document.addEventListener("pointerdown", event=>{
    if(!document.getElementById("blockQuickMenu")?.classList.contains("is-hidden")){
        if(!event.target.closest("#blockQuickMenu")) hideBlockQuickMenu()
    }
}, {capture:true})

// Re-apply the responsive layout for the current viewport. Forces past the
// scheduleViewportMetricUpdate significance gate, so it also fixes the case
// where an earlier relayout committed stale (pre-rotation) dimensions.
function commitResponsiveLayout(){
    cachedTimelineHeight = null
    let bounds = currentViewportBounds()
    lastViewportWidth = bounds.width
    lastViewportHeight = bounds.height
    updateAppViewportMetrics()
    syncInputCapabilityClasses?.()
    applyWorkspaceLayout(currentWorkspaceLayout())
    applyTimelineZoom({render:false})
    if(!isMobileLayout()) closeMobileSheet()
    renderWeek()
    update()
}

window.addEventListener("resize",()=>{
    scheduleViewportMetricUpdate()
    cachedTimelineHeight = null
    clearTimeout(resizeUpdateTimer)
    resizeUpdateTimer = setTimeout(commitResponsiveLayout,150)
})

window.addEventListener("orientationchange",()=>{
    scheduleViewportMetricUpdate()
    // iOS Safari often still reports the pre-rotation viewport size when the
    // resize/orientationchange handlers first run, so the docked iPad panes get
    // clamped to the old orientation's width and landscape looks broken until the
    // next resize. Re-apply once the new orientation has settled — twice, since
    // the settle time varies by device.
    clearTimeout(orientationSettleTimer)
    orientationSettleTimer = setTimeout(commitResponsiveLayout,350)
    setTimeout(commitResponsiveLayout,600)
},{passive:true})

window.visualViewport?.addEventListener("resize",scheduleViewportMetricUpdate,{passive:true})

//--------------------------------
// ACTIVE DAY UI
//--------------------------------
function updateActiveDay(){
    document.querySelectorAll(".day-heading, .day-column")
        .forEach(b=>b.classList.remove("active","drop-target","today","current-week"))

    document.querySelectorAll(`.day-heading[data-day="${currentDay}"], .day-column[data-day="${currentDay}"]`)
        .forEach(active=>active.classList.add("active"))

    let today = new Date()
    let currentWeekKey = dateKey(startOfPlannerWeek(today))

    if(selectedWeekStartKey === currentWeekKey){
        let todayKey = DAY_ORDER[(today.getDay() + 6) % 7]
        document.querySelectorAll(`.day-heading[data-day="${todayKey}"], .day-column[data-day="${todayKey}"]`)
            .forEach(active=>active.classList.add("today"))
    }

    if(selectedWeekStartKey === currentWeekKey){
        document.querySelectorAll(".day-heading, .day-column")
            .forEach(active=>active.classList.add("current-week"))
    }
}

//--------------------------------
// MONTH VIEW
//--------------------------------
function setPlannerView(view){
    view = mobileFriendlyView(view)
    let previousView = plannerView
    if(plannerView !== view) clearSelection()
    if(TIMELINE_VIEWS.includes(plannerView) && document.querySelector(".event")){
        saveAllDays({persist:false})
    }

    if(previousView === "month" && TIMELINE_VIEWS.includes(view) && selectedWeekStartKey){
        weekData = buildWeekDataFromMonthEntries(parseDateKey(selectedWeekStartKey),monthEvents)
    }

    if(dayVisibilityFilter === "overtime" && TIMELINE_VIEWS.includes(view)){
        let candidateDays = view === "workweek" ? DAY_ORDER.slice(0,6) : DAY_ORDER
        let currentHasOvertime = candidateDays.includes(currentDay) &&
            calculateOvertimeSummary(storedSchedule(currentDay)).pay > 0
        if(!currentHasOvertime){
            currentDay = candidateDays.find(day=>
                calculateOvertimeSummary(storedSchedule(day)).pay > 0
            ) || currentDay
        }
    }

    plannerView = view
    closeMobileSheet()

    document.body.classList.toggle("workweek-mode",view === "workweek")
    document.body.classList.toggle("three-day-mode",view === "three-day")
    document.body.classList.toggle("day-focus-mode",view === "day")
    document.querySelector(".timeline-panel")?.classList.toggle("is-hidden",!TIMELINE_VIEWS.includes(view))
    document.getElementById("monthPanel")?.classList.toggle("is-hidden",view !== "month")
    document.getElementById("weekViewButton")?.classList.toggle("active-view",view === "week")
    document.getElementById("threeDayViewButton")?.classList.toggle("active-view",view === "three-day")
    document.getElementById("dayViewButton")?.classList.toggle("active-view",view === "day")
    document.getElementById("workWeekViewButton")?.classList.toggle("active-view",view === "workweek")
    document.getElementById("monthViewButton")?.classList.toggle("active-view",view === "month")

    if(TIMELINE_VIEWS.includes(view)){
        buildTimeline()
        applyTimelineZoom({render:false})
        renderWeek()
    }

    updateWeekHeader()
    updateActiveDay()
    updateImportSummary()
    savePlannerState()
    if(view === "month") renderMonthView()
    else update()
    updateOutlookPanels()
    updateMobileNav()
}

function changeMonth(offset){
    monthAnchorDate = new Date(monthAnchorDate.getFullYear(),monthAnchorDate.getMonth() + offset,1)
    selectedWeekStartKey = null
    renderMonthView()
    if(selectedWeekStartKey) loadWeekFromMonth(selectedWeekStartKey)
    renderMonthView()
}

function goToCurrentWeek(){
    saveDay()

    let today = new Date()
    let weekStart = startOfPlannerWeek(today)
    selectedWeekStartKey = dateKey(weekStart)
    monthAnchorDate = new Date(today.getFullYear(),today.getMonth(),1)

    loadWeekFromMonth(selectedWeekStartKey)
    currentDay = DAY_ORDER[(today.getDay() + 6) % 7]
    updateActiveDay()
    update()
    renderMonthView()
    setPlannerView(isPhoneLayout() ? "day" : "week")
}

function changeWeek(offset){
    saveDay()
    let start = selectedWeekStartDate()
    selectedWeekStartKey = dateKey(addDays(start,offset * 7))
    monthAnchorDate = new Date(parseDateKey(selectedWeekStartKey).getFullYear(),parseDateKey(selectedWeekStartKey).getMonth(),1)
    loadWeekFromMonth(selectedWeekStartKey)
    updateActiveDay()
    update()
    renderMonthView()
    setPlannerView(TIMELINE_VIEWS.includes(plannerView) ? plannerView : "week")
}

function changeMobilePeriod(offset){
    if(plannerView === "month"){
        changeMonth(offset)
        updateOutlookPanels()
        return
    }

    if(plannerView === "three-day" || plannerView === "day"){
        saveDay()
        let step = plannerView === "three-day" ? 3 : 1
        let activeDate = addDays(selectedWeekStartDate(),currentDayIndex() + (offset * step))
        selectedWeekStartKey = dateKey(startOfPlannerWeek(activeDate))
        monthAnchorDate = new Date(activeDate.getFullYear(),activeDate.getMonth(),1)
        currentDay = DAY_ORDER[(activeDate.getDay() + 6) % 7]
        loadWeekFromMonth(selectedWeekStartKey,{currentDay})
        renderMonthView()
        setPlannerView(plannerView)
        return
    }

    changeWeek(offset)
}

function dateKey(date){
    return date.getFullYear()+"-"+
        String(date.getMonth()+1).padStart(2,"0")+"-"+
        String(date.getDate()).padStart(2,"0")
}

function sameDate(a,b){
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate()
}

function monthName(date){
    return date.toLocaleDateString(undefined,{month:"long",year:"numeric"})
}

function addDays(date,days){
    let copy = new Date(date)
    copy.setDate(copy.getDate() + days)
    return copy
}

function startOfPlannerWeek(date){
    let start = new Date(date.getFullYear(),date.getMonth(),date.getDate())
    let mondayOffset = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - mondayOffset)
    return start
}

function weekRangeLabel(start){
    let end = addDays(start,6)
    let startLabel = start.toLocaleDateString(undefined,{month:"short",day:"numeric"})
    let endLabel = end.toLocaleDateString(undefined,{month:"short",day:"numeric"})
    return startLabel+" - "+endLabel
}

function weekDateLabel(start,index){
    return addDays(start,index).toLocaleDateString(undefined,{month:"short",day:"numeric"})
}

function emptyWeekData(){
    return {mon:[],tue:[],wed:[],thu:[],fri:[],sat:[],sun:[]}
}

function normalizePlannerBlock(block){
    let start = Math.round(Number(block?.start || 0) * 100) / 100
    let dur = Math.round(Number(block?.dur || 0) * 100) / 100
    return {
        start,
        dur,
        title: String(block?.title || "").trim(),
        location: String(block?.location || "").trim(),
        description: String(block?.description || "").trim()
    }
}

function normalizePlannerBlockTitle(title){
    return String(title || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\([^)]*\bstudio\b[^)]*\)/g, " ")
        .replace(/\b(?:rehearsal|performance)\b/g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

function plannerBlockSignature(block){
    let normalized = normalizePlannerBlock(block)
    return [
        normalized.start,
        normalized.dur,
        normalizePlannerBlockTitle(normalized.title)
    ].join("|")
}

function sanitizePlannerBlocks(blocks){
    let seen = new Set()
    let sanitized = []

    ;(Array.isArray(blocks) ? blocks : []).forEach(block=>{
        let normalized = normalizePlannerBlock(block)
        if(!(normalized.dur > 0)) return

        let signature = plannerBlockSignature(normalized)
        if(seen.has(signature)) return
        seen.add(signature)
        sanitized.push(normalized)
    })

    sanitized.sort((a,b)=>a.start-b.start || a.dur-b.dur || a.title.localeCompare(b.title))
    return sanitized
}

function sanitizePlannerStateCollections(state){
    let sanitizedWeekData = emptyWeekData()
    let sanitizedMonthEvents = {}

    DAY_ORDER.forEach(day=>{
        let original = Array.isArray(state?.weekData?.[day]) ? state.weekData[day] : []
        let sanitized = sanitizePlannerBlocks(original)
        sanitizedWeekData[day] = sanitized
    })

    Object.entries(state?.monthEvents || {}).forEach(([key,events])=>{
        let original = Array.isArray(events) ? events : []
        let sanitized = sanitizePlannerBlocks(original)
        if(sanitized.length) sanitizedMonthEvents[key] = sanitized
    })

    let monthEventCount = Object.values(sanitizedMonthEvents).reduce((total,events)=>total + events.length,0)
    return {
        weekData: sanitizedWeekData,
        monthEvents: sanitizedMonthEvents,
        importedEventCount: Math.min(Number(state?.importedEventCount || 0),monthEventCount)
    }
}

function populateWeekSelector(){
    let selector = document.getElementById("weekSelector")
    if(!selector) return

    selector.innerHTML = ""

    let first = new Date(monthAnchorDate.getFullYear(),monthAnchorDate.getMonth(),1)
    let last = new Date(monthAnchorDate.getFullYear(),monthAnchorDate.getMonth()+1,0)
    let cursor = startOfPlannerWeek(first)
    let lastWeek = startOfPlannerWeek(last)
    let availableKeys = []

    while(cursor <= lastWeek){
        let key = dateKey(cursor)
        availableKeys.push(key)

        let option = document.createElement("option")
        option.value = key
        option.innerText = weekRangeLabel(cursor)
        selector.appendChild(option)

        cursor = addDays(cursor,7)
    }

    if(!availableKeys.length) return

    if(!selectedWeekStartKey || !availableKeys.includes(selectedWeekStartKey)){
        selectedWeekStartKey = availableKeys.find(key=>{
            let weekStart = parseDateKey(key)
            return DAY_ORDER.some((day,index)=>monthEvents[dateKey(addDays(weekStart,index))]?.length)
        }) || availableKeys[0]
    }

    selector.value = selectedWeekStartKey
}

function parseDateKey(key){
    let [year,month,day] = key.split("-").map(Number)
    return new Date(year,month - 1,day)
}

function updateWeekHeader(){
    let title = document.getElementById("weekTitle")
    let range = document.getElementById("weekRangeText")
    if(!title || !range) return

    title.innerText = selectedWeekStartKey
        ? plannerViewLabel(plannerView)+": "+weekRangeLabel(parseDateKey(selectedWeekStartKey))
        : plannerViewLabel(plannerView)
    range.innerText = "10:00 AM - 11:00 PM"
}

function isTouchPointer(event){
    return event?.pointerType === "touch"
}

function isPenPointer(event){
    return event?.pointerType === "pen"
}

function isDirectPointer(event){
    return isTouchPointer(event) || isPenPointer(event)
}

function pointerMoveThreshold(event){
    if(isPenPointer(event)) return 1.5
    if(isTouchPointer(event)) return 6
    return 2
}

function blockResizeEdgeSize(event){
    if(isTouchPointer(event)) return 28
    if(isPenPointer(event)) return 16
    return 12
}

function updateImportSummary(){
    let summary = document.getElementById("importSummary")
    if(!summary) return

    summary.innerText = importSummaryText
    summary.classList.toggle("is-hidden",!importSummaryText)
}

function syncSelectedWeekToMonth(){
    if(!selectedWeekStartKey) return

    let start = parseDateKey(selectedWeekStartKey)

    DAY_ORDER.forEach((day,index)=>{
        let key = dateKey(addDays(start,index))
        let items = (weekData[day] || []).map(item=>({
            start:item.start,
            dur:item.dur,
            title:item.title,
            location:item.location,
            description:item.description,
            ...(item.gcalId && {gcalId:item.gcalId})
        }))

        if(items.length) monthEvents[key] = items
        else delete monthEvents[key]
    })
}

function setSaveStatus(message){
    let status = document.getElementById("saveStatus")
    if(status) status.innerText = message
}

function showAppToast(message, action){
    let toast = document.getElementById("appToast")
    if(!toast || !message) return
    toast.innerHTML = ""
    let text = document.createElement("span")
    text.textContent = message
    toast.appendChild(text)
    if(action && action.label && typeof action.handler === "function"){
        let button = document.createElement("button")
        button.type = "button"
        button.className = "app-toast-action"
        button.textContent = action.label
        button.addEventListener("click",()=>{
            clearTimeout(toastTimer)
            toast.classList.add("is-hidden")
            action.handler()
        })
        toast.appendChild(button)
    }
    toast.classList.remove("is-hidden")
    clearTimeout(toastTimer)
    toastTimer = setTimeout(()=>toast.classList.add("is-hidden"), action ? 6000 : 3200)
}

function formatDurationLabel(hours){
    let total = Math.round((Number(hours) || 0) * 60)
    let h = Math.floor(total / 60)
    let m = total % 60
    if(h && m) return h+"h "+m+"m"
    if(h) return h+"h"
    return m+"m"
}

function plannerStatusLabel(prefix){
    let name = currentProjectName || "planner"
    return prefix + " - " + name
}

function updateAutosaveButton(){
    let button = document.getElementById("autosaveToggleButton")
    let menuButton = document.getElementById("autosaveMenuButton")
    const label = autosaveEnabled ? "Autosave On" : "Autosave Off"

    function setButtonLabel(node){
        const text = node?.querySelector?.(".button-label")
        if(text) text.textContent = label
        else if(node) node.textContent = label
    }

    if(button){
        setButtonLabel(button)
        button.classList.toggle("active-view",autosaveEnabled)
    }

    if(menuButton){
        setButtonLabel(menuButton)
        menuButton.classList.toggle("active-view",autosaveEnabled)
    }
}

function loadAutosavePreference(){
    try{
        let value = localStorage.getItem(AUTOSAVE_ENABLED_KEY)
        autosaveEnabled = value === null ? true : value !== "false"
    }catch(error){
        autosaveEnabled = true
    }
}

function setAutosaveEnabled(enabled){
    autosaveEnabled = Boolean(enabled)

    try{
        localStorage.setItem(AUTOSAVE_ENABLED_KEY,String(autosaveEnabled))
    }catch(error){
        console.warn("Autosave preference could not be saved.",error)
    }

    updateAutosaveButton()
    syncSettingsControls()
    setSaveStatus(plannerStatusLabel(autosaveEnabled ? "Autosave enabled" : "Autosave disabled"))
    showAppToast(autosaveEnabled ? "Autosave enabled" : "Autosave disabled")
    if(autosaveEnabled) savePlannerState()
}

function toggleAutosave(){
    setAutosaveEnabled(!autosaveEnabled)
}

function resetLayoutPreferences(){
    timelineZoom = 1
    saveTimelineZoom()
    timelineLayoutMode = "fit"
    try{
        localStorage.setItem(TIMELINE_LAYOUT_MODE_KEY,timelineLayoutMode)
    }catch(error){
        console.warn("Timeline layout mode could not be saved.",error)
    }
    resetWorkspaceLayoutPreferences(false)
    applyTimelineLayoutMode()
    applyTimelineZoom()
    syncSettingsControls()
    showAppToast("Layout reset")
}

function plannerStatePayload(){
    return {
        fileType: PROJECT_FILE_TYPE,
        version: PROJECT_FILE_VERSION,
        savedAt: new Date().toISOString(),
        projectName: currentProjectName,
        weekData,
        monthEvents,
        currentDay,
        plannerView,
        selectedWeekStartKey,
        exportOtRangeStartKey,
        exportOtRangeEndKey,
        importSummaryText,
        importedEventCount,
        skippedNonAbtCount,
        customImportKeywords,
        exportScope:getExportScope(),
        monthAnchorDate: dateKey(monthAnchorDate)
    }
}

function applyPlannerState(state){
    if(!state || typeof state !== "object") throw new Error("Invalid planner file.")

    let sanitizedCollections = sanitizePlannerStateCollections(state)

    if(state.projectName) currentProjectName = normalizeProjectFileName(state.projectName)
    weekData = sanitizedCollections.weekData
    monthEvents = sanitizedCollections.monthEvents
    if(state.currentDay) currentDay = state.currentDay
    if(state.selectedWeekStartKey) selectedWeekStartKey = state.selectedWeekStartKey
    if(state.exportOtRangeStartKey) exportOtRangeStartKey = state.exportOtRangeStartKey
    if(state.exportOtRangeEndKey) exportOtRangeEndKey = state.exportOtRangeEndKey
    importSummaryText = state.importSummaryText || ""
    importedEventCount = sanitizedCollections.importedEventCount
    skippedNonAbtCount = state.skippedNonAbtCount || 0

    if(Array.isArray(state.customImportKeywords)){
        customImportKeywords = state.customImportKeywords.map(normalizeImportKeyword).filter(Boolean)
        rebuildCustomImportPatterns()
    }

    if(state.monthAnchorDate) monthAnchorDate = parseDateKey(state.monthAnchorDate)
    if(state.exportScope && document.getElementById("exportScope")){
        document.getElementById("exportScope").value = state.exportScope
    }

    loadDay()
    updateActiveDay()
    setPlannerView(state.plannerView || "week")
    updateWeekHeader()
    updateImportSummary()
    renderMonthView()
}

function projectJsonText(){
    saveAllDays({persist:false})
    syncSelectedWeekToMonth()
    return JSON.stringify(plannerStatePayload(),null,2)
}

function normalizeProjectFileName(name){
    let clean = String(name || "").trim() || "abt-overtime-planner"
    clean = clean.replace(/[\\/:*?"<>|]+/g,"-")

    if(!clean.toLowerCase().endsWith(".abt-planner.json")){
        clean = clean.replace(/\.json$/i,"") + ".abt-planner.json"
    }

    return clean
}

function saveProjectName(){
    try{
        localStorage.setItem(PROJECT_FILENAME_KEY,currentProjectName)
    }catch(error){
        console.warn("Project name could not be saved.",error)
    }
}

function loadProjectName(){
    try{
        currentProjectName = normalizeProjectFileName(localStorage.getItem(PROJECT_FILENAME_KEY) || currentProjectName)
    }catch(error){
        currentProjectName = normalizeProjectFileName(currentProjectName)
    }
}

function downloadTextFile(text,fileName,type="application/json"){
    let blob = new Blob([text],{type})
    let link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    setTimeout(()=>URL.revokeObjectURL(link.href),1000)
}

async function writeProjectFile(handle,text){
    let writable = await handle.createWritable()
    await writable.write(text)
    await writable.close()
}

// Planner data lives in localStorage, which browsers (notably iOS Safari) can
// evict after ~7 days of inactivity. Nudge the user to export a real backup
// file when it's been a while and there's something to lose.
const LAST_BACKUP_KEY = "abtPlannerLastBackup"
const BACKUP_NUDGE_AFTER_MS = 7 * 24 * 60 * 60 * 1000

function recordBackup(){
    try{ localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString()) }catch(error){}
}

function plannerHasData(){
    if(DAY_ORDER.some(day => (weekData[day] || []).length)) return true
    return Object.values(monthEvents).some(list => (list || []).length)
}

function maybeNudgeBackup(){
    if(!plannerHasData()) return
    let iso = null
    try{ iso = localStorage.getItem(LAST_BACKUP_KEY) }catch(error){}
    let stale = !iso || (Date.now() - new Date(iso).getTime()) > BACKUP_NUDGE_AFTER_MS
    if(!stale) return
    if(typeof showAppToast === "function"){
        showAppToast(
            iso ? "Back up your planner — it's been over a week." : "Tip: export a backup so you don't lose your planner.",
            {label:"Back up", handler:()=>backupProjectCopy()}
        )
    }
}

async function saveProject(options={}){
    let saveAs = Boolean(options.saveAs)
    let text = projectJsonText()

    try{
        if(window.showSaveFilePicker){
            if(saveAs || !projectFileHandle){
                let suggestedName = normalizeProjectFileName(currentProjectName)
                projectFileHandle = await window.showSaveFilePicker({
                    suggestedName,
                    types:[{
                        description:"ABT Planner Project",
                        accept:{"application/json":[".json"]}
                    }]
                })
                currentProjectName = normalizeProjectFileName(projectFileHandle.name || suggestedName)
                saveProjectName()
            }

            await writeProjectFile(projectFileHandle,text)
            savePlannerState()
            recordBackup()
            setSaveStatus(plannerStatusLabel("Saved"))
            return
        }

        if(typeof navigator.share === "function" && typeof File !== "undefined"){
            let shareFile = new File([text],normalizeProjectFileName(currentProjectName),{type:"application/json"})
            if(!navigator.canShare || navigator.canShare({files:[shareFile]})){
                try{
                    await navigator.share({
                        files:[shareFile],
                        title:"ABT Overtime Planner",
                        text:"Choose where to save this planner file."
                    })
                    savePlannerState()
                    recordBackup()
                    setSaveStatus(plannerStatusLabel("Shared to Files"))
                    return
                }catch(error){
                    if(error?.name === "AbortError") return
                    console.warn("Share save fallback failed.",error)
                }
            }
        }

        if(saveAs){
            currentProjectName = normalizeProjectFileName(prompt("Save as",currentProjectName) || currentProjectName)
            saveProjectName()
        }

        downloadTextFile(text,normalizeProjectFileName(currentProjectName))
        savePlannerState()
        recordBackup()
        setSaveStatus(plannerStatusLabel("Downloaded"))
    }catch(error){
        if(error?.name === "AbortError") return
        console.warn("Project could not be saved.",error)
        alert("Could not save the planner file.")
    }
}

function saveProjectAs(){
    return saveProject({saveAs:true})
}

function chooseSaveLocation(){
    if(!window.showSaveFilePicker && typeof navigator.share !== "function"){
        alert("This browser does not support choosing a save location directly. Use Save As to download the planner file.")
    }
    return saveProject({saveAs:true})
}

async function openProjectBlob(file,sourceName=""){
    let state = JSON.parse(await file.text())
    if(state.fileType && state.fileType !== PROJECT_FILE_TYPE){
        throw new Error("Unsupported project file.")
    }

    pushUndoState()
    currentProjectName = normalizeProjectFileName(file.name)
    applyPlannerState(state)
    saveProjectName()
    setSaveStatus("Opened " + currentProjectName + (sourceName ? " from " + sourceName : ""))
}

async function openProjectFile(fileOverride=null){
    let input = document.getElementById("projectFileInput")
    let file = fileOverride || input?.files?.[0]
    if(!file) return

    try{
        isRestoringState = true
        projectFileHandle = null
        await openProjectBlob(file,pendingCloudImportProvider)
    }catch(error){
        console.warn("Project file could not be opened.",error)
        alert("Could not open that planner file.")
    }finally{
        isRestoringState = false
        pendingCloudImportProvider = ""
        if(input) input.value = ""
        savePlannerState()
    }
}

// Provider-agnostic "back up a copy": opens the OS share sheet (so you can pick
// Save to Files -> OneDrive/iCloud, Google Drive, Mail, etc.) and falls back to
// a plain download. No OAuth, so it works on every device including
// Advanced-Protection Google accounts.
async function backupProjectCopy(){
    let fileName = normalizeProjectFileName(currentProjectName)
    let text = projectJsonText()
    try{
        if(typeof File !== "undefined" && navigator.canShare){
            let file = new File([text],fileName,{type:"application/json"})
            if(navigator.canShare({files:[file]})){
                await navigator.share({
                    files:[file],
                    title:"ABT Overtime Planner backup",
                    text:"Save this planner backup (e.g. Save to Files → OneDrive).",
                })
                recordBackup()
                setSaveStatus("Backup ready — choose where to save it")
                return
            }
        }
    }catch(error){
        if(error?.name === "AbortError") return
        console.warn("Backup share failed, downloading instead.",error)
    }
    downloadTextFile(text,fileName)
    recordBackup()
    setSaveStatus("Backup downloaded: " + fileName)
}

function savePlannerState(){
    if(isRestoringState || isInitializingState) return
    if(!autosaveEnabled){
        setSaveStatus("Autosave disabled")
        return
    }

    try{
        localStorage.setItem(STORAGE_KEY,JSON.stringify({
            fileType: PROJECT_FILE_TYPE,
            version: PROJECT_FILE_VERSION,
            projectName: currentProjectName,
            weekData,
            monthEvents,
            currentDay,
            plannerView,
            selectedWeekStartKey,
            exportOtRangeStartKey,
            exportOtRangeEndKey,
            importSummaryText,
            importedEventCount,
            skippedNonAbtCount,
            customImportKeywords,
            exportScope:getExportScope(),
            monthAnchorDate: dateKey(monthAnchorDate)
        }))
        setSaveStatus(plannerStatusLabel("Autosaved locally"))
    }catch(error){
        console.warn("Planner state could not be saved.",error)
        setSaveStatus(plannerStatusLabel("Autosave failed"))
    }
}

function restorePlannerState(){
    let raw = null

    try{
        raw = localStorage.getItem(STORAGE_KEY)
    }catch(error){
        return
    }

    if(!raw) return

    try{
        let state = JSON.parse(raw)
        if(state.fileType && state.fileType !== PROJECT_FILE_TYPE) return
        let sanitizedCollections = sanitizePlannerStateCollections(state)
        isRestoringState = true

        if(state.projectName) currentProjectName = normalizeProjectFileName(state.projectName)
        weekData = sanitizedCollections.weekData
        monthEvents = sanitizedCollections.monthEvents
        if(state.currentDay) currentDay = state.currentDay
        if(state.selectedWeekStartKey) selectedWeekStartKey = state.selectedWeekStartKey
        if(state.exportOtRangeStartKey) exportOtRangeStartKey = state.exportOtRangeStartKey
        if(state.exportOtRangeEndKey) exportOtRangeEndKey = state.exportOtRangeEndKey
        if(state.importSummaryText) importSummaryText = state.importSummaryText
        importedEventCount = sanitizedCollections.importedEventCount
        if(state.skippedNonAbtCount) skippedNonAbtCount = state.skippedNonAbtCount
        if(Array.isArray(state.customImportKeywords)){
            customImportKeywords = state.customImportKeywords.map(normalizeImportKeyword).filter(Boolean)
            rebuildCustomImportPatterns()
        }
        if(state.monthAnchorDate) monthAnchorDate = parseDateKey(state.monthAnchorDate)
        if(state.exportScope && document.getElementById("exportScope")){
            document.getElementById("exportScope").value = state.exportScope
        }

        if(!selectedWeekStartKey){
            selectedWeekStartKey = dateKey(startOfPlannerWeek(new Date()))
        }
        syncSelectedWeekToMonth()
        loadDay()
        updateActiveDay()
        setPlannerView(mobileFriendlyView(state.plannerView || "week"))
        updateWeekHeader()
        updateImportSummary()
    }catch(error){
        console.warn("Planner state could not be restored.",error)
    }finally{
        isRestoringState = false
    }
}

function selectWeekFromMonth(key,day){
    if(!key) return

    selectedWeekStartKey = key
    loadWeekFromMonth(key,{currentDay:day || "mon"})
    renderMonthView()
    setPlannerView("week")
}

function loadWeekFromMonth(key,options={}){
    let start = parseDateKey(key)
    let useImportedMonthEvents = Boolean(options.useImportedMonthEvents)
    let persist = options.persist !== false
    let selectedWeekData = useImportedMonthEvents
        ? buildWeekDataFromMonthEntries(start,monthEvents)
        : emptyWeekData()

    if(!useImportedMonthEvents){
        DAY_ORDER.forEach((day,index)=>{
            let currentDateKey = dateKey(addDays(start,index))
            let items = monthEvents[currentDateKey] || []
            selectedWeekData[day] = items
                .map(event=>({
                    start:event.start,
                    dur:event.dur,
                    title:event.title,
                    location:event.location,
                    description:event.description,
                    ...(event.gcalId && {gcalId:event.gcalId})
                }))
        })
    }

    weekData = selectedWeekData
    currentDay = options.currentDay || "mon"
    loadDay({persist})
    updateActiveDay()
    updateWeekHeader()
    if(importedEventCount) importSummaryText = buildImportSummary(importedEventCount)
    updateImportSummary()
    applyThemeMode(themeMode)
    if(persist) savePlannerState()
}

function buildWeekDataFromMonthEntries(startDate,sourceMonthEvents=monthEvents){
    let selectedWeekData = emptyWeekData()

    DAY_ORDER.forEach((day,index)=>{
        let currentDateKey = dateKey(addDays(startDate,index))
        selectedWeekData[day] = (sourceMonthEvents[currentDateKey] || [])
            .map(event=>({
                start:event.start,
                dur:event.dur,
                title:event.title,
                location:event.location,
                description:event.description,
                ...(event.gcalId && {gcalId:event.gcalId})
            }))
    })

    return selectedWeekData
}

function isDateInSelectedWeek(date){
    if(!selectedWeekStartKey) return false

    let start = parseDateKey(selectedWeekStartKey)
    let end = addDays(start,6)
    return date >= start && date <= end
}

function cloneScheduleForPay(items){
    return items
        .map(item=>({
            start:item.start,
            dur:item.dur,
            title:item.title,
            location:item.location,
            description:item.description
        }))
        .sort((a,b)=>a.start-b.start)
}

function calculateMonthDayPay(items){
    return calculateDailyPay(cloneScheduleForPay(items))
}

function calculateMonthlyTotals(){
    let total = 0
    let hasOT = false
    let year = monthAnchorDate.getFullYear()
    let month = monthAnchorDate.getMonth()
    let daysInMonth = new Date(year, month + 1, 0).getDate()
    for(let day=1; day<=daysInMonth; day++){
        let key = dateKey(new Date(year, month, day))
        let items = monthDayItems(key)
        if(!items.length) continue
        // calculateMonthDayPay (like Daily/Weekly) already returns OT-only pay.
        let otPay = calculateMonthDayPay(items)
        total += otPay
        if(otPay > 0) hasOT = true
    }
    return {total, hasOT}
}

function buildImportSummary(importedCount=importedEventCount){
    let eventDates = Object.keys(monthEvents).sort()
    let weekKeys = new Set(eventDates.map(key=>dateKey(startOfPlannerWeek(parseDateKey(key)))))
    let selected = selectedWeekStartKey ? weekRangeLabel(parseDateKey(selectedWeekStartKey)) : "the selected week"
    let skipped = skippedNonAbtCount
        ? " Skipped "+skippedNonAbtCount+" non-ABT event"+(skippedNonAbtCount===1 ? "" : "s")+"."
        : ""

    return "Imported "+importedCount+" timed event"+(importedCount===1 ? "" : "s")+
        " across "+weekKeys.size+" week"+(weekKeys.size===1 ? "" : "s")+
        ". Showing "+selected+"."+skipped
}

function selectedWeekStartDate(){
    if(selectedWeekStartKey) return parseDateKey(selectedWeekStartKey)
    return startOfPlannerWeek(new Date())
}

function plannerWeekItemForDateKey(eventDateKey){
    if(!selectedWeekStartKey) return null

    let start = parseDateKey(selectedWeekStartKey)
    for(let index=0; index<DAY_ORDER.length; index++){
        let currentKey = dateKey(addDays(start,index))
        if(currentKey === eventDateKey){
            let day = DAY_ORDER[index]
            return (weekData[day] || []).map(block=>({
                start:block.start,
                dur:block.dur,
                title:block.title,
                location:block.location,
                description:block.description
            }))
        }
    }

    return null
}

function monthDayItems(eventDateKey){
    if(plannerView !== "month"){
        let plannerItems = plannerWeekItemForDateKey(eventDateKey)
        if(plannerItems) return plannerItems
    }
    return monthEvents[eventDateKey] || []
}

function isInAnchoredMonth(date){
    return date?.getFullYear?.() === monthAnchorDate.getFullYear() &&
        date?.getMonth?.() === monthAnchorDate.getMonth()
}

function monthDateKeysForCurrentView(){
    let keys = new Set(Object.keys(monthEvents))
    if(selectedWeekStartKey){
        let start = parseDateKey(selectedWeekStartKey)
        DAY_ORDER.forEach((day,index)=>{
            let items = weekData[day] || []
            if(items.length) keys.add(dateKey(addDays(start,index)))
        })
    }
    return [...keys].sort()
}

function selectedWeekAgendaBlocks(){
    let start = selectedWeekStartDate()
    return DAY_ORDER.flatMap((day,index)=>{
        let date = addDays(start,index)
        return (weekData[day] || []).map(block=>({
            ...block,
            day,
            date,
            dateKey:dateKey(date)
        }))
    }).sort((a,b)=>a.date-b.date || a.start-b.start)
}

function monthAgendaBlocks(){
    return monthDateKeysForCurrentView()
        .flatMap(key=>{
            let date = parseDateKey(key)
            if(!isInAnchoredMonth(date)) return []
            let day = DAY_ORDER[(date.getDay() + 6) % 7]
            return monthDayItems(key).map(block=>({
                ...block,
                day,
                date,
                dateKey:key
            }))
        })
        .sort((a,b)=>a.date-b.date || a.start-b.start)
}

function agendaScopeBlocks(){
    return plannerView === "month" ? monthAgendaBlocks() : selectedWeekAgendaBlocks()
}

function blockSourceLabel(block){
    if(block?.source) return block.source
    return plannerView === "month" ? "Imported calendar" : "Planner blocks"
}

function enrichBlockWithFilterMetadata(block, fallbackSource="Planner blocks"){
    return {
        ...block,
        source:block?.source || fallbackSource
    }
}

function blockMatchesSourceFilter(block, filterValue){
    if(filterValue === "all" || !block) return true
    let source = String(block.source || "").toLowerCase()
    if(filterValue === "planner") return source.includes("planner") || source.includes("selected week")
    if(filterValue === "imported") return source.includes("import")
    return true
}

function blockMatchesDurationFilter(block, filterValue){
    if(filterValue === "all" || !block) return true
    let duration = Number(block.duration ?? block.dur) || 0
    if(filterValue === "short") return duration > 0 && duration <= 2
    if(filterValue === "standard") return duration > 2 && duration <= 4
    if(filterValue === "long") return duration > 4
    return true
}

function searchableBlockValues(block){
    return [
        block.title,
        block.location,
        block.description,
        DAY_LABELS[block.day],
        block.dateKey,
        block.date ? block.date.toLocaleDateString(undefined,{weekday:"long", month:"long", day:"numeric", year:"numeric"}) : "",
        formatTime(block.start),
        formatTime(block.start + block.dur),
        block.source
    ]
}

function normalizedSearchValues(values=[]){
    return values
        .map(value=>String(value || "").toLowerCase().trim())
        .filter(Boolean)
}

function hasBooleanSearchOperators(query=""){
    return /\b(?:and|or|not)\b|(^|\s)-\S+/i.test(String(query || ""))
}

function unquoteSearchToken(token=""){
    return String(token || "").replace(/^"(.*)"$/,"$1").trim().toLowerCase()
}

function booleanSearchSegments(query=""){
    return String(query || "")
        .trim()
        .split(/\s+\bOR\b\s+/i)
        .map(segment=>segment.trim())
        .filter(Boolean)
}

function segmentMatchesBooleanSearch(values,segment){
    let tokens = String(segment || "").match(/"[^"]+"|\S+/g) || []
    let negateNext = false
    let hasTerms = false

    for(let token of tokens){
        if(/^AND$/i.test(token)) continue
        if(/^NOT$/i.test(token)){
            negateNext = !negateNext
            continue
        }

        let negated = negateNext || token.startsWith("-")
        let normalizedToken = unquoteSearchToken(token.startsWith("-") ? token.slice(1) : token)
        negateNext = false
        if(!normalizedToken) continue

        hasTerms = true
        let matched = values.some(value=>value.includes(normalizedToken))
        if(negated ? matched : !matched) return false
    }

    return hasTerms
}

function matchesSearchValues(values,query){
    if(!query) return true
    let normalizedQuery = String(query || "").trim().toLowerCase()
    let normalizedValuesList = normalizedSearchValues(values)
    if(!normalizedValuesList.length) return false

    if(!hasBooleanSearchOperators(normalizedQuery)){
        return normalizedValuesList.some(value=>value.includes(normalizedQuery))
    }

    return booleanSearchSegments(normalizedQuery).some(segment=>segmentMatchesBooleanSearch(normalizedValuesList,segment))
}

function matchesSearchQuery(block,query){
    return matchesSearchValues(searchableBlockValues(block),query)
}

function fullSearchFieldValues(block){
    if(fullSearchFieldFilter === "title") return [block.title]
    if(fullSearchFieldFilter === "location") return [block.location]
    if(fullSearchFieldFilter === "notes") return [block.description]
    if(fullSearchFieldFilter === "time") return [formatTime(block.start), formatTime(block.start + block.dur)]
    if(fullSearchFieldFilter === "date") return [block.dateKey, block.date ? block.date.toLocaleDateString(undefined,{weekday:"long", month:"long", day:"numeric", year:"numeric"}) : "", DAY_LABELS[block.day]]
    if(fullSearchFieldFilter === "source") return [block.source]
    return searchableBlockValues(block)
}

function matchesFullSearchQuery(block,query){
    return matchesSearchValues(fullSearchFieldValues(block),query)
}

function matchesAgendaSearchQuery(block,query){
    if(!query) return true

    let overtimeMatch = query.includes("overtime") || query === "ot"
    if(overtimeMatch && blockMatchesDayVisibilityFilter(block)) return true

    let values = []
    if(agendaSearchFieldFilter === "title") values = [block.title]
    else if(agendaSearchFieldFilter === "location") values = [block.location]
    else if(agendaSearchFieldFilter === "notes") values = [block.description]
    else if(agendaSearchFieldFilter === "time") values = [formatTime(block.start), formatTime(block.start + block.dur), block.dateKey]
    else if(agendaSearchFieldFilter === "date") values = [block.dateKey, block.date ? block.date.toLocaleDateString(undefined,{weekday:"long", month:"long", day:"numeric", year:"numeric"}) : "", DAY_LABELS[block.day]]
    else values = searchableBlockValues(block)

    return matchesSearchValues(values,query)
}

function visibleAgendaBlocks(){
    let query = String(document.getElementById("agendaSearchInput")?.value || "").trim().toLowerCase()
    let visibleDays = new Set(visibleTimelineDays())
    return agendaScopeBlocks()
        .map(block=>enrichBlockWithFilterMetadata(block,blockSourceLabel(block)))
        .filter(block=>plannerView === "month" || visibleDays.has(block.day))
        .filter(block=>blockMatchesDayVisibilityFilter(block))
        .filter(block=>blockMatchesSourceFilter(block,agendaSourceFilter))
        .filter(block=>blockMatchesDurationFilter(block,agendaDurationFilter))
        .filter(block=>matchesAgendaSearchQuery(block,query))
}

function monthAgendaFilterSummary(){
    let summary = []
    let overtimeLabel = dayVisibilityFilter === "overtime" ? "OT Only" : "All Days"
    let sourceLabel = ({all:"All Sources", planner:"Planner Only", imported:"Imported Only"})[agendaSourceFilter] || "All Sources"
    let durationLabel = ({all:"Any Length", short:"Up to 2h", standard:"2h to 4h", long:"4h+"})[agendaDurationFilter] || "Any Length"
    let fieldLabel = ({all:"All Fields", title:"Title", location:"Location", notes:"Notes", time:"Time", date:"Date"})[agendaSearchFieldFilter] || "All Fields"
    let query = String(document.getElementById("agendaSearchInput")?.value || "").trim()

    if(dayVisibilityFilter !== "all") summary.push("Filter: "+overtimeLabel)
    if(agendaSourceFilter !== "all") summary.push("Source: "+sourceLabel)
    if(agendaDurationFilter !== "all") summary.push("Length: "+durationLabel)
    if(query) summary.push("Search ("+fieldLabel+"): "+query)

    return summary.length ? summary.join(" | ") : "Filters: None"
}

function allSearchBlocks(){
    let seen = new Set()
    let blocks = []
    selectedWeekAgendaBlocks().forEach(block=>{
        blocks.push({...block, source:"Selected week"})
    })

    Object.keys(monthEvents)
        .sort()
        .forEach(key=>{
            let date = parseDateKey(key)
            let day = DAY_ORDER[(date.getDay() + 6) % 7]
            ;(monthEvents[key] || []).forEach(block=>{
                let signature = [
                    key,
                    day,
                    block.start,
                    block.dur,
                    block.title || "",
                    block.location || "",
                    block.description || ""
                ].join("|")
                if(seen.has(signature)) return
                seen.add(signature)
                blocks.push({
                    ...block,
                    day,
                    date,
                    dateKey:key,
                    source:"Imported calendar"
                })
            })
        })

    return blocks.sort((a,b)=>a.date-b.date || a.start-b.start || String(a.title || "").localeCompare(String(b.title || "")))
}

function scopedSearchBlocks(){
    if(searchScopeFilter === "week"){
        return selectedWeekAgendaBlocks().map(block=>({...block, source:"Planner blocks"}))
    }
    if(searchScopeFilter === "month"){
        return monthAgendaBlocks().map(block=>({...block, source:"Imported calendar"}))
    }
    return allSearchBlocks()
}

function openFullSearch(){
    closeOpenFileMenus()
    closeMobileSheet()
    document.getElementById("fullSearchBackdrop")?.classList.remove("is-hidden")
    renderFullSearchResults()
    document.querySelectorAll("[data-mobile-nav]").forEach(button=>button.classList.toggle("active-view",button.dataset.mobileNav === "search"))
    setTimeout(()=>document.getElementById("fullSearchInput")?.focus(),40)
}

function closeFullSearch(){
    document.getElementById("fullSearchBackdrop")?.classList.add("is-hidden")
    updateMobileNav()
}

function closeConflictReview(){
    document.getElementById("conflictReviewBackdrop")?.classList.add("is-hidden")
}

function conflictReviewBlocks(){
    let blocks = []
    let source = plannerView === "month" ? monthAgendaBlocks() : selectedWeekAgendaBlocks()
    let grouped = source.reduce((map,block)=>{
        let key = block.dateKey || block.day
        if(!map[key]) map[key] = []
        map[key].push(block)
        return map
    },{})

    Object.keys(grouped).forEach(key=>{
        let sorted = grouped[key].slice().sort((a,b)=>a.start-b.start || b.dur-a.dur)
        let latest = null
        sorted.forEach(block=>{
            if(latest && block.start < latest.start + latest.dur - 0.0001){
                blocks.push({...latest, conflictWith:block})
            }
            if(!latest || block.start + block.dur > latest.start + latest.dur) latest = block
        })
    })

    return blocks
}

function openConflictReviewFromImport(){
    closeOpenFileMenus()
    let list = document.getElementById("conflictReviewList")
    let summary = document.getElementById("conflictReviewSummary")
    if(!list || !summary) return

    let conflicts = conflictReviewBlocks()
    list.innerHTML = ""
    summary.textContent = conflicts.length
        ? conflicts.length+" conflict"+(conflicts.length===1 ? "" : "s")+" found in the current "+(plannerView === "month" ? "month" : "week")+"."
        : "No overlapping blocks found in the current "+(plannerView === "month" ? "month" : "week")+"."
    showAppToast(conflicts.length ? conflicts.length+" conflict"+(conflicts.length===1 ? "" : "s")+" found" : "No conflicts found")

    if(!conflicts.length){
        let empty = document.createElement("p")
        empty.className = "conflict-empty"
        empty.textContent = "Imported events and planned blocks do not overlap in this view."
        list.appendChild(empty)
    }

    conflicts.forEach(pair=>{
        let item = document.createElement("button")
        item.type = "button"
        item.className = "conflict-review-item"
        item.addEventListener("click",()=>{
            closeConflictReview()
            openAgendaBlock(pair.conflictWith)
        })

        let title = document.createElement("strong")
        title.textContent = (pair.title || "Block")+" overlaps "+(pair.conflictWith.title || "Block")
        item.appendChild(title)

        let meta = document.createElement("span")
        meta.textContent = [
            pair.date ? pair.date.toLocaleDateString(undefined,{weekday:"short", month:"short", day:"numeric"}) : DAY_LABELS[pair.day],
            formatTime(pair.start)+" - "+formatTime(pair.start + pair.dur),
            formatTime(pair.conflictWith.start)+" - "+formatTime(pair.conflictWith.start + pair.conflictWith.dur)
        ].filter(Boolean).join(" | ")
        item.appendChild(meta)
        list.appendChild(item)
    })

    document.getElementById("conflictReviewBackdrop")?.classList.remove("is-hidden")
}

function openFullSearchBlock(block){
    if(block.dateKey){
        selectedWeekStartKey = dateKey(startOfPlannerWeek(block.date))
        loadWeekFromMonth(selectedWeekStartKey)
        monthAnchorDate = new Date(block.date.getFullYear(),block.date.getMonth(),1)
    }
    currentDay = block.day
    closeFullSearch()
    setPlannerView("week")
    updateActiveDay()
    updateOutlookPanels()
    savePlannerState()
}

function renderFullSearchResults(){
    let input = document.getElementById("fullSearchInput")
    let summary = document.getElementById("fullSearchSummary")
    let results = document.getElementById("fullSearchResults")
    if(!results) return

    let query = String(input?.value || "").trim().toLowerCase()
    let matches = scopedSearchBlocks()
        .map(block=>enrichBlockWithFilterMetadata(block,block.source || "Planner blocks"))
        .filter(block=>blockMatchesDayVisibilityFilter(block))
        .filter(block=>blockMatchesSourceFilter(block,searchSourceFilter))
        .filter(block=>blockMatchesDurationFilter(block,searchDurationFilter))
        .filter(block=>matchesFullSearchQuery(block,query))
    let displayMatches = query ? matches.slice(0,100) : matches.slice(0,30)
    results.innerHTML = ""

    if(summary){
        if(!query){
            summary.textContent = displayMatches.length
                ? "Showing "+(searchScopeFilter === "week" ? "week" : searchScopeFilter === "month" ? "month" : "all")+" search items. Type to search across titles, notes, locations, dates, and times."
                : "No searchable calendar data is available yet."
        }else{
            summary.textContent = matches.length+" result"+(matches.length===1 ? "" : "s")+" for \""+String(input?.value || "").trim()+"\" in "+(searchScopeFilter === "week" ? "week" : searchScopeFilter === "month" ? "month" : "all data")
        }
    }

    if(!displayMatches.length){
        let empty = document.createElement("p")
        empty.className = "full-search-empty"
        empty.textContent = query ? "No calendar items match this search." : "Import a calendar or add blocks to search."
        results.appendChild(empty)
        return
    }

    displayMatches.forEach(block=>{
        let item = document.createElement("button")
        item.type = "button"
        item.className = "full-search-result"
        item.addEventListener("click",()=>openFullSearchBlock(block))

        let title = document.createElement("strong")
        title.className = "agenda-title"
        title.textContent = block.title || "Block"
        item.appendChild(title)

        let time = document.createElement("span")
        time.className = "full-search-time"
        time.textContent = block.date.toLocaleDateString(undefined,{weekday:"short", month:"short", day:"numeric"})+" - "+formatTime(block.start)+" to "+formatTime(block.start + block.dur)
        item.appendChild(time)

        let meta = document.createElement("span")
        meta.className = "full-search-meta"
        meta.textContent = [block.source, block.location, block.description].filter(Boolean).join(" - ")
        item.appendChild(meta)

        results.appendChild(item)
    })

    if(matches.length > displayMatches.length){
        let capped = document.createElement("p")
        capped.className = "full-search-empty"
        capped.textContent = "Showing first "+displayMatches.length+" results. Refine the search to narrow the list."
        results.appendChild(capped)
    }
}

function agendaGroupLabel(block){
    if(plannerView !== "month") return DAY_LABELS[block.day]
    return block.date.toLocaleDateString(undefined,{weekday:"short", month:"short", day:"numeric"})
}

const TABLET_AGENDA_SIZE_KEY = "abtPlannerTabletAgendaSize"
const TABLET_AGENDA_HEIGHTS = {
    compact: 260,
    default: 360,
    expanded: 520
}
const TABLET_AGENDA_HEIGHT_MIN = 220
const TABLET_AGENDA_HEIGHT_MAX = 720

function syncTabletAgendaControls(height,preset=""){
    const slider = document.getElementById("tabletAgendaHeightSlider")
    if(slider) slider.value = String(Math.round(height))

    document.body.classList.toggle("tablet-agenda-compact",preset === "compact")
    document.body.classList.toggle("tablet-agenda-expanded",preset === "expanded")

    const states = {
        compact: preset === "compact",
        default: preset === "default",
        expanded: preset === "expanded"
    }
    const buttons = {
        compact: document.getElementById("tabletAgendaCompactButton"),
        default: document.getElementById("tabletAgendaDefaultButton"),
        expanded: document.getElementById("tabletAgendaExpandedButton")
    }
    Object.entries(buttons).forEach(([key,button])=>{
        if(!button) return
        button.classList.toggle("active-view",states[key])
        button.setAttribute("aria-pressed",String(states[key]))
    })
}

function setTabletAgendaHeight(value,persist=true,preset=""){
    let height = Math.min(Math.max(Number(value) || TABLET_AGENDA_HEIGHTS.default,TABLET_AGENDA_HEIGHT_MIN),TABLET_AGENDA_HEIGHT_MAX)
    document.documentElement.style.setProperty("--tablet-agenda-height",height + "px")
    syncTabletAgendaControls(height,preset)
    if(!persist) return

    saveWorkspaceLayout({
        ...currentWorkspaceLayout(),
        agendaHeight:height
    })

    try{
        if(preset) localStorage.setItem(TABLET_AGENDA_SIZE_KEY,preset)
        else localStorage.removeItem(TABLET_AGENDA_SIZE_KEY)
    }catch(error){
        console.warn("Tablet agenda size preference could not be saved.",error)
    }
}

function setTabletAgendaSize(size){
    const preset = size === "compact" ? "compact" : size === "expanded" ? "expanded" : "default"
    setTabletAgendaHeight(TABLET_AGENDA_HEIGHTS[preset],true,preset)
}

function loadTabletAgendaSize(){
    try{
        const preset = localStorage.getItem(TABLET_AGENDA_SIZE_KEY) || ""
        if(preset && TABLET_AGENDA_HEIGHTS[preset]){
            setTabletAgendaHeight(TABLET_AGENDA_HEIGHTS[preset],false,preset)
            return
        }
        syncTabletAgendaControls(currentWorkspaceLayout().agendaHeight || TABLET_AGENDA_HEIGHTS.default,"")
    }catch(error){
        syncTabletAgendaControls(TABLET_AGENDA_HEIGHTS.default,"")
    }
}

function openAgendaBlock(block){
    currentDay = block.day
    if(block.dateKey) selectedWeekStartKey = dateKey(startOfPlannerWeek(block.date))

    if(plannerView === "month" && block.dateKey){
        loadWeekFromMonth(selectedWeekStartKey,{currentDay})
    }

    setPlannerView(TIMELINE_VIEWS.includes(plannerView) ? plannerView : "week")
    updateActiveDay()
}

function changeMiniMonth(offset){
    monthAnchorDate = new Date(monthAnchorDate.getFullYear(),monthAnchorDate.getMonth() + offset,1)
    renderMiniMonth()
    if(plannerView === "month") renderMonthView()
    updateOutlookPanels()
}

function selectMiniMonthDate(key){
    let selectedDate = parseDateKey(key)
    selectedWeekStartKey = dateKey(startOfPlannerWeek(selectedDate))
    monthAnchorDate = new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1)
    currentDay = DAY_ORDER[(selectedDate.getDay() + 6) % 7]

    loadWeekFromMonth(selectedWeekStartKey,{currentDay})
    setPlannerView(plannerView === "month" ? "month" : plannerView)
    renderMonthView()
    updateOutlookPanels()
}

function renderMiniMonth(){
    let grid = document.getElementById("miniMonthGrid")
    let title = document.getElementById("miniMonthTitle")
    if(!grid || !title) return

    grid.innerHTML = ""
    title.textContent = monthName(monthAnchorDate)

    let first = new Date(monthAnchorDate.getFullYear(),monthAnchorDate.getMonth(),1)
    let start = new Date(first)
    let mondayOffset = (first.getDay() + 6) % 7
    start.setDate(first.getDate() - mondayOffset)

    for(let index=0; index<42; index++){
        let cellDate = addDays(start,index)
        let key = dateKey(cellDate)
        let button = document.createElement("button")
        button.type = "button"
        button.className = "mini-month-day"
        button.textContent = String(cellDate.getDate())
        button.classList.toggle("outside-month",cellDate.getMonth() !== monthAnchorDate.getMonth())
        button.classList.toggle("today",sameDate(cellDate,new Date()))
        button.classList.toggle("selected-week",isDateInSelectedWeek(cellDate))
        button.classList.toggle("has-events",Boolean(monthDayItems(key).length))
        button.setAttribute("aria-label","Open week of "+weekRangeLabel(startOfPlannerWeek(cellDate)))
        button.addEventListener("click",()=>selectMiniMonthDate(key))
        grid.appendChild(button)
    }
}

function updateOutlookPanels(options={}){
    let today = new Date()
    let railMonth = document.getElementById("railMonthLabel")
    let railDate = document.getElementById("railDateLabel")
    let railDay = document.getElementById("railDayLabel")
    let railWeek = document.getElementById("railWeekLabel")
    let railImport = document.getElementById("railImportLabel")
    let agendaRange = document.getElementById("agendaRangeLabel")
    let agendaList = document.getElementById("agendaList")
    let mobileMonth = document.getElementById("mobileMonthLabel")
    let mobileDate = document.getElementById("mobileDateLabel")
    let mobileView = document.getElementById("mobileViewLabel")
    let mobileRange = document.getElementById("mobileRangeLabel")

    if(railMonth) railMonth.textContent = today.toLocaleDateString(undefined,{month:"long"})
    if(railDate) railDate.textContent = String(today.getDate())
    if(railDay) railDay.textContent = today.toLocaleDateString(undefined,{weekday:"long"})
    if(mobileMonth) mobileMonth.textContent = today.toLocaleDateString(undefined,{month:"short"})
    if(mobileDate) mobileDate.textContent = String(today.getDate())

    let weekStart = selectedWeekStartDate()
    let weekLabel = weekRangeLabel(weekStart)
    if(railWeek) railWeek.textContent = weekLabel
    if(agendaRange){
        agendaRange.textContent = agendaRangeLabelForView(weekLabel)
    }

    let mobileLayout = isMobileLayout()
    let agendaSheetLayout = isPhoneLayout()
    if(!mobileLayout) renderMiniMonth()

    if(mobileView){
        mobileView.textContent = plannerView === "month"
            ? monthName(monthAnchorDate)
            : (plannerView === "three-day" && isFloatingTabletLayout() ? "Week" : plannerViewLabel())
    }
    if(mobileRange){
        mobileRange.textContent = plannerView === "month"
            ? "Month view"
            : agendaRangeLabelForView(weekLabel)
    }

    let eventCount = agendaScopeBlocks().length
    if(railImport){
        railImport.textContent = importedEventCount
            ? importedEventCount+" imported event"+(importedEventCount===1 ? "" : "s")
            : eventCount+" planned block"+(eventCount===1 ? "" : "s")
    }

    document.querySelectorAll(".rail-action-button").forEach(button=>{
        let label = normalizeViewLabel(button.textContent)
        button.classList.toggle("active-view",
            label === plannerView ||
            (label === "today" && isDateInSelectedWeek(today))
        )
    })
    updateMobileNav()
    let settingsOpen = !document.getElementById("settingsBackdrop")?.classList.contains("is-hidden")

    if(!agendaList) return
    if(agendaSheetLayout && !options.forceAgenda && !document.body.classList.contains("mobile-agenda-open")) return
    agendaList.innerHTML = ""

    let blocks = visibleAgendaBlocks()
    if(!blocks.length){
        let empty = document.createElement("p")
        empty.className = "agenda-empty"
        empty.textContent = document.getElementById("agendaSearchInput")?.value
            ? "No agenda items match the search."
            : plannerView === "month"
                ? "No scheduled events in this month."
                : "No scheduled blocks in the selected week."
        agendaList.appendChild(empty)
        if(settingsOpen) syncOvertimeDayInspector()
        return
    }

    let activeGroup = ""
    blocks.forEach(block=>{
        let groupKey = plannerView === "month" ? block.dateKey : block.day
        if(groupKey !== activeGroup){
            activeGroup = groupKey
            let group = document.createElement("div")
            group.className = "agenda-day-group"
            let count = blocks.filter(item=>(plannerView === "month" ? item.dateKey : item.day) === activeGroup).length
            group.innerHTML = `<span>${agendaGroupLabel(block)}</span><strong>${count} item${count===1 ? "" : "s"}</strong>`
            agendaList.appendChild(group)
        }

        let item = document.createElement("button")
        item.type = "button"
        item.className = "agenda-item"
        item.dataset.day = block.day
        item.addEventListener("click",()=>openAgendaBlock(block))

        let time = document.createElement("span")
        time.className = "agenda-time"
        time.textContent = formatTimeRange(block.start, block.start + block.dur)
        item.appendChild(time)

        let title = document.createElement("strong")
        title.className = "agenda-title"
        title.textContent = block.title || "Block"
        item.appendChild(title)

        if(block.location){
            let loc = document.createElement("span")
            loc.className = "agenda-location"
            loc.textContent = block.location
            item.appendChild(loc)
        }

        agendaList.appendChild(item)
    })
    if(settingsOpen) syncOvertimeDayInspector()
}

function getExportScope(){
    return document.getElementById("exportScope")?.value || "week"
}

function getMonthExportBlocks(){
    return Object.keys(monthEvents)
        .sort()
        .flatMap(key=>{
            let date = parseDateKey(key)
            if(date.getFullYear() !== monthAnchorDate.getFullYear() ||
               date.getMonth() !== monthAnchorDate.getMonth()) return []
            return (monthEvents[key] || []).map(block=>({date,...block}))
        })
}

function getOtExportDateRangeBounds(){
    let keys = Object.keys(monthEvents).sort()
    if(keys.length) return {startKey:keys[0], endKey:keys[keys.length - 1]}

    let start = new Date(monthAnchorDate.getFullYear(),monthAnchorDate.getMonth(),1)
    let end = new Date(monthAnchorDate.getFullYear(),monthAnchorDate.getMonth() + 1,0)
    return {startKey:dateKey(start), endKey:dateKey(end)}
}

function syncOtDateRangeInputs(){
    let bounds = getOtExportDateRangeBounds()
    if(!exportOtRangeStartKey) exportOtRangeStartKey = bounds.startKey
    if(!exportOtRangeEndKey) exportOtRangeEndKey = bounds.endKey

    let startInput = document.getElementById("otExportStartDateInput")
    let endInput = document.getElementById("otExportEndDateInput")
    if(startInput){
        startInput.min = bounds.startKey
        startInput.max = bounds.endKey
        startInput.value = exportOtRangeStartKey
    }
    if(endInput){
        endInput.min = bounds.startKey
        endInput.max = bounds.endKey
        endInput.value = exportOtRangeEndKey
    }
}

function readOtDateRangeInputs(){
    let bounds = getOtExportDateRangeBounds()
    let startInput = document.getElementById("otExportStartDateInput")
    let endInput = document.getElementById("otExportEndDateInput")
    let startKey = String(startInput?.value || exportOtRangeStartKey || bounds.startKey)
    let endKey = String(endInput?.value || exportOtRangeEndKey || bounds.endKey)
    if(startKey > endKey) [startKey,endKey] = [endKey,startKey]
    exportOtRangeStartKey = startKey
    exportOtRangeEndKey = endKey
    return {startKey,endKey}
}

function getSelectedMonthOtExportBlocks(){
    let groupedEvents = new Map()
    getSelectedMonthEvents().forEach(({dateKey,event})=>{
        if(!groupedEvents.has(dateKey)) groupedEvents.set(dateKey,[])
        groupedEvents.get(dateKey).push({...event})
    })
    return collectOtExportBlocksFromDateEntries(Array.from(groupedEvents.entries()))
}

function getOtDateRangeExportBlocks(startKey=exportOtRangeStartKey,endKey=exportOtRangeEndKey){
    let bounds = getOtExportDateRangeBounds()
    let safeStartKey = startKey || bounds.startKey
    let safeEndKey = endKey || bounds.endKey
    if(safeStartKey > safeEndKey) [safeStartKey,safeEndKey] = [safeEndKey,safeStartKey]

    return collectOtExportBlocksFromDateEntries(Object.keys(monthEvents)
        .sort()
        .filter(key=>key >= safeStartKey && key <= safeEndKey)
        .map(key=>[key,(monthEvents[key] || []).map(block=>({...block}))]))
}

function getSelectedWeekExportBlocks(){
    if(selectedWeekStartKey){
        let start = parseDateKey(selectedWeekStartKey)
        return DAY_ORDER.flatMap((day,index)=>{
            let date = addDays(start,index)
            return (weekData[day] || []).map(block=>({date,...block}))
        })
    }

    const baseMonday = new Date(2026,0,5)
    return DAY_ORDER.flatMap((day,index)=>{
        let date = addDays(baseMonday,index)
        return (weekData[day] || []).map(block=>({date,...block}))
    })
}

function getSelectedWeekOtExportBlocks(){
    let grouped = new Map()
    getSelectedWeekExportBlocks().forEach(block=>{
        let key = dateKey(block.date)
        if(!grouped.has(key)) grouped.set(key,[])
        grouped.get(key).push({...block})
    })
    return collectOtExportBlocksFromDateEntries(Array.from(grouped.entries()))
}

function renderMonthView(){
    let grid = document.getElementById("monthGrid")
    let title = document.getElementById("monthTitle")
    if(!grid || !title) return

    grid.innerHTML = ""
    title.innerText = monthName(monthAnchorDate)
    populateWeekSelector()

    let first = new Date(monthAnchorDate.getFullYear(),monthAnchorDate.getMonth(),1)
    let start = new Date(first)
    let mondayOffset = (first.getDay() + 6) % 7
    start.setDate(first.getDate() - mondayOffset)

    for(let week=0; week<6; week++){
        let weekTotal = 0

        for(let day=0; day<7; day++){
            let cellDate = new Date(start)
            cellDate.setDate(start.getDate() + (week * 7) + day)

            let key = dateKey(cellDate)
            let events = monthDayItems(key)
                .map((event,index)=>({...event,monthIndex:index}))
                .sort((a,b)=>a.start-b.start)
            let dailyPay = calculateMonthDayPay(events)
            weekTotal += dailyPay

            let cell = document.createElement("div")
            cell.className = "month-day"
            cell.dataset.dateKey = key
            if(cellDate.getMonth() !== monthAnchorDate.getMonth()) cell.classList.add("outside-month")
            if(events.length) cell.classList.add("has-events")
            if(sameDate(cellDate,new Date())) cell.classList.add("today")
            if(dateKey(startOfPlannerWeek(cellDate)) === dateKey(startOfPlannerWeek(new Date()))) cell.classList.add("current-week")
            if(isDateInSelectedWeek(cellDate)) cell.classList.add("selected-week")
            cell.tabIndex = 0
            cell.setAttribute("role","button")
            cell.setAttribute("aria-label","Open week of "+weekRangeLabel(startOfPlannerWeek(cellDate)))
            cell.addEventListener("click",()=>{
                selectWeekFromMonth(dateKey(startOfPlannerWeek(cellDate)),DAY_ORDER[(cellDate.getDay()+6)%7])
            })
            cell.addEventListener("keydown",event=>{
                if(event.key === "Enter" || event.key === " "){
                    event.preventDefault()
                    selectWeekFromMonth(dateKey(startOfPlannerWeek(cellDate)),DAY_ORDER[(cellDate.getDay()+6)%7])
                }
            })

            let head = document.createElement("div")
            head.className = "month-day-head"

            let dateLabel = document.createElement("span")
            dateLabel.className = "month-date"
            dateLabel.innerText = cellDate.getDate()
            head.appendChild(dateLabel)

            let total = document.createElement("span")
            total.className = "month-total"
            total.innerText = "$"+dailyPay.toFixed(0)
            head.appendChild(total)

            if(hasOvertimeForDateKey(key)){
                let whyButton = document.createElement("button")
                whyButton.type = "button"
                whyButton.className = "month-ot-explain-button"
                whyButton.textContent = "Why OT?"
                whyButton.setAttribute("aria-label","Explain overtime for "+key)
                whyButton.addEventListener("click",event=>{
                    event.stopPropagation()
                    openOvertimeInspectorForDateKey(key)
                })
                head.appendChild(whyButton)
            }

            cell.appendChild(head)

            events.forEach(event=>{
                let eventEl = document.createElement("div")
                eventEl.className = "month-event"
                eventEl.dataset.dateKey = key
                eventEl.dataset.eventIndex = String(event.monthIndex)
                eventEl.tabIndex = 0
                eventEl.setAttribute("role","button")
                eventEl.setAttribute("aria-label","Select "+(event.title || "event")+" on "+key)
                eventEl.classList.toggle("selected",selectedMonthEvents.has(monthSelectionKey(key,event.monthIndex)))
                eventEl.addEventListener("click",eventClick=>{
                    eventClick.stopPropagation()
                    if(eventClick.ctrlKey || eventClick.metaKey) selectMonthEvent(eventEl,"toggle")
                    else if(eventClick.shiftKey) selectMonthEvent(eventEl,"add")
                    else selectMonthEvent(eventEl)
                })
                eventEl.addEventListener("keydown",eventKey=>{
                    if(eventKey.key === "Enter" || eventKey.key === " "){
                        eventKey.preventDefault()
                        eventKey.stopPropagation()
                        selectMonthEvent(eventEl,eventKey.shiftKey ? "add" : "replace")
                    }
                })

                let eventTitle = document.createElement("strong")
                eventTitle.innerText = event.title || "Imported Event"
                eventEl.appendChild(eventTitle)

                let eventTime = document.createElement("span")
                eventTime.innerText = formatTime(event.start)+" - "+formatTime(event.start + event.dur)
                eventEl.appendChild(eventTime)

                cell.appendChild(eventEl)
            })

            grid.appendChild(cell)
        }

        let weekTotalEl = document.createElement("div")
        weekTotalEl.className = "month-week-total"
        weekTotalEl.innerText = "Week total: $"+weekTotal.toFixed(0)
        grid.appendChild(weekTotalEl)
    }

    updateOutlookPanels()
}

function openOtDateRangeExportDialog(){
    syncOtDateRangeInputs()
    document.getElementById("otDateRangeExportBackdrop")?.classList.remove("is-hidden")
}

function closeOtDateRangeExportDialog(){
    document.getElementById("otDateRangeExportBackdrop")?.classList.add("is-hidden")
}

function exportOtDateRangePdf(startKey,endKey){
    let exportBlocks = getOtDateRangeExportBlocks(startKey,endKey)
    let totals = calculatePdfOtTotals(exportBlocks)
    const { jsPDF } = window.jspdf
    let doc = new jsPDF({orientation:"landscape",unit:"mm",format:"letter"})
    let rangeLabel = `${parseDateKey(startKey).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})} to ${parseDateKey(endKey).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}`
    renderAgendaPdfBlocks(doc,exportBlocks,{
        title:"ABT Overtime Planner - OT Date Range",
        summary:"Range: "+rangeLabel+" | OT events: "+exportBlocks.length+" | OT pay: "+formatCurrencyAmount(totals.pay)+" | OT hours: "+totals.overtimeHours+" | Double OT: "+totals.doubleHours+"\n"+effectiveOvertimeRulesSummaryText(),
        filename:"planner-ot-date-range.pdf",
        emptyMessage:"No overtime events were found in this date range."
    })
}

function confirmOtDateRangePdfExport(){
    let {startKey,endKey} = readOtDateRangeInputs()
    closeOtDateRangeExportDialog()
    savePlannerState()
    exportOtDateRangePdf(startKey,endKey)
}

//--------------------------------
// ✅ ICS IMPORT (FIXED)
//--------------------------------
function importICS(fileOverride=null){

    const input = document.getElementById("fileInput")
    const file = fileOverride || input?.files?.[0]
    if(!file){
        alert("Select an .ics file first")
        return
    }

    const reader = new FileReader()

    reader.onload = function(e){

        let importedWeekData = {mon:[],tue:[],wed:[],thu:[],fri:[],sat:[],sun:[]}
        let importedMonthEvents = {}
        let extension = (file.name.split(".").pop() || "").toLowerCase()

        let text = String(e.target.result || "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/\n[ \t]/g, "")

        const days = ["sun","mon","tue","wed","thu","fri","sat"]
        let importedCount = 0
        let skippedNonAbt = 0
        let firstImportedDay = null
        let firstImportedDate = null
        let seenImportedSourceEvents = new Set()
        let seenImportedSemanticEvents = new Set()

        function getProperty(eventText, fieldName){
            let line = eventText
                .split("\n")
                .find(l => l.toUpperCase().startsWith(fieldName + ":") ||
                           l.toUpperCase().startsWith(fieldName + ";"))

            if(!line || !line.includes(":")) return null

            let head = line.slice(0,line.indexOf(":"))
            let rawValue = line.slice(line.indexOf(":") + 1).trim()
            let parts = head.split(";")
            let params = parts.slice(1).reduce((map,part)=>{
                let [key,...valueParts] = part.split("=")
                if(key) map[key.toUpperCase()] = valueParts.join("=").replace(/^"|"$/g,"")
                return map
            },{})

            return {
                name: parts[0].toUpperCase(),
                params,
                rawValue,
                value: unescapeIcsText(rawValue)
            }
        }

        function getProperties(eventText, fieldName){
            return eventText
                .split("\n")
                .filter(l => l.toUpperCase().startsWith(fieldName + ":") ||
                             l.toUpperCase().startsWith(fieldName + ";"))
                .map(line => getProperty(line, fieldName))
                .filter(Boolean)
        }

        function getField(eventText, fieldName){
            return getProperty(eventText, fieldName)?.value || null
        }

        function unescapeIcsText(value){
            return String(value || "")
                .replace(/\\n/gi, " ")
                .replace(/\\,/g, ",")
                .replace(/\\;/g, ";")
                .replace(/\\\\/g, "\\")
                .replace(/\s+/g, " ")
                .trim()
        }

        function isAbtRelevantEvent(title, location, description){
            return isImportRelevantEvent(title, location, description)
        }

        function parseIcsDateInfo(propOrValue){
            let value = typeof propOrValue === "string" ? propOrValue : propOrValue?.rawValue
            let params = typeof propOrValue === "string" ? {} : (propOrValue?.params || {})
            if(!value) return null

            let dateOnly = value.match(/^(\d{4})(\d{2})(\d{2})$/)
            if(dateOnly || params.VALUE === "DATE"){
                let match = dateOnly || value.match(/^(\d{4})(\d{2})(\d{2})/)
                if(!match) return null

                return {
                    date: new Date(Number(match[1]),Number(match[2]) - 1,Number(match[3])),
                    allDay: true
                }
            }

            let match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/)
            if(!match || !match[4]) return null

            let [, year, month, day, hour, minute, second, isUtc] = match

            if(isUtc){
                return {
                    date: new Date(Date.UTC(
                        Number(year),
                        Number(month) - 1,
                        Number(day),
                        Number(hour),
                        Number(minute),
                        Number(second || 0)
                    )),
                    allDay: false
                }
            }

            return {
                date: new Date(
                    Number(year),
                    Number(month) - 1,
                    Number(day),
                    Number(hour),
                    Number(minute),
                    Number(second || 0)
                ),
                allDay: false
            }
        }

        function parseIcsDate(value){
            return parseIcsDateInfo(value)?.date || null
        }

        function addIcsDuration(startDate,value){
            if(!startDate || !value) return null

            let match = String(value).match(/^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i)
            if(!match) return null

            let [,weeks,days,hours,minutes,seconds] = match
            let date = new Date(startDate)
            date.setSeconds(date.getSeconds() +
                (Number(weeks || 0) * 7 * 24 * 60 * 60) +
                (Number(days || 0) * 24 * 60 * 60) +
                (Number(hours || 0) * 60 * 60) +
                (Number(minutes || 0) * 60) +
                Number(seconds || 0)
            )

            return date
        }

        function propertyDateList(properties){
            return properties.flatMap(prop=>{
                return prop.rawValue
                    .split(",")
                    .map(value=>parseIcsDateInfo({...prop,rawValue:value.trim()}))
                    .filter(info=>info?.date)
            })
        }

        function dateTimeExclusionKey(date){
            return date.getFullYear()+"-"+
                String(date.getMonth()+1).padStart(2,"0")+"-"+
                String(date.getDate()).padStart(2,"0")+"T"+
                String(date.getHours()).padStart(2,"0")+":"+
                String(date.getMinutes()).padStart(2,"0")
        }

        function addMonthsClamped(date, months){
            let next = new Date(date)
            let dayOfMonth = next.getDate()
            next.setDate(1)
            next.setMonth(next.getMonth() + months)
            let lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
            next.setDate(Math.min(dayOfMonth, lastDay))
            return next
        }

        function getRecurrenceRangeEnd(startDate, rule, untilDate, countLimit, interval){
            if(untilDate) return new Date(untilDate)

            if(countLimit){
                if(rule.FREQ === "MONTHLY"){
                    return addMonthsClamped(startDate, Math.max((countLimit - 1) * interval, 0) + 1)
                }

                let daysToAdd = rule.FREQ === "WEEKLY"
                    ? Math.max((countLimit - 1) * interval * 7, 7)
                    : Math.max((countLimit - 1) * interval, 1)
                let end = new Date(startDate)
                end.setDate(end.getDate() + daysToAdd)
                return end
            }

            if(rule.FREQ === "MONTHLY"){
                return addMonthsClamped(startDate, Math.max(interval * 12, 12))
            }

            let daysToAdd = rule.FREQ === "WEEKLY"
                ? Math.max(interval * 366, 366)
                : Math.max(interval * 366, 366)
            let end = new Date(startDate)
            end.setDate(end.getDate() + daysToAdd)
            return end
        }

        function parseRRule(value){
            if(!value) return null

            return value.split(";").reduce((rule, part)=>{
                let [key, val] = part.split("=")
                if(key && val) rule[key.toUpperCase()] = val
                return rule
            }, {})
        }

        function getRecurringWeekdays(rule, startDate){
            const bydayMap = {
                SU:"sun",
                MO:"mon",
                TU:"tue",
                WE:"wed",
                TH:"thu",
                FR:"fri",
                SA:"sat"
            }

            if(!rule || rule.FREQ !== "WEEKLY"){
                return [days[startDate.getDay()]]
            }

            if(rule.COUNT && Number(rule.COUNT) < 1){
                return []
            }

            if(rule.UNTIL){
                let untilDate = parseIcsDate(rule.UNTIL)
                if(untilDate && untilDate < startDate) return []
            }

            if(!rule.BYDAY){
                return [days[startDate.getDay()]]
            }

            return rule.BYDAY
                .split(",")
                .map(day => bydayMap[day.replace(/^[+-]?\d+/, "").toUpperCase()])
                .filter(Boolean)
        }

        function sameDate(a,b){
            return a.getFullYear() === b.getFullYear() &&
                   a.getMonth() === b.getMonth() &&
                   a.getDate() === b.getDate()
        }

        function startOfDay(date){
            return new Date(date.getFullYear(), date.getMonth(), date.getDate())
        }

        function addMonthEvent(eventDate, start, dur, title, location, description){
            if(!eventDate) return

            let key = dateKey(eventDate)
            if(!importedMonthEvents[key]) importedMonthEvents[key] = []

            importedMonthEvents[key].push({
                start: Math.round(start * 100) / 100,
                dur: Math.round(dur * 100) / 100,
                title,
                location,
                description
            })

            if(!firstImportedDate) firstImportedDate = new Date(eventDate.getFullYear(),eventDate.getMonth(),eventDate.getDate())
        }

        function normalizeImportedEventTitle(title){
            return String(title || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/\([^)]*\bstudio\b[^)]*\)/g, " ")
                .replace(/\b(?:rehearsal|performance)\b/g, " ")
                .replace(/[^a-z0-9]+/g, " ")
                .replace(/\s+/g, " ")
                .trim()
        }

        function importedEventSignature(eventDate, dayKey, start, dur, title){
            let eventKey = eventDate ? dateKey(eventDate) : String(dayKey || "")
            return [
                eventKey,
                Math.round(Number(start || 0) * 100) / 100,
                Math.round(Number(dur || 0) * 100) / 100,
                normalizeImportedEventTitle(title)
            ].join("|")
        }

        function importedSourceSignature(identity,eventDate,dayKey){
            let uid = String(identity?.uid || "").trim().toLowerCase()
            if(!uid) return ""

            let occurrenceDate = identity?.occurrenceDate || eventDate
            let occurrenceKey = occurrenceDate
                ? dateTimeExclusionKey(occurrenceDate)
                : String(dayKey || "")
            let segmentKey = eventDate ? dateKey(eventDate) : String(dayKey || "")
            return uid+"|"+occurrenceKey+"|"+segmentKey
        }

        function addImportedEvent(dayKey, start, end, title, location, description, eventDate=null,identity={}){
            let visibleStart = Math.max(start, START_HOUR)
            let visibleEnd = Math.min(end, START_HOUR + HOURS)
            let dur = visibleEnd - visibleStart

            if(dur <= 0) return false

            if(!isAbtRelevantEvent(title, location, description)){
                skippedNonAbt++
                return false
            }

            let sourceSignature = importedSourceSignature(identity,eventDate,dayKey)
            if(sourceSignature && seenImportedSourceEvents.has(sourceSignature)) return false

            let semanticSignature = importedEventSignature(eventDate, dayKey, visibleStart, dur, title)
            if(seenImportedSemanticEvents.has(semanticSignature)) return false

            if(sourceSignature) seenImportedSourceEvents.add(sourceSignature)
            seenImportedSemanticEvents.add(semanticSignature)

            importedWeekData[dayKey].push({
                start: Math.round(visibleStart * 100) / 100,
                dur: Math.round(dur * 100) / 100,
                title,
                location,
                description
            })

            importedCount++
            if(!firstImportedDay) firstImportedDay = dayKey
            addMonthEvent(eventDate,visibleStart,dur,title,location,description)

            return true
        }

        function addImportedEventRange(startDate, endDate, title, location, description,identity={}){
            let cursor = startOfDay(startDate)
            let finalDay = startOfDay(endDate)

            while(cursor <= finalDay){
                let dayKey = days[cursor.getDay()]
                let start = sameDate(cursor, startDate)
                    ? startDate.getHours() + (startDate.getMinutes() / 60)
                    : 0
                let end = sameDate(cursor, endDate)
                    ? endDate.getHours() + (endDate.getMinutes() / 60)
                    : 24

                if(end === 0 && !sameDate(cursor, startDate)){
                    cursor.setDate(cursor.getDate() + 1)
                    continue
                }

                addImportedEvent(
                    dayKey,
                    start,
                    end,
                    title,
                    location,
                    description,
                    new Date(cursor),
                    {...identity,occurrenceDate:identity.occurrenceDate || startDate}
                )
                cursor.setDate(cursor.getDate() + 1)
            }
        }

        function parseCsv(text){
            let rows = []
            let row = []
            let value = ""
            let quoted = false

            for(let i=0;i<text.length;i++){
                let ch = text[i]
                let next = text[i+1]

                if(ch === '"' && quoted && next === '"'){
                    value += '"'
                    i++
                }else if(ch === '"'){
                    quoted = !quoted
                }else if(ch === "," && !quoted){
                    row.push(value)
                    value = ""
                }else if(ch === "\n" && !quoted){
                    row.push(value)
                    if(row.some(cell => cell.trim() !== "")) rows.push(row)
                    row = []
                    value = ""
                }else{
                    value += ch
                }
            }

            row.push(value)
            if(row.some(cell => cell.trim() !== "")) rows.push(row)

            return rows
        }

        function normalizeHeader(value){
            return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "")
        }

        function getCsvCell(row, indexes, names){
            for(let name of names){
                let index = indexes[normalizeHeader(name)]
                if(index !== undefined && row[index] !== undefined) return row[index].trim()
            }

            return ""
        }

        function parseCsvDate(value){
            let raw = String(value || "").trim()
            if(!raw) return null

            let iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
            if(iso) return {year:Number(iso[1]), month:Number(iso[2]), day:Number(iso[3])}

            let slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
            if(slash){
                let year = Number(slash[3])
                if(year < 100) year += 2000
                return {year, month:Number(slash[1]), day:Number(slash[2])}
            }

            let parsed = new Date(raw)
            if(!Number.isNaN(parsed.getTime())){
                return {
                    year: parsed.getFullYear(),
                    month: parsed.getMonth() + 1,
                    day: parsed.getDate()
                }
            }

            return null
        }

        function parseCsvTime(value){
            let raw = String(value || "").trim()
            if(!raw) return {hour:0, minute:0}

            let match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i)
            if(!match) return {hour:0, minute:0}

            let hour = Number(match[1])
            let minute = Number(match[2] || 0)
            let suffix = (match[3] || "").toUpperCase()

            if(suffix === "PM" && hour < 12) hour += 12
            if(suffix === "AM" && hour === 12) hour = 0

            return {hour, minute}
        }

        function makeCsvDateTime(dateValue, timeValue){
            let date = parseCsvDate(dateValue)
            let time = parseCsvTime(timeValue)

            if(!date) return null

            return new Date(date.year, date.month - 1, date.day, time.hour, time.minute)
        }

        function importCsvEvents(text){
            let rows = parseCsv(text)
            if(rows.length < 2) return

            let headers = rows[0]
            let indexes = headers.reduce((map, header, index)=>{
                map[normalizeHeader(header)] = index
                return map
            }, {})

            rows.slice(1).forEach(row=>{
                let title = getCsvCell(row, indexes, ["Subject", "Title", "Summary", "Event"])
                let startDateValue = getCsvCell(row, indexes, ["Start Date", "StartDate", "Start"])
                let startTimeValue = getCsvCell(row, indexes, ["Start Time", "StartTime"])
                let endDateValue = getCsvCell(row, indexes, ["End Date", "EndDate", "End"])
                let endTimeValue = getCsvCell(row, indexes, ["End Time", "EndTime"])
                let description = getCsvCell(row, indexes, ["Description", "Body", "Notes"])
                let location = getCsvCell(row, indexes, ["Location", "Where"])

                let startDate = makeCsvDateTime(startDateValue, startTimeValue)
                let endDate = makeCsvDateTime(endDateValue || startDateValue, endTimeValue)

                if(!title) title = "Imported Event"
                if(!startDate || !endDate || endDate <= startDate) return

                addImportedEventRange(startDate, endDate, title, location, description)
            })
        }

        if(extension === "csv" || (!text.includes("BEGIN:VCALENDAR") && text.includes(","))){
            importCsvEvents(text)

            if(importedCount === 0){
                alert("No timed ABT events were found in that CSV file between 10:00 and 23:00.")
                return
            }

            commitImportedCalendar(importedMonthEvents, importedWeekData, {
                importedCount,
                skippedNonAbt,
                firstImportedDay,
                firstImportedDate,
                input,
                sourceLabel: "calendar"
            })
            return
        }

        const events = text.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || []
        const parsedEvents = events
            .map(ev => {
                let startInfo = parseIcsDateInfo(getProperty(ev, "DTSTART"))
                let endInfo = parseIcsDateInfo(getProperty(ev, "DTEND"))
                let durationValue = getProperty(ev, "DURATION")?.rawValue
                let endDate = endInfo?.date ||
                    addIcsDuration(startInfo?.date,durationValue) ||
                    (startInfo?.allDay ? addDays(startInfo.date,1) : null)

                return {
                    uid: getField(ev, "UID") || "",
                    recurrenceId: parseIcsDate(getProperty(ev, "RECURRENCE-ID")),
                    startDate: startInfo?.date || null,
                    endDate,
                    allDay: Boolean(startInfo?.allDay || endInfo?.allDay),
                    title: getField(ev, "SUMMARY") || "Imported Event",
                    location: getField(ev, "LOCATION") || "",
                    description: getField(ev, "DESCRIPTION") || "",
                    rule: parseRRule(getField(ev, "RRULE")),
                    exdates: propertyDateList(getProperties(ev, "EXDATE")),
                    rdates: propertyDateList(getProperties(ev, "RDATE"))
                }
            })
            .filter(event => event.startDate && event.endDate && event.endDate > event.startDate && !event.allDay)

        let overriddenOccurrences = new Set(parsedEvents
            .filter(event=>event.uid && event.recurrenceId)
            .map(event=>String(event.uid).trim().toLowerCase()+"|"+dateTimeExclusionKey(event.recurrenceId)))

        let importRangeAnchor = parsedEvents.find(event=>!event.rule || event.rule.FREQ !== "WEEKLY")?.startDate ||
            parsedEvents[0]?.startDate ||
            null

        parsedEvents
        .sort((a,b)=>Number(Boolean(b.recurrenceId)) - Number(Boolean(a.recurrenceId)))
        .forEach(event => {
            let { uid, recurrenceId, startDate, endDate, title, location, description, rule, exdates, rdates } = event
            let excluded = new Set(exdates.map(info=>dateTimeExclusionKey(info.date)))

            if(rule && ["DAILY","WEEKLY","MONTHLY"].includes(rule.FREQ)){
                let start = startDate.getHours() + (startDate.getMinutes() / 60)
                let end = endDate.getHours() + (endDate.getMinutes() / 60)

                if(endDate > startDate && end <= start && !sameDate(startDate,endDate)){
                    end = 24
                }

                let weekdays = rule.FREQ === "WEEKLY" ? getRecurringWeekdays(rule, startDate) : days
                let monthDays = rule.BYMONTHDAY
                    ? rule.BYMONTHDAY.split(",").map(Number).filter(Boolean)
                    : [startDate.getDate()]
                let rangeAnchor = importRangeAnchor || startDate
                let rangeStart = new Date(rangeAnchor.getFullYear(),rangeAnchor.getMonth(),1)
                let rangeEnd = new Date(rangeAnchor.getFullYear(),rangeAnchor.getMonth()+1,0)
                let startLimit = startOfDay(startDate)
                let untilDate = rule.UNTIL ? parseIcsDate(rule.UNTIL) : null
                let countLimit = rule.COUNT ? Number(rule.COUNT) : null
                let interval = Math.max(Number(rule.INTERVAL || 1),1)
                let added = 0
                let cursor = startOfDay(rangeStart)

                if(untilDate && untilDate < rangeEnd) rangeEnd = untilDate

                function daysBetween(a,b){
                    return Math.floor((startOfDay(a) - startOfDay(b)) / (1000 * 60 * 60 * 24))
                }

                function monthsBetween(a,b){
                    return (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth())
                }

                function matchesRecurrenceDate(date){
                    if(date < startLimit) return false

                    if(rule.FREQ === "DAILY"){
                        return daysBetween(date,startDate) % interval === 0
                    }

                    if(rule.FREQ === "WEEKLY"){
                        let weeks = Math.floor(daysBetween(date,startDate) / 7)
                        return weeks % interval === 0 && weekdays.includes(days[date.getDay()])
                    }

                    if(rule.FREQ === "MONTHLY"){
                        return monthsBetween(date,startDate) % interval === 0 && monthDays.includes(date.getDate())
                    }

                    return false
                }

                while(cursor <= rangeEnd){
                    let dayKey = days[cursor.getDay()]

                    if(matchesRecurrenceDate(cursor)){
                        let occurrenceDate = new Date(cursor)
                        occurrenceDate.setHours(startDate.getHours(),startDate.getMinutes(),0,0)

                        let occurrenceKey = String(uid || "").trim().toLowerCase()+"|"+dateTimeExclusionKey(occurrenceDate)
                        if(!excluded.has(dateTimeExclusionKey(occurrenceDate)) &&
                           (!uid || !overriddenOccurrences.has(occurrenceKey))){
                            addImportedEvent(
                                dayKey,
                                start,
                                end,
                                title,
                                location,
                                description,
                                new Date(cursor),
                                {uid,occurrenceDate}
                            )
                        }
                        added++
                        if(countLimit && added >= countLimit) break
                    }

                    cursor.setDate(cursor.getDate() + 1)
                }
            }else{
                if(!excluded.has(dateTimeExclusionKey(startDate))){
                    addImportedEventRange(
                        startDate,
                        endDate,
                        title,
                        location,
                        description,
                        {uid,occurrenceDate:recurrenceId || startDate}
                    )
                }
            }

            rdates.forEach(info=>{
                if(info.allDay || excluded.has(dateTimeExclusionKey(info.date))) return

                let duration = (endDate - startDate) / (1000 * 60 * 60)
                let rdateEnd = new Date(info.date)
                rdateEnd.setMinutes(rdateEnd.getMinutes() + Math.round(duration * 60))
                addImportedEventRange(
                    info.date,
                    rdateEnd,
                    title,
                    location,
                    description,
                    {uid,occurrenceDate:info.date}
                )
            })
        })

        if(importedCount === 0){
            alert("No timed ABT events were found in that calendar file between 10:00 and 23:00.")
            return
        }

        commitImportedCalendar(importedMonthEvents, importedWeekData, {
            importedCount,
            skippedNonAbt,
            firstImportedDay,
            firstImportedDate,
            input,
            sourceLabel: "calendar"
        })
    }

    reader.onerror = function(){
        if(input) input.value = ""
        alert("Could not read that .ics file.")
    }

    reader.readAsText(file)
}

//--------------------------------
// ICS EXPORT
//--------------------------------
function exportICS(){

    saveDay()

    let scope = getExportScope()
    let exportBlocks = scope==="month"
        ? getMonthExportBlocks()
        : scope==="selected-month-ot"
            ? getSelectedMonthOtExportBlocks()
            : scope==="ot-date-range"
                ? getOtDateRangeExportBlocks()
            : getSelectedWeekExportBlocks()

    // Default (week) scope: if the typed-in week is empty but the month has
    // events (synced calendars land in monthEvents), export the month instead
    // so Export Calendar isn't wrongly empty.
    if(exportBlocks.length===0 && scope!=="month" && scope!=="selected-month-ot" && scope!=="ot-date-range"){
        exportBlocks = getMonthPdfExportBlocks()
    }

    if(exportBlocks.length===0){
        alert(
            scope==="selected-month-ot"
                ? "There are no selected overtime month events to export."
                : scope==="ot-date-range"
                    ? "There are no overtime events in the selected export date range."
                    : "There are no events to export."
        )
        return
    }

    let dtstamp = formatUtcIcsDate(new Date())
    let lines=[
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//ABT//Overtime Planner//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:ABT Overtime Planner"
    ]
    let eventIndex = 0

    exportBlocks.forEach(block=>{
        let startDate = dateWithHour(block.date,block.start)
        let endDate = dateWithHour(block.date,block.start + block.dur)

        lines.push(
            "BEGIN:VEVENT",
            "UID:"+Date.now()+"-"+eventIndex+"@abt-overtime-planner",
            "DTSTAMP:"+dtstamp,
            "SUMMARY:"+escapeIcsText(block.title || "Block"),
            "DTSTART:"+formatLocalIcsDate(startDate),
            "DTEND:"+formatLocalIcsDate(endDate)
        )

        if(block.location) lines.push("LOCATION:"+escapeIcsText(block.location))
        if(block.description) lines.push("DESCRIPTION:"+escapeIcsText(block.description))

        lines.push("END:VEVENT")
        eventIndex++
    })

    lines.push("END:VCALENDAR")

    let ics=lines.map(foldIcsLine).join("\r\n")+"\r\n"

    let blob=new Blob([ics],{type:"text/calendar"})
    let link=document.createElement("a")
    link.href=URL.createObjectURL(blob)
    link.download=scope==="month"
        ? "abt-overtime-planner-month.ics"
        : scope==="selected-month-ot"
            ? "abt-overtime-planner-selected-month-ot.ics"
            : scope==="ot-date-range"
                ? "abt-overtime-planner-ot-date-range.ics"
            : "abt-overtime-planner-week.ics"
    link.click()
}

function dateWithHour(baseDate,hourValue){
    let dayOffset = Math.floor(hourValue / 24)
    let hour = Math.floor(hourValue % 24)
    let minute = Math.round((hourValue - Math.floor(hourValue)) * 60)
    let date = new Date(baseDate.getFullYear(),baseDate.getMonth(),baseDate.getDate())

    if(minute === 60){
        hour++
        minute = 0
    }

    date.setDate(date.getDate() + dayOffset)
    date.setHours(hour,minute,0,0)

    return date
}

function foldIcsLine(line){
    let value = String(line || "")
    let result = ""

    while(value.length > 75){
        result += value.slice(0,75)+"\r\n "
        value = value.slice(75)
    }

    return result + value
}

function dateForBlock(baseMonday,dayIndex,hourValue){
    let dayOffset = dayIndex + Math.floor(hourValue / 24)
    let hour = Math.floor(hourValue % 24)
    let minute = Math.round((hourValue - Math.floor(hourValue)) * 60)
    let date = new Date(baseMonday)

    if(minute === 60){
        hour++
        minute = 0
    }

    date.setDate(baseMonday.getDate() + dayOffset)
    date.setHours(hour,minute,0,0)

    return date
}

function formatLocalIcsDate(date){
    return date.getFullYear()+
        String(date.getMonth()+1).padStart(2,"0")+
        String(date.getDate()).padStart(2,"0")+"T"+
        String(date.getHours()).padStart(2,"0")+
        String(date.getMinutes()).padStart(2,"0")+
        "00"
}

function formatUtcIcsDate(date){
    return date.getUTCFullYear()+
        String(date.getUTCMonth()+1).padStart(2,"0")+
        String(date.getUTCDate()).padStart(2,"0")+"T"+
        String(date.getUTCHours()).padStart(2,"0")+
        String(date.getUTCMinutes()).padStart(2,"0")+
        String(date.getUTCSeconds()).padStart(2,"0")+"Z"
}

function escapeIcsText(value){
    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/\r?\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;")
}

function pdfAgendaDateLabel(date){
    return date.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"})
}

function formatCurrencyAmount(value){
    return "$"+(Math.round((Number(value) || 0) * 100) / 100).toFixed(2)
}

function effectiveOvertimeRulesSummaryText(){
    let currentCustom = normalizeCustomOvertimeRules(window.overtimeRulesCustom || {})
    let exceptionNames = CONTINUOUS_SPAN_EXCEPTIONS
        .map(rule=>String(rule?.name || "").trim())
        .filter(Boolean)
    let summary = [
        "Rules: " + formatHoursCompact(DAILY_REGULAR_HOURS) + " regular before OT",
        formatHoursCompact(CONTINUOUS_RESET_BREAK_HOURS) + " break resets continuous span",
        exceptionNames.length + " exceptions"
    ]
    if(currentCustom.continuous_span_exceptions.length){
        summary.push("Custom: " + currentCustom.continuous_span_exceptions.map(rule=>String(rule?.name || "").trim()).filter(Boolean).join(", "))
    }
    return summary.join(" | ")
}

function otSummaryLabel(block){
    let overtimeHours = Number(block.overtimeHours || 0)
    let doubleOvertimeHours = Number(block.doubleOvertimeHours || 0)
    let pay = calculateBlockPay(block)
    if(doubleOvertimeHours > 0 && overtimeHours > 0) return overtimeHours+"h OT / "+doubleOvertimeHours+"h Double | "+formatCurrencyAmount(pay)
    if(doubleOvertimeHours > 0) return doubleOvertimeHours+"h Double | "+formatCurrencyAmount(pay)
    if(overtimeHours > 0) return overtimeHours+"h OT | "+formatCurrencyAmount(pay)
    return "OT day | "+formatCurrencyAmount(pay)
}

function calculatePdfOtTotals(blocks){
    let grouped = new Map()
    ;(blocks || []).forEach(block=>{
        if(!block?.dateKey) return
        if(!grouped.has(block.dateKey)) grouped.set(block.dateKey,[])
        grouped.get(block.dateKey).push({
            start:Number(block.start) || START_HOUR,
            dur:Number(block.dur) || 0,
            title:block.title || "Block",
            location:block.location || "",
            description:block.description || ""
        })
    })

    let totalPay = 0
    let totalOvertimeHours = 0
    let totalDoubleHours = 0

    grouped.forEach(schedule=>{
        applyDailyOvertime(schedule)
        schedule.forEach(block=>{
            totalPay += calculateBlockPay(block)
            totalOvertimeHours += Number(block.overtimeHours || 0)
            totalDoubleHours += Number(block.doubleOvertimeHours || 0)
        })
    })

    return {
        pay:Math.round(totalPay * 100) / 100,
        overtimeHours:Math.round(totalOvertimeHours * 100) / 100,
        doubleHours:Math.round(totalDoubleHours * 100) / 100
    }
}

function getWeekPdfExportBlocks(){
    let grouped = new Map()
    getSelectedWeekExportBlocks().forEach(block=>{
        let key = dateKey(block.date)
        if(!grouped.has(key)) grouped.set(key,[])
        grouped.get(key).push({
            start:Number(block.start) || START_HOUR,
            dur:Number(block.dur) || 0,
            title:block.title || "Block",
            location:block.location || "",
            description:block.description || ""
        })
    })

    return Array.from(grouped.entries())
        .sort((a,b)=>String(a[0]).localeCompare(String(b[0])))
        .flatMap(([dateKey,events])=>{
            let schedule = events.map(event=>({...event}))
            applyDailyOvertime(schedule)
            let date = parseDateKey(dateKey)
            return schedule
                .sort((a,b)=>a.start-b.start)
                .map(block=>({date,dateKey,...block}))
        })
}

// All events in the anchor month, from monthEvents (synced/imported calendar)
// AND the selected week's planner blocks, with dateKey + OT applied. View-
// independent so Export PDF works even when the current week has no typed-in
// blocks. Dedupes identical events that exist in both stores.
function getMonthPdfExportBlocks(anchor){
    let anchorDate = anchor || monthAnchorDate ||
        (selectedWeekStartKey ? parseDateKey(selectedWeekStartKey) : new Date())
    let inMonth = d => d && !isNaN(d.getTime()) &&
        d.getFullYear() === anchorDate.getFullYear() && d.getMonth() === anchorDate.getMonth()

    let grouped = new Map()
    let seen = new Set()
    let add = (dKey, ev) => {
        let start = Number(ev.start) || START_HOUR
        let dur = Number(ev.dur) || 0
        let sig = dKey + "|" + start + "|" + dur + "|" + (ev.title || "")
        if(seen.has(sig)) return
        seen.add(sig)
        if(!grouped.has(dKey)) grouped.set(dKey, [])
        grouped.get(dKey).push({start, dur, title:ev.title || "Block", location:ev.location || "", description:ev.description || ""})
    }

    Object.keys(monthEvents).forEach(key=>{
        if(inMonth(parseDateKey(key))) (monthEvents[key] || []).forEach(ev=>add(key, ev))
    })
    getSelectedWeekExportBlocks().forEach(block=>{
        if(inMonth(block.date)) add(dateKey(block.date), block)
    })

    return Array.from(grouped.entries())
        .sort((a,b)=>String(a[0]).localeCompare(String(b[0])))
        .flatMap(([dKey,events])=>{
            let schedule = events.map(event=>({...event}))
            applyDailyOvertime(schedule)
            let date = parseDateKey(dKey)
            return schedule
                .sort((a,b)=>a.start-b.start)
                .map(block=>({date, dateKey:dKey, ...block}))
        })
}

// Overtime-day blocks for the anchor month, using the same OT-day collection as
// the week OT export (keeps full days that incur OT so daily totals compute
// correctly), so Export PDF (OT only) is consistent whether week or month.
function getMonthOtExportBlocks(){
    let grouped = new Map()
    getMonthPdfExportBlocks().forEach(block=>{
        let key = block.dateKey || dateKey(block.date)
        if(!grouped.has(key)) grouped.set(key, [])
        grouped.get(key).push({...block})
    })
    return collectOtExportBlocksFromDateEntries(Array.from(grouped.entries()))
}

// Blocks that Export PDF/CSV should use: the selected week, or the whole month
// when in month view or when the week has no typed-in blocks (synced events
// live in monthEvents). Shared so PDF and CSV never disagree. Returns {blocks, month}.
function chooseExportBlocks(){
    let weekBlocks = getWeekPdfExportBlocks()
    let month = plannerView === "month" || weekBlocks.length === 0
    let blocks = month ? getMonthPdfExportBlocks() : weekBlocks
    if(month && !blocks.length && plannerView !== "month"){ month = false; blocks = weekBlocks }
    return {blocks, month}
}

function csvEscape(value){
    let s = String(value == null ? "" : value)
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

// One row per block, with computed OT — spreadsheet-friendly for the overtime form.
function blocksToCsv(blocks){
    let rows = [["Date","Day","Start","End","Hours","Title","Location","Description","OT Hours","Double OT Hours","OT Pay"]]
    blocks.forEach(b=>{
        let date = b.date instanceof Date ? b.date : (b.dateKey ? parseDateKey(b.dateKey) : null)
        let hasDate = date && !isNaN(date.getTime())
        let ot = calculateBlockOvertime(b)
        let dbl = calculateBlockDoubleOvertime(b)
        rows.push([
            hasDate ? date.toLocaleDateString("en-US") : (b.dateKey || ""),
            hasDate ? date.toLocaleDateString("en-US",{weekday:"long"}) : (DAY_LABELS[b.day] || b.day || ""),
            formatTime(b.start),
            formatTime(b.start + b.dur),
            +Number(b.dur).toFixed(2),
            b.title || "Block",
            b.location || "",
            b.description || "",
            +ot.toFixed(2),
            +dbl.toFixed(2),
            formatCurrencyAmount(calculateBlockPay(b))
        ])
    })
    return rows.map(row => row.map(csvEscape).join(",")).join("\r\n")
}

function downloadCsv(text, filename){
    // Prepend a BOM so Excel opens the UTF-8 file with correct characters.
    let blob = new Blob(["﻿" + text], {type:"text/csv;charset=utf-8"})
    let url = URL.createObjectURL(blob)
    let a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(()=>URL.revokeObjectURL(url), 1000)
}

function exportCSV(){
    saveDay()
    // Honour the same export-scope selector as PDF/ICS so the CSV matches what
    // the user picked, not just the current view.
    let scope = getExportScope()
    let blocks, label
    if(scope === "selected-month-ot"){ blocks = getSelectedMonthOtExportBlocks(); label = "month-ot" }
    else if(scope === "ot-date-range"){ blocks = getOtDateRangeExportBlocks(); label = "ot-range" }
    else if(scope === "month"){ blocks = getMonthPdfExportBlocks(); label = "month" }
    else { let chosen = chooseExportBlocks(); blocks = chosen.blocks; label = chosen.month ? "month" : "week" }

    if(!blocks.length){
        alert("No scheduled blocks to export to CSV.")
        return
    }
    downloadCsv(blocksToCsv(blocks), "abt-overtime-" + label + ".csv")
    setSaveStatus("Exported " + blocks.length + " row" + (blocks.length === 1 ? "" : "s") + " to CSV")
}

function collectOtExportBlocksFromDateEntries(entries){
    return (entries || [])
        .sort((a,b)=>String(a[0]).localeCompare(String(b[0])))
        .flatMap(([dateKey,events])=>{
            let schedule = (events || []).map(event=>({
                start:Number(event.start) || START_HOUR,
                dur:Number(event.dur) || 0,
                title:event.title || "Imported Event",
                location:event.location || "",
                description:event.description || ""
            }))
            let pay = calculateDailyPay(schedule)
            if(pay <= 0) return []
            let date = parseDateKey(dateKey)
            return schedule
                .sort((a,b)=>a.start-b.start)
                .map(block=>({date,dateKey,...block}))
        })
}

// jsPDF's built-in helvetica only renders Latin-1 text. Emoji, pictographs and
// other symbols (common in calendar titles) otherwise come out as garbled
// boxes that look like stray icons — strip them so the PDF stays clean,
// readable text. Common typographic characters are folded to ASCII first.
function sanitizePdfText(value){
    return String(value == null ? "" : value)
        .replace(/[‘’‚‛]/g, "'")
        .replace(/[“”„‟]/g, '"')
        .replace(/[‐-―]/g, "-")
        .replace(/…/g, "...")
        .replace(/[  -​  　]/g, " ")
        .replace(/[^\x20-\x7E¡-ÿ]/g, "")
        .replace(/\s+/g, " ")
        .trim()
}

// Output a finished PDF. On devices that support sharing files (iPad/iOS,
// Android, some desktops) this opens the native share sheet — AirDrop, Mail,
// Messages, Save to Files, Print, copy to another app — instead of only a
// local download. Everywhere else it falls back to a normal download.
async function savePdfDocument(doc,filename){
    try{
        if(typeof navigator.share === "function" && typeof File !== "undefined" && navigator.canShare){
            let file = new File([doc.output("blob")],filename,{type:"application/pdf"})
            if(navigator.canShare({files:[file]})){
                try{
                    await navigator.share({files:[file],title:"ABT Overtime Planner"})
                    return
                }catch(error){
                    if(error?.name === "AbortError") return
                    console.warn("PDF share failed, downloading instead.",error)
                }
            }
        }
    }catch(error){
        console.warn("PDF share unavailable, downloading instead.",error)
    }
    doc.save(filename)
}

function renderAgendaPdfBlocks(doc,blocks,{title,summary,filename,emptyMessage="No agenda items match this export."}){
    let pageWidth = doc.internal.pageSize.getWidth()
    let pageHeight = doc.internal.pageSize.getHeight()
    let margin = 12
    let contentWidth = pageWidth - (margin * 2)
    let y = 16

    doc.setFont("helvetica","bold")
    doc.setFontSize(18)
    doc.text(sanitizePdfText(title),margin,y)
    y += 8

    doc.setFont("helvetica","normal")
    doc.setFontSize(10)
    let summaryLines = doc.splitTextToSize(sanitizePdfText(summary),contentWidth)
    doc.text(summaryLines,margin,y)
    y += summaryLines.length * 5 + 4

    if(!blocks.length){
        doc.setFontSize(12)
        doc.text(emptyMessage,margin,y)
        savePdfDocument(doc,filename)
        return
    }

    let groupedEvents = new Map()
    blocks.forEach(block=>{
        if(!block?.dateKey) return
        if(!groupedEvents.has(block.dateKey)) groupedEvents.set(block.dateKey,[])
        groupedEvents.get(block.dateKey).push(block)
    })

    Array.from(groupedEvents.keys()).sort().forEach(key=>{
        let date = parseDateKey(key)
        let events = (groupedEvents.get(key) || []).slice().sort((a,b)=>a.start-b.start)
        let dailyPay = Math.round(events.reduce((sum,block)=>sum + calculateBlockPay(block),0) * 100) / 100
        let columns = [
            {key:"time",label:"Time",width:34},
            {key:"title",label:"Title / Name",width:52},
            {key:"location",label:"Location",width:48},
            {key:"ot",label:"OT / Amount",width:46},
            {key:"notes",label:"Notes",width:contentWidth - 180}
        ]

        if(y > pageHeight - 32){
            doc.addPage()
            y = 16
        }

        doc.setDrawColor(32,43,56)
        doc.setFillColor(242,245,247)
        doc.roundedRect(margin,y,contentWidth,10,3,3,"FD")
        doc.setFont("helvetica","bold")
        doc.setFontSize(11)
        doc.text(pdfAgendaDateLabel(date),margin + 4,y + 6.5)
        doc.setFont("helvetica","normal")
        doc.setFontSize(10)
        doc.text("Day OT: "+formatCurrencyAmount(dailyPay),pageWidth - margin - 4,y + 6.5,{align:"right"})
        y += 14

        doc.setFillColor(248,250,252)
        doc.setDrawColor(215,221,228)
        doc.rect(margin,y,contentWidth,8,"FD")
        doc.setFont("helvetica","bold")
        doc.setFontSize(9)
        let headerX = margin
        columns.forEach(column=>{
            doc.text(column.label,headerX + 2,y + 5.2)
            headerX += column.width
        })
        y += 8

        events.forEach(block=>{
            let cellValues = {
                time:formatTime(block.start)+" - "+formatTime(block.start + block.dur),
                title:sanitizePdfText(block.title) || "Block",
                location:sanitizePdfText(block.location) || " ",
                ot:otSummaryLabel(block),
                notes:sanitizePdfText(block.description) || " "
            }
            let wrappedCells = columns.map(column=>doc.splitTextToSize(String(cellValues[column.key] || " "),Math.max(column.width - 4,12)))
            let rowLineCount = wrappedCells.reduce((maxCount,lines)=>Math.max(maxCount,lines.length || 1),1)
            let rowHeight = Math.max(8,rowLineCount * 4.2 + 3)

            if(y + rowHeight > pageHeight - 12){
                doc.addPage()
                y = 16
                doc.setFillColor(248,250,252)
                doc.setDrawColor(215,221,228)
                doc.rect(margin,y,contentWidth,8,"FD")
                doc.setFont("helvetica","bold")
                doc.setFontSize(9)
                let restartX = margin
                columns.forEach(column=>{
                    doc.text(column.label,restartX + 2,y + 5.2)
                    restartX += column.width
                })
                y += 8
            }

            doc.setDrawColor(201,209,217)
            doc.setFillColor(255,255,255)
            doc.rect(margin,y,contentWidth,rowHeight,"FD")
            doc.setFont("helvetica","normal")
            doc.setFontSize(9)
            let cellX = margin
            columns.forEach((column,index)=>{
                if(index > 0) doc.line(cellX,y,cellX,y + rowHeight)
                doc.text(wrappedCells[index],cellX + 2,y + 4.5)
                cellX += column.width
            })
            y += rowHeight
        })
        y += 4
    })

    savePdfDocument(doc,filename)
}

//--------------------------------
// PDF
//--------------------------------
function exportPDF(){
    saveDay()
    let scope = getExportScope()

    if(scope === "ot-date-range"){
        openOtDateRangeExportDialog()
        return
    }

    if(scope === "selected-month-ot"){
        let exportBlocks = getSelectedMonthOtExportBlocks()
        let totals = calculatePdfOtTotals(exportBlocks)
        const { jsPDF } = window.jspdf
        let doc = new jsPDF({orientation:"landscape",unit:"mm",format:"letter"})
        renderAgendaPdfBlocks(doc,exportBlocks,{
            title:"ABT Overtime Planner - Selected Month OT",
            summary:"Selected OT events: "+exportBlocks.length+" | OT pay: "+formatCurrencyAmount(totals.pay)+" | OT hours: "+totals.overtimeHours+" | Double OT: "+totals.doubleHours+"\n"+effectiveOvertimeRulesSummaryText(),
            filename:"planner-selected-month-ot.pdf",
            emptyMessage:"No selected overtime month events match this export."
        })
        return
    }

    if(scope === "month"){
        let filterSummary = monthAgendaFilterSummary()
        let exportBlocks = visibleAgendaBlocks()
        // visibleAgendaBlocks is view-filtered and comes back empty outside month
        // view; fall back to the whole month so the export isn't wrongly empty.
        if(!exportBlocks.length) exportBlocks = getMonthPdfExportBlocks()
        let totals = calculatePdfOtTotals(exportBlocks)
        const { jsPDF } = window.jspdf
        let doc = new jsPDF({orientation:"landscape",unit:"mm",format:"letter"})
        renderAgendaPdfBlocks(doc,exportBlocks,{
            title:"ABT Overtime Planner - "+monthName(monthAnchorDate),
            summary:filterSummary+" | OT pay: "+formatCurrencyAmount(totals.pay)+" | OT hours: "+totals.overtimeHours+" | Double OT: "+totals.doubleHours+"\n"+effectiveOvertimeRulesSummaryText(),
            filename:"planner-month-agenda.pdf",
            emptyMessage:"No agenda items match the selected month filter."
        })
        return
    }

    // Default: export the selected week. But if you're in month view, or the
    // selected week has no typed-in blocks while the month has events (e.g. a
    // synced calendar lands in monthEvents), export the whole month so the PDF
    // is never wrongly empty.
    let {blocks: exportBlocks, month: useMonth} = chooseExportBlocks()
    let totals = calculatePdfOtTotals(exportBlocks)
    const { jsPDF } = window.jspdf
    let doc = new jsPDF({orientation:"landscape",unit:"mm",format:"letter"})

    if(useMonth){
        renderAgendaPdfBlocks(doc,exportBlocks,{
            title:"ABT Overtime Planner - "+monthName(monthAnchorDate),
            summary:"Month: "+monthName(monthAnchorDate)+" | OT pay: "+formatCurrencyAmount(totals.pay)+" | OT hours: "+totals.overtimeHours+" | Double OT: "+totals.doubleHours+"\n"+effectiveOvertimeRulesSummaryText(),
            filename:"planner-month.pdf",
            emptyMessage:"No scheduled blocks were found this month."
        })
        return
    }

    let weekLabel = selectedWeekStartKey
        ? weekRangeLabel(parseDateKey(selectedWeekStartKey))
        : "Current week"
    renderAgendaPdfBlocks(doc,exportBlocks,{
        title:"ABT Overtime Planner - Week",
        summary:"Week: "+weekLabel+" | Daily total: "+document.getElementById("daily").innerText+" | Weekly total: "+document.getElementById("weekly").innerText+" | OT pay: "+formatCurrencyAmount(totals.pay)+" | OT hours: "+totals.overtimeHours+" | Double OT: "+totals.doubleHours+"\n"+effectiveOvertimeRulesSummaryText(),
        filename:"planner.pdf",
        emptyMessage:"No scheduled blocks were found in the selected week."
    })
}

function exportWeekOtPDF(){
    saveDay()
    let weekOt = getSelectedWeekOtExportBlocks()
    // If the selected week has no OT (common when events are synced into the
    // month rather than typed into the week), fall back to the month's OT days.
    let useMonth = weekOt.length === 0
    let exportBlocks = useMonth ? getMonthOtExportBlocks() : weekOt
    if(useMonth && !exportBlocks.length){ useMonth = false; exportBlocks = weekOt }

    let totals = calculatePdfOtTotals(exportBlocks)
    const { jsPDF } = window.jspdf
    let doc = new jsPDF({orientation:"landscape",unit:"mm",format:"letter"})

    if(useMonth){
        renderAgendaPdfBlocks(doc,exportBlocks,{
            title:"ABT Overtime Planner - "+monthName(monthAnchorDate)+" OT",
            summary:"Month: "+monthName(monthAnchorDate)+" | OT pay: "+formatCurrencyAmount(totals.pay)+" | OT hours: "+totals.overtimeHours+" | Double OT: "+totals.doubleHours+"\n"+effectiveOvertimeRulesSummaryText(),
            filename:"planner-month-ot.pdf",
            emptyMessage:"No overtime events were found this month."
        })
        return
    }

    let weekLabel = selectedWeekStartKey
        ? weekRangeLabel(parseDateKey(selectedWeekStartKey))
        : "Current week"
    renderAgendaPdfBlocks(doc,exportBlocks,{
        title:"ABT Overtime Planner - Week OT",
        summary:"Week: "+weekLabel+" | OT pay: "+formatCurrencyAmount(totals.pay)+" | OT hours: "+totals.overtimeHours+" | Double OT: "+totals.doubleHours+"\n"+effectiveOvertimeRulesSummaryText(),
        filename:"planner-week-ot.pdf",
        emptyMessage:"No overtime events were found in the selected week."
    })
}

function polishControlLabels(){
    const labels = new Map([
        ["addBlock()","Add Block"],
        ["undoLastChange()","Undo"],
        ["resetAll()","Reset"],
        ["selectAllBlocks()","Select All"],
        ["clearSelection()","Clear"],
        ["editSelectedBlock()","Edit"],
        ["copySelectedBlock()","Copy"],
        ["cutSelectedBlock()","Cut"],
        ["pasteBlock()","Paste"],
        ["importICS()","Import Calendar"],
        ["openImportFilterEditor()","Import Filters"],
        ["exportICS()","Export Calendar"],
        ["exportPDF()","PDF"]
    ])

    document.querySelectorAll("button[onclick]").forEach(button=>{
        const label = labels.get(button.getAttribute("onclick"))
        if(label && !button.querySelector(".button-icon")) button.textContent = label
    })
}

function updateAppViewportMetrics(){
    let height = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight
    document.documentElement.style.setProperty("--app-vh",(height * 0.01)+"px")
    syncInputCapabilityClasses()
}

// iOS/iPadOS Safari fires visualViewport "resize" continuously while the URL
// bar collapses/expands during scroll. Treat sub-threshold height-only changes
// as scroll chrome (cosmetic), not a real layout change, so the docked panes
// — whose sizing depends on --app-vh — don't jitter/flicker on every scroll.
const VIEWPORT_RELAYOUT_THRESHOLD = 90
function viewportChangeIsSignificant(){
    let bounds = currentViewportBounds()
    if(lastViewportWidth === null || lastViewportHeight === null) return true
    if(Math.round(bounds.width) !== Math.round(lastViewportWidth)) return true
    return Math.abs(bounds.height - lastViewportHeight) >= VIEWPORT_RELAYOUT_THRESHOLD
}

function currentViewportBounds(){
    return {
        width:window.innerWidth || document.documentElement.clientWidth || 1024,
        height:window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 768
    }
}

function scheduleViewportMetricUpdate(){
    clearTimeout(viewportUpdateTimer)
    viewportUpdateTimer = setTimeout(()=>{
        // Skip the relayout cascade for scroll-driven URL-bar resizes (the iPad
        // flicker): only commit when the viewport meaningfully changed.
        if(!viewportChangeIsSignificant()) return
        let bounds = currentViewportBounds()
        lastViewportWidth = bounds.width
        lastViewportHeight = bounds.height
        updateAppViewportMetrics()
        // Re-evaluate device-mode classes (mode-phone/ipad/desktop) so the
        // layout follows orientation changes — e.g. rotating a phone into
        // landscape must keep the phone shell, not fall back to the grid.
        syncInputCapabilityClasses?.()
        applyWorkspaceLayout(currentWorkspaceLayout())
        applyTimelineZoom({render:false})
    },120)
}

function isDesktopWorkspaceLayout(){
    return !isPhoneLayout()
}

function parseWorkspaceBool(value){
    return value === true || value === "true"
}

function clampWorkspaceLayout(layout){
    let viewport = currentViewportBounds()
    let margin = 12
    let ipadLayout = isFloatingTabletLayout()
    let railFloating = parseWorkspaceBool(layout?.railFloating ?? false)
    let agendaFloating = parseWorkspaceBool(layout?.agendaFloating ?? false)
    let railDefault = ipadLayout ? 192 : 208
    let agendaDefault = ipadLayout ? 320 : 380
    let railMin = ipadLayout ? 168 : 160
    let viewportWidthCap = Math.max(220,viewport.width - (margin * 2))
    // Docked iPad panes share the row with the calendar, so cap them to a
    // fraction of the viewport. Floating panes overlay the calendar, so they
    // can grow much wider — otherwise left/right resize feels stuck near the
    // cap while up/down stays free.
    let railMax = !ipadLayout ? viewportWidthCap
        : (railFloating ? viewportWidthCap : Math.max(railMin,Math.min(360,Math.round(viewport.width * 0.34))))
    let agendaMin = 260
    let agendaMax = !ipadLayout ? viewportWidthCap
        : (agendaFloating ? viewportWidthCap : Math.max(agendaMin,Math.min(460,Math.round(viewport.width * 0.44))))
    let railWidth = Math.min(Math.max(Number(layout?.rail) || railDefault,railMin),Math.max(railMax,railMin))
    let agendaWidth = Math.min(Math.max(Number(layout?.agenda) || agendaDefault,agendaMin),Math.max(agendaMax,agendaMin))
    let agendaHeight = Math.min(Math.max(Number(layout?.agendaHeight) || 360,220),Math.max(240,viewport.height - (margin * 2)))
    let railHeight = Math.min(Math.max(Number(layout?.railHeight) || 420,220),Math.max(240,viewport.height - (margin * 2)))
    let railDock = ["left","right"].includes(layout?.railDock) ? layout.railDock : "left"
    let agendaDock = ["left","right","bottom"].includes(layout?.agendaDock) ? layout.agendaDock : "right"
    if(ipadLayout && agendaDock === "bottom") agendaDock = "right"
    // iPad defaults to a docked 3-column layout (like desktop) so panels never
    // overlap the calendar; the user can opt into floating via the Undock button.
    if(agendaDock !== "bottom" && agendaDock === railDock){
        agendaDock = railDock === "left" ? "right" : "left"
    }
    let topOffset = ipadLayout ? 70 : margin
    let railDefaultX = railDock === "right"
        ? Math.max(margin,viewport.width - railWidth - margin)
        : margin
    let railDefaultY = topOffset
    let agendaDefaultX = agendaDock === "left"
        ? margin
        : Math.max(margin,viewport.width - agendaWidth - margin)
    let agendaDefaultY = agendaDock === "bottom"
        ? Math.max(margin,viewport.height - agendaHeight - margin)
        : topOffset
    let railX = Math.min(Math.max(Number(layout?.railX),margin),Math.max(margin,viewport.width - railWidth - margin))
    let railY = Math.min(Math.max(Number(layout?.railY),margin),Math.max(margin,viewport.height - 180))
    let agendaX = Math.min(Math.max(Number(layout?.agendaX),margin),Math.max(margin,viewport.width - agendaWidth - margin))
    let agendaY = Math.min(Math.max(Number(layout?.agendaY),margin),Math.max(margin,viewport.height - agendaHeight - margin))
    if(!Number.isFinite(railX)) railX = railDefaultX
    if(!Number.isFinite(railY)) railY = railDefaultY
    if(!Number.isFinite(agendaX)) agendaX = agendaDefaultX
    if(!Number.isFinite(agendaY)) agendaY = agendaDefaultY
    return {
        rail:railWidth,
        agenda:agendaWidth,
        agendaHeight:agendaHeight,
        railHeight:railHeight,
        railDock,
        agendaDock,
        railFloating,
        agendaFloating,
        railX,
        railY,
        agendaX,
        agendaY
    }
}

function applyWorkspaceLayout(layout){
    let next = clampWorkspaceLayout(layout)
    let workspace = document.querySelector(".calendar-workspace")
    document.documentElement.style.setProperty("--workspace-rail-width",next.rail+"px")
    document.documentElement.style.setProperty("--workspace-agenda-width",next.agenda+"px")
    document.documentElement.style.setProperty("--tablet-agenda-height",next.agendaHeight+"px")
    document.documentElement.style.setProperty("--workspace-rail-height",next.railHeight+"px")
    document.documentElement.style.setProperty("--workspace-rail-left",next.railX+"px")
    document.documentElement.style.setProperty("--workspace-rail-top",next.railY+"px")
    document.documentElement.style.setProperty("--workspace-agenda-left",next.agendaX+"px")
    document.documentElement.style.setProperty("--workspace-agenda-top",next.agendaY+"px")
    if(workspace){
        workspace.dataset.railDock = next.railDock
        workspace.dataset.agendaDock = next.agendaDock
        workspace.dataset.railFloating = String(Boolean(next.railFloating))
        workspace.dataset.agendaFloating = String(Boolean(next.agendaFloating))

        // Force the docked iPad column widths inline (with !important) so the
        // saved sizes always win. The stylesheet has many overlapping
        // breakpoint rules for .calendar-workspace columns that otherwise froze
        // the panes (the +/- buttons changed the value but not the rendered
        // width). Inline !important beats them all.
        let ipadDocked = typeof isFloatingTabletLayout === "function" && isFloatingTabletLayout()
            && !next.railFloating && !next.agendaFloating
            && !document.body.classList.contains("navigation-auto-hide")
            && !document.body.classList.contains("agenda-auto-hide")
            && next.agendaDock !== "bottom"
        if(ipadDocked){
            // Plain px tracks (no minmax/min wrappers) — simplest possible value
            // so no browser can mis-parse or re-cap it; inline !important wins.
            let railCol = next.rail + "px"
            let agendaCol = next.agenda + "px"
            let cols = next.railDock === "right"
                ? agendaCol + " 24px minmax(0px, 1fr) 24px " + railCol
                : railCol + " 24px minmax(0px, 1fr) 24px " + agendaCol
            workspace.style.setProperty("display", "grid", "important")
            workspace.style.setProperty("grid-template-columns", cols, "important")
        }else{
            workspace.style.removeProperty("grid-template-columns")
            workspace.style.removeProperty("display")
        }
    }
    syncPaneDockControls(next)
}

function loadWorkspaceLayout(){
    try{
        applyWorkspaceLayout(JSON.parse(localStorage.getItem(WORKSPACE_LAYOUT_KEY) || "null"))
    }catch(error){
        applyWorkspaceLayout({})
    }
}

function saveWorkspaceLayout(layout){
    let next = clampWorkspaceLayout(layout)
    try{
        localStorage.setItem(WORKSPACE_LAYOUT_KEY,JSON.stringify(next))
    }catch(error){
        console.warn("Workspace layout could not be saved.",error)
    }
    applyWorkspaceLayout(next)
}

function currentWorkspaceLayout(){
    let styles = getComputedStyle(document.documentElement)
    let workspace = document.querySelector(".calendar-workspace")
    return clampWorkspaceLayout({
        rail:parseFloat(styles.getPropertyValue("--workspace-rail-width")),
        agenda:parseFloat(styles.getPropertyValue("--workspace-agenda-width")),
        agendaHeight:parseFloat(styles.getPropertyValue("--tablet-agenda-height")),
        railHeight:parseFloat(styles.getPropertyValue("--workspace-rail-height")),
        railX:parseFloat(styles.getPropertyValue("--workspace-rail-left")),
        railY:parseFloat(styles.getPropertyValue("--workspace-rail-top")),
        agendaX:parseFloat(styles.getPropertyValue("--workspace-agenda-left")),
        agendaY:parseFloat(styles.getPropertyValue("--workspace-agenda-top")),
        railDock:workspace?.dataset.railDock,
        agendaDock:workspace?.dataset.agendaDock,
        railFloating:workspace?.dataset.railFloating,
        agendaFloating:workspace?.dataset.agendaFloating
    })
}

function isPaneFloating(pane,layout=currentWorkspaceLayout()){
    let next = clampWorkspaceLayout(layout)
    return pane === "rail" ? next.railFloating : next.agendaFloating
}

// Tap-based pane resize — reliable on touch where dragging the thin divider is
// fiddly. Works for both docked and floating panes (adjusts the same width var).
function stepPaneWidth(pane,delta){
    let layout = currentWorkspaceLayout()
    if(pane === "rail") layout.rail = (Number(layout.rail) || 0) + delta
    else layout.agenda = (Number(layout.agenda) || 0) + delta
    saveWorkspaceLayout(layout)
    if(typeof window.showAppToast === "function"){
        // Report the ACTUAL rendered width (not the saved value) so it's obvious
        // whether the pane really resized on this device.
        let selector = pane === "rail" ? ".calendar-rail" : ".agenda-pane"
        let el = document.querySelector(selector)
        let rendered = el ? Math.round(el.getBoundingClientRect().width) : 0
        showAppToast((pane === "rail" ? "Nav" : "Agenda") + " " + rendered + "px")
    }
    cachedTimelineHeight = null
}

function syncPaneDockControls(layout=currentWorkspaceLayout()){
    let next = clampWorkspaceLayout(layout)
    document.querySelectorAll("[data-dock-target]").forEach(button=>{
        let target = button.dataset.dockTarget
        let value = button.dataset.dockValue
        let floating = target === "rail" ? next.railFloating : next.agendaFloating
        let active = !floating && (target === "rail" ? next.railDock : next.agendaDock) === value
        button.classList.toggle("is-active",active)
        button.setAttribute("aria-pressed",String(active))
    })
    if(typeof window.syncPaneFloatButtons === "function") window.syncPaneFloatButtons(next)
}

function setPaneFloating(pane,floating){
    let next = currentWorkspaceLayout()
    let shouldFloat = Boolean(floating)
    let viewport = currentViewportBounds()
    let margin = 12
    let workspaceRect = shouldFloat ? document.querySelector(".calendar-workspace")?.getBoundingClientRect() : null
    let workspaceTop = (workspaceRect && Number.isFinite(workspaceRect.top) && workspaceRect.top > margin) ? workspaceRect.top : margin

    if(pane === "rail"){
        next.railFloating = shouldFloat
        next.railX = next.railDock === "right"
            ? Math.max(margin,viewport.width - next.rail - margin)
            : margin
        next.railY = shouldFloat ? workspaceTop : margin
    }

    if(pane === "agenda"){
        next.agendaFloating = shouldFloat
        if(next.agendaDock === "bottom"){
            next.agendaX = Math.max(margin,viewport.width - next.agenda - margin)
            next.agendaY = Math.max(margin,viewport.height - next.agendaHeight - margin)
        }else{
            next.agendaX = next.agendaDock === "left"
                ? margin
                : Math.max(margin,viewport.width - next.agenda - margin)
            next.agendaY = shouldFloat ? workspaceTop : margin
        }
    }

    saveWorkspaceLayout(next)
    syncTabletAgendaControls(currentWorkspaceLayout().agendaHeight,"")
    cachedTimelineHeight = null
}

function togglePaneFloating(pane){
    if(!isFloatingTabletLayout()) return
    setPaneFloating(pane,!isPaneFloating(pane))
}

function setPaneDock(pane,dock){
    let next = currentWorkspaceLayout()
    if(isFloatingTabletLayout()){
        let viewport = currentViewportBounds()
        let margin = 12
        if(pane === "rail"){
            next.railDock = ["left","right"].includes(dock) ? dock : next.railDock
            next.railFloating = false
            next.railX = dock === "right" ? Math.max(margin,viewport.width - next.rail - margin) : margin
            next.railY = margin
        }
        if(pane === "agenda"){
            let targetDock = dock === "bottom" ? "right" : dock
            next.agendaDock = ["left","right"].includes(targetDock) ? targetDock : next.agendaDock
            next.agendaFloating = false
            if(next.agendaDock === "left") next.agendaX = margin
            if(next.agendaDock === "right") next.agendaX = Math.max(margin,viewport.width - next.agenda - margin)
            next.agendaY = margin
        }
        saveWorkspaceLayout(next)
        syncTabletAgendaControls(currentWorkspaceLayout().agendaHeight,"")
        cachedTimelineHeight = null
        return
    }
    if(pane === "rail"){
        next.railDock = ["left","right"].includes(dock) ? dock : next.railDock
        next.railFloating = false
        if(next.agendaDock !== "bottom" && next.agendaDock === next.railDock){
            next.agendaDock = next.railDock === "left" ? "right" : "left"
        }
    }
    if(pane === "agenda"){
        next.agendaDock = ["left","right","bottom"].includes(dock) ? dock : next.agendaDock
        next.agendaFloating = false
        if(next.agendaDock !== "bottom" && next.agendaDock === next.railDock){
            next.railDock = next.agendaDock === "left" ? "right" : "left"
        }
    }
    saveWorkspaceLayout(next)
    syncTabletAgendaControls(currentWorkspaceLayout().agendaHeight,"")
    cachedTimelineHeight = null
}

function initWorkspaceResizers(){
    document.querySelectorAll(".workspace-resizer").forEach(handle=>{
        handle.addEventListener("pointerdown",event=>{
            if(!isDesktopWorkspaceLayout()) return
            event.preventDefault()
            handle.setPointerCapture?.(event.pointerId)
            document.body.classList.add("resizing-workspace")

            let startX = event.clientX
            let start = currentWorkspaceLayout()
            let pane = handle.dataset.resizePane
            // The agenda only resizes vertically when it's docked to the bottom
            // (a desktop-only option); when side-docked (always on iPad, and the
            // default on desktop) it resizes by width like the rail. Keying off
            // the dock — not the viewport size — is what makes the iPad agenda
            // resizer actually move the pane.
            let agendaIsBottom = start.agendaDock === "bottom"
            handle.setAttribute("aria-valuemin",pane === "agenda" ? "260" : "160")
            handle.setAttribute("aria-valuemax",pane === "agenda" ? "760" : "360")
            handle.setAttribute("aria-valuenow",String(Math.round(
                pane === "agenda"
                    ? (agendaIsBottom ? start.agendaHeight : start.agenda)
                    : start.rail
            )))

            function onMove(moveEvent){
                let next = {...start}
                let dx = moveEvent.clientX - startX
                if(pane === "rail"){
                    // Resizer sits opposite the dock edge, so invert for a right dock.
                    next.rail = start.railDock === "right" ? start.rail - dx : start.rail + dx
                }
                if(pane === "agenda"){
                    if(agendaIsBottom){
                        let dy = moveEvent.clientY - event.clientY
                        next.agendaHeight = start.agendaHeight + dy
                    }else{
                        next.agenda = start.agendaDock === "left" ? start.agenda + dx : start.agenda - dx
                    }
                }
                applyWorkspaceLayout(next)
                let current = currentWorkspaceLayout()
                if(pane === "agenda" && agendaIsBottom) syncTabletAgendaControls(current.agendaHeight,"")
                let valueNow = pane === "agenda"
                    ? (agendaIsBottom ? current.agendaHeight : current.agenda)
                    : current.rail
                handle.setAttribute("aria-valuenow",String(Math.round(valueNow)))
            }

            function onUp(){
                document.body.classList.remove("resizing-workspace")
                document.removeEventListener("pointermove",onMove)
                document.removeEventListener("pointerup",onUp)
                document.removeEventListener("pointercancel",onUp)
                saveWorkspaceLayout(currentWorkspaceLayout())
                cachedTimelineHeight = null
            }

            document.addEventListener("pointermove",onMove)
            document.addEventListener("pointerup",onUp)
            document.addEventListener("pointercancel",onUp)
        })
    })
}

function ensureButtonIcon(button,iconClass){
    if(!button || !iconClass) return
    let icon = button.querySelector(".button-icon")
    if(!icon){
        icon = document.createElement("span")
        icon.className = "button-icon"
        icon.setAttribute("aria-hidden","true")
        button.prepend(icon)
    }
    icon.className = "button-icon " + iconClass
    button.classList.add("icon-text-button")
}

function enhanceMenuIcons(){
    const iconTargets = [
        ["fileMenuButton","icon-folder"],
        ["editMenuButton","icon-edit"],
        ["calendarMenuButton","icon-calendar"],
        ["toolsMenuButton","icon-settings"],
        ["viewMenuButton","icon-view"],
        ["saveMenuButton","icon-save"],
        ["saveAsMenuButton","icon-save-as"],
        ["openMenuButton","icon-open"],
        ["importCalendarMenuButton","icon-import"],
        ["exportCalendarMenuButton","icon-export"],
        ["pdfMenuButton","icon-pdf"],
        ["importOneDriveMenuButton","icon-cloud-download"],
        ["importGoogleDriveMenuButton","icon-cloud-download"],
        ["uploadOneDriveMenuButton","icon-cloud-upload"],
        ["uploadGoogleDriveMenuButton","icon-cloud-upload"],
        ["searchMenuButton","icon-search"],
        ["settingsMenuButton","icon-settings"],
        ["conflictReviewMenuButton","icon-calendar-check"],
        ["filterOvertimeMenuButton","icon-filter"],
        ["toolbarCustomizeMenuButton","icon-view"],
        ["autosaveMenuButton","icon-autosave"],
        ["zoomMenuButton","icon-zoom"],
        ["themeMenuButton","icon-theme"]
    ]

    iconTargets.forEach(([id,iconClass])=>ensureButtonIcon(document.getElementById(id),iconClass))

    const byOnclick = new Map([
        ["saveProject()","icon-save"],
        ["saveProjectAs()","icon-save-as"],
        ["openProjectFile()","icon-open"],
        ["importICS()","icon-import"],
        ["exportICS()","icon-export"],
        ["exportPDF()","icon-pdf"],
        ["openFullSearch()","icon-search"],
        ["openSettings()","icon-settings"],
        ["openConflictReview()","icon-calendar-check"],
        ["openImportFilterEditor()","icon-filter"],
        ["toggleAutosave()","icon-autosave"],
        ["openToolbarCustomizer()","icon-view"],
        ["setDayVisibilityFilter('overtime')","icon-filter"]
    ])

    document.querySelectorAll(".file-menu-item, .file-menu-button, .toolbar-menu button").forEach(button=>{
        let onclick = button.getAttribute("onclick")
        let iconClass = byOnclick.get(onclick) || ""
        if(!iconClass){
            let text = button.textContent.toLowerCase()
            if(text.includes("search")) iconClass = "icon-search"
            else if(text.includes("setting")) iconClass = "icon-settings"
            else if(text.includes("filter")) iconClass = "icon-filter"
            else if(text.includes("save as")) iconClass = "icon-save-as"
            else if(text.includes("save")) iconClass = "icon-save"
            else if(text.includes("open")) iconClass = "icon-open"
            else if(text.includes("import")) iconClass = "icon-import"
            else if(text.includes("export")) iconClass = "icon-export"
            else if(text.includes("pdf")) iconClass = "icon-pdf"
            else if(text.includes("onedrive")) iconClass = button.textContent.toLowerCase().includes("import") ? "icon-cloud-download" : "icon-cloud-upload"
            else if(text.includes("google drive")) iconClass = button.textContent.toLowerCase().includes("import") ? "icon-cloud-download" : "icon-cloud-upload"
        }
        ensureButtonIcon(button,iconClass)
    })
}

const DESKTOP_MENU_ORDER = [
    {id:"fileMenuButton", label:"File", icon:"icon-folder"},
    {id:"editMenuButton", label:"Edit", icon:"icon-edit"},
    {id:"calendarMenuButton", label:"Calendar", icon:"icon-calendar"},
    {id:"viewMenuButton", label:"View", icon:"icon-view"},
    {id:"toolsMenuButton", label:"Tools", icon:"icon-settings"}
]

function findMenuButton(menu){
    return document.getElementById(menu.id) || Array.from(document.querySelectorAll("#controls .file-menu-button"))
        .find(button=>button.textContent.trim().toLowerCase() === menu.label.toLowerCase())
}

function enforceDesktopMenuBar(){
    const controls = document.getElementById("controls")
    if(!controls) return
    if(!isDesktopLayout()){
        controls.classList.remove("top-menu-bar")
        return
    }

    let wraps = DESKTOP_MENU_ORDER.map(menu=>{
        let button = findMenuButton(menu)
        ensureButtonIcon(button,menu.icon)
        if(button){
            button.classList.add("desktop-menu-button")
            let label = button.querySelector(".button-label")
            if(label) label.textContent = menu.label
        }
        return button?.closest(".file-menu-wrap") || null
    }).filter(Boolean)

    if(!wraps.length) return

    Array.from(controls.children).forEach(child=>{
        if(!wraps.includes(child)) child.remove()
    })

    wraps.forEach(wrap=>controls.appendChild(wrap))
    controls.classList.remove("optimized-controls")
    controls.classList.add("top-menu-bar")
}

function ensureMenuBarRendered(){
    const controls = document.getElementById("controls")
    if(!controls) return
    if(controls.querySelector(".file-menu-wrap")) return

    toolbarSettings = cloneToolbarDefaults()
    try{
        localStorage.setItem(TOOLBAR_SETTINGS_KEY,JSON.stringify(toolbarSettings))
    }catch(error){
        console.warn("Toolbar settings fallback could not be saved.",error)
    }

    originalRebuildToolbar()
    enforceDesktopMenuBar()
    enhanceMenuIcons()
}

const OUTLOOK_CHROME_KEY = "abtPlannerOutlookChrome"

function loadOutlookChromeState(){
    try{
        const saved = JSON.parse(localStorage.getItem(OUTLOOK_CHROME_KEY) || "{}")
        return {
            ...saved,
            ribbonAutoHide:!!saved.ribbonAutoHide,
            navigationAutoHide:!!saved.navigationAutoHide,
            agendaAutoHide:!!saved.agendaAutoHide
        }
    }catch(error){
        return {ribbonAutoHide:false,navigationAutoHide:false,agendaAutoHide:false}
    }
}

function saveOutlookChromeState(){
    try{
        localStorage.setItem(OUTLOOK_CHROME_KEY,JSON.stringify({
            ribbonAutoHide:document.body.classList.contains("ribbon-auto-hide"),
            navigationAutoHide:document.body.classList.contains("navigation-auto-hide"),
            agendaAutoHide:document.body.classList.contains("agenda-auto-hide")
        }))
    }catch(error){
        console.warn("Outlook chrome state could not be saved.",error)
    }
}

function applyOutlookChromeState(state=loadOutlookChromeState()){
    document.body.classList.toggle("ribbon-auto-hide",!!state.ribbonAutoHide)
    document.body.classList.toggle("navigation-auto-hide",!!state.navigationAutoHide)
    document.body.classList.toggle("agenda-auto-hide",!!state.agendaAutoHide)
    updateOutlookChromeButtons()
}

function updateOutlookChromeButtons(){
    const ribbonHidden = document.body.classList.contains("ribbon-auto-hide")
    const navHidden = document.body.classList.contains("navigation-auto-hide")
    const agendaHidden = document.body.classList.contains("agenda-auto-hide")
    const ribbonButton = document.getElementById("ribbonPinButton")
    const navButton = document.getElementById("navPanePinButton")
    const agendaButton = document.getElementById("agendaPanePinButton")

    if(ribbonButton){
        ribbonButton.classList.toggle("is-unpinned",ribbonHidden)
        ribbonButton.setAttribute("aria-pressed",String(!ribbonHidden))
        ribbonButton.setAttribute("aria-label",ribbonHidden ? "Keep ribbon shown" : "Auto-hide ribbon")
        ribbonButton.title = ribbonHidden ? "Keep ribbon shown" : "Auto-hide ribbon"
    }

    if(navButton){
        navButton.classList.toggle("is-unpinned",navHidden)
        navButton.setAttribute("aria-pressed",String(!navHidden))
        navButton.setAttribute("aria-label",navHidden ? "Keep navigation pane shown" : "Auto-hide navigation pane")
        navButton.title = navHidden ? "Keep navigation pane shown" : "Auto-hide navigation pane"
    }

    if(agendaButton){
        agendaButton.classList.toggle("is-unpinned",agendaHidden)
        agendaButton.setAttribute("aria-pressed",String(!agendaHidden))
        agendaButton.setAttribute("aria-label",agendaHidden ? "Keep agenda shown" : "Auto-hide agenda pane")
        agendaButton.title = agendaHidden ? "Keep agenda shown" : "Auto-hide agenda pane"
    }
}

function toggleRibbonAutoHide(){
    document.body.classList.toggle("ribbon-auto-hide")
    if(!document.body.classList.contains("ribbon-auto-hide")) hideRibbonPeek()
    if(document.body.classList.contains("ribbon-auto-hide")) closeOpenFileMenus()
    updateOutlookChromeButtons()
    saveOutlookChromeState()
}

function toggleNavigationPaneAutoHide(){
    document.body.classList.toggle("navigation-auto-hide")
    updateOutlookChromeButtons()
    saveOutlookChromeState()
    // Re-apply so the forced inline iPad column widths are cleared/restored to
    // match the new auto-hide state (otherwise the collapsed pane can't shrink).
    applyWorkspaceLayout(currentWorkspaceLayout())
    cachedTimelineHeight = null
}

function toggleAgendaPaneAutoHide(){
    document.body.classList.toggle("agenda-auto-hide")
    updateOutlookChromeButtons()
    saveOutlookChromeState()
    applyWorkspaceLayout(currentWorkspaceLayout())
    cachedTimelineHeight = null
}

function revealRibbon(){
    if(!document.body.classList.contains("ribbon-auto-hide")) return
    document.querySelector(".outlook-topbar")?.classList.add("ribbon-peek")
}

function hideRibbonPeek(){
    document.querySelector(".outlook-topbar")?.classList.remove("ribbon-peek","ribbon-menu-open")
}

function setActiveRibbonTab(tab){
    if(!tab) return
    document.querySelectorAll(".outlook-ribbon-tab").forEach(button=>{
        let active = button === tab
        button.classList.toggle("is-active",active)
        button.setAttribute("aria-selected",String(active))
    })
}

function openRibbonMenu(menuButtonId){
    const trigger = document.getElementById(menuButtonId)
    const wrap = trigger?.closest(".file-menu-wrap")
    const menu = trigger?.nextElementSibling
    if(!trigger || !wrap || !menu) return

    enhanceMenuIcons()
    revealRibbon()
    closeOpenFileMenus()
    wrap.classList.add("is-open")
    if(isMobileLayout()) menu.classList.add("is-mobile-open")
    trigger.setAttribute("aria-expanded","true")
    document.querySelector(".outlook-topbar")?.classList.add("ribbon-menu-open")
    enforceRibbonFlyout(menu,trigger)
    if(!isMobileLayout()) trigger.focus({preventScroll:true})
}

function enforceRibbonFlyout(menu,trigger=null){
    if(!menu) return
    if(isMobileLayout()){
        resetRibbonFlyoutOverflow()
        const isPhone = isPhoneLayout()
        menu.classList.add("is-mobile-open")
        Object.assign(menu.style,{
            position:"fixed",
            top:"auto",
            right:"max(6px, env(safe-area-inset-right))",
            bottom:"calc(64px + max(6px, env(safe-area-inset-bottom)))",
            left:"max(6px, env(safe-area-inset-left))",
            transform:"none",
            width:"auto",
            maxWidth:"none",
            maxHeight:"min(calc(var(--app-vh) * 58), 460px)",
            overflow:"auto",
            overflowX:"hidden",
            overflowY:"auto",
            scrollbarWidth:"thin",
            gridTemplateColumns:isPhone ? "1fr" : "repeat(2, minmax(0, 1fr))",
            margin:"0"
        })
        trigger?.setAttribute("aria-expanded","true")
        return
    }
    enableRibbonFlyoutOverflow()
    const isFolderMenu = menu.classList.contains("file-backstage-menu")
    const width = isFolderMenu ? "min(520px, calc(100vw - 24px))" : "min(420px, calc(100vw - 24px))"
    const columns = isFolderMenu ? "repeat(2, minmax(150px, 1fr))" : "repeat(2, minmax(145px, 1fr))"

    Object.assign(menu.style,{
        position:"absolute",
        top:"calc(100% + 8px)",
        bottom:"auto",
        left:"0",
        right:"auto",
        transform:"none",
        width,
        maxWidth:"calc(100vw - 24px)",
        maxHeight:"none",
        overflow:"visible",
        overflowX:"visible",
        overflowY:"visible",
        scrollbarWidth:"none",
        gridTemplateColumns:columns,
        margin:"0"
    })

    requestAnimationFrame(()=>{
        const rect = menu.getBoundingClientRect()
        if(rect.right > window.innerWidth - 8){
            menu.style.left = "auto"
            menu.style.right = "0"
        }
        if(rect.left < 8){
            menu.style.left = "0"
            menu.style.right = "auto"
        }
        trigger?.setAttribute("aria-expanded","true")
    })
}

function enableRibbonFlyoutOverflow(){
    ;[".outlook-topbar",".outlook-topbar .toolbar","#controls"].forEach(selector=>{
        const node = document.querySelector(selector)
        if(!node) return
        node.style.overflow = "visible"
        node.style.overflowX = "visible"
        node.style.overflowY = "visible"
    })
}

function resetRibbonFlyoutOverflow(){
    ;[".outlook-topbar",".outlook-topbar .toolbar","#controls"].forEach(selector=>{
        const node = document.querySelector(selector)
        if(!node) return
        node.style.overflow = ""
        node.style.overflowX = ""
        node.style.overflowY = ""
    })
}

function showRibbonFromTab(tab=null,event=null){
    event?.stopPropagation()
    setActiveRibbonTab(tab)
    revealRibbon()
    const target = tab?.dataset?.ribbonTarget || "home"
    if(target === "home"){
        closeOpenFileMenus()
        return
    }
    openRibbonMenu(target)
}

function openMenuFromQueryParam(){
    try{
        const menu = new URLSearchParams(window.location.search).get("openMenu")
        const byName = {
            file:"fileMenuButton",
            edit:"editMenuButton",
            calendar:"calendarMenuButton",
            tools:"toolsMenuButton",
            view:"viewMenuButton"
        }
        const targetId = byName[String(menu || "").toLowerCase()]
        if(targetId) requestAnimationFrame(()=>openRibbonMenu(targetId))
    }catch(error){
        console.warn("Could not open menu from query parameter.",error)
    }
}

function openAgendaFilterFromQueryParam(){
    try{
        const filter = new URLSearchParams(window.location.search).get("openAgendaFilter")
        const allowed = new Set(["overtime","source","field","duration"])
        if(allowed.has(String(filter || "").toLowerCase())){
            requestAnimationFrame(()=>toggleAgendaFilterMenu(String(filter).toLowerCase()))
        }
    }catch(error){
        console.warn("Could not open agenda filter from query parameter.",error)
    }
}

const originalRenderMonthView = renderMonthView
renderMonthView = function(...args){
    const result = originalRenderMonthView.apply(this,args)
    applyOvertimeFilterToViews()
    return result
}

const originalUpdate = update
update = function(...args){
    const result = originalUpdate.apply(this,args)
    applyOvertimeFilterToViews()
    return result
}

const originalRebuildToolbar = rebuildToolbar
rebuildToolbar = function(...args){
    const result = originalRebuildToolbar.apply(this,args)
    enforceDesktopMenuBar()
    enhanceMenuIcons()
    requestAnimationFrame(()=>enhanceMenuIcons())
    return result
}

// INIT
applyCustomOvertimeRulesState(readCustomOvertimeRulesFromStorage())
updateAppViewportMetrics()
;({width:lastViewportWidth,height:lastViewportHeight} = currentViewportBounds())
loadModeBadgePreference()
syncInputCapabilityClasses()
loadWorkspaceLayout()
loadThemeMode()
loadTimelineZoom()
loadTimelineLayoutMode()
loadDefaultPlannerView()
loadDayVisibilityFilter()
loadSearchScopeFilter()
loadSearchSourceFilter()
loadSearchDurationFilter()
loadFullSearchFieldFilter()
loadAgendaSourceFilter()
loadAgendaDurationFilter()
loadAgendaSearchFieldFilter()
loadAutosavePreference()
loadToolbarCustomization()
loadTabletAgendaSize()
initAgendaFilterMenus()
rebuildToolbar()
enforceDesktopMenuBar()
applyOutlookChromeState()
polishControlLabels()
enhanceMenuIcons()
ensureMenuBarRendered()
requestAnimationFrame(()=>ensureMenuBarRendered())
openMenuFromQueryParam()
openAgendaFilterFromQueryParam()
buildTimeline()
applyTimelineZoom()
updateActiveDay()
loadProjectName()
restorePlannerState()
if(!selectedWeekStartKey){
    selectedWeekStartKey = dateKey(startOfPlannerWeek(new Date()))
    syncSelectedWeekToMonth()
    if(defaultPlannerView !== plannerView) setPlannerView(defaultPlannerView)
}
if(isPhoneLayout() && (plannerView === "week" || plannerView === "workweek")) setPlannerView("three-day")
updateWeekHeader()
updateImportSummary()
isInitializingState = false
savePlannerState()
setSaveStatus(autosaveEnabled ? "Autosaved locally" : "Autosave disabled")
updateUndoButton()
updateOutlookPanels()
initWorkspaceResizers()
initFloatingPaneDrag()
ensurePaneResizeGrips()
initGCal()
loadFormProfile()
setTimeout(maybeNudgeBackup, 2500)
