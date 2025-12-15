# Sub-PRD: Ingestion & Vectorization Engine
**Component:** Data Pipeline (ETL)
**Version:** 1.0 (CPU-Optimized)

## 1. Objective
Create a robust, asynchronous pipeline that accepts PDF documents, securely stores them, extracts text, generates vector embeddings using CPU-efficient models, and indexes them for RAG retrieval.

## 2. Technical Stack & Strategy
* **Storage:** Supabase Storage (S3-compatible). Files are organized by tenant: `/{tenant_id}/{filename}`.
* **Parsing:** `PyMuPDF` (fitz). Fast C++ extraction (No OCR/GPU required).
* **Chunking:** `LangChain RecursiveCharacterTextSplitter` (Target: 512 tokens).
* **Embedding Model:** `FastEmbed` (ONNX Runtime).
    * *Model:* `BAAI/bge-small-en-v1.5`
    * *Dimensions:* **384** (Requires DB schema update).
    * *Hardware:* Standard CPU (No Torch/CUDA dependencies).
* **Queue:** Celery + Redis.

## 3. Database Schema Updates

### 3.1 New Table: `files` (Status Tracking)
Used to track the processing state of uploaded documents so the UI can react accordingly.
* `id`: UUID (PK)
* `tenant_id`: UUID (FK)
* `filename`: String
* `storage_path`: String (Path in Supabase Storage)
* `status`: Enum (`uploading`, `processing`, `indexed`, `failed`)
* `created_at`: Timestamp

### 3.2 Update: `documents` (Vectors)
* `embedding`: Change type to `vector(384)`.
* `file_id`: UUID (FK -> files.id) *Link chunk back to source file*.

## 4. Workflow Specification

### Step 1: API Upload (ASynchronous)
* **Endpoint:** `POST /documents/upload`
* **Action:**
    1.  Validate file type (PDF only) and size (< 20MB).
    2.  Create entry in `files` table with status `uploading`.
    3.  Upload binary stream to Supabase Storage bucket.
    4.  Update `files` status to `processing`.
    5.  Trigger Celery Task: `ingest_pdf(file_id, tenant_id, storage_path)`.
    6.  **Return:** `202 Accepted` with `file_id`.

### Step 2: The Worker (Synchronous)
* **Task:** `ingest_pdf`
* **Action:**
    1.  Download file from Supabase Storage to local temporary storage (`/tmp`).
    2.  **Extract:** Use PyMuPDF to get text + page numbers.
    3.  **Chunk:** Split text (Size: 512, Overlap: 50).
    4.  **Embed:** Use `FastEmbed` to generate 384-dim vectors.
    5.  **Persist:** Bulk insert chunks into `documents` table with `tenant_id` and `file_id`.
    6.  **Finalize:**
        * *Success:* Update `files` status to `indexed`.
        * *Failure:* Update `files` status to `failed` and log error.
    7.  **Cleanup:** Delete local temp file.

## 5. Functional Requirements

### FR-01: Tenant Isolation
* Users must only be able to upload files to their own tenant's "folder" in Supabase Storage.
* API must validate `tenant_id` from the JWT before triggering any storage operation.

### FR-02: Deduplication (Simple)
* If a file with the same name exists for the tenant:
    * Option A (MVP): Overwrite (Delete old vectors, process new).
    * Option B: Append timestamp to filename.
    * *Decision:* **Option A** for Portfolio simplicity.

### FR-03: Performance
* Embedding generation should not block the main API thread.
* Large files must be processed in the background.

## 6. Implementation Checklist

- [ ] **Database:**
    - [ ] Create `files` table via Alembic.
    - [ ] Migration: Alter `documents.embedding` to 384 dimensions.
- [ ] **Infrastructure:**
    - [ ] Create generic "Bucket" in Supabase (e.g., `knowledge-base`).
    - [ ] Set RLS policy on Storage Bucket (allow read/write for auth users).
- [ ] **Backend (FastAPI):**
    - [ ] Implement `POST /upload`.
    - [ ] Integrate `supabase-py` client for file transfer.
- [ ] **Worker (Celery):**
    - [ ] Implement `ingest_service.py` with FastEmbed.
    - [ ] Handle exceptions gracefully (ensure status is updated to `failed` on crash).
