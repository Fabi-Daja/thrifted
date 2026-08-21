import os
import json

import anthropic
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.chat import ChatMessage

client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

MODEL = "claude-haiku-4-5"

SYSTEM_PROMPT = """Je asistenti i Thrifted, nje marketplace online per rroba te dores se dyte ne Shqiperi.
Ndihmo klientet me pyetje rreth platformes: si te postojne produkte, si te bejne oferta,
si funksionon pagesa, dhe pyetje te pergjithshme rreth blerjes/shitjes se rrobave second-hand.
Pergjigju shkurt dhe qarte, ne shqip, me nje ton miqesor.Kur klienti kerkon rekomandime konkrete produktesh (p.sh. per keshilla outfiti), perdor funksionin search_products per te gjetur produkte reale nga stoku, dhe rekomandoi ato specifikisht (me titull dhe cmim)."""

MAX_HISTORY = 15

TOOLS = [
    {
        "name": "search_products",
        "description": "Kerkon produkte reale ne Thrifted...",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {"type": "string", "description": "..."},
                "max_price": {"type": "number", "description": "..."},
            },
            "required": [],
        },
    }
]


def _build_messages(messages: list[ChatMessage]) -> list[dict]:
    """Kufizon historine. System prompt-i kalohet vecmas si parametri `system`,
    jo si mesazh brenda listes (siç e ka Anthropic, ndryshe nga Groq/OpenAI-style)."""
    recent = messages[-MAX_HISTORY:]
    return [{"role": m.role, "content": m.content} for m in recent]


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
    claude = client.with_options(timeout=10.0)

    try:
        # Hapi 1: dergo mesazhin + menu-ne e funksioneve
        response = await claude.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=formatted_messages,
            tools=TOOLS,
        )
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="Jam pak i zene, provo perseri per pak sekonda")
    except anthropic.APIStatusError as e:
        raise HTTPException(status_code=502, detail=f"Gabim gjate komunikimit me Claude: {e.message}")
    except anthropic.APIConnectionError:
        raise HTTPException(status_code=502, detail="S'u arrit lidhja me Claude")

    tool_use_blocks = [block for block in response.content if block.type == "tool_use"]

    # Hapi 2: a kerkoi modeli te thirre nje funksion?
    if tool_use_blocks:
        formatted_messages.append({"role": "assistant", "content": response.content})

        tool_results = []
        for block in tool_use_blocks:
            if block.name == "search_products":
                try:
                    # Hapi 3: EKZEKUTIMI real (block.input eshte tashme dict, jo string JSON per parse)
                    results = search_products(db, **block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(results),
                    })
                except Exception as e:
                    # fail-secure: mos e lejo gabimin te "kaloje" pa u vene re
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": f"Gabim gjate kerkimit te produkteve: {str(e)}",
                        "is_error": True,
                    })

        # Hapi 4: kthe rezultatet mbrapsht te modeli si mesazh "user" me tool_result block-e
        formatted_messages.append({"role": "user", "content": tool_results})

        try:
            # Hapi 5: thirrje e dyte - modeli formulon pergjigjen finale me te dhenat reale
            final_response = await claude.messages.create(
                model=MODEL,
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=formatted_messages,
            )
        except anthropic.RateLimitError:
            raise HTTPException(status_code=429, detail="Jam pak i zene, provo perseri per pak sekonda")
        except anthropic.APIStatusError as e:
            raise HTTPException(status_code=502, detail=f"Gabim gjate komunikimit me Claude: {e.message}")
        except anthropic.APIConnectionError:
            raise HTTPException(status_code=502, detail="S'u arrit lidhja me Claude")

        return next((b.text for b in final_response.content if b.type == "text"), "")

    # Nese modeli s'kerkoi asnje funksion, kthe pergjigjen direkte
    return next((b.text for b in response.content if b.type == "text"), "")
