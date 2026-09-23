from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.search import SearchResultItem, SearchResponse

class SearchService:
    def __init__(self, db: Session):
        self.db = db

    def search_history(self, user_id: str, query: str, limit: int = 30) -> SearchResponse:
        results: List[SearchResultItem] = []
        if not query or not query.strip():
            return SearchResponse(query=query, results=[], total=0)

        search_pattern = f"%{query.strip()}%"

        # Search matching conversation titles
        matching_convs = self.db.query(Conversation).filter(
            Conversation.user_id == user_id,
            Conversation.status != "deleted",
            Conversation.title.ilike(search_pattern)
        ).limit(limit).all()

        for c in matching_convs:
            results.append(SearchResultItem(
                conversation_id=c.id,
                conversation_title=c.title,
                message_id=None,
                snippet=f"Title match: {c.title}",
                match_type="title",
                created_at=c.updated_at
            ))

        # Search matching message contents
        matching_msgs = self.db.query(Message, Conversation).join(
            Conversation, Message.conversation_id == Conversation.id
        ).filter(
            Conversation.user_id == user_id,
            Conversation.status != "deleted",
            Message.content.ilike(search_pattern)
        ).order_by(Message.created_at.desc()).limit(limit).all()

        for m, c in matching_msgs:
            # Highlight matching snippet
            content = m.content
            snippet = content[:150] + "..." if len(content) > 150 else content
            results.append(SearchResultItem(
                conversation_id=c.id,
                conversation_title=c.title,
                message_id=m.id,
                snippet=snippet,
                match_type="message",
                created_at=m.created_at
            ))

        return SearchResponse(
            query=query,
            results=results,
            total=len(results)
        )
