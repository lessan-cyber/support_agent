# Sub-PRD: Public Chat Widget & Agent Engine

**Component:** External API / Widget Backend
**Version:** 1.3 (Corrected - Auth & Hybrid Memory)
**Status:** Approved for Development

## 1\. Objective

Build a  multi-tenant Chat API. The system handles anonymous user sessions via JWT, streams AI responses via SSE, and synchronizes two layers of memory (SQL for UI, LangGraph for Execution).

## 2\. Security Architecture (The Handshake)

We rely on **Domain Whitelisting** to prevent abuse and **JWT Sessions** to secure the conversation.

### 2.1 The "Handshake" Flow

1.  **Step 1 (Init):** Widget sends `POST /chat/init` with `tenant_id` and browser sends `Origin`.
2.  **Step 2 (Verify):** API checks if `Origin` is in `tenants.allowed_domains`.
3.  **Step 3 (Issue):** API returns a **Session JWT** signed with the Supabase Secret.
      * **Payload:**
          * `sub`: `anon_{random_uuid}` (The anonymous user ID)
          * `role`: `customer` (Distinct from 'admin')
          * `tenant_id`: `{target_tenant_uuid}` (CRITICAL for RLS)
          * `ticket_id`: `{ticket_uuid}` (Used for History & Thread ID)

## 3\. Authentication & Dependencies (The Implementation)

This is the critical "Senior" part. We do not use headers like `X-Tenant-ID`. We use a FastAPI Dependency.

### 3.1 New Dependency: `get_chat_session`

  * **Location:** `app/api/deps.py`
  * **Inputs:** Accepts Token via **HTTP Bearer Header** OR **Query Parameter** (e.g., `?token=xyz` for easier SSE debugging).
  * **Logic:**
    1.  Decodes JWT.
    2.  Validates `role` == `customer`.
    3.  Extracts `tenant_id`.
    4.  **RLS Injection:** Opens a DB Session and executes `SET app.current_tenant = :tenant_id`.
    5.  **Return:** A tuple `(AsyncSession, ticket_id)`.

### 3.2 Security Rules

  * **Rule:** The `/chat/stream` and `/chat/history` endpoints **MUST** fail (401) if the JWT signature is invalid or if the `tenant_id` is missing from the payload.

## 4\. The Hybrid Memory Strategy

We synchronize two storage systems.

### 4.1 UI Memory (PostgreSQL `messages` table)

  * **Purpose:** Rendering chat history (`GET /history`), Analytics, RLS.
  * **Write Timing:**
      * *User Msg:* Saved *before* graph execution.
      * *AI Msg:* Saved *after* stream completion.

### 4.2 Execution Memory (LangGraph Checkpointer)

  * **Purpose:** Handling `interrupt` (Human-in-the-Loop) and persisting the full agent state between requests.
  * **Implementation:** `langgraph_checkpoint_postgres.AsyncPostgresSaver`. The connection will use the async engine from `app.config.db`.
  * **Key:** The `thread_id` for the checkpointer will be the `ticket_id` from the JWT.
  * **Isolation:** The `ticket_id` is unique per-tenant chat session, ensuring that one user cannot access another user's graph state.

## 5\. Streaming Protocol (SSE)

**Endpoint:** `POST /api/v1/chat/stream`
**Format:** `Content-Type: text/event-stream`

### Event Structure

1.  `status`: `{"type": "status", "content": "Searching docs..."}`
2.  `token`: `{"type": "token", "content": "Hello"}`
3.  `escalation`: `{"type": "escalation", "content": "Ticket #123 created."}`
4.  `end`: `{"type": "end", "content": ""}`

## 6\. Development Milestones

### Milestone 1: Infrastructure & Auth (Start Here)

**Goal:** Prove the Handshake and Secure Connection.

  * **Task:** Implement `POST /chat/init`.
      * *Logic:* Validate Origin -\> Create `Ticket` in DB -\> Return JWT.
  * **Task:** Implement `get_chat_session` dependency.
      * *Logic:* Decode JWT -\> Set RLS -\> Yield Session.
  * **Task:** Implement `POST /chat/stream` (Echo only).
      * *Logic:* `depends(get_chat_session)` -\> Sleep -\> Yield "Echo".
  * **Success:** `curl` without token fails (401). `curl` with token streams text.

### Milestone 2: The RAG Pipeline

**Goal:** Connect Vector Search.

  * **Task:** Implement `retrieve_node` inside LangGraph.
  * **Context:** Use the `tenant_id` extracted from the JWT to filter vector search.

### Milestone 3: Persistence (Hybrid)

**Goal:** Handle Refresh and interruptions.

  * **Task:** Update API to save User Message to `messages` table (UI Memory).
  * **Task:** Implement `GET /chat/history` to retrieve UI chat history.
  * **Task:** Integrate `AsyncPostgresSaver` into the agent constructor. The compiled graph should be configured with this checkpointer, using the `ticket_id` from the chat session as the `thread_id`.

### Milestone 4: Semantic Cache (Redis)

**Goal:** Optimize.

  * **Task:** Add `check_cache_node`.
  * **Key:** `hash(jwt.tenant_id + query)`.

### Milestone 5: Human-in-the-Loop

**Goal:** Safety Net.

  * **Task:** Add `grade_node`.
  * **Logic:** Confidence \< 0.7 $\rightarrow$ `interrupt`.
  * **Task:** Create Admin Endpoint `POST /resolve` to resume.

-----

### Reference Code: The Auth Dependency (`app/api/deps.py`)

Here is the exact code you need to implement for Section 3 to work securely:

```python
async def get_chat_session(
    request: Request,
    # Allow token via Header (Standard) OR Query Param (SSE fallback)
    token: str = Depends(oauth2_scheme_optional), 
    token_query: str | None = Query(None, alias="token")
):
    actual_token = token or token_query
    if not actual_token:
         raise HTTPException(401, "Missing session token")

    try:
        # 1. Decode JWT (Anonymous Session)
        payload = jwt.decode(actual_token, settings.SECRET_KEY, algorithms=["HS256"])
        
        if payload.get("role") != "customer":
             raise HTTPException(403, "Invalid role for chat")
        
        tenant_id = payload.get("tenant_id")
        ticket_id = payload.get("ticket_id")

        # 2. Configure DB Session with RLS
        async with async_session_maker() as session:
             await session.execute(
                text("SET app.current_tenant = :t_id"), 
                {"t_id": tenant_id}
            )
            # Yield both the secure session AND the ticket_id for the logic
            yield session, ticket_id
            
    except JWTError:
        raise HTTPException(401, "Invalid or expired session")
```
