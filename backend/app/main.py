from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.database.session import init_db
from app.middleware.logging import LoggingMiddleware
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.error_handler import (
    AntigravityException,
    antigravity_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    global_exception_handler
)
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.conversations import router as conversations_router
from app.api.messages import router as messages_router
from app.api.chat import router as chat_router
from app.api.search import router as search_router
from app.api.documents import router as documents_router
from app.api.models import router as models_router
from app.api.file_chat import router as file_chat_router
from app.api.analytics import router as analytics_router
from app.api.tts import router as tts_router
from app.api.coding_agent import router as coding_agent_router, router_alt as coding_agent_alt_router
from app.api.object3d import router as object3d_router
from app.utils.logging import logger

# SlowAPI Limiter
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.CHAT_RATE_LIMIT])

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing KirstonAI database schema...")
    init_db()
    logger.info("KirstonAI backend started successfully.")
    yield
    logger.info("Shutting down KirstonAI backend...")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="KirstonAI — AI Multimodal RAG Platform powered by NVIDIA Nemotron",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Custom Exception Handlers
app.add_exception_handler(AntigravityException, antigravity_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Middlewares
app.add_middleware(RequestIDMiddleware)
app.add_middleware(LoggingMiddleware)

# CORS
cors_origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(conversations_router)
app.include_router(messages_router)
app.include_router(chat_router)
app.include_router(search_router)
app.include_router(documents_router)
app.include_router(models_router)
app.include_router(file_chat_router)
app.include_router(analytics_router)
app.include_router(tts_router)
app.include_router(coding_agent_router)
app.include_router(coding_agent_alt_router)
app.include_router(object3d_router)

