"""
Asynchronous task for document ingestion, embedding, and indexing.
"""

import logging
import os
import tempfile
import uuid

import fitz  # PyMuPDF
from fastembed import TextEmbedding
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config.db import get_db_sync
from app.config.supabase import get_supabase_client_sync
from app.models.document import Document
from app.models.file import File, FileStatus
from app.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="ingest_pdf")
def ingest_pdf(file_id: str, tenant_id: str, storage_path: str):
    """
    Celery task to process a PDF file from storage, extract text,
    create embeddings, and save them to the database.

    Args:
        file_id: The ID of the file record in the database.
        tenant_id: The ID of the tenant who owns the file.
        storage_path: The path of the file in Supabase Storage.
    """
    logger.info(f"Starting ingestion for file_id: {file_id}, tenant_id: {tenant_id}")

    db_session_gen = get_db_sync(tenant_id=tenant_id)
    db = next(db_session_gen)

    try:
        # 1. Download file from Supabase Storage to a temporary local file
        storage_client = get_supabase_client_sync()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            # The download method is sync, so it's fine in a Celery task
            res = storage_client.storage.from_("knowledge-base").download(storage_path)
            tmp_file.write(res)
            tmp_file_path = tmp_file.name

        # 2. Extract text from the PDF
        doc = fitz.open(tmp_file_path)
        extracted_texts = [page.get_text() for page in doc]
        doc.close()
        full_text = "\n".join(extracted_texts)

        # 3. Chunk the text
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=50)
        chunks = text_splitter.split_text(full_text)

        # 4. Embed the chunks
        # According to the PRD, we need to use BAAI/bge-small-en-v1.5
        embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        embeddings = list(embedding_model.embed(chunks))

        # 5. Persist the document chunks
        # First, delete any old documents associated with this file to handle re-uploads
        db.query(Document).filter(Document.file_id == file_id).delete(
            synchronize_session=False
        )

        documents_to_add = []
        for i, chunk in enumerate(chunks):
            new_doc = Document(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                file_id=file_id,
                content=chunk,
                embedding=embeddings[i].tolist(),
            )
            documents_to_add.append(new_doc)

        db.add_all(documents_to_add)

        # 6. Update the file status to 'indexed'
        db.query(File).filter(File.id == file_id).update({"status": FileStatus.INDEXED})

        db.commit()
        logger.info(f"Successfully indexed file_id: {file_id}")

    except Exception as e:
        logger.error(f"Failed to ingest file_id: {file_id}. Error: {e}", exc_info=True)
        # Rollback any partial changes
        db.rollback()
        # Mark the file as failed
        db.query(File).filter(File.id == file_id).update({"status": FileStatus.FAILED})
        db.commit()
    finally:
        # 7. Cleanup the temporary file and close the db session
        # pyrefly: ignore [unbound-name]
        if "tmp_file_path" in locals() and os.path.exists(tmp_file_path):
            # pyrefly: ignore [unbound-name]
            os.remove(tmp_file_path)
        db.close()
