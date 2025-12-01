"""Celery worker configuration."""

from celery import Celery

from app.settings import settings

celery_app = Celery(
    "worker",
    broker=str(settings.REDIS_URL),
    backend=str(settings.REDIS_URL),
    include=["app.services.ingestion"],
)


celery_app.conf.update(
    task_track_started=True,
)
