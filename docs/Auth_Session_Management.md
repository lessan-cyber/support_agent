# Sub-PRD: Auth & Multi-tenant Session Management
**Component:** Core Security / API Layer
**Version:** 1.0
**Status:** High Priority (Blocking Ingestion Feature)

## 1. Objective
Establish a "Zero Trust" security model where multi-tenancy is enforced by the Database Engine (RLS), not by client-side headers.
**Key Goal:** Derive the `tenant_id` exclusively from the validated JWT token during every API request, ensuring User A can never impersonate User B.

## 2. Architecture: The "Chain of Trust"

We are moving from a **Middleware** approach (Global, inflexible) to a **Dependency Injection** approach (Granular, secure).

### 2.1 The Secure Request Flow


1.  **Client:** Sends Request with `Authorization: Bearer <JWT>`.
2.  **FastAPI Dependency (`get_current_user`):**
    * Validates JWT signature using Supabase Secret.
    * Extracts `sub` (Auth ID).
    * Queries `public.users` to find the associated `tenant_id`.
3.  **FastAPI Dependency (`get_db_rls`):**
    * Opens a DB Session.
    * Executes `SET app.current_tenant = 'uuid'` immediately.
4.  **Endpoint:** Receives the secured session. Any query run here is automatically filtered.

## 3. Database Implementation (Automated Onboarding)

To ensure every authenticated user has a valid Tenant and Public User profile, we rely on PostgreSQL Triggers.

### 3.1 Migration Specification (`alembic/versions/xxxx_add_auth_trigger.py`)
* **Trigger Target:** `auth.users` (Supabase System Table).
* **Trigger Timing:** `AFTER INSERT`.
* **Function Logic (`handle_new_user`):**
    1.  Create a new row in `public.tenants` (Name: "Workspace of [email]").
    2.  Capture the generated `tenant.id`.
    3.  Create a new row in `public.users` linking `auth.users.id` and the new `tenant.id`.
    4.  Set default role to `admin`.

## 4. Functional Requirements

### FR-01: Zero-Touch Onboarding
* **Requirement:** When a user signs up via Supabase Auth (Frontend/Postman), their Tenant and User Profile must be created instantly without additional API calls.
* **Success Criteria:** A new record appears in `public.tenants` immediately after signup.

### FR-02: Token-Based Identification
* **Requirement:** The API must reject any request that relies on `X-Tenant-ID`.
* **Requirement:** The system must derive the `tenant_id` solely from the `public.users` table using the JWT `sub` claim.

### FR-03: Row Level Security (RLS) Enforcement
* **Requirement:** The `get_db_rls` dependency must fail/rollback if the `tenant_id` cannot be set.
* **Requirement:** No query in protected endpoints shall execute without `app.current_tenant` being set in the session configuration.

## 5. API Layer Specifications

### 5.1 `app/api/deps.py` (New Dependencies)
* **`get_current_user`**:
    * Input: `HTTPBearer` token.
    * Output: `User` ORM model (with loaded `tenant_id`).
    * Error: `401 Unauthorized` if token invalid or user not found in public DB.
* **`get_db_rls`**:
    * Input: Result of `get_current_user`.
    * Output: `AsyncSession` with `app.current_tenant` set.
    * Context: Must use `yield` to ensure session closure.

### 5.2 `app/main.py` (Cleanup)
* **Action:** Delete `rls_tenant_middleware`.
* **Action:** Ensure `app/api/api_v1/api.py` includes the router.

## 6. Implementation Roadmap

- [ ] **Step 1: Database Trigger (Alembic)**
    - [ ] Create generic migration: `alembic revision -m "add_auth_trigger"`.
    - [ ] Paste the PL/pgSQL function and Trigger definition.
    - [ ] Run `alembic upgrade head`.
- [ ] **Step 2: Manual Test (Supabase)**
    - [ ] Create a "Dummy User" in Supabase Auth.
    - [ ] Verify `public.tenants` and `public.users` have new rows.
- [ ] **Step 3: Backend Refactor**
    - [ ] Create/Update `app/api/deps.py` with the JWT logic.
    - [ ] Remove `rls_tenant_middleware` from `main.py`.
- [ ] **Step 4: Endpoint Update**
    - [ ] Update `POST /upload` to use `db: AsyncSession = Depends(get_db_rls)`.
    - [ ] Remove any reference to `X-Tenant-ID`.
- [ ] **Step 5: Validation**
    - [ ] Send Postman request *without* `X-Tenant-ID` header.
    - [ ] It should succeed (200 OK) if the Bearer Token is valid.
