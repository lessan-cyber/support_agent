# Product Requirements Document (PRD)

**Project Name:** Multi-tenant AI Support Agent (SaaS)
**Version:** 1.1 (Updated with Semantic Cache & Sync/Async Bridge)
**Status:** Ready for Development

-----

## 1. Executive Summary

**Objective:** Build a secure, multi-tenant AI customer support platform. The system acts as a first-line responder using RAG (Retrieval Augmented Generation) but seamlessly escalates to human agents when confidence is low.
**Key Differentiators:**

1.  **Strict Data Isolation:** PostgreSQL Row Level Security (RLS) ensures Tenant A never accesses Tenant B's data.
2.  **Cost & Latency Optimization:** A Semantic Cache (Redis) intercepts recurring questions to bypass expensive LLM calls.
3.  **Self-Improving Loop:** When a human agent corrects the AI, the corrected answer is saved to the cache, ensuring the AI "learns" instantly for the next time.
4.  **Hybrid UX:** Handles the transition from Real-time Chat (AI) to Asynchronous Ticket (Human) without losing the user.

-----

## 2. System Architecture

### 2.1 High-Level Components

  * **Client:** React/Vue Dashboard (Admin) & Chat Widget (End User).
  * **API:** FastAPI (Async) + SSE (Server-Sent Events).
  * **State & Logic:** LangGraph (Orchestration).
  * **Vector DB & Storage:** Supabase (PostgreSQL + pgvector + RLS).
  * **Caching:** Redis (Semantic Caching & Celery Broker).
  * **Background Jobs:** Celery (Document Ingestion).
  * **Notifications:** Resend/SendGrid (Email).

### 2.2 The "Learning" Data Flow

1.  **Inference:** User Query $\rightarrow$ **Check Redis Cache (Tenant-Scoped)**.
      * *Hit:* Return cached answer immediately (0 cost).
      * *Miss:* Retrieve Docs (RLS) $\rightarrow$ Generate Answer $ightarrow$ Check Confidence.
2.  **Escalation (Low Confidence):** Send "Bridge Message" $ightarrow$ Create Ticket $ightarrow$ **Pause**.
3.  **Resolution:** Human fixes answer $ightarrow$ Resume Graph $ightarrow$ Send to User $ightarrow$ **Update Redis Cache**.

-----

## 3. Database Schema & Security (Supabase)

**Core Principle:** Every query implies `WHERE tenant_id = X`. RLS enforces this physically.

### 3.1 Tables

  * **`tenants`**: `id` (PK), `name`, `plan`.
  * **`users`**: `id` (Linked to `auth.users`), `tenant_id` (FK), `role`.
  * **`documents`**: `id`, `tenant_id` (FK), `content`, `embedding` (1536), `additional_data`.
  * **`tickets`**: `id`, `tenant_id` (FK), `status` (`open`, `pending_human`, `resolved`), `user_email`.
  * **`messages`**: `id`, `ticket_id` (FK), `tenant_id` (FK), `sender_type`, `content`.

### 3.2 Row Level Security (RLS) Reference

```sql
-- Policy ensures a tenant NEVER reads another tenant's vectors
CREATE POLICY isolation_policy ON documents
USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

-----

## 4. Semantic Caching Strategy (Redis)

To prevent data leaks between tenants in the cache, we must use **Namespaced Keys**.

### 4.1 Key Construction

The Redis key is NOT just the vector of the question. It is a composite:

  * **Logic:** `CacheKey = Hash(TenantID) + Vector(UserQuery)`
  * **Search:** When searching for similarity in Redis, filter strictly by `metadata.tenant_id`.

### 4.2 Cache Invalidation

  * **Time-to-Live (TTL):** 7 days (configurable per tenant).
  * **Update Trigger:** When a human resolves a ticket via the "Control Center", the new approved answer **overwrites** or adds a new entry to the cache for that specific query.

-----

## 5. The AI Engine (LangGraph Specification)

### 5.1 State Definition

```python
class AgentState(TypedDict):
    messages: list[BaseMessage]
    tenant_id: str
    user_email: str | None
    ticket_id: str | None
    is_cache_hit: bool
```

### 5.2 Graph Nodes & Logic

1.  **`cache_check_node`**:
      * Embeds query. Searches Redis within `tenant_id` namespace (Threshold > 0.9).
      * If Hit $\rightarrow$ Go to End.
      * If Miss $ightarrow$ Go to `retrieve_node`.
2.  **`retrieve_node`**: RLS Query on Supabase `documents`.
3.  **`grade_node`**: LLM evaluates document relevance.
4.  **`generate_node`**: LLM generates answer.
5.  **`assess_confidence_node`**: LLM rates its own answer (0.0 to 1.0).
      * **Score > 0.7:** Go to `cache_update_node` (Auto-save) $ightarrow$ End.
      * **Score < 0.7:** Go to `escalate_node`.
6.  **`escalate_node` (The Bridge)**:
      * Create `Ticket` in DB.
      * **Output:** "I need to check this with an expert. Ticket #{id} created. You will receive an email notification."
      * **Action:** `interrupt` (Pause Graph).
7.  **`human_resolution_node` (Post-Pause)**:
      * Input: Human modified answer.
      * **Action 1:** Send to Chat.
      * **Action 2:** Send Email (via Resend).
      * **Action 3:** **Write to Redis Cache** (so AI knows next time).

-----

## 6. Functional Requirements (UX focus)

### 6.1 Real-Time UX

  * **FR-01:** System must support Streaming Response (SSE).
  * **FR-02 (Bridge Message):** If escalation occurs, the UI must display a distinct status (e.g., "Waiting for Agent") instead of a generic spinner.

### 6.2 The "Control Center" (Admin Dashboard)

  * **FR-03:** Admin views a list of `paused` workflows.
  * **FR-04:** Admin sees the User Query, the Context, and the AI's *failed/draft* response.
  * **FR-05:** When Admin clicks "Approve/Send", the system must:
    1.  Resume the specific LangGraph thread.
    2.  Update the Database ticket status to `resolved`.
    3.  Update the Semantic Cache.

----- 

## 7. API Specification (Key Endpoints)

### Chat

  * `POST /chat/stream`: Main entry point. Handles Cache Logic internally.
  * `POST /chat/email`: Capture user email for the ticket if not logged in.

### Human-in-the-Loop

  * `GET /admin/tickets?status=pending_human`: List items stuck at `escalate_node`.
  * `POST /admin/tickets/{ticket_id}/resolve`:
      * **Body:** `{"answer": "The corrected technical answer...", "notify_email": true}`
      * **Backend Action:** Resumes LangGraph with the new answer, triggers Email service, writes to Redis.

----- 

## 8. Development Roadmap

  * **Phase 1: The Secure Core (Days 1-3)**
      * FastAPI + Supabase setup.
      * **Crucial:** Implement `database.py` with SQLAlchemy session that injects `tenant_id` for RLS.
  * **Phase 2: Ingestion & Caching (Days 4-7)**
      * Celery PDF Processing.
      * Redis setup with `tenant_id` namespacing.
  * **Phase 3: The Graph (Days 8-11)**
      * Implement LangGraph with `interrupt`.
      * Build the "Bridge Message" logic.
  * **Phase 4: The Loop (Days 12-15)**
      * Build the `resolve` endpoint.
      * Implement the Email notification.
      * Connect the "Human Fix" to the "Redis Write".
