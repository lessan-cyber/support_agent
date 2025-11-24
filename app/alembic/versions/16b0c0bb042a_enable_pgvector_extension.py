"""Enable pgvector extension

Revision ID: 16b0c0bb042a
Revises: 2dc665a0f047
Create Date: 2025-11-24 14:24:50.209152

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '16b0c0bb042a'
down_revision: Union[str, Sequence[str], None] = '2dc665a0f047'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP EXTENSION IF EXISTS vector;")
