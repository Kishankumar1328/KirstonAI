import re
from typing import List, Dict, Any

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Splits document text into overlapping chunks."""
    paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    chunks: List[str] = []
    
    current_chunk = ""
    for p in paragraphs:
        if len(current_chunk) + len(p) + 1 <= chunk_size:
            current_chunk = (current_chunk + "\n\n" + p).strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = p
            
    if current_chunk:
        chunks.append(current_chunk)

    # Fallback to character split if single block is huge
    final_chunks = []
    for c in chunks:
        if len(c) > chunk_size * 1.5:
            words = c.split(" ")
            sub_chunk = ""
            for w in words:
                if len(sub_chunk) + len(w) + 1 <= chunk_size:
                    sub_chunk = (sub_chunk + " " + w).strip()
                else:
                    if sub_chunk:
                        final_chunks.append(sub_chunk)
                    sub_chunk = w
            if sub_chunk:
                final_chunks.append(sub_chunk)
        else:
            final_chunks.append(c)

    return final_chunks or [text[:chunk_size]]
