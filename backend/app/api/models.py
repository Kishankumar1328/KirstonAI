from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/models", tags=["Models"])

class ModelCard(BaseModel):
    id: str
    name: str
    provider: str = "NVIDIA"
    capability: str  # Reasoning, Image Generation, Text-to-Speech, Multimodal Vision, Embedding
    description: str
    status: str = "Available"
    is_default: bool = False
    badge: Optional[str] = None

@router.get("", response_model=List[ModelCard])
def list_models():
    return [
        ModelCard(
            id="nvidia/nemotron-3.5-lightning-30b-a3b",
            name="Nemotron 3.5 Lightning 30B",
            provider="NVIDIA",
            capability="Reasoning / Chat",
            description="Primary Nemotron reasoning model with fast token generation & extended thinking stream.",
            status="Available",
            is_default=True,
            badge="NVIDIA REASONING"
        ),
        ModelCard(
            id="nvidia/llama-3.1-nemotron-70b-instruct",
            name="Llama 3.1 Nemotron 70B Instruct",
            provider="NVIDIA",
            capability="Reasoning / Chat",
            description="High-capacity 70B parameter model tuned for technical instruction & document analysis.",
            status="Available",
            badge="70B INSTRUCT"
        ),
        ModelCard(
            id="nvidia/flux-1-dev",
            name="NVIDIA FLUX.1 Dev",
            provider="NVIDIA",
            capability="Image Generation",
            description="State-of-the-art text-to-image NIM model for generating high-fidelity visuals & artwork.",
            status="Available",
            badge="NVIDIA IMAGE"
        ),
        ModelCard(
            id="nvidia/nemotron-speech-v1",
            name="NVIDIA Nemotron Speech TTS",
            provider="NVIDIA",
            capability="Text-to-Speech",
            description="NVIDIA Nemotron Neural Speech NIM for high-definition natural text-to-speech audio synthesis.",
            status="Available",
            badge="NVIDIA SPEECH"
        ),
        ModelCard(
            id="nvidia/neva-22b",
            name="NVIDIA NeVA 22B Multimodal",
            provider="NVIDIA",
            capability="Multimodal Vision",
            description="Visual reasoning NIM capable of understanding complex images, diagrams & spatial charts.",
            status="Available",
            badge="MULTIMODAL"
        ),
        ModelCard(
            id="nvidia/nv-embedqa-e5-v5",
            name="NV EmbedQA E5 v5",
            provider="NVIDIA",
            capability="Embedding",
            description="High-dimensional text embedding model for RAG vector index building.",
            status="Available",
            badge="RAG VECTOR"
        )
    ]
