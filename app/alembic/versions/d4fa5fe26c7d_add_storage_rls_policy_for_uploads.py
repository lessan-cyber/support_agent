"""add storage rls policy for uploads

Revision ID: d4fa5fe26c7d
Revises: 4a052b179d39
Create Date: 2025-11-30 21:27:27.748598

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4fa5fe26c7d"
down_revision: Union[str, Sequence[str], None] = "4a052b179d39"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Creates the RLS policy for allowing authenticated downloads to tenant folders."""
    op.execute("""
        CREATE POLICY "Users can read own tenant folder"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (
            bucket_id = 'knowledge-base' AND
            (storage.foldername(name))[1] = (
                SELECT tenant_id::text FROM public.users WHERE id = auth.uid()
            )
        );
    """)


def downgrade() -> None:
    """Removes the RLS policy for storage uploads."""
    op.execute("""
    DROP POLICY IF EXISTS "Users can read own tenant folder" ON storage.objects;
    """)
