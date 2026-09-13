"""Tests for account export + deletion (S03)."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import Base, Role, app, create_access_token
from models import User, WorkspaceMember


@pytest.fixture(scope="function")
def db_session():
    engine = create_engine("sqlite:///./test_stw_account.db", echo=False)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def _get_db_override():
        return db_session

    from database import get_db

    app.dependency_overrides[get_db] = _get_db_override
    _client = TestClient(app)
    _client._db = db_session  # lets as_user() ensure the User row exists
    yield _client
    app.dependency_overrides.clear()


def as_user(client: TestClient, user_id: str, role: str = Role.OWNER.value):
    # Real JWT auth (post-T004): mint a real token; the role arg is legacy —
    # workspace roles come from membership rows, not headers.
    db = getattr(client, "_db", None)
    if db is not None and not db.query(User).filter(User.id == user_id).first():
        db.add(User(id=user_id, email=f"{user_id}@example.com", display_name=user_id))
        db.commit()
    client.headers["Authorization"] = f"Bearer {create_access_token(user_id)}"


def _seed_user(db, uid="u1", email="u1@example.com"):
    from dependencies import get_password_hash

    db.add(User(id=uid, email=email, display_name="U One", hashed_password=get_password_hash("pw123456")))
    db.commit()


def test_export_contains_own_data(client, db_session):
    _seed_user(db_session)
    as_user(client, "u1")
    ws = client.post("/workspaces", json={"name": "WS", "slug": "ws"}).json()
    proj = client.post(f"/workspaces/{ws['id']}/projects", json={"name": "P"}).json()
    client.post(f"/projects/{proj['id']}/tasks", json={"title": "T1", "assignee_id": "u1"})

    resp = client.get("/users/me/export")
    assert resp.status_code == 200
    assert "attachment" in resp.headers["content-disposition"]
    data = resp.json()
    assert data["user"]["email"] == "u1@example.com"
    assert any(t["title"] == "T1" for t in data["tasks"])
    assert len(data["memberships"]) == 1


def test_delete_requires_password(client, db_session):
    _seed_user(db_session)
    as_user(client, "u1")
    resp = client.request("DELETE", "/users/me", json={"password": "wrong"})
    assert resp.status_code == 403


def test_delete_anonymizes_and_purges(client, db_session):
    _seed_user(db_session)
    as_user(client, "u1")
    ws = client.post("/workspaces", json={"name": "WS", "slug": "ws"}).json()
    ch = client.post(f"/workspaces/{ws['id']}/channels", json={"name": "general"}).json()
    client.post(f"/channels/{ch['id']}/messages", json={"content": "hello"})

    resp = client.request("DELETE", "/users/me", json={"password": "pw123456"})
    assert resp.status_code == 200
    assert resp.json()["deleted"] is True

    # User row anonymized, message survives
    user = db_session.query(User).filter(User.id == "u1").first()
    assert user.display_name == "Deleted user"
    assert user.email.startswith("deleted-")
    assert user.hashed_password is None
    assert user.is_active is False

    from models import Message

    assert db_session.query(Message).count() == 1  # shared content survives
    assert db_session.query(WorkspaceMember).filter(WorkspaceMember.user_id == "u1").count() == 0

    # Token-free test header path still works but user is inactive — the row
    # is gone for login purposes either way.
    resp = client.post("/auth/login", json={"email": "u1@example.com", "password": "pw123456"})
    assert resp.status_code == 401
