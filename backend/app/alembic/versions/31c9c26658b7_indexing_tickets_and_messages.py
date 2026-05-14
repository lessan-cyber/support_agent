"""indexing tickets and messages

Revision ID: 31c9c26658b7
Revises: 480358558f87
Create Date: 2026-05-14 12:55:50.068738

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '31c9c26658b7'
down_revision: Union[str, Sequence[str], None] = '480358558f87'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Index on messages.ticket_id for fast lookups by ticket
    op.create_index("ix_messages_ticket_id", "messages", ["ticket_id"])

    # Composite index on tickets for conversation list sorting by date within tenant
    op.create_index(
        "ix_tickets_tenant_created",
        "tickets",
        ["tenant_id", sa.text("created_at DESC")],
    )

    # Composite index on messages for window function (latest message per ticket)
    op.create_index(
        "ix_messages_ticket_created",
        "messages",
        ["ticket_id", sa.text("created_at DESC")],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_messages_ticket_id", table_name="messages")
    op.drop_index("ix_tickets_tenant_created", table_name="tickets")
    op.drop_index("ix_messages_ticket_created", table_name="messages")
