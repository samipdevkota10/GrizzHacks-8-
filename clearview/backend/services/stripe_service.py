import stripe
from config import settings

if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    async def create_card(self, merchant_name: str, spending_limit: float, cardholder_id: str = "") -> dict:
        if not settings.STRIPE_SECRET_KEY:
            import random
            return {
                "id": f"ic_mock_{random.randint(100000, 999999)}",
                "last4": f"{random.randint(1000, 9999)}",
                "exp_month": 12,
                "exp_year": 2028,
            }
        card = stripe.issuing.Card.create(
            cardholder=cardholder_id or settings.STRIPE_CARDHOLDER_ID,
            currency="usd",
            type="virtual",
            spending_controls={
                "spending_limits": [{"amount": int(spending_limit * 100), "interval": "monthly"}],
            },
        )
        return {
            "id": card.id,
            "last4": card.last4,
            "exp_month": card.exp_month,
            "exp_year": card.exp_year,
        }

    async def pause_card(self, stripe_card_id: str) -> bool:
        if not settings.STRIPE_SECRET_KEY or not stripe_card_id:
            return True
        stripe.issuing.Card.modify(stripe_card_id, status="inactive")
        return True

    async def destroy_card(self, stripe_card_id: str) -> bool:
        if not settings.STRIPE_SECRET_KEY or not stripe_card_id:
            return True
        stripe.issuing.Card.modify(stripe_card_id, status="canceled")
        return True

    async def update_limit(self, stripe_card_id: str, new_limit: float) -> bool:
        if not settings.STRIPE_SECRET_KEY or not stripe_card_id:
            return True
        stripe.issuing.Card.modify(
            stripe_card_id,
            spending_controls={"spending_limits": [{"amount": int(new_limit * 100), "interval": "monthly"}]},
        )
        return True


stripe_service = StripeService()
