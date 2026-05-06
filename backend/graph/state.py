from typing import TypedDict, Literal, List, Dict, Any

class StudyState(TypedDict):
    buddy_name: str
    mode: Literal["learn", "quiz", "library", "alert"]
    conversation_history: List[Dict[str, str]]
    current_concept: str
    concept_page: Dict[str, Any]
    quiz_score: int
    quiz_round: int
    difficulty: Literal["easy", "medium", "hard"]
    current_question: Dict[str, Any]
    saved_concepts: List[Dict[str, Any]]
    pending_alerts: List[Dict[str, Any]]
