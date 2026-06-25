const path = require("node:path");
const { test, expect } = require("@playwright/test");

const fixture = path.join(__dirname, "fixtures", "calendar-regression.ics");

test("calendar import identity, recurrence, OT views, export, and removal", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("dialog", dialog => dialog.accept());

  await page.goto("file:///" + path.resolve(__dirname, "..", "index.html").replaceAll("\\", "/"));
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#fileInput").setInputFiles(fixture);

  await expect.poll(() => page.evaluate(() => importedEventCount)).toBe(14);

  const imported = await page.evaluate(() => ({
    total: Object.values(monthEvents).flat().length,
    feb2: monthEvents["2026-02-02"]?.map(event => event.title) || [],
    feb4: monthEvents["2026-02-04"]?.map(event => event.title) || [],
    feb5: monthEvents["2026-02-05"]?.map(event => event.title) || [],
    feb6: monthEvents["2026-02-06"]?.map(event => event.title) || [],
    feb9: monthEvents["2026-02-09"]?.map(event => event.title) || [],
    feb16: monthEvents["2026-02-16"]?.map(event => event.title) || [],
    feb20: monthEvents["2026-02-20"]?.map(event => event.title) || [],
    feb21: monthEvents["2026-02-21"]?.map(event => event.title) || []
  }));

  expect(imported.total).toBe(14);
  expect(imported.feb2).toEqual(["SYLVIA Rehearsal"]);
  expect(imported.feb4).toHaveLength(1);
  expect(imported.feb5).toHaveLength(1);
  expect(imported.feb6).toHaveLength(7);
  expect(imported.feb9).toEqual(["SYLVIA Rehearsal - Moved"]);
  expect(imported.feb16).toEqual(["SYLVIA Rehearsal"]);
  expect(imported.feb20).toEqual(["ABT Overnight Rehearsal"]);
  expect(imported.feb21).toEqual(["ABT Overnight Rehearsal"]);

  await page.locator("#fileInput").setInputFiles(fixture);
  await expect.poll(() => page.evaluate(() => importedEventCount)).toBe(14);
  await expect.poll(() => page.evaluate(() => Object.values(monthEvents).flat().length)).toBe(14);

  const transitions = await page.evaluate(() => {
    monthAnchorDate = new Date(2026, 1, 1);
    selectedWeekStartKey = "2026-02-02";
    setPlannerView("month");
    renderMonthView();
    setDayVisibilityFilter("overtime");

    const result = {};
    for (const view of ["week", "day", "three-day", "workweek"]) {
      setPlannerView(view);
      result[view] = [...document.querySelectorAll(".day-heading")]
        .filter(node => getComputedStyle(node).display !== "none")
        .map(node => node.dataset.day);
    }
    return result;
  });

  expect(transitions.week).toEqual(["fri"]);
  expect(transitions.day).toEqual(["fri"]);
  expect(transitions["three-day"]).toEqual(["fri"]);
  expect(transitions.workweek).toEqual(["fri"]);

  const monthLayout = await page.evaluate(() => {
    monthAnchorDate = new Date(2026, 1, 1);
    setPlannerView("month");
    renderMonthView();
    return {
      weekdays: [...document.querySelectorAll(".month-weekdays span")].map(node => node.textContent.trim()),
      firstGridDate: document.querySelector(".month-day")?.dataset.dateKey || null,
      firstMiniDate: document.querySelector(".mini-month-day")?.textContent?.trim() || null,
      workweekDays: visibleTimelineDays("workweek")
    };
  });

  expect(monthLayout.weekdays).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  expect(monthLayout.firstGridDate).toBe("2026-01-26");
  expect(monthLayout.firstMiniDate).toBe("26");
  expect(monthLayout.workweekDays).toEqual(["mon", "tue", "wed", "thu", "fri", "sat"]);

  const monthYearScope = await page.evaluate(() => {
    monthEvents["2025-02-13"] = [{
      start: 10,
      dur: 6,
      title: "Prior Year Overtime",
      location: "",
      description: ""
    }];

    monthAnchorDate = new Date(2026, 1, 1);
    setPlannerView("month");
    renderMonthView();
    setDayVisibilityFilter("overtime");

    return [...new Set(visibleAgendaBlocks().map(block => block.dateKey))];
  });

  expect(monthYearScope).toEqual(["2026-02-06"]);

  await page.evaluate(() => {
    setDayVisibilityFilter("all");
    monthAnchorDate = new Date(2026, 1, 1);
    setPlannerView("month");
    document.querySelector("#exportScope").value = "month";
  });
  const monthCount = await page.evaluate(() => getMonthExportBlocks().length);
  expect(monthCount).toBe(14);

  const downloadPromise = page.waitForEvent("download");
  await page.evaluate(() => exportICS());
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("abt-overtime-planner-month.ics");

  await page.evaluate(() => removeImportedCalendar());
  await expect.poll(() => page.evaluate(() => Object.values(monthEvents).flat().length)).toBe(0);
  expect(pageErrors).toEqual([]);
});

