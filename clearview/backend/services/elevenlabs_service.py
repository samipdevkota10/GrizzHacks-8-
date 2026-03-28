import base64
import httpx
from config import settings


class ElevenLabsService:
    BASE_URL = "https://api.elevenlabs.io/v1"

    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        self.voice_id = settings.ELEVENLABS_VERA_VOICE_ID
        self.agent_id = settings.ELEVENLABS_AGENT_ID

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


elevenlabs_service = ElevenLabsService()
