import math
import re
from typing import List, Dict, Any, Tuple
from sqlalchemy import or_
from app.database.session import SessionLocal
from app.models.document import Document
from app.rag.ingestion import chunk_text
from app.utils.logging import logger

STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "about", "above", "after", "again", "all",
    "am", "an", "any", "are", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "by", "can", "did", "do", "does", "doing", "down",
    "during", "each", "few", "for", "from", "further", "had", "has", "have", "having",
    "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if",
    "in", "into", "is", "it", "its", "itself", "just", "me", "more", "most", "my",
    "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "other", "our",
    "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so", "some",
    "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then",
    "there", "these", "they", "this", "those", "through", "to", "too", "under",
    "until", "up", "very", "was", "we", "were", "what", "when", "where", "which",
    "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself"
}

class SimpleVectorStore:
    def __init__(self):
        # List of dicts: {"document_id": str, "filename": str, "text": str, "user_id": str, "vector": Dict, "tokens": Set}
        self.documents: List[Dict[str, Any]] = []

    def _tokenize(self, text: str) -> List[str]:
        words = re.findall(r'\w+', text.lower())
        return [w for w in words if len(w) > 1 and w not in STOP_WORDS]

    def _compute_vector(self, tokens: List[str]) -> Dict[str, float]:
        if not tokens:
            return {}
        tf: Dict[str, int] = {}
        for token in tokens:
            tf[token] = tf.get(token, 0) + 1

        length = math.sqrt(sum(v * v for v in tf.values()))
        if length == 0:
            return {}
        return {k: v / length for k, v in tf.items()}

    def _cosine_similarity(self, vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        intersection = set(vec1.keys()) & set(vec2.keys())
        return sum(vec1[k] * vec2[k] for k in intersection)

    def add_chunks(
        self,
        user_id: str,
        document_id: str,
        filename: str,
        chunks: List[str],
    ):
        for chunk in chunks:
            tokens = self._tokenize(chunk)
            vector = self._compute_vector(tokens)
            self.documents.append({
                'user_id': user_id,
                'document_id': document_id,
                'filename': filename,
                'text': chunk,
                'vector': vector,
                'token_set': set(tokens),
            })

    def _hydrate_from_db(self, user_id: str):
        """Hydrates vector store from PostgreSQL database for all available user documents."""
        try:
            db = SessionLocal()
            try:
                docs = db.query(Document).all()
                existing_doc_ids = {d['document_id'] for d in self.documents}
                for doc in docs:
                    if doc.id not in existing_doc_ids:
                        chunks = chunk_text(doc.content or '', chunk_size=400, overlap=40)
                        self.add_chunks(
                            user_id=doc.user_id,
                            document_id=doc.id,
                            filename=doc.filename,
                            chunks=chunks,
                        )
            finally:
                db.close()
        except Exception as e:
            logger.error(f'Error hydrating vector store from database: {e}')

    def search(
        self, user_id: str, query: str, top_k: int = 3
    ) -> List[Dict[str, Any]]:
        # Always hydrate from PostgreSQL database to keep vector store up to date
        self._hydrate_from_db(user_id)

        if not self.documents:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            # Fallback to all lowercase words if stop-words filtered everything
            query_tokens = [w for w in re.findall(r'\w+', query.lower()) if len(w) > 1]

        query_vec = self._compute_vector(query_tokens)
        query_set = set(query_tokens)

        results: List[Tuple[float, Dict[str, Any]]] = []
        for doc in self.documents:
            cos_sim = self._cosine_similarity(query_vec, doc['vector']) if query_vec else 0.0

            # Filename boost if query keywords match document title
            doc_name_clean = doc['filename'].lower()
            title_boost = 0.3 if any(w in doc_name_clean for w in query_tokens) else 0.0

            # Keyword match count boost
            overlap_count = len(query_set & doc['token_set'])
            overlap_boost = overlap_count * 0.1

            total_score = cos_sim + title_boost + overlap_boost
            results.append((total_score, doc))

        # Sort descending by relevance score
        results.sort(key=lambda x: x[0], reverse=True)

        output = []
        seen_snippets = set()
        for score, doc in results:
            snippet_hash = hash(doc['text'][:100])
            if snippet_hash in seen_snippets:
                continue
            seen_snippets.add(snippet_hash)

            output.append({
                'document_id': doc['document_id'],
                'filename': doc['filename'],
                'snippet': doc['text'],
                'score': round(score, 4),
            })
            if len(output) >= top_k:
                break

        return output

vector_store = SimpleVectorStore()