test("opened project state survives reload", async ({ page }) => {
  await page.goto("file:///" + path.resolve(__dirname, "..", "index.html").replaceAll("\\", "/"));
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const beforeReload = await page.evaluate(async () => {
    const state = {
      fileType: PROJECT_FILE_TYPE,
      version: PROJECT_FILE_VERSION,
      projectName: "memory-test.abt-planner.json",
      weekData: {
        mon: [{ start: 11, dur: 2, title: "Saved Block", location: "Studio 5", description: "note" }],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: [],
        sun: []
      },
      monthEvents: {
        "2026-04-16": [{ start: 11, dur: 2, title: "Saved Event", location: "Studio 5", description: "note" }]
      },
      currentDay: "mon",
      plannerView: "month",
      selectedWeekStartKey: "2026-04-13",
      importSummaryText: "Imported 1 timed event",
      importedEventCount: 1,
      skippedNonAbtCount: 0,
      customImportKeywords: ["abt"],
      exportScope: "month",
      monthAnchorDate: "2026-04-01"
    };

    const file = new File([JSON.stringify(state)], "memory-test.abt-planner.json", { type: "application/json" });
    await openProjectBlob(file);
    savePlannerState();

    return {
      currentProjectName,
      plannerView,
      selectedWeekStartKey,
      monthAnchorDate: dateKey(monthAnchorDate),
      importedEventCount,
      monCount: weekData.mon.length,
      monthCount: Object.values(monthEvents).flat().length
    };
  });

  await page.reload();

  const afterReload = await page.evaluate(() => ({
    currentProjectName,
    plannerView,
    selectedWeekStartKey,
    monthAnchorDate: dateKey(monthAnchorDate),
    importedEventCount,
    monCount: weekData.mon.length,
    monthCount: Object.values(monthEvents).flat().length
  }));

  expect(beforeReload).toEqual({
    currentProjectName: "memory-test.abt-planner.json",
    plannerView: "month",
    selectedWeekStartKey: "2026-04-13",
    monthAnchorDate: "2026-04-01",
    importedEventCount: 1,
    monCount: 1,
    monthCount: 1
  });

  expect(afterReload).toEqual(beforeReload);
});

test("stale saved duplicate imports are scrubbed on restore", async ({ page }) => {
  await page.goto("file:///" + path.resolve(__dirname, "..", "index.html").replaceAll("\\", "/"));
  await page.evaluate(() => localStorage.clear());

  await page.evaluate(() => {
    const duplicateState = {
      fileType: PROJECT_FILE_TYPE,
      version: PROJECT_FILE_VERSION,
      projectName: "duplicate-state.abt-planner.json",
      weekData: {
        mon: [],
        tue: [
          { start: 11, dur: 1.5, title: "Swan Lake", location: "Studio 5", description: "" },
          { start: 11, dur: 1.5, title: "Swan Lake", location: "Studio 5", description: "" },
          { start: 13, dur: 1.5, title: "Variations", location: "Studio 2", description: "" },
          { start: 13, dur: 1.5, title: "Variations", location: "Studio 2", description: "" }
        ],
        wed: [],
        thu: [],
        fri: [],
        sat: [],
        sun: []
      },
      monthEvents: {
        "2026-05-26": [
          { start: 11, dur: 1.5, title: "Swan Lake", location: "Studio 5", description: "" },
          { start: 11, dur: 1.5, title: "Swan Lake", location: "Studio 5", description: "" },
          { start: 13, dur: 1.5, title: "Variations", location: "Studio 2", description: "" },
          { start: 13, dur: 1.5, title: "Variations", location: "Studio 2", description: "" }
        ]
      },
      currentDay: "tue",
      plannerView: "month",
      selectedWeekStartKey: "2026-05-25",
      importSummaryText: "Imported 4 timed events",
      importedEventCount: 4,
      skippedNonAbtCount: 0,
      customImportKeywords: [],
      exportScope: "month",
      monthAnchorDate: "2026-05-01"
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(duplicateState));
  });

  await page.reload();

  const restored = await page.evaluate(() => ({
    importedEventCount,
    dayCount: monthEvents["2026-05-26"]?.length || 0,
    weekCount: weekData.tue.length,
    hasOt: hasOvertimeForDateKey("2026-05-26")
  }));

  expect(restored).toEqual({
    importedEventCount: 2,
    dayCount: 2,
    weekCount: 2,
    hasOt: false
  });
});

