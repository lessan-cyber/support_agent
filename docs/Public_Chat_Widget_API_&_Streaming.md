# Sub-PRD: Context-Aware AI Support Agent (Public Chat Widget)

**Component:** External API / Widget Backend & Agent Engine
**Version:** 2.0 (Unified - Context-Aware)
**Status:** Approved for Development

---

## 1. Objective

Build a secure, multi-tenant, context-aware AI customer support platform. The system must handle multi-turn conversations by reformulating user questions, stream responses in real-time via SSE, and seamlessly escalate to human agents when AI confidence is low. It synchronizes two layers of memory: a PostgreSQL database for UI history and a LangGraph checkpointer for execution state.

---

## 2. Security Architecture (The Handshake)

We rely on **Domain Whitelisting** to prevent abuse and **JWT Sessions** to secure each conversation.

### 2.1. The "Handshake" Flow

1.  **Step 1 (Init):** The client-side widget sends a `POST /api/v1/chat/init` request containing the `tenant_id` and the browser's `Origin` header.
2.  **Step 2 (Verify):** The API verifies that the `Origin` domain is listed in the `tenants.allowed_domains` table for the given `tenant_id`.
3.  **Step 3 (Issue):** If verified, the API creates a `ticket` record in the database and returns a **Session JWT** signed with the application's `SECRET_KEY`.

### 2.2. Session JWT Payload

The JWT payload contains all necessary context for secure, stateful operations:

-   `sub`: `anon_{random_uuid}` (A unique identifier for the anonymous user).
-   `role`: `customer` (A fixed role to distinguish from internal admin users).
-   `tenant_id`: The UUID of the tenant, critical for enforcing RLS.
-   `ticket_id`: The UUID of the newly created ticket, used as the `thread_id` for the LangGraph agent and for querying chat history.

---

## 3. Authentication & Dependencies

All chat-related endpoints are protected by a robust FastAPI dependency that manages the session and enforces security.

### 3.1. The `get_chat_session` Dependency

-   **Location:** `app/api/deps.py`
-   **Inputs:** Accepts the JWT via **HTTP Bearer Header** or a **`token` query parameter** (for easier SSE client implementation).
-   **Logic:**
    1.  Decodes and validates the JWT. It must contain the `customer` role.
    2.  Extracts `tenant_id` and `ticket_id` from the payload.
    3.  Initializes an `AsyncSession` with the database.
    4.  **Enforces RLS:** Executes `SET app.current_tenant = :tenant_id` on the session to ensure all subsequent queries are isolated to the correct tenant.
    5.  Yields the `(AsyncSession, ticket_id)` tuple to the endpoint.
-   **Rule:** Endpoints using this dependency **MUST** fail with a 401 Unauthorized error if the token is missing, invalid, or expired.

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

---

## 4. The Agent Architecture (Context-Aware RAG)

We use a **"Contextualize-Retrieve-Generate"** LangGraph flow to handle conversations.

### 4.1. Graph Nodes

1.  **`check_cache_node` (Redis):**
    -   Checks if the **raw user query** has a high-similarity match in the tenant-specific semantic cache.
    -   *Hit:* Returns the cached answer immediately and terminates the graph.
    -   *Miss:* Proceeds to `contextualize_node`.

2.  **`contextualize_node` (The Reformulator):**
    -   **Input:** The full chat history and the latest user message.
    -   **Action:** Uses a fast LLM (e.g., GPT-4o-mini) to rewrite the latest message into a standalone, self-contained question. This resolves anaphora (like "it", "that") and context-dependent phrases.
    -   **Example:**
        -   *History:* "How do I create a DOCX file?"
        -   *User:* "How do I export *it* to PDF?"
        -   *Output:* "How do I export a DOCX file to PDF?"

3.  **`retrieve_node` (Vector Search):**
    -   **Input:** The **standalone (rephrased) question** from the previous node.
    -   **Action:** Performs a similarity search against the `documents` table in Supabase (pgvector), automatically filtered by the RLS policy.

4.  **`generate_node` (The Responder):**
    -   **Input:** The original chat history and the retrieved context chunks.
    -   **Action:** Generates the final answer, which is streamed back to the user.

