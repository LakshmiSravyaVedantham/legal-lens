from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
PROCESSED_DIR = DATA_DIR / "processed"
CHROMA_DIR = DATA_DIR / "chroma_db"

# Ensure directories exist
for d in [UPLOADS_DIR, PROCESSED_DIR, CHROMA_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Embedding model
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

# ChromaDB
CHROMA_COLLECTION_NAME = "legal_documents"

# Ollama
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.1:8b"
OLLAMA_TIMEOUT = 120.0

# Chunking
CHUNK_SIZE_WORDS = 200
CHUNK_OVERLAP_WORDS = 50

# Search
DEFAULT_SEARCH_RESULTS = 10
MAX_SEARCH_RESULTS = 50

# Upload
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_FILE_SIZE_MB = 50
