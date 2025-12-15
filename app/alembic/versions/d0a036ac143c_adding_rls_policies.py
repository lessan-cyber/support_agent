"""adding RLS policies

Revision ID: d0a036ac143c
Revises: 7cb26edbd5e6
Create Date: 2025-11-28 21:13:43.957585

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d0a036ac143c"
down_revision: Union[str, Sequence[str], None] = "7cb26edbd5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Enable Row Level Security and create isolation policies"""
    # ============= Enable RLS on all tables =============
    op.execute("ALTER TABLE tenants ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE users ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE documents ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE tickets ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE messages ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE files ENABLE ROW LEVEL SECURITY")

    # ============ Tenant Isolation Policies ==============

    op.execute("""
            CREATE POLICY tenant_isolation ON tenants
            FOR ALL
            USING (id = current_setting('app.current_tenant')::uuid)
        """)
    # users: linked to auth.users via id, but isolated by tenant_id
    op.execute("""
        CREATE POLICY tenant_isolation ON users
        FOR ALL
        USING (tenant_id = current_setting('app.current_tenant')::uuid)
    """)
    # documents (RAG knowledge base): CRITICAL for security
    op.execute("""
        CREATE POLICY tenant_isolation ON documents
        FOR ALL
        USING (tenant_id = current_setting('app.current_tenant')::uuid)
    """)
    # tickets: escalation system
    op.execute("""
        CREATE POLICY tenant_isolation ON tickets
        FOR ALL
        USING (tenant_id = current_setting('app.current_tenant')::uuid)
    """)
    # messages: chat history
    op.execute("""
        CREATE POLICY tenant_isolation ON messages
        FOR ALL
        USING (tenant_id = current_setting('app.current_tenant')::uuid)
    """)
    # files: uploaded documents
    op.execute("""
        CREATE POLICY tenant_isolation ON files
        FOR ALL
        USING (tenant_id = current_setting('app.current_tenant')::uuid)
    """)
    # ============= Service Role Policy (Admin Access) =============
    op.execute("""
        CREATE POLICY service_role_access ON documents
        FOR ALL
        USING (current_setting('role', true) = 'service_role')
    """)

    op.execute("""
        CREATE POLICY service_role_access ON tickets
        FOR ALL
        USING (current_setting('role', true) = 'service_role')
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop policies in reverse order
    op.execute("DROP POLICY IF EXISTS service_role_access ON tickets")
    op.execute("DROP POLICY IF EXISTS service_role_access ON documents")
    op.execute("DROP POLICY IF EXISTS tenant_isolation ON files")
    op.execute("DROP POLICY IF EXISTS admin_only ON alembic_version")
    op.execute("DROP POLICY IF EXISTS tenant_isolation ON messages")
    op.execute("DROP POLICY IF EXISTS tenant_isolation ON tickets")
    op.execute("DROP POLICY IF EXISTS tenant_isolation ON documents")
    op.execute("DROP POLICY IF EXISTS tenant_isolation ON users")
    op.execute("DROP POLICY IF EXISTS tenant_isolation ON tenants")

    # Disable RLS
    op.execute("ALTER TABLE files DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE messages DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE tickets DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE documents DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE users DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE tenants DISABLE ROW LEVEL SECURITY")
