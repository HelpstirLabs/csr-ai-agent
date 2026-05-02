from __future__ import annotations

import logging
import time
from typing import AsyncIterator

from src.ai.backends.base import AIBackend, AIResponse
from src.ai.backends.claude import ClaudeBackend
from src.ai.backends.ollama import OllamaBackend
from src.core.config import settings

logger = logging.getLogger(__name__)

PREFIX_MAP: dict[str, str] = {
    "claude/": "claude",
    "ollama/": "ollama",
}


class AIEngine:
    """
    Routes AI requests to the appropriate backend based on model prefix.

    Prefixes:
        claude/<model>  → ClaudeBackend
        ollama/<model>  → OllamaBackend
        (no prefix)     → default backend from settings
    """

    def __init__(self) -> None:
        self._backends: dict[str, AIBackend] = {
            "claude": ClaudeBackend(),
            "ollama": OllamaBackend(),
        }
        self._default = settings.default_ai_backend

    def register_backend(self, backend: AIBackend) -> None:
        self._backends[backend.name] = backend

    def _resolve(self, model: str | None) -> tuple[AIBackend, str | None]:
        if model:
            for prefix, backend_name in PREFIX_MAP.items():
                if model.startswith(prefix):
                    bare_model = model[len(prefix):]
                    return self._backends[backend_name], bare_model
        return self._backends[self._default], model

    async def generate(
        self,
        prompt: str,
        *,
        model: str | None = None,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AIResponse:
        backend, bare_model = self._resolve(model)
        start = time.perf_counter()

        logger.info("─── AI REQUEST ───")
        logger.info("Backend: %s | Model: %s | Temp: %s | MaxTokens: %d", backend.name, bare_model, temperature, max_tokens)
        if system:
            logger.info("System prompt (%d chars): %s", len(system), system[:200])
        logger.info("User prompt (%d chars): %s...", len(prompt), prompt[:300])

        response = await backend.generate(
            prompt,
            model=bare_model,
            system=system,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        elapsed = (time.perf_counter() - start) * 1000
        logger.info("─── AI RESPONSE ───")
        logger.info(
            "Backend: %s | Model: %s | Prompt tokens: %d | Completion tokens: %d | Latency: %.0fms",
            response.backend, response.model, response.prompt_tokens, response.completion_tokens, elapsed,
        )
        logger.info("Response (%d chars): %s...", len(response.text), response.text[:300])
        return response

    async def stream(
        self,
        prompt: str,
        *,
        model: str | None = None,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        backend, bare_model = self._resolve(model)
        async for chunk in backend.stream(
            prompt,
            model=bare_model,
            system=system,
            temperature=temperature,
            max_tokens=max_tokens,
        ):
            yield chunk

    async def health_all(self) -> dict[str, bool]:
        results = {}
        for name, backend in self._backends.items():
            try:
                results[name] = await backend.health_check()
            except Exception:
                results[name] = False
        return results

    async def shutdown(self) -> None:
        for backend in self._backends.values():
            if hasattr(backend, "close"):
                await backend.close()
