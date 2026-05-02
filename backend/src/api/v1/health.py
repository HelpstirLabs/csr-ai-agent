from __future__ import annotations

from fastapi import APIRouter, Request

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(request: Request):
    ai_engine = request.app.state.ai_engine
    backends = await ai_engine.health_all()
    all_healthy = any(backends.values())
    return {
        "status": "healthy" if all_healthy else "degraded",
        "backends": backends,
        "version": "0.1.0",
    }
