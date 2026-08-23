"""Skript nje-heresh (§5.3): gjeneron embeddings per te gjitha fotot e
produkteve EKZISTUESE qe s'kane ende nje rresht ne `product_image_embeddings`
(p.sh. foto te ngarkuara para se hook-u automatik i upload-it te ekzistonte).

Perdorim:
    cd backend
    venv\\Scripts\\python.exe scripts\\backfill_image_embeddings.py
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.product_image import ProductImage
from app.models.product_image_embedding import ProductImageEmbedding
from app.services.image_embedding_service import generate_embedding_for_image


async def main() -> None:
    db = SessionLocal()
    try:
        already_embedded_ids = {row.image_id for row in db.query(ProductImageEmbedding.image_id).all()}
        images = db.query(ProductImage).filter(ProductImage.id.notin_(already_embedded_ids)).all() \
            if already_embedded_ids else db.query(ProductImage).all()

        print(f"{len(images)} foto pa embedding - duke i procesuar...")

        success, failed = 0, 0
        for image in images:
            try:
                await generate_embedding_for_image(db, image)
                db.commit()
                success += 1
                print(f"  [OK] {image.id}")
            except Exception as e:
                db.rollback()
                failed += 1
                print(f"  [DESHTOI] {image.id}: {e}")

        print(f"\nPerfunduar: {success} me sukses, {failed} deshtuan.")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
