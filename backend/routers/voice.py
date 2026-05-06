from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from backend.services.voice import transcribe, synthesize
from fastapi.responses import Response

router = APIRouter(prefix="/api/voice")

class SynthesizeRequest(BaseModel):
    text: str

@router.post("/transcribe")
async def transcribe_route(audio: UploadFile = File(...)):
    try:
        audio_bytes = await audio.read()
        text = await transcribe(audio_bytes)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/synthesize")
async def synthesize_route(req: SynthesizeRequest):
    try:
        audio_bytes = await synthesize(req.text)
        return Response(content=audio_bytes, media_type="audio/wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
