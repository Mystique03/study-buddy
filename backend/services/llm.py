import json
import logging
import httpx
from backend.config import settings

logger = logging.getLogger(__name__)

async def call_llm(url: str, model: str, prompt: str, system: str = "", require_json: bool = False) -> str:
    headers = {"Content-Type": "application/json"}
    if settings.llm_api_key:
        headers["Authorization"] = f"Bearer {settings.llm_api_key}"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 2048,
    }
    
    if require_json:
        payload["response_format"] = {"type": "json_object"}
        # Qwen-specific: sometimes it helps to append to the system prompt
        if not system.endswith("Output JSON only."):
            payload["messages"][0]["content"] += "\nOutput JSON only."

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{url}/v1/chat/completions", json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except httpx.ConnectError:
        logger.warning(f"Could not connect to vLLM at {url}. (Expected if AMD credits pending)")
        raise Exception(f"503: vLLM Service Unavailable at {url}")
    except Exception as e:
        logger.error(f"vLLM error at {url}: {e}")
        raise

async def call_7b(prompt: str, system: str = "", require_json: bool = False) -> str:
    return await call_llm(settings.vllm_7b_url, settings.llm_7b_model, prompt, system, require_json)

async def call_14b(prompt: str, system: str = "", require_json: bool = False) -> str:
    return await call_llm(settings.vllm_14b_url, settings.llm_14b_model, prompt, system, require_json)
