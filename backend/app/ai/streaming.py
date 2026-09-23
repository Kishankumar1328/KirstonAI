import json
from typing import Dict, Any

def format_sse(event: str, data: Dict[str, Any]) -> str:
    """Format SSE payload adhering to W3C Server-Sent Events standard."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"
