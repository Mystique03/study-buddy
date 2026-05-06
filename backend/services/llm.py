import json
import logging
import httpx
import re
from backend.config import settings

logger = logging.getLogger(__name__)

async def call_llm(url: str, model: str, prompt: str, system: str = "", require_json: bool = False) -> str:
    headers = {"Content-Type": "application/json"}
    if settings.llm_api_key:
        headers["Authorization"] = f"Bearer {settings.llm_api_key}"

    # Ensure system prompt always asks for JSON so we can parse it
    if require_json and "JSON" not in system:
        system += "\nOutput valid JSON only. Do not include any text outside the JSON object."

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 2048,
    }
    # NOTE: response_format is intentionally NOT set here.
    # Groq's llama3 models do NOT support the json_object response_format.
    # We rely entirely on the system prompt to enforce JSON output instead.

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(f"{url}/v1/chat/completions", json=payload, headers=headers)
            if response.status_code >= 400:
                logger.error(f"API Error Response: {response.text}")
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]

            # If JSON was requested, extract just the JSON block in case
            # the model wrapped it in markdown code fences like ```json ... ```
            if require_json:
                match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", content)
                if match:
                    content = match.group(1)

            return content
    except httpx.ConnectError:
        logger.warning(f"Could not connect to LLM at {url}.")
        raise Exception(f"503: LLM Service Unavailable at {url}")
    except httpx.HTTPStatusError as e:
        raise Exception(f"{e.response.status_code} Client Error: {e.response.text}")
    except Exception as e:
        logger.error(f"LLM error at {url}: {e}")
        raise

async def call_7b(prompt: str, system: str = "", require_json: bool = False) -> str:
    return await call_llm(settings.vllm_7b_url, settings.llm_7b_model, prompt, system, require_json)

async def call_14b(prompt: str, system: str = "", require_json: bool = False) -> str:
    return await call_llm(settings.vllm_14b_url, settings.llm_14b_model, prompt, system, require_json)
