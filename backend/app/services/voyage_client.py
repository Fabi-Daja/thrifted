import base64
import os

import httpx
from fastapi import HTTPException

# Voyage AI - embeddings multimodale per 5.3 (visual search), shih §5.3 te
# docs/faza/faza-5-ai-features.md ("Vendimi per embeddings"). Perdor httpx
# (tashme varesi ekzistuese) direkt kunder API-t REST te tyre, jo SDK e re -
# nje thirrje e vetme s'ka nevoje per nje paketë shtese.
VOYAGE_API_URL = "https://api.voyageai.com/v1/multimodalembeddings"
VOYAGE_MODEL = "voyage-multimodal-3.5"

# Dimensioni real i vektorit qe kthen voyage-multimodal-3.5 - s'ka parametër
# "output_dimension" per kete endpoint (verifikuar kunder API reference-it
# zyrtar, ndryshe nga embeddings-et e tekstit te Voyage qe e kane) - eshte
# fiks, prandaj konfirmohet nje here me nje thirrje reale dhe mbahet konstante
# ketu (duhet te perputhet SAKTESISHT me `vector(N)` te migrimit Alembic).
EMBEDDING_DIMENSION = 1024


async def embed_image(image_bytes: bytes, media_type: str, input_type: str | None = None) -> list[float]:
    """Gjeneron embedding multimodal per nje foto.

    `input_type`: Voyage rekomandon dallimin `"document"` per fotot qe RUHEN
    (produktet ne katalog) dhe `"query"` per foton qe KERKON useri - permireson
    rezultatet e asymmetric retrieval (kerkim me nje lloj input kunder nje
    baze te indeksuar me tjetrin)."""
    api_key = os.getenv("VOYAGE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="VOYAGE_API_KEY s'eshte konfiguruar.")

    data_uri = f"data:{media_type};base64,{base64.b64encode(image_bytes).decode()}"
    payload = {
        "inputs": [{"content": [{"type": "image_base64", "image_base64": data_uri}]}],
        "model": VOYAGE_MODEL,
    }
    if input_type:
        payload["input_type"] = input_type

    async with httpx.AsyncClient(timeout=30.0) as http_client:
        try:
            response = await http_client.post(
                VOYAGE_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "content-type": "application/json"},
                json=payload,
            )
        except httpx.RequestError:
            raise HTTPException(status_code=502, detail="S'u arrit lidhja me Voyage AI")

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Gabim nga Voyage AI ({response.status_code}): {response.text[:300]}")

    body = response.json()
    embedding = body["data"][0]["embedding"]

    if len(embedding) != EMBEDDING_DIMENSION:
        # fail loudly - nese Voyage ndryshon dimensionin e defaultit, kolona
        # vector(N) e DB do te refuzonte insert-in gjithsesi; me mire te kapet
        # ketu me mesazh te qarte sesa te dale error kriptik nga psycopg2
        raise HTTPException(
            status_code=502,
            detail=(
                f"Voyage AI ktheu embedding me {len(embedding)} dimensione, "
                f"pritej {EMBEDDING_DIMENSION} - kontrollo EMBEDDING_DIMENSION "
                "dhe migrimin e tabeles product_image_embeddings."
            ),
        )

    return embedding
