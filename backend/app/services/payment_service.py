from decimal import Decimal

import stripe
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.stripe_config import FRONTEND_URL, STRIPE_CURRENCY
from app.models.bid import Bid
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.services import conversation_service, notification_service


def _to_stripe_amount(price) -> int:
    """Stripe pret shumën në njësinë më të vogël të monedhës (cent)."""
    return int(round(float(price) * 100))


def _create_session(*, buyer: User, product: Product, amount, metadata: dict) -> stripe.checkout.Session:
    try:
        return stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            customer_email=buyer.email,
            line_items=[{
                "price_data": {
                    "currency": STRIPE_CURRENCY,
                    "product_data": {"name": product.title},
                    "unit_amount": _to_stripe_amount(amount),
                },
                "quantity": 1,
            }],
            metadata=metadata,
            success_url=f"{FRONTEND_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/products/{product.id}?checkout=cancelled",
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Gabim gjatë komunikimit me Stripe: {e.user_message or str(e)}",
        )


def create_checkout_session_for_product(db: Session, product: Product, buyer: User) -> stripe.checkout.Session:
    """Krijon sesion Stripe Checkout për blerje me çmim fiks (buy-now)."""
    if not buyer.is_email_verified:
        raise HTTPException(status_code=403, detail="Duhet të verifikoni email-in para se të kryeni blerje.")

    if product.owner_id == buyer.id:
        raise HTTPException(status_code=400, detail="Nuk mund të blini produktin tuaj.")

    if product.selling_type == "offers_only":
        raise HTTPException(status_code=400, detail="Ky produkt shitet vetëm me oferta, jo me blerje direkte.")

    if product.status != "active":
        raise HTTPException(
            status_code=400,
            detail=f"Ky produkt nuk mund të blihet sepse është në statusin: {product.status}",
        )

    return _create_session(
        buyer=buyer,
        product=product,
        amount=product.price,
        metadata={"product_id": str(product.id), "buyer_id": str(buyer.id)},
    )


def create_checkout_session_for_bid(db: Session, bid: Bid, buyer: User) -> stripe.checkout.Session:
    """Krijon sesion Stripe Checkout për të paguar një ofertë të pranuar nga shitësi."""
    if bid.bidder_id != buyer.id:
        raise HTTPException(status_code=403, detail="Kjo ofertë nuk të përket.")

    if bid.status != "accepted":
        raise HTTPException(status_code=400, detail="Vetëm ofertat e pranuara nga shitësi mund të paguhen.")

    if not buyer.is_email_verified:
        raise HTTPException(status_code=403, detail="Duhet të verifikoni email-in para se të kryeni pagesën.")

    product = db.query(Product).filter(Product.id == bid.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produkti s'u gjet.")

    if product.status != "reserved":
        raise HTTPException(
            status_code=400,
            detail=f"Ky produkt nuk pret pagesë - statusi aktual: {product.status}",
        )

    existing_order = db.query(Order).filter(Order.product_id == product.id).first()
    if existing_order:
        raise HTTPException(status_code=400, detail="Ky produkt është paguar tashmë.")

    return _create_session(
        buyer=buyer,
        product=product,
        amount=bid.amount,
        metadata={"product_id": str(product.id), "buyer_id": str(buyer.id), "bid_id": str(bid.id)},
    )


def finalize_checkout_session(db: Session, session) -> Order:
    """
    Përfundon një sesion Stripe të paguar: krijon Order-in real dhe përditëson
    statuset e produktit/ofertës. Idempotente me qëllim — thirret edhe nga faqja
    e konfirmimit (rruga kryesore, sinkrone) edhe nga webhook-u i Stripe (rrjeti
    mbrojtës), kështu që një pagesë nuk duhet të prodhojë kurrë dy porosi.
    """
    if session.payment_status != "paid":
        raise HTTPException(status_code=400, detail="Pagesa nuk është konfirmuar ende.")

    # StripeObject (SDK v15+) s'ka .get() si dict normal — .to_dict() e kthen në dict të thjeshtë.
    metadata = session.metadata.to_dict() if session.metadata else {}
    product_id = metadata.get("product_id")
    buyer_id = metadata.get("buyer_id")
    bid_id = metadata.get("bid_id")

    if not product_id or not buyer_id:
        raise HTTPException(status_code=400, detail="Sesioni i pagesës s'ka të dhëna të vlefshme.")

    existing_order = db.query(Order).filter(Order.product_id == product_id).first()
    if existing_order:
        return existing_order

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produkti s'u gjet.")

    try:
        new_order = Order(
            product_id=product.id,
            buyer_id=buyer_id,
            seller_id=product.owner_id,
            final_price=Decimal(session.amount_total) / 100,
            status="completed",
        )
        db.add(new_order)
        product.status = "sold"

        if bid_id:
            bid = db.query(Bid).filter(Bid.id == bid_id).first()
            if bid:
                bid.status = "accepted"

        # çdo ofertë tjetër në pritje për këtë produkt s'ka më kuptim pasi u shit
        other_bids = db.query(Bid).filter(
            Bid.product_id == product.id,
            Bid.status == "pending",
        ).all()
        for other_bid in other_bids:
            other_bid.status = "rejected"

        notification_service.notify_order_paid(db, new_order, product)

        conversation = conversation_service.get_or_create_conversation(db, product.id, buyer_id)
        conversation_service.send_message(
            db, conversation, product.owner_id, content="🎉 Blerja u finalizua! Kontakto për dërgesën."
        )

        db.commit()
        db.refresh(new_order)
        return new_order

    except IntegrityError:
        # Race condition: dy pagesa u konfirmuan pothuajse njëkohësisht për të
        # njëjtin produkt (webhook + faqja e konfirmimit, p.sh.).
        db.rollback()
        existing_order = db.query(Order).filter(Order.product_id == product_id).first()
        if existing_order:
            return existing_order
        raise HTTPException(status_code=409, detail="Ky produkt u shit tashmë.")
