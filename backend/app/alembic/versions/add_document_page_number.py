"""add page_number column to documents table

Revision ID: add_document_page_number
Revises: 733529437aa2
Create Date: 2025-01-13 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "add_document_page_number"
down_revision: Union[str, Sequence[str], None] = "add_updated_at_indexes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "documents",
        sa.Column(
            "page_number",
            sa.Integer(),
            nullable=True,
            comment="Source page number in PDF (0-indexed).",
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("documents", "page_number")
