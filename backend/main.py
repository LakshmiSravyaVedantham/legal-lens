import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.settings import get_settings
from backend.core.database import connect_db, close_db
from backend.services import embeddings
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.middleware.logging import setup_logging, RequestTimingMiddleware
from backend.middleware.rate_limit import limiter
from backend.routers import documents, search, chat, analytics, legal, auth, health, llm_config, ai, audit

settings = get_settings()
setup_logging(log_format=settings.log_format, log_level=settings.log_level)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Starting LegalLens backend...")

    # Connect to MongoDB
    db = await connect_db(settings.mongo_uri, settings.mongo_db_name)
    app.state.db = db

    # Load embedding model
    embeddings.load_model()

    logger.info("LegalLens backend ready")
    yield

    # Shutdown
    await close_db()
    logger.info("Shutting down LegalLens backend")


app = FastAPI(
    title="LegalLens",
    description="Smart Document Search for Legal Professionals",
    version=settings.app_version,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(RequestTimingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Routers
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(legal.router, prefix="/api")
app.include_router(llm_config.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
