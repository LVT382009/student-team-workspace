"""add channel_members table (DMs)

Revision ID: b5e15_channel_members
Revises: a4f04_message_reactions
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b5e15_channel_members"
down_revision: str | Sequence[str] | None = "a4f04_message_reactions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # No-op post-merge: upstream's ``add_channel_members`` migration owns the
    # ``channel_members`` table (``joined_at`` schema, backfill included) and
    # ``models.ChannelMember`` matches it. This branch's copy predates the
    # merge; creating a second copy here collides with ``upgrade head`` over
    # both branches.
    pass


def downgrade() -> None:
    pass
