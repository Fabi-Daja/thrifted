import uuid
from sqlalchemy import Column, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    product = relationship("Product", backref="favorites")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="unique_user_product_favorite"),
    )

    @property
    def added_at(self):
        """Alias per `created_at` - schemas/favorite.py::FavoriteResponse pret
        `added_at` (kesisoj e njeh frontend-i, shih types/index.ts::FavoriteItem),
        por kolona reale ne DB eshte `created_at`. Pa kete alias, GET /favorites
        deshtonte gjithmone me ResponseValidationError (500) - bug i pazbuluar
        me pare, gjetur duke testuar live flow-in e favoriteve 2026-09-06."""
        return self.created_at