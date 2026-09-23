import asyncio
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.repositories.document_repository import DocumentRepository
from app.rag.ingestion import chunk_text
from app.rag.vectorstore import vector_store
from app.schemas.document import DocumentResponse
from app.utils.logging import logger

class DocumentService:
    def __init__(self, db: Session):
        self.db = db
        self.doc_repo = DocumentRepository(db)

    def upload_and_index_document(self, user_id: str, filename: str, file_type: str, content: str) -> DocumentResponse:
        chunks = chunk_text(content, chunk_size=400, overlap=40)
        
        # Calculate TF-IDF vectors for chunks
        chunk_vectors = [vector_store._compute_vector(vector_store._tokenize(c)) for c in chunks]

        doc = self.doc_repo.create_with_chunks(
            user_id=user_id,
            filename=filename,
            file_type=file_type,
            content=content,
            chunks=chunks,
            chunk_vectors=chunk_vectors,
            status="completed"
        )
        
        # Index in active vector store for RAG
        vector_store.add_chunks(
            user_id=user_id,
            document_id=doc.id,
            filename=filename,
            chunks=chunks
        )
        
        return DocumentResponse.model_validate(doc)

    async def upload_batch_documents_parallel(
        self,
        user_id: str,
        files_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Processes up to 10 files in parallel asynchronously with thread-isolated DB sessions."""
        
        def _process_single_sync(file_item: Dict[str, Any]) -> Dict[str, Any]:
            filename = file_item["filename"]
            file_type = file_item.get("file_type", "text/plain")
            content = file_item["content"]

            if not content.strip():
                return {
                    "filename": filename,
                    "status": "failed",
                    "error": "File content is empty.",
                    "document": None
                }

            # Create thread-isolated DB session to prevent concurrent SQLAlchemy session collision
            db = SessionLocal()
            try:
                service = DocumentService(db)
                doc_res = service.upload_and_index_document(
                    user_id=user_id,
                    filename=filename,
                    file_type=file_type,
                    content=content
                )
                return {
                    "filename": filename,
                    "status": "completed",
                    "error": None,
                    "document": doc_res
                }
            except Exception as e:
                logger.error(f"Batch ingestion error for file '{filename}': {e}")
                return {
                    "filename": filename,
                    "status": "failed",
                    "error": str(e),
                    "document": None
                }
            finally:
                db.close()

        tasks = [asyncio.to_thread(_process_single_sync, item) for item in files_data[:10]]
        results = await asyncio.gather(*tasks)
        return list(results)

    def list_user_documents(self, user_id: str) -> List[DocumentResponse]:
        docs = self.doc_repo.list_by_user(user_id)
        return [DocumentResponse.model_validate(d) for d in docs]
