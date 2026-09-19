"""create user_product_interactions table (§5.5 - rekomandime te personalizuara)

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-08-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2a3b4c5d6e7'
down_revision: Union[str, Sequence[str], None] = 'e1f2a3b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'user_product_interactions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        # view / favorite / purchase / search - shih recommendation_service.INTERACTION_WEIGHTS
        sa.Column('interaction_type', sa.String(), nullable=False),
        sa.Column('weight', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        # ondelete=CASCADE ne te dyja FK-te: kur nje user/produkt fshihet, historia
        # e ndervprimit s'ka me kuptim te mbetet (dhe do te prishte agregimin e
        # rekomandimeve nese mbetej "orfane") - e njejta logjike si bug-fix-i i
        # mepasshem per product_image_embeddings (shih e1f2a3b4c5d6).
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_user_product_interactions_user_id', 'user_product_interactions', ['user_id']
    )
    op.create_index(
        'ix_user_product_interactions_product_id', 'user_product_interactions', ['product_id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_user_product_interactions_product_id', table_name='user_product_interactions')
    op.drop_index('ix_user_product_interactions_user_id', table_name='user_product_interactions')
    op.drop_table('user_product_interactions')
