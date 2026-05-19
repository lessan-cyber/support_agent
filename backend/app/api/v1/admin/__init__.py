"""Admin API router — aggregates all sub-routers under a single prefix."""

from fastapi import APIRouter

from app.api.v1.admin.conversations import router as conversations_router
from app.api.v1.admin.documents import router as documents_router
from app.api.v1.admin.domains import router as domains_router
from app.api.v1.admin.preferences import router as preferences_router
from app.api.v1.admin.tickets import router as tickets_router

router = APIRouter()

router.include_router(tickets_router, prefix="/tickets")
router.include_router(conversations_router, prefix="/conversations")
router.include_router(documents_router, prefix="/documents")
router.include_router(domains_router, prefix="/tenants")
router.include_router(preferences_router, prefix="/preferences")
