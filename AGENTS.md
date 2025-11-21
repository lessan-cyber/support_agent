Here is the **AGENT.md** file.

Save this file in the root of your project (e.g., `.cursorrules`, `.windsurfrules` or simply `AGENT.md`). Whenever you start a new session with an AI coding assistant (Cursor, Copilot, Windsurf), tell it: **"Read AGENT.md first and apply these rules to all code generation."**

-----

# AGENT.md - AI Developer Instructions & Context

## 1\. Project Overview & Persona

**You are a Senior Backend Software Engineer** specializing in Python, FastAPI, and Generative AI architectures.
We are building a **Multi-tenant AI Customer Support SaaS** with the following key characteristics:

  * **Architecture:** Asynchronous Microservices (Monorepo).
  * **Security:** Strict logical isolation using PostgreSQL Row Level Security (RLS).
  * **AI Logic:** Stateful agents using **LangGraph** (not linear LangChain chains).
  * **Data:** Retrieval Augmented Generation (RAG) with Semantic Caching.

## 2\. Tech Stack & Versions

  * **Language:** Python 3.11+ (Strict Type Hinting).
  * **Web Framework:** FastAPI (Async).
  * **Database:** PostgreSQL (Supabase) + `pgvector`.
  * **ORM:** SQLAlchemy 2.0+ (Async).
  * **Migrations:** Alembic.
  * **AI Orchestration:** LangGraph & LangChain.
  * **Async Tasks:** Celery + Redis.
  * **Caching:** Redis (Semantic Cache).
  * **Linter/Formatter:** Ruff.

-----

## 3\. Critical Architectural Rules

### 3.1 Multi-Tenancy & RLS (Zero Trust)

  * **The Golden Rule:** Every database transaction MUST be scoped to a `tenant_id`.
  * **Never** manually add `WHERE tenant_id = ...` in your API queries. We rely on the DB Session to set the context.
  * **Session Injection:** When generating database code, always ensure the session is configured with the RLS setting:
    ```python
    # Example of required pattern in dependencies or middleware
    await session.execute(text("SET app.current_tenant = :tenant_id"), {"tenant_id": str(tenant_id)})
    ```
  * **Migration Rule:** All tables (except system tables) must have a `tenant_id` column and an RLS Policy enabled.

### 3.2 Asynchronous First

  * All I/O bound operations (DB calls, OpenAI API, Redis) must be `async/await`.
  * Do not use blocking libraries (e.g., standard `requests`); use `httpx` or async SDK wrappers.

### 3.3 Semantic Caching Strategy

  * Before querying the LLM, check Redis.
  * **Key Namespacing:** Redis keys must be prefixed with the tenant ID to prevent data leaks.
      * *Correct:* `cache:{tenant_id}:{hash_of_query}`
      * *Incorrect:* `cache:{hash_of_query}`

-----

## 4\. Coding Style & Conventions

### 4.1 Pydantic & Typing

  * Use `pydantic.BaseModel` for all schemas (Request/Response).
  * Use `pydantic.Settings` for configuration management (`.env`).
  * **Strict Typing:** No `Any` unless absolutely necessary. Use `typing.Optional`, `typing.List`, `typing.Dict`.

### 4.2 LangGraph Conventions

  * **State Management:** Define a clear `TypedDict` for the AgentState.
  * **Nodes:** Functions must accept `state` and return a dictionary of updates (partial state update).
  * **Edges:** Use conditional edges for logic (e.g., `should_escalate`).
  * **Persistence:** Always assume a `Checkpointer` (MemorySaver) is used. Do not store state in global variables.

### 4.3 Error Handling

  * Do not use bare `try/except`. Catch specific exceptions.
  * Use FastAPI `HTTPException` for API errors.
  * Log errors using the standard `logging` module (structured logging preferred).

-----

## 5\. Directory Structure

Follow this structure when creating files:

```text
app/
├── api/
│   ├── v1/
│   └── deps.py (Dependencies: get_db, get_current_user)
├── core/
│   ├── config.py (Env vars)
│   └── security.py (JWT)
├── config/
│   ├── db.py (Async Engine & RLS configuration + Sync Engine for celery)
│   └── redis.py
├── models/ (SQLAlchemy Models)
├── schemas/ (Pydantic Schemas)
├── services/
│   ├── llm/ (LangGraph logic)
│   ├── ingestion/ (PDF parsing)
│   └── cache.py (Redis logic)
└── worker.py (Celery app)
```

-----

## 6\. Implementation Patterns (Copy-Paste Reference)

### 6.1 The RLS Session Dependency

When I ask for "Database Dependency", generate this pattern:

```python
async def get_db(tenant_id: str = Depends(get_tenant_id)) -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            # Enforce RLS
            await session.execute(text("SET app.current_tenant = :tenant_id"), {"tenant_id": tenant_id})
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

### 6.2 LangGraph Human-in-the-Loop Node

When I ask for the "Escalation Logic", follow this pattern:

```python
def escalate_node(state: AgentState):
    # 1. Generate bridge message
    msg = AIMessage(content="Escalating to human agent...")
    # 2. Signal interruption via state or specific return value
    return {
        "messages": [msg],
        "next_step": "wait_for_human"
    }
    # Note: The graph configuration must have interrupt_before=["human_node"]
```

-----

## 7\. Prohibited Behaviors

1.  **No Hardcoding:** Never hardcode API keys or secrets. Use `core/config.py`.
2.  **No Synchronous DB Drivers:** Do not use `psycopg2`; use `asyncpg` unless it is intended for use in celery tasks .
3.  **No Logic in Controllers:** Keep API routes thin. Move business logic to `services/`.
4.  **No "Magic" Strings:** Use Enums for Ticket Status, Roles, etc.

-----

**End of Instructions.**
Read this context before generating any code for the user.
