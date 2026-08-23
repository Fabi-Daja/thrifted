"""create product_image_embeddings table (pgvector, §5.3)

Revision ID: c4d5e6f7a8b9
Revises: b2c3d4e5f6a7
Create Date: 2026-08-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    op.create_table(
        'product_image_embeddings',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('image_id', sa.UUID(), nullable=False),
        sa.Column('embedding', Vector(1024), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.ForeignKeyConstraint(['image_id'], ['product_images.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('image_id'),
    )
    op.create_index(
        'ix_product_image_embeddings_product_id', 'product_image_embeddings', ['product_id']
    )

    # Index HNSW per kerkim te shpejte te ngjashmerise (cosine distance, operatori
    # `<=>`) - pa te, çdo kerkim do te krahasonte me çdo embedding ne katalog
    # (sequential scan O(N)), i papërdorshëm sapo katalogu te rritet (shih §5.3).
    op.execute(
        "CREATE INDEX ix_product_image_embeddings_hnsw "
        "ON product_image_embeddings USING hnsw (embedding vector_cosine_ops)"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute('DROP INDEX IF EXISTS ix_product_image_embeddings_hnsw')
    op.drop_index('ix_product_image_embeddings_product_id', table_name='product_image_embeddings')
    op.drop_table('product_image_embeddings')
    op.execute('DROP EXTENSION IF EXISTS vector')
