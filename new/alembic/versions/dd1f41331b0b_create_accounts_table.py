"""Create accounts table

Revision ID: dd1f41331b0b
Revises: 
Create Date: 2026-09-01 20:12:23.995277

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dd1f41331b0b'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table("accounts", sa.Column("id",sa.Uuid, primary_key=True), sa.Column("amount", sa.Double), sa.Column("description", sa.Text))

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("accounts")
