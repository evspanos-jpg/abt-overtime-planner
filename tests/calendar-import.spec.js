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
