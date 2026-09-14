"""Merge heads: upstream unique-membership branch + task-2 feature branch.

Revision ID: m3rge_task2_heads
Revises: adfcaabfb828, f9a01_page_versions
"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "m3rge_task2_heads"
down_revision: Union[str, Sequence[str], None] = ("adfcaabfb828", "f9a01_page_versions")
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
