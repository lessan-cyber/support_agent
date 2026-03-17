"""add indexes on updated_at columns

Revision ID: add_updated_at_indexes
Revises: 733529437aa2
Create Date: 2025-01-13 00:00:00.000000

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "add_updated_at_indexes"
down_revision: Union[str, Sequence[str], None] = "733529437aa2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index(
        op.f("ix_tickets_updated_at"), "tickets", ["updated_at"], unique=False
    )
    op.create_index(
        op.f("ix_messages_updated_at"), "messages", ["updated_at"], unique=False
    )
    op.create_index(op.f("ix_files_updated_at"), "files", ["updated_at"], unique=False)
    op.create_index(
        op.f("ix_documents_updated_at"), "documents", ["updated_at"], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_documents_updated_at"), table_name="documents")
    op.drop_index(op.f("ix_files_updated_at"), table_name="files")
    op.drop_index(op.f("ix_messages_updated_at"), table_name="messages")
    op.drop_index(op.f("ix_tickets_updated_at"), table_name="tickets")
