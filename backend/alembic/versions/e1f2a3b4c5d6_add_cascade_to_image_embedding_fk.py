"""add ondelete=CASCADE to product_image_embeddings.image_id FK (§5.3 bug fix)

Rregullon bug-un e gjetur 2026-08-24 (review i Cowork, shih
docs/faza/faza-5-ai-features.md §"Probleme/Çështje të Hapura"): FK-ja
`product_image_embeddings.image_id -> product_images.id` s'kishte
`ondelete="CASCADE"`, kështu që `DELETE /products/{id}/images` dështonte me
`IntegrityError`/`ForeignKeyViolation` sapo foto e fshirë kishte embedding
(rasti normal, pas hook-ut automatik të 5.3 në upload).

Revision ID: e1f2a3b4c5d6
Revises: c4d5e6f7a8b9
Create Date: 2026-08-26

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, Sequence[str], None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint(
        'product_image_embeddings_image_id_fkey',
        'product_image_embeddings',
        type_='foreignkey',
    )
    op.create_foreign_key(
        'product_image_embeddings_image_id_fkey',
        'product_image_embeddings',
        'product_images',
        ['image_id'],
        ['id'],
        ondelete='CASCADE',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        'product_image_embeddings_image_id_fkey',
        'product_image_embeddings',
        type_='foreignkey',
    )
    op.create_foreign_key(
        'product_image_embeddings_image_id_fkey',
        'product_image_embeddings',
        'product_images',
        ['image_id'],
        ['id'],
    )
