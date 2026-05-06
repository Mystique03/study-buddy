from backend.graph.state import StudyState

def route_mode(state: StudyState) -> str:
    """Routes the initial state to the correct subgraph based on mode."""
    mode = state.get("mode")
    if mode == "learn":
        return "learn_concept"
    elif mode == "quiz":
        return "generate_question"
    elif mode == "alert":
        return "fetch_arxiv_alerts_node"
    # Library mode is mostly frontend, but we could route it somewhere if needed
    return "end"

def should_continue_quiz(state: StudyState) -> str:
    """Determines next step in quiz loop."""
    score = state.get("quiz_score", 0)
    round_num = state.get("quiz_round", 0)
    
    if score >= 5:
        return "mastered"
    if round_num >= 10:
        return "exhausted"
    return "continue"
