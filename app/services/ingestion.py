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
from supabase import StorageException

from app.config.db import get_db_sync
from app.config.supabase import supabase_admin_sync
from app.models.document import Document
from app.models.file import File, FileStatus
from app.services.storage import upload_to_storage_sync
from app.worker import celery_app

logger = logging.getLogger(__name__)


def _handle_ingestion_failure(db, file_id: str, error: Exception):
    logger.exception(f"Ingestion failed for file_id: {file_id}. Error: {error}")
    db.rollback()
    db.query(File).filter(File.id == file_id).update({"status": FileStatus.FAILED})
    db.commit()


@celery_app.task(
    name="upload_file_and_trigger_ingestion",
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3},
    retry_backoff=True,
)
def upload_file_and_trigger_ingestion(
    local_file_path: str, file_id: str, tenant_id: str, filename: str
):
    """
    Celery task to upload a file to Supabase Storage and then trigger the ingestion task.
    """
    logger.info(f"Starting upload for file_id: {file_id}")
    db_session_gen = get_db_sync(tenant_id=tenant_id)
    db = next(db_session_gen)

    try:
        storage_path = f"{tenant_id}/{filename}"
        with open(local_file_path, "rb") as f:
            upload_to_storage_sync(f, storage_path)

        logger.info(f"Successfully uploaded file_id: {file_id} to {storage_path}")

        # Update file status to PROCESSING
        db.query(File).filter(File.id == file_id).update(
            {"status": FileStatus.PROCESSING}
        )
        db.commit()

        # Trigger the next stage of the pipeline
        ingest_pdf.delay(file_id, tenant_id, storage_path)

    except Exception as e:
        _handle_ingestion_failure(db, file_id, e)
        raise
    finally:
        if os.path.exists(local_file_path):
            os.remove(local_file_path)
        db.close()


@celery_app.task(
    name="ingest_pdf",
    autoretry_for=(StorageException,),
    retry_kwargs={"max_retries": 3},
    retry_backoff=True,
)
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
        storage_client = supabase_admin_sync()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            res = storage_client.storage.from_("knowledge-base").download(storage_path)
            tmp_file.write(res)
            tmp_file_path = tmp_file.name
        doc = fitz.open(tmp_file_path)
        extracted_texts = [page.get_text() for page in doc]
        doc.close()
        full_text = "\n".join(extracted_texts)

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=50)
        chunks = text_splitter.split_text(full_text)
        embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        embeddings = list(embedding_model.embed(chunks))
        db.query(Document).filter(Document.file_id == file_id).delete(
            synchronize_session=False
        )

        documents_to_add = []
        for i, chunk in enumerate(chunks):
            try:
                tenant_uuid = uuid.UUID(tenant_id)
                file_uuid = uuid.UUID(file_id)
            except ValueError as e:
                logger.error(
                    f"Invalid UUID format for tenant_id: {tenant_id} or file_id: {file_id}. Error: {e}"
                )
                raise  # Re-raise to be caught by the task's main exception handler

            new_doc = Document(
                id=uuid.uuid4(),
                tenant_id=tenant_uuid,
                file_id=file_uuid,
                content=chunk,
                embedding=embeddings[i].tolist(),
            )
            documents_to_add.append(new_doc)

        db.add_all(documents_to_add)

        db.query(File).filter(File.id == file_id).update({"status": FileStatus.INDEXED})

        db.commit()
        logger.info(f"Successfully indexed file_id: {file_id}")

    except StorageException as e:
        _handle_ingestion_failure(db, file_id, e)
        raise  # Re-raise to let Celery handle retry/failure

    except fitz.FileDataError as e:
        _handle_ingestion_failure(db, file_id, e)
        raise  # Re-raise to let Celery handle retry/failure

    except (
        ValueError
    ) as e:  # Catch ValueErrors from UUID conversion, text splitting, etc.
        _handle_ingestion_failure(db, file_id, e)
        raise  # Re-raise to let Celery handle retry/failure

    except RuntimeError as e:  # Catch RuntimeErrors from fastembed or other issues
        _handle_ingestion_failure(db, file_id, e)
        raise  # Re-raise to let Celery handle retry/failure

    except Exception as e:  # Generic fallback
        _handle_ingestion_failure(db, file_id, e)
        raise  # Re-raise to let Celery handle retry/failure
    finally:
        if "tmp_file_path" in locals() and os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)
        db.close()