from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import app


def main() -> None:
    client = app.test_client()
    targets = [
        "/",
        "/manifest.webmanifest",
        "/service-worker.js",
        "/static/pwa.js",
        "/static/planner-app.js",
        "/static/overtime-rules.js",
        "/static/overtime-rules.json",
        "/static/planner-ui.js",
        "/static/planner-ui.css",
        "/static/vendor/jspdf.umd.min.js",
    ]
    for path in targets:
        response = client.get(path)
        assert response.status_code == 200, f"{path} returned {response.status_code}"

    html = client.get("/").get_data(as_text=True)
    html_markers = [
        "static/planner-ui.css?v=1",
        "static/planner-ui.js?v=1",
        "static/planner-app.js?v=1",
        "static/overtime-rules.js?v=1",
        "deviceModeBadge",
        "settingsModeValue",
        "otRulesRegularSpanValue",
        "otInspectorDayValue",
        "Reset Workspace",
        "/static/vendor/jspdf.umd.min.js",
    ]
    for marker in html_markers:
        assert marker in html, f"Missing HTML marker: {marker}"

    planner_js = client.get("/static/planner-app.js").get_data(as_text=True)
    planner_markers = [
        'previousView === "month"',
        "!TIMELINE_VIEWS.includes(plannerView)",
        "date.getMonth() !== monthAnchorDate.getMonth()",
        'document.querySelectorAll(".day-column")',
        'getProperty(ev, "RECURRENCE-ID")',
        "seenImportedSourceEvents",
    ]
    for marker in planner_markers:
        assert marker in planner_js, f"Missing planner marker: {marker}"

    print("smoke check passed")


if __name__ == "__main__":
    main()
