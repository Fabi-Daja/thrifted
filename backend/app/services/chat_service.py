import os
import json

from groq import AsyncGroq
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.chat import ChatMessage

client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """Je asistenti i Thrifted, nje marketplace online per rroba te dores se dyte ne Shqiperi.
Ndihmo klientet me pyetje rreth platformes: si te postojne produkte, si te bejne oferta,
si funksionon pagesa, dhe pyetje te pergjithshme rreth blerjes/shitjes se rrobave second-hand.
Pergjigju shkurt dhe qarte, ne shqip, me nje ton miqesor.Kur klienti kerkon rekomandime konkrete produktesh (p.sh. per keshilla outfiti), perdor funksionin search_products per te gjetur produkte reale nga stoku, dhe rekomandoi ato specifikisht (me titull dhe cmim)."""

MAX_HISTORY = 15

TOOLS = [
    {
        "type": "function",  # 1
        "function": {
            "name": "search_products",  # 2
            "description": "Kerkon produkte reale ne Thrifted...",  # 3
            "parameters": {  # 4
                "type": "object",
                "properties": {
                    "category": {"type": "string", "description": "..."},  # 5
                    "max_price": {"type": "number", "description": "..."},
                },
                "required": [],  # 6
            },
        },
    }
]


def _build_messages(messages: list[ChatMessage]) -> list[dict]:
    """Kufizon historine dhe shton system prompt ne fillim."""
    recent = messages[-MAX_HISTORY:]
    return [{"role": "system", "content": SYSTEM_PROMPT}] + [
        {"role": m.role, "content": m.content} for m in recent
    ]


def search_products(db: Session, category: str | None = None, max_price: float | None = None) -> list[dict]:
    """Kthen produkte aktive nga baza per rekomandime ne chat."""
    query = db.query(Product).filter(Product.status == "active")

    if category:
        query = query.filter(Product.category.ilike(f"%{category}%"))

    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    products = query.order_by(Product.created_at.desc()).limit(5).all()

    return [
        {
            "id": str(product.id),
            "title": product.title,
            "price": product.price,
            "category": product.category,
            "brand": product.brand,
            "condition_rating": product.condition_rating,
        }
        for product in products
    ]


async def get_chat_response(messages: list[ChatMessage], db: Session) -> str:
    if not messages:
        raise HTTPException(status_code=400, detail="S'ka mesazhe per te procesuar")

    formatted_messages = _build_messages(messages)

    try:
        # Hapi 1: dergo mesazhin + menu-ne e funksioneve
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=formatted_messages,
            tools=TOOLS,
            max_tokens=500,
            timeout=10.0,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gabim gjate komunikimit me Groq: {str(e)}")

    choice = response.choices[0]

    # Hapi 2: a kerkoi modeli te thirre nje funksion?
    if choice.message.tool_calls:
        formatted_messages.append(choice.message)  # shto pergjigjen e modelit ne histori

        for tool_call in choice.message.tool_calls:
            if tool_call.function.name == "search_products":
                args = json.loads(tool_call.function.arguments)
                results = search_products(db, **args)  # Hapi 3: EKZEKUTIMI real

                # Hapi 4: kthe rezultatet mbrapsht te modeli
                formatted_messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(results),
                })

        # Hapi 5: thirrje e dyte - modeli formulon pergjigjen finale me te dhenat reale
        final_response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=formatted_messages,
            max_tokens=500,
            timeout=10.0,
        )
        return final_response.choices[0].message.content

    # Nese modeli s'kerkoi asnje funksion, kthe pergjigjen direkte
    return choice.message.content




