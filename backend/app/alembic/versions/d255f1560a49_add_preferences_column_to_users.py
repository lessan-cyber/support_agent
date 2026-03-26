"""add preferences column to users

Revision ID: d255f1560a49
Revises: add_document_page_number
Create Date: 2026-03-26 14:18:12.114390

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "d255f1560a49"
down_revision: Union[str, Sequence[str], None] = "add_document_page_number"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "users",
        sa.Column(
            "preferences",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default='{"language": "en", "timezone": "UTC", "email_notifications": true, "default_view": "grid", "items_per_page": 12, "auto_download": false}',
            nullable=False,
            comment="User preferences stored as JSON.",
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "preferences")
