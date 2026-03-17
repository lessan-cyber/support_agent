"""empty message

Revision ID: 733529437aa2
Revises: d3047c331038, enable_realtime_tickets
Create Date: 2025-12-24 16:00:33.574779

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '733529437aa2'
down_revision: Union[str, Sequence[str], None] = ('d3047c331038', 'enable_realtime_tickets')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
