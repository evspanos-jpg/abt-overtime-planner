const { test, expect } = require("@playwright/test");
const path = require("path");

// WCAG relative-luminance + contrast helpers.
function parseColors(str) {
  const out = [];
  const re = /rgba?\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(str))) {
    const p = m[1].split(",").map((s) => parseFloat(s));
    out.push({ r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] });
  }
  return out;
}
function luminance({ r, g, b }) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(l1, l2) {
  const a = Math.max(l1, l2);
  const b = Math.min(l1, l2);
  return (a + 0.05) / (b + 0.05);
}
function effectiveContrast({ color, bg, bgi }) {
  const text = parseColors(color)[0];
  let pool = parseColors(bg).filter((c) => c.a > 0.5);
  if (!pool.length) pool = parseColors(bgi).filter((c) => c.a > 0.3);
  if (!pool.length) pool = [{ r: 255, g: 255, b: 255 }]; // assume a light surface
  const bgLum = pool.reduce((s, c) => s + luminance(c), 0) / pool.length;
  return contrastRatio(luminance(text), bgLum);
}

// Probe a class's resolved colours by injecting a throwaway button so the test
// is independent of where any particular control happens to live in the UI.
async function probe(page, className) {
  return page.evaluate((cls) => {
    const b = document.createElement("button");
    b.className = cls;
    b.textContent = "Sample";
    document.body.appendChild(b);
    const cs = getComputedStyle(b);
    const v = { color: cs.color, bg: cs.backgroundColor, bgi: cs.backgroundImage };
    b.remove();
    return v;
  }, className);
}

// Guards against the "white text on a light background" class of bug (e.g. the
// invisible light-mode Delete buttons): every solid-coloured button variant
// must stay readable in light mode.
test("light mode: solid button variants keep readable contrast", async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("abtOvertimePlannerThemeMode", "light");
    } catch (e) {}
  });
  await page.goto("file:///" + path.resolve(__dirname, "..", "index.html").replaceAll("\\", "/"));
  await page.waitForTimeout(400); // let the theme apply

  const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  expect(theme).toBe("light");

  for (const cls of ["danger", "primary"]) {
    const colours = await probe(page, cls);
    const ratio = effectiveContrast(colours);
    expect(
      ratio,
      `light-mode .${cls}: ${colours.color} on ${colours.bgi !== "none" ? colours.bgi : colours.bg} (ratio ${ratio.toFixed(2)})`
    ).toBeGreaterThanOrEqual(4.5);
  }
});
