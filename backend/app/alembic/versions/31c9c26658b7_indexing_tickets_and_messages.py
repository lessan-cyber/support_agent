"""indexing tickets and messages

Revision ID: 31c9c26658b7
Revises: 480358558f87
Create Date: 2026-05-14 12:55:50.068738

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "31c9c26658b7"
down_revision: str | Sequence[str] | None = "480358558f87"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.get_context().autocommit_block():
        op.create_index(
            "ix_messages_ticket_id",
            "messages",
            ["ticket_id"],
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.create_index(
            "ix_tickets_tenant_created",
            "tickets",
            ["tenant_id", sa.text("created_at DESC")],
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.create_index(
            "ix_messages_ticket_created",
            "messages",
            ["ticket_id", sa.text("created_at DESC")],
            postgresql_concurrently=True,
            if_not_exists=True,
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.get_context().autocommit_block():
        op.drop_index(
            "ix_messages_ticket_id",
            table_name="messages",
            postgresql_concurrently=True,
            if_exists=True,
        )
        op.drop_index(
            "ix_tickets_tenant_created",
            table_name="tickets",
            postgresql_concurrently=True,
            if_exists=True,
        )
        op.drop_index(
            "ix_messages_ticket_created",
            table_name="messages",
            postgresql_concurrently=True,
            if_exists=True,
        )
