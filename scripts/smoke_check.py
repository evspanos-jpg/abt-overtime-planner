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
        "/static/planner-ui.js",
        "/static/planner-ui.css",
    ]
    for path in targets:
        response = client.get(path)
        assert response.status_code == 200, f"{path} returned {response.status_code}"

    html = client.get("/").get_data(as_text=True)
    markers = [
        "static/planner-ui.css?v=1",
        "static/planner-ui.js?v=1",
        "deviceModeBadge",
        "settingsModeValue",
        "Reset Workspace",
    ]
    for marker in markers:
        assert marker in html, f"Missing marker: {marker}"

    print("smoke check passed")


if __name__ == "__main__":
    main()
