"""Enable real-time notifications for tickets table

Revision ID: enable_realtime_tickets
Revises: f9dbf22331dc
Create Date: 2025-12-24 14:30:00.000000

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "enable_realtime_tickets"
down_revision: Union[str, Sequence[str], None] = "f9dbf22331dc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Enable real-time notifications for tickets table."""
    # Add tickets table to the default Supabase publication
    # This enables the table to broadcast events
    op.execute("ALTER PUBLICATION supabase_realtime ADD TABLE tickets;")

    # Set Replica Identity to FULL to ensure both old and new values
    # are available in the payload for better debugging and filtering
    op.execute("ALTER TABLE tickets REPLICA IDENTITY FULL;")

    # Add RLS policy for real-time notifications to ensure tenant isolation
    # This policy allows authenticated users to receive real-time updates
    # only for tickets belonging to their tenant
    op.execute("""
        CREATE POLICY "Admins can receive real-time ticket updates"
        ON tickets FOR SELECT
        TO authenticatedalembic  -c app/alembic.ini revision --autogenerate -m "adding indexing to tenant_id and file_id"
        USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))
    """)


def downgrade() -> None:
    """Disable real-time notifications for tickets table."""
    # Remove the RLS policy for real-time notifications
    op.execute(
        'DROP POLICY IF EXISTS "Admins can receive real-time ticket updates" ON tickets;'
    )

    # Remove tickets table from the publication
    op.execute("ALTER PUBLICATION supabase_realtime DROP TABLE tickets;")

    # Reset replica identity to default
    op.execute("ALTER TABLE tickets REPLICA IDENTITY DEFAULT;")
