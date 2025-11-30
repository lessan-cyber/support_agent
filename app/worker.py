"""Celery worker configuration."""

from celery import Celery

from app.settings import settings

celery_app = Celery(
    "worker",
    broker=str(settings.REDIS_URL),
    backend=str(settings.REDIS_URL),
    include=["app.services.ingestion"],  # Points to the module where tasks are defined
)

# Optional: Configure Celery further if needed
# pyrefly: ignore [missing-attribute]
celery_app.conf.update(
    task_track_started=True,
)
