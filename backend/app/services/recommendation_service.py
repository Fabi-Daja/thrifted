import logging
from collections import defaultdict

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.product_image_embedding import ProductImageEmbedding
from app.models.user_product_interaction import UserProductInteraction

logger = logging.getLogger("thrifted.recommendations")

# §5.5 (faza-5-ai-features.md) - peshat e propozuara ne plan: nje blerje tregon
# interes shume me te forte se nje "view" i thjeshte. "search" mbetet e
# percaktuar per perdorim te ardhshem - S'KA ENCE hook te lidhur qe ta mbushe
# (checklist-i i fazes kerkon vetem view/favorite/purchase per momentin).
INTERACTION_WEIGHTS = {
    "view": 1,
    "favorite": 5,
    "purchase": 10,
    "search": 1,
}

DEFAULT_RECOMMENDATION_LIMIT = 10

# Bonus (JO hard-filter) per kategori/marke qe perputhen me historine e userit,
# dhe per cmim brenda rrezes se tij - "sinjal shtese" siç e kerkon plani, jo
# nje filtrim i forte qe do te hiqte rezultate te tjera te ngjashme vizualisht.
# Vlera EMPIRIKE (njesoj si DEFAULT_SIMILARITY_LIMIT te image_embedding_service.py)
# - per t'u kalibruar me perdorim real, jo hamendje perfundimtare.
CATEGORY_MATCH_BONUS = 0.10
BRAND_MATCH_BONUS = 0.05
PRICE_RANGE_MATCH_BONUS = 0.05
PRICE_RANGE_TOLERANCE = 0.30  # +/-30% rreth min/max cmimeve te produkteve te historise se userit


def log_interaction(db: Session, user_id, product_id, interaction_type: str) -> None:
    """Regjistron nje ndervprim user-produkt (§5.5). E QELLIMSHME qe s'ndalon
    KURRE rrjedhen kryesore (favorite/blerje/shikim produkti) nese logimi
    deshton - njesoj si fail-secure e embeddings-eve (5.3, shih
    routers/product_image.py). Perdor SAVEPOINT (`begin_nested`) ne vend te
    thjesht db.add()+commit() qe nje deshtim ketu te rrotullohet mbrapsht VETEM
    kete insert, jo tere transaksionin e caller-it (p.sh. Favorite-in qe eshte
    ende i pa-commit-uar ne te njejten sesion kur thirret nga routers/favorite.py)."""
    weight = INTERACTION_WEIGHTS.get(interaction_type, 1)
    try:
        with db.begin_nested():
            db.add(UserProductInteraction(
                user_id=user_id,
                product_id=product_id,
                interaction_type=interaction_type,
                weight=weight,
            ))
    except Exception:
        logger.warning(
            "interaction_log_failed user_id=%s product_id=%s type=%s",
            user_id, product_id, interaction_type, exc_info=True,
        )


def _serialize_product(product: Product) -> dict:
    return {
        "id": str(product.id),
        "title": product.title,
        "price": product.price,
        "category": product.category,
        "brand": product.brand,
        "condition_rating": product.condition_rating,
        "image_url": product.images[0].url if product.images else None,
    }


