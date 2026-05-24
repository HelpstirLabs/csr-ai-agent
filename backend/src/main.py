from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from src.ai.engine import AIEngine
from src.db.session import init_db, AsyncSessionLocal
from src.db.seed import seed_mock_data
from src.api.v1 import auth, projects, ngos, funders, health

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting HELPSTiR backend...")
    ai_engine = AIEngine()
    app.state.ai_engine = ai_engine

    await init_db()
    logger.info("Database initialised.")

    async with AsyncSessionLocal() as session:
        await seed_mock_data(session)

    yield

    logger.info("Shutting down HELPSTiR backend...")
    await ai_engine.shutdown()


app = FastAPI(
    title="HELPSTiR CSR Intelligence Platform",
    description="AI-powered CSR project design, NGO matching, and impact management",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(ngos.router)
app.include_router(funders.router)


if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
else:
    @app.get("/")
    async def root():
        return {"service": "HELPSTiR CSR Intelligence Platform", "version": "0.1.0", "docs": "/docs"}
