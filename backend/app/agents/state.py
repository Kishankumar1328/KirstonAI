from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    thread_id: str
    user_id: str
    input_message: str
    model: str
    use_rag: bool
    history: List[Dict[str, str]]
    context: List[Dict[str, Any]]  # RAG retrieved sources
    route: str  # direct_chat | rag | code_engineer | debugging | tool | multimodal
    intent: str
    plan: Optional[List[str]]
    tool_results: Optional[Dict[str, Any]]
    attachments: Optional[List[Dict[str, Any]]]
    system_prompt: str
    formatted_messages: List[Dict[str, str]]
    response_text: str
    status: str
    error: Optional[str]
