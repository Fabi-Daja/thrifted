from uuid import UUID

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.stripe_config import STRIPE_WEBHOOK_SECRET
from app.models.bid import Bid
from app.models.user import User
from app.schemas.order import OrderRead
from app.schemas.payment import CheckoutSessionResponse
from app.services import payment_service

router = APIRouter(tags=["Payments"])


@router.post(
    "/bids/{bid_id}/checkout-session",
    response_model=CheckoutSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_bid_checkout_session(
    bid_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fillon pagesën reale për një ofertë që shitësi e ka pranuar tashmë."""
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oferta s'u gjet.")

    session = payment_service.create_checkout_session_for_bid(db, bid, current_user)
    return CheckoutSessionResponse(checkout_url=session.url, session_id=session.id)


@router.get("/payments/session/{session_id}/confirm", response_model=OrderRead)
def confirm_checkout_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Thirret nga faqja e suksesit (frontend) pas kthimit nga Stripe. Kjo është
    rruga kryesore, sinkrone, për të finalizuar porosinë menjëherë - pa u
    mbështetur vetëm te webhook-u, që në dev lokal kërkon `stripe listen`.
    """
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.error.StripeError:
        raise HTTPException(status_code=404, detail="Sesioni i pagesës s'u gjet.")

    # StripeObject (SDK v15+) s'ka .get() si dict normal — .to_dict() e kthen në dict të thjeshtë.
    metadata = session.metadata.to_dict() if session.metadata else {}
    if metadata.get("buyer_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Ky sesion pagese s'të përket.")

    return payment_service.finalize_checkout_session(db, session)


@router.post("/webhooks/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint që e thërret vetë Stripe (jo frontend-i) kur ndodh një event pagese.
    Shërben si rrjet mbrojtës: konfirmon porosinë edhe nëse blerësi mbyll tab-in
    e browser-it para se të kthehet te faqja e suksesit.
    """
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Webhook-u i Stripe s'është konfiguruar në server.")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Firma e webhook-ut është e pavlefshme.")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        payment_service.finalize_checkout_session(db, session)

    return {"received": True}
