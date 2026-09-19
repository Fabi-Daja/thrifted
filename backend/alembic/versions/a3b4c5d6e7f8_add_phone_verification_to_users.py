"""add phone verification fields to users

Revision ID: a3b4c5d6e7f8
Revises: f2a3b4c5d6e7
Create Date: 2026-08-31

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3b4c5d6e7f8'
down_revision: Union[str, Sequence[str], None] = 'f2a3b4c5d6e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('phone_number', sa.String(), nullable=True))
    op.add_column(
        'users',
        sa.Column('is_phone_verified', sa.Boolean(), nullable=True, server_default=sa.false()),
    )
    op.add_column('users', sa.Column('phone_verification_code_hash', sa.String(), nullable=True))
    op.add_column(
        'users', sa.Column('phone_verification_expires_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        'users',
        sa.Column('phone_verification_attempts', sa.Integer(), nullable=True, server_default='0'),
    )
    op.add_column(
        'users', sa.Column('phone_verification_sent_at', sa.DateTime(timezone=True), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'phone_verification_sent_at')
    op.drop_column('users', 'phone_verification_attempts')
    op.drop_column('users', 'phone_verification_expires_at')
    op.drop_column('users', 'phone_verification_code_hash')
    op.drop_column('users', 'is_phone_verified')
    op.drop_column('users', 'phone_number')
