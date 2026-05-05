from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.graph.builder import graph
from backend.routers.utils import sanitize_concept

router = APIRouter(prefix="/api")

class ConceptRequest(BaseModel):
    concept: str

@router.post("/learn")
async def learn_concept_route(req: ConceptRequest):
    try:
        concept = sanitize_concept(req.concept)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    initial_state = {
        "buddy_name": "Buddy", # Would come from request or local storage normally, but graph doesn't strictly need it for learn
        "mode": "learn",
        "current_concept": concept,
        "conversation_history": [],
        "concept_page": {},
        "quiz_score": 0,
        "quiz_round": 0,
        "difficulty": "easy",
        "current_question": {},
        "saved_concepts": [],
        "pending_alerts": []
    }
    
    try:
        final_state = await graph.ainvoke(initial_state)
        return final_state.get("concept_page", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/visual")
async def visual_concept_route(req: ConceptRequest):
    try:
        concept = sanitize_concept(req.concept)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    from backend.graph.nodes import generate_visual

    initial_state = {
        "buddy_name": "Buddy",
        "mode": "learn",
        "current_concept": concept,
        "conversation_history": [],
        "concept_page": {},
        "quiz_score": 0,
        "quiz_round": 0,
        "difficulty": "easy",
        "current_question": {},
        "saved_concepts": [],
        "pending_alerts": []
    }
    
    try:
        final_state = await generate_visual(initial_state)
        return {"html": final_state.get("concept_page", {}).get("visual_html", "")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
