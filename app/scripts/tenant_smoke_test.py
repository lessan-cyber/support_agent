import asyncio
from app.config.db import SessionLocal
from app.services.user_models import Tenant


async def test_create_tenant():
    async with SessionLocal() as session:
        tenant = Tenant(name="smoke-test", plan="basic")
        session.add(tenant)
        await session.commit()
        await session.refresh(tenant)
        print("Tenant ID:", tenant.id, type(tenant.id))


if __name__ == "__main__":
    asyncio.run(test_create_tenant())
