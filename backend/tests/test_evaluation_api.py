from types import SimpleNamespace
from app.api.endpoints import evaluation as evaluation_router


def test_evaluation_status_returns_idle_when_none(client):
    response = client.get("/evaluation-status")

    assert response.status_code == 200
    assert response.json() == {"status": "idle"}


def test_start_evaluation_starts_task_and_returns_task_id(client, monkeypatch):
    monkeypatch.setattr(evaluation_router, "process_real_time_evaluation", lambda user_id, task_id: None)
    monkeypatch.setattr(evaluation_router, "increment_evaluation_count", lambda request, current_user: None)

    response = client.post("/start-evaluation")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "started"
    assert payload["task_id"]


def test_get_metrics_returns_default_metrics(client, monkeypatch):
    monkeypatch.setattr(evaluation_router.evaluate_module, "get_user_current_metrics", lambda user_id: {"expression": "happy", "pitch": 120, "confidence": 96})

    response = client.get("/api/metrics")

    assert response.status_code == 200
    assert response.json() == {"expression": "happy", "pitch": 120, "confidence": 96}
