from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.agents.nodes import (
    validate_input_node,
    query_orchestration_node,
    rag_retriever_node,
    prepare_prompt_node
)

def create_agent_graph():
    """
    Creates and compiles the LangGraph Agent Workflow with Query Orchestrator routing.
    """
    workflow = StateGraph(AgentState)

    workflow.add_node("validate_input", validate_input_node)
    workflow.add_node("orchestrate_query", query_orchestration_node)
    workflow.add_node("rag_retriever", rag_retriever_node)
    workflow.add_node("prepare_prompt", prepare_prompt_node)

    workflow.set_entry_point("validate_input")

    workflow.add_edge("validate_input", "orchestrate_query")
    workflow.add_edge("orchestrate_query", "rag_retriever")
    workflow.add_edge("rag_retriever", "prepare_prompt")
    workflow.add_edge("prepare_prompt", END)

    return workflow.compile()

agent_graph = create_agent_graph()
