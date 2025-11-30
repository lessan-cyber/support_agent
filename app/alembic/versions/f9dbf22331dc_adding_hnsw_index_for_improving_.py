"""adding hnsw index for improving performance and RLS policies for alembic table

Revision ID: f9dbf22331dc
Revises: d0a036ac143c
Create Date: 2025-11-28 21:33:08.252894

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f9dbf22331dc"
down_revision: Union[str, Sequence[str], None] = "d0a036ac143c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TABLE alembic_version ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY admin_only ON alembic_version
        FOR ALL
        USING (current_setting('role', true) = 'service_role')
    """)
    op.execute("""
        CREATE INDEX CONCURRENTLY idx_documents_embedding_hnsw
        ON documents
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_documents_embedding_hnsw", table_name="documents")
