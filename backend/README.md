# Backend - Multi-tenant AI Support Agent

FastAPI-based backend for a multi-tenant AI customer support SaaS with LangGraph-powered agents.

## Tech Stack

- **Language:** Python 3.11+
- **Framework:** FastAPI (Async)
- **Database:** PostgreSQL 17 + pgvector (Supabase)
- **ORM:** SQLAlchemy 2.0+ (Async)
- **Migrations:** Alembic
- **AI:** LangGraph & LangChain
- **Task Queue:** Celery + Redis
- **Caching:** Redis (Semantic Cache with RedisVL)
- **Package Manager:** uv
- **Linter/Formatter:** Ruff

## Features

- **Multi-tenancy:** Strict isolation using PostgreSQL Row Level Security (RLS)
- **AI Agents:** Stateful LangGraph agents with human-in-the-loop escalation
- **RAG:** Retrieval Augmented Generation with PDF ingestion
- **Semantic Caching:** Intelligent caching to reduce LLM costs
- **Real-time Streaming:** SSE (Server-Sent Events) for live agent responses
- **Async Tasks:** Background processing with Celery

## Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- Supabase account (for auth & database)

### Local Development with uv

```bash
# Install dependencies
uv sync

# Copy environment file
cp ../.env.example ../.env

# Run migrations
uv run alembic  -c app/alembic.ini upgrade head

# Start backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start Celery worker (in another terminal)
uv run celery -A app.worker worker --loglevel=info
```

### Docker

```bash
# Build and start all services
docker compose up 

# View logs
docker compose logs -f backend
```

## Project Structure

```
backend/
├── app/
│   ├── agent/              # LangGraph agent nodes & edges
│   │   ├── constructor.py  # Agent graph builder
│   │   ├── nodes/          # Individual nodes (cache_check, llm_call, etc.)
│   ├── api/
│   │   └── v1/             # API endpoints
│   ├── alembic/            # Database migrations
│   ├── config/             # Database & Redis configuration
│   ├── middleware/         # Custom middleware (RLS, auth)
│   ├── models/             # SQLAlchemy models
│   ├── schemas/            # Pydantic schemas
│   ├── services/           # Business logic
│   ├── main.py             # FastAPI application
│   ├── settings.py         # Configuration
│   └── worker.py           # Celery app
├── tests/                  # Test suite
├── pyproject.toml          # Dependencies
├── uv.lock                 # Locked dependencies
├── Dockerfile              # Docker image
├── .dockerignore           # Docker build exclusions
└── README.md               # This file
```

## Testing

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=app --cov-report=html
```

## Docker Optimization

The Dockerfile is optimized for size :

- Single-stage build with uv
- Layer caching for faster rebuilds
- Aggressive cleanup (tests, dist-info, __pycache__, build tools)
- Non-root user (appuser)
- Cache mounts for dependency installation


## Environment Variables

Required variables (see `../.env.example`)

## API Documentation

When running locally:
- Swagger UI: http://localhost:8000/docs 
- ReDoc: http://localhost:8000/redoc

## License

MIT
