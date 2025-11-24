"""Add HNSW index to documents table

Revision ID: daf096f6afa9
Revises: d2c607fa8a45
Create Date: 2025-11-24 15:39:47.205049

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "daf096f6afa9"
down_revision: Union[str, Sequence[str], None] = "d2c607fa8a45"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None
disable_ddl_transaction = True


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
        CREATE INDEX idx_documents_embedding
        ON documents
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
        """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("""
        DROP INDEX IF EXISTS idx_documents_embedding
        """)
