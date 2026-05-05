from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.graph.builder import graph
from backend.routers.utils import sanitize_concept

router = APIRouter(prefix="/api/quiz")

class QuizStartRequest(BaseModel):
    concept: str
    saved_concepts: List[Dict[str, Any]] = []

class QuizAnswerRequest(BaseModel):
    answer_index: int
    state: dict # The frontend passes back the state to keep the backend stateless

@router.post("/start")
async def start_quiz(req: QuizStartRequest):
    try:
        concept = sanitize_concept(req.concept)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    initial_state = {
        "buddy_name": "Buddy",
        "mode": "quiz",
        "current_concept": concept,
        "conversation_history": [],
        "concept_page": {},
        "quiz_score": 0,
        "quiz_round": 0,
        "difficulty": "easy",
        "current_question": {},
        "saved_concepts": req.saved_concepts,
        "pending_alerts": []
    }
    
    try:
        # LangGraph routing will hit generate_question and stop because evaluate_answer expects input?
        # Actually in our graph, generate_question -> evaluate_answer -> escalate_difficulty -> condition.
        # But wait, generate_question just generates it. It doesn't wait for user input.
        # So we shouldn't run the full graph yet. We just want to generate one question.
        from backend.graph.nodes import generate_question
        
        final_state = await generate_question(initial_state)
        return final_state
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/answer")
async def answer_quiz(req: QuizAnswerRequest):
    """
    Evaluates the answer and decides the next step.
    """
    state = req.state
    question = state.get("current_question", {})
    correct_idx = question.get("correct_index", -1)
    
    is_correct = req.answer_index == correct_idx
    
    if is_correct:
        state["quiz_score"] = state.get("quiz_score", 0) + 1
        
    # We call escalate_difficulty to update difficulty based on new score
    from backend.graph.nodes import escalate_difficulty, generate_question
    from backend.graph.edges import should_continue_quiz
    
    state = escalate_difficulty(state)
    next_step = should_continue_quiz(state)
    
    if next_step == "continue":
        state = await generate_question(state)
        
    return {
        "correct": is_correct,
        "explanation": question.get("explanation", ""),
        "next_step": next_step,
        "state": state
    }
