from langgraph.graph import StateGraph, END
from backend.graph.state import StudyState
from backend.graph.nodes import (
    learn_concept,
    generate_visual,
    generate_question,
    evaluate_answer,
    fetch_arxiv_alerts_node,
    escalate_difficulty
)
from backend.graph.edges import route_mode, should_continue_quiz

def build_graph() -> StateGraph:
    workflow = StateGraph(StudyState)
    
    # Add nodes
    workflow.add_node("learn_concept", learn_concept)
    workflow.add_node("generate_visual", generate_visual)
    workflow.add_node("generate_question", generate_question)
    workflow.add_node("evaluate_answer", evaluate_answer)
    workflow.add_node("escalate_difficulty", escalate_difficulty)
    workflow.add_node("fetch_arxiv_alerts_node", fetch_arxiv_alerts_node)
    
    # We need a dummy entry node to handle the conditional routing
    workflow.set_conditional_entry_point(
        route_mode,
        {
            "learn_concept": "learn_concept",
            "generate_question": "generate_question",
            "fetch_arxiv_alerts_node": "fetch_arxiv_alerts_node",
            "end": END
        }
    )
    
    # Learn flow
    workflow.add_edge("learn_concept", END)
    
    # Visual flow (invoked directly or via custom routing, let's just make it end for now)
    workflow.add_edge("generate_visual", END)
    
    # Quiz flow: generate -> evaluate -> escalate -> conditionally continue or end
    workflow.add_edge("generate_question", "evaluate_answer")
    workflow.add_edge("evaluate_answer", "escalate_difficulty")
    
    workflow.add_conditional_edges(
        "escalate_difficulty",
        should_continue_quiz,
        {
            "continue": "generate_question",
            "mastered": END,
            "exhausted": END
        }
    )
    
    # Alert flow
    workflow.add_edge("fetch_arxiv_alerts_node", END)
    
    return workflow.compile()

graph = build_graph()