test("restore scrub removes semantic import duplicates with different notes", async ({ page }) => {
  await page.goto("file:///" + path.resolve(__dirname, "..", "index.html").replaceAll("\\", "/"));
  await page.evaluate(() => localStorage.clear());

  await page.evaluate(() => {
    const duplicateState = {
      fileType: PROJECT_FILE_TYPE,
      version: PROJECT_FILE_VERSION,
      projectName: "semantic-duplicate-state.abt-planner.json",
      weekData: {
        mon: [],
        tue: [
          { start: 11.58, dur: 0.92, title: "Spanos Rehearsal - Sylvia (Studio 2)", location: "Studio 2", description: "First copy" },
          { start: 11.58, dur: 0.92, title: "Spanos Performance - Sylvia", location: "American Ballet Theatre", description: "Second copy" },
          { start: 12.58, dur: 0.92, title: "Spanos Rehearsal - Variations", location: "Studio 5", description: "" }
        ],
        wed: [],
        thu: [],
        fri: [],
        sat: [],
        sun: []
      },
      monthEvents: {
        "2026-05-26": [
          { start: 11.58, dur: 0.92, title: "Spanos Rehearsal - Sylvia (Studio 2)", location: "Studio 2", description: "First copy" },
          { start: 11.58, dur: 0.92, title: "Spanos Performance - Sylvia", location: "American Ballet Theatre", description: "Second copy" },
          { start: 12.58, dur: 0.92, title: "Spanos Rehearsal - Variations", location: "Studio 5", description: "" }
        ]
      },
      currentDay: "tue",
      plannerView: "month",
      selectedWeekStartKey: "2026-05-25",
      importSummaryText: "Imported 3 timed events",
      importedEventCount: 3,
      skippedNonAbtCount: 0,
      customImportKeywords: [],
      exportScope: "month",
      monthAnchorDate: "2026-05-01"
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(duplicateState));
  });

  await page.reload();

  const restored = await page.evaluate(() => ({
    importedEventCount,
    dayCount: monthEvents["2026-05-26"]?.length || 0,
    weekCount: weekData.tue.length
  }));

  expect(restored).toEqual({
    importedEventCount: 2,
    dayCount: 2,
    weekCount: 2
  });
});

