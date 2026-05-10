from langgraph.graph import StateGraph, END
from backend.graph.state import StudyState
from backend.graph.nodes import (
    learn_concept,
    generate_visual,
    fetch_arxiv_alerts_node,
)
from backend.graph.edges import route_mode

def build_graph() -> StateGraph:
    workflow = StateGraph(StudyState)

    workflow.add_node("learn_concept", learn_concept)
    workflow.add_node("generate_visual", generate_visual)
    workflow.add_node("fetch_arxiv_alerts_node", fetch_arxiv_alerts_node)

    workflow.set_conditional_entry_point(
        route_mode,
        {
            "learn_concept": "learn_concept",
            "generate_question": END,
            "fetch_arxiv_alerts_node": "fetch_arxiv_alerts_node",
            "end": END,
        }
    )

    workflow.add_edge("learn_concept", END)
    workflow.add_edge("generate_visual", END)
    workflow.add_edge("fetch_arxiv_alerts_node", END)

    return workflow.compile()

graph = build_graph()
