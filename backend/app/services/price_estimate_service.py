from sqlalchemy.orm import Session

from app.models.product import Product


def estimate_price(
    db: Session,
    category: str,
    brand: str | None = None,
    condition_rating: int | None = None,
    for_llm: bool = False,
) -> dict:
    """Vleresim 'Faza A' i US-52 (§5.4, faza-5-ai-features.md): bazuar ne shpallje
    AKTIVE te ngjashme ne Thrifted, jo ne shitje te perfunduara reale - s'ka ende
    mjaftueshem histori `Orders` per te trajnuar dicka statistikisht kuptimplote
    (Faza B, kur te grumbullohen shitje te mjaftueshme, mbetet plan i veçante).

    E ndarë si service i vetëm (jo e dyfishuar) sepse e njëjta logjikë përdoret
    nga dy vende: tool-i `estimate_price` i chat assistant-it (5.1) DHE endpoint-i
    i veçantë `POST /ai/estimate-price` (5.4) - kontrata e output-it (input/output)
    mbetet e njëjtë kudo qe perdoret, sic e kerkon dokumenti i fazes.

    `for_llm=True` (perdoret vetem nga chat_service.py) shton te `note` nje udhezim
    shtese PER VETE MODELIN qe te japi hamendje te pergjithshme kur s'ka mjaftueshem
    comps - s'ka kuptim per `POST /ai/estimate-price` (s'ka LLM ne ate rrjedhe),
    prandaj mbetet False (default) per endpoint-in REST."""
    query = db.query(Product).filter(Product.status == "active", Product.category.ilike(f"%{category}%"))

    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))
    if condition_rating is not None:
        query = query.filter(Product.condition_rating == condition_rating)

    prices = [p.price for p in query.limit(50).all()]

    if len(prices) < 3:
        note = (
            "S'ka mjaftueshem shpallje aktive te ngjashme ne Thrifted per nje vleresim "
            "te bazuar ne te dhena reale."
        )
        if for_llm:
            note += (
                " Jep nje vleresim te pergjithshem bazuar ne njohurite e tua te pergjithshme "
                "per cmimet e ketij lloji artikulli, dhe theksoje qarte qe eshte nje hamendje "
                "e pergjithshme, jo e bazuar ne shpallje reale."
            )
        return {
            "confidence": "e ulet",
            "sample_size": len(prices),
            "price_min": None,
            "price_max": None,
            "price_avg": None,
            "note": note,
        }

    return {
        "confidence": "e larte" if len(prices) >= 10 else "e mesme",
        "sample_size": len(prices),
        "price_min": round(min(prices), 2),
        "price_max": round(max(prices), 2),
        "price_avg": round(sum(prices) / len(prices), 2),
        "note": "Bazuar ne shpallje aktive te ngjashme ne Thrifted, jo ne shitje te perfunduara reale.",
    }