test("ipad panes can undock and dock back", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "platform", { get: () => "MacIntel", configurable: true });
    Object.defineProperty(navigator, "maxTouchPoints", { get: () => 5, configurable: true });
    Object.defineProperty(navigator, "userAgent", { get: () => "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)", configurable: true });
  });
  await page.setViewportSize({ width: 1180, height: 900 });
  await page.goto("file:///" + path.resolve(__dirname, "..", "index.html").replaceAll("\\", "/"));
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const initial = await page.evaluate(() => {
    const workspace = document.querySelector(".calendar-workspace");
    const railRect = document.querySelector(".calendar-rail")?.getBoundingClientRect();
    const mainRect = document.querySelector(".calendar-main")?.getBoundingClientRect();
    const agendaRect = document.querySelector(".agenda-pane")?.getBoundingClientRect();
    return {
      deviceMode: document.body.dataset.deviceMode,
      railFloatButton: document.getElementById("railFloatToggleButton")?.textContent?.trim() || "",
      agendaFloatButton: document.getElementById("agendaFloatToggleButton")?.textContent?.trim() || "",
      railFloating: workspace?.dataset.railFloating || "false",
      agendaFloating: workspace?.dataset.agendaFloating || "false",
      agendaDock: workspace?.dataset.agendaDock || "",
      workspaceDisplay: workspace ? getComputedStyle(workspace).display : "",
      railX: railRect?.x || 0,
      railY: railRect?.y || 0,
      mainX: mainRect?.x || 0,
      mainY: mainRect?.y || 0,
      agendaX: agendaRect?.x || 0,
      agendaY: agendaRect?.y || 0,
      agendaWidth: agendaRect?.width || 0
    };
  });

  // iPad default: panels float so main timeline gets full width
  expect(initial.deviceMode).toBe("ipad");
  expect(initial.railFloatButton).toBe("Dock");
  expect(initial.agendaFloatButton).toBe("Dock");
  expect(initial.railFloating).toBe("true");
  expect(initial.agendaFloating).toBe("true");
  expect(initial.agendaDock).toBe("right");
  expect(initial.workspaceDisplay).toBe("grid");
  expect(initial.agendaWidth).toBeGreaterThan(240);

  // Dock both panels via setPaneDock (which also sets floating=false)
  const floating = await page.evaluate(() => {
    setPaneDock("rail", "left");
    setPaneDock("agenda", "right");
    const workspace = document.querySelector(".calendar-workspace");
    return {
      railFloating: workspace?.dataset.railFloating || "false",
      agendaFloating: workspace?.dataset.agendaFloating || "false",
      railButton: document.getElementById("railFloatToggleButton")?.textContent?.trim() || "",
      agendaButton: document.getElementById("agendaFloatToggleButton")?.textContent?.trim() || "",
      railPosition: getComputedStyle(document.querySelector(".calendar-rail")).position,
      agendaPosition: getComputedStyle(document.querySelector(".agenda-pane")).position
    };
  });

  expect(floating).toEqual({
    railFloating: "false",
    agendaFloating: "false",
    railButton: "Undock",
    agendaButton: "Undock",
    railPosition: "relative",
    agendaPosition: "relative"
  });

  const docked = await page.evaluate(() => {
    setPaneDock("rail", "left");
    setPaneDock("agenda", "right");
    const workspace = document.querySelector(".calendar-workspace");
    const railRect = document.querySelector(".calendar-rail")?.getBoundingClientRect();
    const mainRect = document.querySelector(".calendar-main")?.getBoundingClientRect();
    const agendaRect = document.querySelector(".agenda-pane")?.getBoundingClientRect();
    return {
      railFloating: workspace?.dataset.railFloating || "false",
      agendaFloating: workspace?.dataset.agendaFloating || "false",
      railButton: document.getElementById("railFloatToggleButton")?.textContent?.trim() || "",
      agendaButton: document.getElementById("agendaFloatToggleButton")?.textContent?.trim() || "",
      railPosition: getComputedStyle(document.querySelector(".calendar-rail")).position,
      agendaPosition: getComputedStyle(document.querySelector(".agenda-pane")).position,
      workspaceDisplay: getComputedStyle(workspace).display,
      railX: railRect?.x || 0,
      railY: railRect?.y || 0,
      railWidth: railRect?.width || 0,
      mainX: mainRect?.x || 0,
      mainY: mainRect?.y || 0,
      mainWidth: mainRect?.width || 0,
      mainHeight: mainRect?.height || 0,
      agendaX: agendaRect?.x || 0,
      agendaY: agendaRect?.y || 0,
      agendaWidth: agendaRect?.width || 0,
      agendaHeight: agendaRect?.height || 0
    };
  });

  expect(docked.railFloating).toBe("false");
  expect(docked.agendaFloating).toBe("false");
  expect(docked.railButton).toBe("Undock");
  expect(docked.agendaButton).toBe("Undock");
  expect(docked.railPosition).toBe("relative");
  expect(docked.agendaPosition).toBe("relative");
  expect(docked.workspaceDisplay).toBe("grid");
  expect(docked.railWidth).toBeGreaterThan(150);
  expect(docked.mainWidth).toBeGreaterThan(280);
  expect(docked.agendaWidth).toBeGreaterThan(240);
  expect(docked.agendaHeight).toBeGreaterThan(200);
  expect(docked.railX).toBeLessThan(docked.mainX);
  expect(Math.abs(docked.railY - docked.mainY)).toBeLessThan(4);
  expect(docked.agendaX).toBeGreaterThan(docked.mainX);
  expect(Math.abs(docked.agendaY - docked.mainY)).toBeLessThan(4);

  const autoHidden = await page.evaluate(() => {
    toggleNavigationPaneAutoHide();
    toggleAgendaPaneAutoHide();
    const workspace = document.querySelector(".calendar-workspace");
    const agendaRect = document.querySelector(".agenda-pane")?.getBoundingClientRect();
    return {
      navHidden: document.body.classList.contains("navigation-auto-hide"),
      agendaHidden: document.body.classList.contains("agenda-auto-hide"),
      railTemplate: getComputedStyle(workspace).gridTemplateColumns,
      agendaWidth: agendaRect?.width || 0
    };
  });

  expect(autoHidden.navHidden).toBe(true);
  expect(autoHidden.agendaHidden).toBe(true);
  expect(autoHidden.agendaWidth).toBeLessThan(120);
});

