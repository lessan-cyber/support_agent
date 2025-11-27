
import asyncio
import uuid

import pytest
import pytest_asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.settings import settings

@pytest_asyncio.fixture(scope="function")
async def engine():
    """Provides a SQLAlchemy engine for the test session."""
    db_engine = create_async_engine(str(settings.TEST_URL), future=True, echo=False)
    yield db_engine
    await db_engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(engine):
    """Provides a transactional database session for a test."""
    AsyncSessionFactory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with AsyncSessionFactory() as session:
        yield session


@pytest.mark.asyncio
async def test_rls_isolation_for_documents(db_session: AsyncSession):
    """
    Tests that a user from one tenant cannot access documents from another tenant.
    This test MUST be run as a non-superuser.
    """
    async with db_session.begin():
        # 1. Verify this test is NOT running as a superuser
        is_superuser = await db_session.execute(
            text("SELECT current_user IN (SELECT rolname FROM pg_roles WHERE rolsuper)")
        )
        if is_superuser.scalar():
            pytest.skip("This test must be run as a non-superuser to validate RLS.")

        # 2. Create two separate tenants, setting the context for each one
        tenant_a_id = uuid.uuid4()
        tenant_b_id = uuid.uuid4()

        # Set context for Tenant A and insert
        await db_session.execute(
            text("SELECT set_config('app.current_tenant', :tenant_id, true)"),
            {"tenant_id": str(tenant_a_id)},
        )
        await db_session.execute(
            text("INSERT INTO tenants (id, name) VALUES (:id, :name)"),
            {"id": tenant_a_id, "name": "Tenant A"},
        )

        # Set context for Tenant B and insert
        await db_session.execute(
            text("SELECT set_config('app.current_tenant', :tenant_id, true)"),
            {"tenant_id": str(tenant_b_id)},
        )
        await db_session.execute(
            text("INSERT INTO tenants (id, name) VALUES (:id, :name)"),
            {"id": tenant_b_id, "name": "Tenant B"},
        )

        # 3. Set context back to Tenant A and insert a document
        await db_session.execute(
            text("SELECT set_config('app.current_tenant', :tenant_id, true)"),
            {"tenant_id": str(tenant_a_id)},
        )

        # Create a placeholder embedding vector
        embedding = f"[{','.join(['0.1'] * 1536)}]"

        document_for_a = await db_session.execute(
            text(
                "INSERT INTO documents (tenant_id, content, embedding) "
                "VALUES (:tenant_id, 'Doc for A', :embedding) RETURNING id"
            ),
            {"tenant_id": tenant_a_id, "embedding": embedding},
        )
        document_a_id = document_for_a.scalar_one()

    # 4. Commit the transaction to make data visible to subsequent connections

    # 5. Set context to Tenant B and try to access Tenant A's document
    async with db_session.begin():
        await db_session.execute(
            text("SELECT set_config('app.current_tenant', :tenant_id, true)"),
            {"tenant_id": str(tenant_b_id)},
        )

        result = await db_session.execute(
            text("SELECT id FROM documents WHERE id = :doc_id"),
            {"doc_id": document_a_id},
        )
        # The query should return no rows, proving RLS is working
        assert (
            result.first() is None
        ), "Tenant B was able to access Tenant A's document."

        # 6. (Optional but good) Verify Tenant A can still access its own document
        await db_session.execute(
            text("SELECT set_config('app.current_tenant', :tenant_id, true)"),
            {"tenant_id": str(tenant_a_id)},
        )
        result = await db_session.execute(
            text("SELECT id FROM documents WHERE id = :doc_id"),
            {"doc_id": document_a_id},
        )
        assert (
            result.scalar_one() == document_a_id
        ), "Tenant A could not access its own document."

    # Clean up created tenants one by one, respecting RLS
    async with db_session.begin():
        # Set context for Tenant A and delete
        await db_session.execute(
            text("SELECT set_config('app.current_tenant', :tenant_id, true)"),
            {"tenant_id": str(tenant_a_id)},
        )
        await db_session.execute(text("DELETE FROM tenants WHERE id = :id"), {"id": tenant_a_id})

        # Set context for Tenant B and delete
        await db_session.execute(
            text("SELECT set_config('app.current_tenant', :tenant_id, true)"),
            {"tenant_id": str(tenant_b_id)},
        )
        await db_session.execute(text("DELETE FROM tenants WHERE id = :id"), {"id": tenant_b_id})
