import logging
import base64
import httpx
from config import settings

logger = logging.getLogger(__name__)


class ElevenLabsService:
    BASE_URL = "https://api.elevenlabs.io/v1"

    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        self.voice_id = settings.ELEVENLABS_VERA_VOICE_ID
        self.agent_id = settings.ELEVENLABS_AGENT_ID
        self.phone_number_id = settings.ELEVENLABS_PHONE_NUMBER_ID

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def text_to_speech(self, text: str) -> dict:
        if not self.is_configured:
            return {"audio_base64": "", "duration_seconds": 0, "mock": True}

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/text-to-speech/{self.voice_id}",
                headers={
                    "xi-api-key": self.api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "model_id": "eleven_turbo_v2_5",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.8,
                        "style": 0.3,
                    },
                },
                timeout=30.0,
            )
            response.raise_for_status()
            audio_bytes = response.content
            audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
            duration = len(audio_bytes) / (24000 * 2)
            return {
                "audio_base64": audio_b64,
                "duration_seconds": round(duration, 1),
            }

    async def get_signed_url(self) -> dict:
        if not self.is_configured or not self.agent_id:
            return {"url": "", "mock": True}

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/convai/conversation/get_signed_url",
                params={"agent_id": self.agent_id},
                headers={"xi-api-key": self.api_key},
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()
            return {"url": data.get("signed_url", "")}

    @property
    def can_make_calls(self) -> bool:
        return bool(self.api_key and self.agent_id and self.phone_number_id)

    async def initiate_outbound_call(
        self,
        to_number: str,
        prompt_override: str,
        first_message: str | None = None,
    ) -> dict:
        """Initiate an outbound phone call via ElevenLabs + Twilio.

        Returns the ElevenLabs response containing ``conversation_id``
        and ``callSid``, or a mock dict if credentials are missing.
        """
        if not self.can_make_calls:
            logger.warning("ElevenLabs outbound call skipped — missing credentials")
            return {
                "success": False,
                "message": "Outbound calling not configured",
                "mock": True,
            }

        agent_override: dict = {"prompt": {"prompt": prompt_override}}
        if first_message:
            agent_override["first_message"] = first_message

        payload = {
            "agent_id": self.agent_id,
            "agent_phone_number_id": self.phone_number_id,
            "to_number": to_number,
            "conversation_initiation_client_data": {
                "conversation_config_override": {
                    "agent": agent_override,
                }
            },
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/convai/twilio/outbound-call",
                headers={
                    "xi-api-key": self.api_key,
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=15.0,
            )
            response.raise_for_status()
            data = response.json()
            logger.info("Outbound call initiated: %s", data)
            return data


elevenlabs_service = ElevenLabsService()
