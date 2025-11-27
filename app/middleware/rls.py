
from fastapi import HTTPException, Request

# Define public paths that don't need a tenant ID
PUBLIC_PATHS = ["/", "/docs", "/openapi.json"]


async def rls_tenant_middleware(request: Request, call_next):
    """
    FastAPI middleware to enforce tenant isolation via X-Tenant-ID header.

    This middleware inspects incoming HTTP requests to ensure that a
    'X-Tenant-ID' header is present for all routes except for those
    explicitly marked as public.

    If the header is present, its value is stored in `request.state.tenant_id`
    to be used by downstream dependencies.

    If the header is missing for a non-public route, a 401 Unauthorized
    HTTPException is raised.
    """
    # Bypass tenant check for public paths
    if request.url.path in PUBLIC_PATHS:
        response = await call_next(request)
        return response

    tenant_id = request.headers.get("X-Tenant-ID")
    if not tenant_id:
        raise HTTPException(status_code=401, detail="X-Tenant-ID header not provided")

    request.state.tenant_id = tenant_id
    response = await call_next(request)
    return response
