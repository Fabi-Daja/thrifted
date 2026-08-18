import os
import stripe
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_CURRENCY = os.getenv("STRIPE_CURRENCY", "eur")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
