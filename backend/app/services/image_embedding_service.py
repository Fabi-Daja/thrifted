import httpx
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.product_image_embedding import ProductImageEmbedding
from app.services.voyage_client import embed_image

# §5.3 (faza-5-ai-features.md). Prag fillestar EMPIRIK per distancen cosine
# (0 = identike, 2 = e kundert) - dokumentuar si "provo dhe rregullo pas
# testimit" ne planin origjinal; s'perdoret ende per te filtruar rezultatet
# (kthehet distanca vete, filtrimi mund te behet nga frontend/klienti derisa
# te kalibrohet me raste reale).
DEFAULT_SIMILARITY_LIMIT = 5


async def generate_embedding_for_image(db: Session, image: ProductImage) -> ProductImageEmbedding:
    """Gjeneron dhe ruan embedding per nje foto EKZISTUESE (tashme e ngarkuar
    ne Cloudinary - `image.url` eshte URL publik). Perdoret nga hook-u i
    upload-it (routers/product_image.py) dhe nga skripti i backfill-it
    (scripts/backfill_image_embeddings.py)."""
    async with httpx.AsyncClient() as http_client:
        response = await http_client.get(image.url, timeout=15.0)
        response.raise_for_status()
        image_bytes = response.content
        media_type = response.headers.get("content-type", "image/jpeg")

    # "document" - kjo eshte nje foto qe RUHET ne katalog (jo nje kerkim) -
    # shih koment te voyage_client.embed_image per dallimin document/query.
    vector = await embed_image(image_bytes, media_type, input_type="document")

    embedding_row = ProductImageEmbedding(
        product_id=image.product_id,
        image_id=image.id,
        embedding=vector,
    )
    db.add(embedding_row)
    db.flush()
    return embedding_row


async def search_by_image(db: Session, image_bytes: bytes, media_type: str, limit: int = DEFAULT_SIMILARITY_LIMIT) -> list[dict]:
    """Kerkim me ngjashmeri vizuale (US-51). Embed foton e kerkimit (input_type=
    'query' - asimetrik me 'document' te fotove te ruajtura), krahason me
    cosine distance (`<=>`, index HNSW) kunder embeddings-eve te ruajtura,
    kthen top-N PRODUKTE (jo foto - nje produkt mund te kete disa foto/kende,
    marrim distancen me te mire per secilin dhe dedup-ojme)."""
    query_vector = await embed_image(image_bytes, media_type, input_type="query")

    distance_expr = ProductImageEmbedding.embedding.cosine_distance(query_vector)
    rows = (
        db.query(ProductImageEmbedding.product_id, distance_expr.label("distance"))
        .order_by(distance_expr)
        .limit(limit * 3)  # disa me shume se `limit` sepse dedup-ojme per produkt me poshte
        .all()
    )

    best_distance_per_product: dict = {}
    for product_id, distance in rows:
        if product_id not in best_distance_per_product or distance < best_distance_per_product[product_id]:
            best_distance_per_product[product_id] = distance

    top_product_ids = sorted(best_distance_per_product.items(), key=lambda kv: kv[1])[:limit]

    results = []
    for product_id, distance in top_product_ids:
        product = db.query(Product).filter(Product.id == product_id, Product.status == "active").first()
        if not product:
            continue  # produkti mund te jete shitur/hequr qe atehere - injoroje, mos e trego
        results.append({
            "id": str(product.id),
            "title": product.title,
            "price": product.price,
            "category": product.category,
            "brand": product.brand,
            "condition_rating": product.condition_rating,
            "image_url": product.images[0].url if product.images else None,
            "similarity_distance": round(float(distance), 4),
        })

    return results