def _trending_fallback(db: Session, limit: int, exclude_product_ids: set = frozenset()) -> list[dict]:
    """Cold-start (user pa histori te perdorshme - shih get_recommendations).
    'Trending' = produktet me me shume ndervprim te grumbulluar nga TERE baza e
    perdoruesve (query e thjeshte pa dritare kohore - e mjaftueshme per volumin
    aktual te te dhenave, njesoj si Faza A e 5.4). Nese tabela e ndervprimeve
    eshte ende bosh (bootstrap - asnje interaction s'eshte regjistruar akoma),
    fallback me tej te produktet me te reja aktive.

    `exclude_product_ids` - QENESORE kur ky fallback thirret PËR NJË USER QË KA
    HISTORI (jo bootstrap i vertete, p.sh. produktet e interaguara s'kane
    embedding te perdorshem - shih get_recommendations): pa kete, nje user mund
    te "rekomandohet" ekzaktesisht produkti qe sapo favorizoi/pa/bleu, sidomos
    kur tabela e ndervprimeve eshte ende e vogel (nderveprimi i tij i fundit e
    "domino" vete renditjen globale) - gjetur gjate testimit manual (2026-08-29)."""
    trending_rows = (
        db.query(
            UserProductInteraction.product_id,
            func.sum(UserProductInteraction.weight).label("total_weight"),
        )
        .group_by(UserProductInteraction.product_id)
        .order_by(func.sum(UserProductInteraction.weight).desc())
        .limit((limit + len(exclude_product_ids)) * 2)
        .all()
    )

    results = []
    for product_id, _ in trending_rows:
        if product_id in exclude_product_ids:
            continue
        product = db.query(Product).filter(Product.id == product_id, Product.status == "active").first()
        if not product:
            continue  # produkti mund te jete shitur/hequr qe atehere
        results.append(_serialize_product(product))
        if len(results) >= limit:
            break

    if results:
        return results

    newest = (
        db.query(Product)
        .filter(Product.status == "active", Product.id.notin_(exclude_product_ids))
        .order_by(Product.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_serialize_product(p) for p in newest]


def get_recommendations(db: Session, user_id, limit: int = DEFAULT_RECOMMENDATION_LIMIT) -> list[dict]:
    """US propozuar (§5.5). Content-based mbi `product_image_embeddings` (5.3,
    RIPERDORIM direkt, jo infrastrukture e re AI): merr produktet me te cilat
    useri ka ndervepruar pozitivisht, ndertion nje embedding "te shijes se tij"
    (mesatare e ponderuar sipas `weight`), pastaj kerkon me `cosine_distance`
    kunder gjithe katalogut - i njejti mekanizem si `search_by_image()` (5.3),
    vetem qe query-vector-i vjen nga historia e userit, jo nga nje foto e re.

    Cold-start (user pa histori, ose histori pa embeddings te perdorshme) ->
    `_trending_fallback`."""
    interactions = (
        db.query(UserProductInteraction.product_id, UserProductInteraction.weight)
        .filter(UserProductInteraction.user_id == user_id)
        .all()
    )

    if not interactions:
        return _trending_fallback(db, limit)

    weight_by_product: dict = defaultdict(int)
    for product_id, weight in interactions:
        weight_by_product[product_id] += weight

    interacted_product_ids = set(weight_by_product.keys())

    embedding_rows = (
        db.query(ProductImageEmbedding.product_id, ProductImageEmbedding.embedding)
        .filter(ProductImageEmbedding.product_id.in_(interacted_product_ids))
        .all()
    )

    if not embedding_rows:
        # useri ka histori, por asnje nga produktet s'ka embedding te ruajtur
        # (p.sh. Voyage deshtoi ne kohen e upload-it - shih fail-secure te 5.3)
        return _trending_fallback(db, limit, exclude_product_ids=interacted_product_ids)

    vectors_by_product: dict = defaultdict(list)
    for product_id, vector in embedding_rows:
        vectors_by_product[product_id].append(vector)

    dimension = len(next(iter(vectors_by_product.values()))[0])
    weighted_sums = [0.0] * dimension
    total_weight = 0.0

    for product_id, vectors in vectors_by_product.items():
        # mesatarizo brenda produktit fillimisht - nje produkt me disa
        # foto/kende s'duhet te "peshoje" me shume vetem sepse ka me shume
        # embeddings te ruajtura per te.
        product_vector = [sum(values) / len(vectors) for values in zip(*vectors)]
        weight = weight_by_product[product_id]
        total_weight += weight
        for i, value in enumerate(product_vector):
            weighted_sums[i] += value * weight

    if total_weight == 0:
        return _trending_fallback(db, limit, exclude_product_ids=interacted_product_ids)

    query_vector = [s / total_weight for s in weighted_sums]

    # Sinjale plotesuese nga historia e userit (kategori/marke/rreze cmimi) -
    # perdoren si bonus i vogel ne rirenditje, JO si filter i forte (§5.5:
    # "si sinjal shtese perveç ngjashmerise vizuale").
    interacted_products = db.query(Product).filter(Product.id.in_(interacted_product_ids)).all()
    category_weight: dict = defaultdict(int)
    brand_weight: dict = defaultdict(int)
    prices: list[float] = []
    for product in interacted_products:
        w = weight_by_product.get(product.id, 1)
        if product.category:
            category_weight[product.category] += w
        if product.brand:
            brand_weight[product.brand] += w
        if product.price is not None:
            prices.append(product.price)

    preferred_category = max(category_weight, key=category_weight.get) if category_weight else None
    preferred_brand = max(brand_weight, key=brand_weight.get) if brand_weight else None
    price_range = (
        (min(prices) * (1 - PRICE_RANGE_TOLERANCE), max(prices) * (1 + PRICE_RANGE_TOLERANCE))
        if prices else None
    )

    distance_expr = ProductImageEmbedding.embedding.cosine_distance(query_vector)
    candidate_rows = (
        db.query(ProductImageEmbedding.product_id, distance_expr.label("distance"))
        .order_by(distance_expr)
        # disa me shume se `limit` sepse dedup-ojme per produkt dhe hedhim
        # poshte produktet me te cilat useri ka ndervepruar tashme
        .limit((limit + len(interacted_product_ids)) * 3)
        .all()
    )

    best_distance_per_product: dict = {}
    for product_id, distance in candidate_rows:
        if product_id in interacted_product_ids:
            continue  # mos rekomando dicka qe useri ka pare/favorizuar/blere tashme
        if product_id not in best_distance_per_product or distance < best_distance_per_product[product_id]:
            best_distance_per_product[product_id] = distance

    if not best_distance_per_product:
        return _trending_fallback(db, limit, exclude_product_ids=interacted_product_ids)

    candidate_products = {
        p.id: p
        for p in db.query(Product).filter(
            Product.id.in_(best_distance_per_product.keys()),
            Product.status == "active",
        ).all()
    }

    scored = []
    for product_id, distance in best_distance_per_product.items():
        product = candidate_products.get(product_id)
        if not product:
            continue  # produkti mund te jete shitur/hequr qe atehere
        score = float(distance)
        if preferred_category and product.category == preferred_category:
            score -= CATEGORY_MATCH_BONUS
        if preferred_brand and product.brand == preferred_brand:
            score -= BRAND_MATCH_BONUS
        if price_range and price_range[0] <= product.price <= price_range[1]:
            score -= PRICE_RANGE_MATCH_BONUS
        scored.append((score, product))

    scored.sort(key=lambda item: item[0])
    results = [_serialize_product(product) for _, product in scored[:limit]]

    return results if results else _trending_fallback(db, limit, exclude_product_ids=interacted_product_ids)
