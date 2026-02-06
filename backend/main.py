import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.services import embeddings
from backend.routers import documents, search, chat, analytics, legal

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting LegalLens backend...")
    embeddings.load_model()
    logger.info("LegalLens backend ready")
    yield
    logger.info("Shutting down LegalLens backend")


app = FastAPI(
    title="LegalLens",
    description="Smart Document Search for Legal Professionals",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(legal.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "LegalLens"}
