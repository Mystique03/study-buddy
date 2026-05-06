import base64
import logging
import httpx
from backend.config import settings

logger = logging.getLogger(__name__)

async def transcribe(audio_bytes: bytes) -> str:
    """
    POST to WhisperFlow for STT.
    Request shape: { "audio": "<base64>", "language": ["en"], "context": { "app": { "type": "editor" } } }
    """
    b64_audio = base64.b64encode(audio_bytes).decode('utf-8')
    payload = {
        "audio": b64_audio,
        "language": ["en"],
        "context": {
            "app": { "type": "editor" }
        }
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(f"{settings.whisperflow_url}/transcribe", json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("text", "")
    except httpx.ConnectError:
        logger.warning("Could not connect to WhisperFlow.")
        raise Exception("503: WhisperFlow Service Unavailable")
    except Exception as e:
        logger.error(f"WhisperFlow error: {e}")
        raise

async def synthesize(text: str) -> bytes:
    """
    POST to ChatterBox for TTS.
    Request shape: { "text": "...", "predefined_voice_id": "alloy", "model": "Chatterbox-Turbo", ... }
    Returns raw WAV bytes.
    """
    payload = {
        "text": text,
        "predefined_voice_id": "alloy",
        "model": "Chatterbox-Turbo",
        "exaggeration": 0.5,
        "cfg_weight": 0.5,
        "temperature": 0.8,
        "language_id": "en"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(f"{settings.chatterbox_url}/tts", json=payload)
            response.raise_for_status()
            return response.content
    except httpx.ConnectError:
        logger.warning("Could not connect to ChatterBox.")
        raise Exception("503: ChatterBox Service Unavailable")
    except Exception as e:
        logger.error(f"ChatterBox error: {e}")
        raise