5.  **`grade_confidence_node` (Safety Net):**
    -   **Input:** The generated answer.
    -   **Action:** An LLM call assesses the confidence of the answer on a scale of 0.0 to 1.0.
    -   *High Confidence (>0.7):* Proceeds to `END`.
    -   *Low Confidence (<0.7):* Proceeds to `escalate_node`.

6.  **`escalate_node` (The Bridge):**
    -   Updates the ticket status in the database to `pending_human`.
    -   Sends a "bridge message" to the user (e.g., "I need to check this with an expert. Ticket #... created.").
    -   **Interrupts** the graph execution to await human intervention.

### 4.2. Prompt Engineering

-   **Contextualization Prompt:** *"Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question, just reformulate it if needed and otherwise return it as is."*

---

## 5. State & Memory Management

### 5.1. The `AgentState`

The `TypedDict` that defines the state of our LangGraph agent.

```python
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages, AnyMessage

class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    tenant_id: str
    ticket_id: str
    rephrased_question: str | None
    context: list[str] | None
    answer: str | None
    is_cache_hit: bool
```

### 5.2. The Hybrid Memory Strategy

1.  **UI Memory (PostgreSQL `messages` table):**
    -   **Purpose:** For quickly rendering the chat history in the UI.
    -   **Write Logic:** The user's message is saved immediately at the start of the `/stream` call. The AI's final, non-streamed message is saved at the end.

2.  **Execution Memory (LangGraph Checkpointer):**
    -   **Purpose:** Persists the full `AgentState` to handle interruptions (for human-in-the-loop) and resume graph execution.
    -   **Implementation:** `langgraph_checkpoint_postgres.AsyncPostgresSaver`.
    -   **Key:** The `thread_id` for the checkpointer is the `ticket_id` from the JWT.

### 5.3. Streaming Protocol (SSE)

-   **Endpoint:** `POST /api/v1/chat/stream`
-   **Content-Type:** `text/event-stream`
-   **Event Structure:** The stream consists of multiple JSON-encoded events.
    1.  `status`: `{"type": "status", "content": "Reformulating question..."}`
    2.  `token`: `{"type": "token", "content": "The"}` (piece of the generated answer)
    3.  `escalation`: `{"type": "escalation", "content": "Ticket #123 has been created..."}`
    4.  `end`: `{"type": "end", "content": ""}`

---

## 6. Unified Development Milestones

1.  **Milestone 1: Infrastructure & Auth (Complete)**
    -   **Goal:** Secure the chat endpoints and establish the JWT handshake.
    -   **Tasks:** Implement `POST /chat/init`, the `get_chat_session` dependency, and a dummy `POST /chat/stream` that echoes a message.

2.  **Milestone 2: Naive RAG & UI History**
    -   **Goal:** Prove the basic RAG pipeline and chat history persistence.
    -   **Tasks:**
        -   Implement a simple graph that uses the **raw user message** for retrieval.
        -   Implement the `retrieve_node` and `generate_node`.
        -   Save user and AI messages to the `messages` table.
        -   Implement `GET /chat/history`.

3.  **Milestone 3: Context-Awareness**
    -   **Goal:** Handle multi-turn, context-dependent questions.
    -   **Tasks:**
        -   Add the `contextualize_node` to the graph with the specified prompt.
        -   Update `retrieve_node` to use the `rephrased_question` from the state.

4.  **Milestone 4: Semantic Caching**
    -   **Goal:** Reduce latency and cost for repeated questions.
    -   **Tasks:**
        -   Implement the `check_cache_node` using Redis.
        -   The cache key must be namespaced by `tenant_id`.

5.  **Milestone 5: Human-in-the-Loop & Persistence**
    -   **Goal:** Implement the full agent lifecycle with escalation and state persistence.
    -   **Tasks:**
        -   Integrate `AsyncPostgresSaver` as the graph's checkpointer.
        -   Implement `grade_confidence_node` and `escalate_node` to interrupt the graph.
        -   Create the admin endpoint (`POST /admin/tickets/{ticket_id}/resolve`) to resume the graph with a human-provided answer.
