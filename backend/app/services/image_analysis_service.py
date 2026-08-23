import base64

import anthropic
from fastapi import HTTPException

from app.core.ai_client import client, MODEL

# US-50 (§5.2, faza-5-ai-features.md). Vendim: perdor Claude (i njejti provider
# si 5.1) per konsistence - mbeshtet vision, s'kerkon provider te dyte/kredenciale
# shtese. Zero-shot, s'kerkon trajnim modeli.
SYSTEM_PROMPT = """Je nje asistent qe analizon foto artikujsh second-hand per Thrifted,
nje marketplace shqiptar per rroba te dores se dyte. Kur te jepet nje ose disa foto
te te njejtit artikull, sugjero fushat per listimin e produktit duke therritur
gjithmone tool-in suggest_product_fields.

Nese fotoja/fotot jane te paqarta, kane drite/kend te keq qe s'lejon identifikim
te sigurt, OSE tregojne me shume se nje artikull te vetem (p.sh. disa rroba te
ndryshme ne te njejten foto), vendos is_clear_single_item=false dhe MOS PLOTESO
fushat e tjera (title/category/brand/etj.) me hamendje - lëri bosh. Kjo eshte
kerkese e rendesishme sigurie/cilesie, jo formalitet.

Kur fotoja eshte e qarte, jep vleresimin tend me te mire per çdo fushe, por
gjithmone theksoje (nepermjet fushes confidence) sa i sigurt je - keto jane
VETEM sugjerime, useri i sheh dhe i ndryshon te gjitha para se te publikoje."""

_ANALYSIS_TOOL = {
    "name": "suggest_product_fields",
    "description": "Regjistron fushat e sugjeruara te produktit bazuar ne foton(t) e dhena.",
    "input_schema": {
        "type": "object",
        "properties": {
            "is_clear_single_item": {
                "type": "boolean",
                "description": "false nese fotoja eshte e paqarte, ka shume artikuj, ose s'identifikon nje veshje/aksesor te vetem me siguri te arsyeshme.",
            },
            "title": {"type": "string", "description": "Titull i shkurter per listim (p.sh. 'Xhup Levi's blu, madhesia M')."},
            "category": {"type": "string", "description": "Kategoria e artikullit (p.sh. 'xhinse', 'kepuce', 'xhup')."},
            "brand": {"type": "string", "description": "Marka, nese e dallueshme (etikete/logo)."},
            "color": {"type": "string", "description": "Ngjyra kryesore."},
            "condition_rating": {
                "type": "integer",
                "minimum": 1,
                "maximum": 5,
                "description": "Gjendja e sugjeruar 1 (e keqe) deri 5 (si e re), bazuar ne shenja te dukshme perdorimi.",
            },
            "description": {"type": "string", "description": "Pershkrim i shkurter per listim (2-3 fjali)."},
            "price_suggestion_min": {"type": "number", "description": "Vleresim i pergjithshem çmimi minimal (euro) - orientues, jo i bazuar ne krahasime reale."},
            "price_suggestion_max": {"type": "number", "description": "Vleresim i pergjithshem çmimi maksimal (euro)."},
            "confidence": {
                "type": "string",
                "enum": ["e larte", "e mesme", "e ulet"],
                "description": "Sa i sigurt je ne sugjerimet e mesiperme.",
            },
        },
        "required": ["is_clear_single_item", "confidence"],
    },
}

_SUPPORTED_MEDIA_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


def _to_result(tool_input: dict) -> dict:
    """I ndare nga thirrja e Claude-it PER QELLIM TESTIMI - kjo logjike (rasti
    'i paqarte' -> fusha bosh) mund te testohet pa asnje thirrje reale API."""
    if not tool_input.get("is_clear_single_item", False):
        return {
            "title": None,
            "category": None,
            "brand": None,
            "color": None,
            "condition_rating": None,
            "description": None,
            "price_suggestion_min": None,
            "price_suggestion_max": None,
            "confidence": "e ulet",
            "note": "Fotoja eshte e paqarte ose duket se ka me shume se nje artikull - plotesoji fushat vete.",
        }

    return {
        "title": tool_input.get("title"),
        "category": tool_input.get("category"),
        "brand": tool_input.get("brand"),
        "color": tool_input.get("color"),
        "condition_rating": tool_input.get("condition_rating"),
        "description": tool_input.get("description"),
        "price_suggestion_min": tool_input.get("price_suggestion_min"),
        "price_suggestion_max": tool_input.get("price_suggestion_max"),
        "confidence": tool_input.get("confidence", "e ulet"),
        "note": "Fushat jane vetem sugjerime nga AI - kontrolloji dhe ndryshoji lirisht para se te publikosh.",
    }


async def analyze_product_images(images: list[tuple[bytes, str]]) -> dict:
    """`images`: liste (bytes, media_type) - njesoj si foto te ngarkuara per nje
    produkt te ri (Faza 1), thjesht PARA se produkti te ekzistoje ende (nuk ka
    product_id, sepse qellimi eshte te parapopulloje formen 'Create Product')."""
    if not images:
        raise HTTPException(status_code=400, detail="Duhet te dergosh te pakten nje foto.")

    content = []
    for data, media_type in images:
        if media_type not in _SUPPORTED_MEDIA_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Formati '{media_type}' s'mbeshtetet. Perdor JPEG, PNG, GIF ose WEBP.",
            )
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": media_type, "data": base64.b64encode(data).decode()},
        })

    content.append({
        "type": "text",
        "text": "Analizo kete/keto foto artikulli second-hand dhe therrit suggest_product_fields.",
    })

    try:
        response = await client.with_options(timeout=20.0).messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": content}],
            tools=[_ANALYSIS_TOOL],
            tool_choice={"type": "tool", "name": "suggest_product_fields"},
        )
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="Jam pak i zene, provo perseri per pak sekonda")
    except anthropic.APIStatusError as e:
        raise HTTPException(status_code=502, detail=f"Gabim gjate komunikimit me Claude: {e.message}")
    except anthropic.APIConnectionError:
        raise HTTPException(status_code=502, detail="S'u arrit lidhja me Claude")

    tool_use = next((block for block in response.content if block.type == "tool_use"), None)
    if not tool_use:
        # fail-secure: nese modeli s'ktheu tool_use (s'duhet te ndodhe me tool_choice
        # te detyruar, por mos e supozo kurre) - trajtoje si "foto e paqarte"
        return _to_result({"is_clear_single_item": False})

    return _to_result(tool_use.input)
