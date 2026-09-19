"""create follows table (follow/unfollow shitesi)

Revision ID: b4c5d6e7f8a9
Revises: a3b4c5d6e7f8
Create Date: 2026-09-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4c5d6e7f8a9'
down_revision: Union[str, Sequence[str], None] = 'a3b4c5d6e7f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'follows',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('follower_id', sa.UUID(), nullable=False),
        sa.Column('followed_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['follower_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['followed_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('follower_id', 'followed_id', name='unique_follower_followed'),
        sa.CheckConstraint('follower_id != followed_id', name='ck_follow_not_self'),
    )
    op.create_index('ix_follows_follower_id', 'follows', ['follower_id'])
    op.create_index('ix_follows_followed_id', 'follows', ['followed_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_follows_followed_id', table_name='follows')
    op.drop_index('ix_follows_follower_id', table_name='follows')
    op.drop_table('follows')
