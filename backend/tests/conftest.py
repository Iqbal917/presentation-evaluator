import pytest
from fastapi.testclient import TestClient
import app.main as app_main
from app.main import app

@pytest.fixture(autouse=True)
def disable_startup(monkeypatch):
    monkeypatch.setattr(app_main, "connect_to_mongo", lambda: None)
    monkeypatch.setattr(app_main.evaluate_module, "init_database", lambda: None)

@pytest.fixture
def client():
    return TestClient(app)