test("phone layout nav bar, agenda sheet, and period navigation work on Pixel viewport", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto("file:///" + path.resolve(__dirname, "..", "index.html").replaceAll("\\", "/"));
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Phone mode detected via JS (matchMedia-based, reliable in all Playwright modes)
  const initial = await page.evaluate(() => ({
    deviceMode: document.body.dataset.deviceMode,
    isPhoneLayout: isPhoneLayout(),
    weekButtonLabel: document.querySelector("[data-mobile-nav='week'] span:last-child")?.textContent?.trim() || "",
    mobileMonthText: document.getElementById("mobileMonthLabel")?.textContent?.trim() || "",
    mobileDateText: document.getElementById("mobileDateLabel")?.textContent?.trim() || "",
    hasCalBar: !!document.querySelector(".mobile-calendar-bar"),
    hasBottomNav: !!document.querySelector(".mobile-bottom-nav"),
    hasBackdrop: !!document.querySelector(".mobile-sheet-backdrop"),
    hasSheetClose: !!document.querySelector(".mobile-sheet-close"),
    navButtons: [...document.querySelectorAll("[data-mobile-nav]")].map(b => b.dataset.mobileNav)
  }));

  expect(initial.deviceMode).toBe("phone");
  expect(initial.isPhoneLayout).toBe(true);
  // All phone HTML elements are present in the DOM
  expect(initial.hasCalBar).toBe(true);
  expect(initial.hasBottomNav).toBe(true);
  expect(initial.hasBackdrop).toBe(true);
  expect(initial.hasSheetClose).toBe(true);
  // All 7 nav buttons are wired up
  expect(initial.navButtons).toEqual(["today", "week", "day", "month", "agenda", "settings", "search"]);
  // On phone the week button label becomes "3 Day"
  expect(initial.weekButtonLabel).toBe("3 Day");
  // Calendar bar shows today's month abbreviation and date number
  expect(initial.mobileMonthText.length).toBeGreaterThan(0);
  expect(Number(initial.mobileDateText)).toBeGreaterThan(0);

  // Agenda sheet opens when the agenda nav button is tapped
  await page.evaluate(() => document.querySelector("[data-mobile-nav='agenda']").click());
  const sheetOpen = await page.evaluate(() => ({
    bodyClass: document.body.classList.contains("mobile-agenda-open"),
    agendaNavActive: document.querySelector("[data-mobile-nav='agenda']").classList.contains("active-view")
  }));
  expect(sheetOpen.bodyClass).toBe(true);
  expect(sheetOpen.agendaNavActive).toBe(true);

  // Close button collapses the sheet
  await page.evaluate(() => document.querySelector(".mobile-sheet-close").click());
  const sheetClosed = await page.evaluate(() => ({
    bodyClass: document.body.classList.contains("mobile-agenda-open"),
    agendaNavActive: document.querySelector("[data-mobile-nav='agenda']").classList.contains("active-view")
  }));
  expect(sheetClosed.bodyClass).toBe(false);
  expect(sheetClosed.agendaNavActive).toBe(false);

  // Period navigation: anchor to Friday so a 3-day advance (three-day view) crosses the week boundary
  await page.evaluate(() => { selectedWeekStartKey = "2026-06-15"; currentDay = "fri"; });
  const weekBefore = await page.evaluate(() => selectedWeekStartKey);
  await page.evaluate(() => changeMobilePeriod(1));
  const weekAfter = await page.evaluate(() => selectedWeekStartKey);
  expect(weekAfter).not.toBe(weekBefore);
  expect(weekAfter > weekBefore).toBe(true);

  // Going back returns to the original week
  await page.evaluate(() => changeMobilePeriod(-1));
  const weekRestored = await page.evaluate(() => selectedWeekStartKey);
  expect(weekRestored).toBe(weekBefore);

  // Switching to day view marks the day nav button active
  await page.evaluate(() => { setPlannerView("day"); updateMobileNav(); });
  const dayActive = await page.evaluate(() =>
    document.querySelector("[data-mobile-nav='day']").classList.contains("active-view")
  );
  expect(dayActive).toBe(true);

  // Switching to month view marks the month nav button active and period label updates
  await page.evaluate(() => { setPlannerView("month"); updateMobileNav(); updateOutlookPanels(); });
  const monthActive = await page.evaluate(() => ({
    monthNavActive: document.querySelector("[data-mobile-nav='month']").classList.contains("active-view"),
    viewLabel: document.getElementById("mobileViewLabel")?.textContent?.trim() || ""
  }));
  expect(monthActive.monthNavActive).toBe(true);
  expect(monthActive.viewLabel.length).toBeGreaterThan(0);
});

