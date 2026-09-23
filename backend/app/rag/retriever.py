import asyncio
from typing import List, Dict, Any
from app.rag.vectorstore import vector_store

async def retrieve_rag_context(user_id: str, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Asynchronously retrieves top matching RAG chunks for a query without blocking FastAPI event loop."""
    return await asyncio.to_thread(vector_store.search, user_id=user_id, query=query, top_k=top_k)
