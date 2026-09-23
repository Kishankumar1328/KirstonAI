import json
from typing import List, Optional
from sqlalchemy.orm import Session, defer
from app.models.document import Document, DocumentChunk

class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, doc_id: str) -> Optional[Document]:
        return self.db.query(Document).filter(Document.id == doc_id).first()

    def list_by_user(self, user_id: str) -> List[Document]:
        # Defer large content text for fast metadata queries
        return (
            self.db.query(Document)
            .options(defer(Document.content))
            .filter(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
            .all()
        )

    def create_with_chunks(
        self,
        user_id: str,
        filename: str,
        file_type: str,
        content: str,
        chunks: List[str],
        chunk_vectors: List[dict],
        status: str = "completed"
    ) -> Document:
        doc = Document(
            user_id=user_id,
            filename=filename,
            file_type=file_type,
            content=content,
            chunk_count=len(chunks),
            status=status
        )
        self.db.add(doc)
        self.db.flush() # Populate doc.id

        chunk_models = []
        for idx, chunk_text_content in enumerate(chunks):
            vec_json = json.dumps(chunk_vectors[idx]) if idx < len(chunk_vectors) else "{}"
            chunk_obj = DocumentChunk(
                document_id=doc.id,
                user_id=user_id,
                chunk_index=idx,
                content=chunk_text_content,
                vector_json=vec_json
            )
            chunk_models.append(chunk_obj)

        self.db.add_all(chunk_models)
        self.db.commit()
        self.db.refresh(doc)
        return doc