test("iCal URL pull imports ABT events, filters non-ABT, and deduplicates on re-sync", async ({ page }) => {
  const ICS_EVENTS = [
    {
      id: "abt-uid-1@google.com",
      summary: "ABT Rehearsal",
      location: "", description: "",
      start: { dateTime: "2026-06-15T09:00:00", timeZone: "" },
      end:   { dateTime: "2026-06-15T11:00:00", timeZone: "" }
    },
    {
      id: "other-uid-1@google.com",
      summary: "Doctor Appointment",
      location: "", description: "",
      start: { dateTime: "2026-06-15T14:00:00", timeZone: "" },
      end:   { dateTime: "2026-06-15T15:00:00", timeZone: "" }
    }
  ];

  // Intercept the server endpoint before navigation so it catches the auto-sync too
  await page.route("**/gcal/ics-pull**", route => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ events: ICS_EVENTS })
  }));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("file:///" + path.resolve(__dirname, "..", "index.html").replaceAll("\\", "/"));
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Set known week anchor and iCal URL
  await page.evaluate(() => {
    selectedWeekStartKey = "2026-06-15";
    localStorage.setItem("gcalIcsUrl", "https://calendar.google.com/calendar/ical/test/basic.ics");
  });
  await page.evaluate(() => gcalLoadIcsUrl());

  // First pull
  await page.evaluate(async () => { await gcalIcsPull(); });

  const afterFirstPull = await page.evaluate(() => ({
    monBlocks: weekData["mon"] || [],
    statusText: document.getElementById("saveStatus")?.innerText || ""
  }));

  // ABT event imported
  const abtBlock = afterFirstPull.monBlocks.find(b => b.gcalId === "abt-uid-1@google.com");
  expect(abtBlock).toBeTruthy();
  expect(abtBlock.title).toBe("ABT Rehearsal");
  expect(abtBlock.start).toBe(9);
  expect(abtBlock.dur).toBe(2);

  // Non-ABT event filtered out
  const nonAbtBlock = afterFirstPull.monBlocks.find(b => b.gcalId === "other-uid-1@google.com");
  expect(nonAbtBlock).toBeUndefined();

  // Status message reflects the import
  expect(afterFirstPull.statusText).toMatch(/1 event/);

  // Second pull must not duplicate the ABT block
  await page.evaluate(async () => { await gcalIcsPull(); });

  const afterSecondPull = await page.evaluate(() =>
    (weekData["mon"] || []).filter(b => b.gcalId === "abt-uid-1@google.com")
  );
  expect(afterSecondPull).toHaveLength(1);
});
