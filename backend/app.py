"""FastAPI application factory: composes routers, middleware, static files.

Domain endpoints live in ``routers/``; shared plumbing in ``dependencies.py``
(auth, tokens, resource getters) and ``authorization.py`` (Role, RBAC checks).
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import logging_mw
import rate_limit
from authorization import ROLE_HIERARCHY, Role  # noqa: F401  (re-exported for tests)
from database import Base, engine, get_db  # noqa: F401  (get_db: test override target)
from dependencies import (  # noqa: F401  (re-exported for tests and convenience)
    _decode_token,
    _parse_cors_origins,
    _test_auth_bypass_enabled,
    _utcnow,
    create_access_token,
    get_password_hash,
    verify_password,
)
from routers import (
    account,
    ai,
    auth,
    channels,
    events,
    files,
    invites,
    members,
    messages,
    notifications,
    pages,
    projects,
    tasks,
    workspaces,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup for simplicity in this scaffold stage.
    Base.metadata.create_all(bind=engine)  # TODO(T036)
    if _test_auth_bypass_enabled():
        logging.getLogger(__name__).warning(
            "STW_TEST_AUTH=1 with ENVIRONMENT in {test,dev}: the X-Test-User-* "
            "auth bypass is ENABLED. Never run with this combination outside tests."
        )
    yield


app = FastAPI(title="Student Team Workspace API", lifespan=lifespan)

logger = logging.getLogger("stw")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(logging_mw.RequestLoggingMiddleware)
app.add_middleware(rate_limit.DefaultWriteLimitMiddleware)


@app.get("/health")
async def health():
    return {"status": "ok"}


logging_mw.register_healthz(app)

for _r in (
    auth.router,
    workspaces.router,
    invites.router,
    members.router,
    channels.router,
    messages.router,
    projects.router,
    tasks.router,
    events.router,
    pages.router,
    files.router,
    notifications.router,
    ai.router,
    account.router,
):
    app.include_router(_r)


# Static file serving for uploads
app.mount("/uploads", StaticFiles(directory=str(files.UPLOAD_DIR)), name="uploads")
