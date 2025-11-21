import json
import logging
import os
from pathlib import Path
from typing import List, Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI, OpenAIError
from pydantic import BaseModel, Field, validator

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("py_ai_service")

SAFETY_ADDENDUM = (
    """IMPORTANT: Never invent promotions, discounts, sales, seasonal events, or generic retail offers unless the user explicitly requested promotional copy. Keep responses relevant, concise, and focused on the agent's domain. If uncertain, ask for clarification."""
)

PROMO_HALLUCINATION_KEYWORDS = [
    "sale",
    "discount",
    "spring",
    "black friday",
    "buy now",
    "shop now",
    "limited time",
    "free gift",
]

PROMO_INTENT_KEYWORDS = [
    "promo",
    "promotion",
    "promotional",
    "campaign",
    "ad copy",
    "ads",
    "facebook ads",
    "instagram ads",
    "sale",
    "discount",
    "offer",
    "launch",
    "black friday",
    "cyber monday",
]

class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class GenerateRequest(BaseModel):
    agent: str = Field(..., description="Name of the agent file (without .txt) located in ../agents")
    messages: List[ChatMessage]

    @validator("agent")
    def agent_must_not_be_empty(cls, v: str) -> str:  # noqa: N805
        v = v.strip()
        if not v:
            raise ValueError("agent must not be empty")
        if any(ch in v for ch in ("/", "\\", "..")):
            raise ValueError("invalid agent name")
        return v

class GenerateResponse(BaseModel):
    reply: str

def get_client() -> OpenAI:
    api_key = os.getenv("PY_OPENAI_KEY")
    if not api_key:
        raise RuntimeError("PY_OPENAI_KEY environment variable is not set")

    base_url = os.getenv("PY_OPENAI_BASE_URL")

    if base_url:
        return OpenAI(api_key=api_key, base_url=base_url)
    # Default: standard OpenAI-compatible URL
    return OpenAI(api_key=api_key)

def load_system_prompt(agent: str) -> str:
    agents_dir = Path(__file__).resolve().parent.parent / "agents"
    prompt_path = agents_dir / f"{agent}.txt"

    if not prompt_path.is_file():
        raise FileNotFoundError(f"Agent prompt file not found for agent '{agent}'")

    base_prompt = prompt_path.read_text(encoding="utf-8").strip()
    if base_prompt:
        full_prompt = f"{base_prompt}\n\n{SAFETY_ADDENDUM}"
    else:
        full_prompt = SAFETY_ADDENDUM
    return full_prompt

def user_asked_for_promotions(messages: List[ChatMessage]) -> bool:
    for msg in messages:
        if msg.role != "user":
            continue
        lower = msg.content.lower()
        if any(keyword in lower for keyword in PROMO_INTENT_KEYWORDS):
            return True
    return False

def contains_promo_hallucination(text: str) -> bool:
    lower = text.lower()
    return any(keyword in lower for keyword in PROMO_HALLUCINATION_KEYWORDS)

def build_messages(system_prompt: str, original_messages: List[ChatMessage]) -> List[dict]:
    messages: List[dict] = [
        {"role": "system", "content": system_prompt},
    ]
    for m in original_messages:
        messages.append({"role": m.role, "content": m.content})
    return messages

def get_model_settings() -> tuple[str, float, int]:
    model = os.getenv("PY_AI_MODEL", "gpt-4o-mini")

    # Deterministic defaults per requirements
    try:
        temperature_env = os.getenv("PY_AI_TEMPERATURE")
        temperature: float = float(temperature_env) if temperature_env is not None else 0.1
    except ValueError:
        temperature = 0.1

    try:
        max_tokens_env = os.getenv("PY_AI_MAX_TOKENS")
        max_tokens: int = int(max_tokens_env) if max_tokens_env is not None else 800
    except ValueError:
        max_tokens = 800

    return model, temperature, max_tokens

PROMO_FALLBACK_MESSAGE = (
    """The AI output appears unrelated to your request. Please clarify what you need or ask specifically for promotional/campaign copy."""
)

app = FastAPI(title="Marketa Python AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health() -> dict:
    return {"status": "ok"}

@app.post("/generate", response_model=GenerateResponse)
def generate(request: GenerateRequest) -> GenerateResponse:
    try:
        system_prompt = load_system_prompt(request.agent)
    except FileNotFoundError as exc:
        logger.warning("Agent file missing", extra={"agent": request.agent})
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to load system prompt")
        raise HTTPException(status_code=500, detail="Failed to load system prompt") from exc

    client = get_client()
    model, temperature, max_tokens = get_model_settings()

    messages_payload = build_messages(system_prompt, request.messages)

    logger.info(
        "AI request payload",
        extra={
            "agent": request.agent,
            "model": model,
            "messages": [
                {"role": m["role"], "content": m["content"][:500]}  # truncate for logs
                for m in messages_payload
            ],
        },
    )

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=messages_payload,
            temperature=temperature,
            max_tokens=max_tokens,
        )
    except OpenAIError as exc:
        logger.exception("OpenAI / OpenRouter API error")
        raise HTTPException(status_code=502, detail="AI provider error") from exc
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Unexpected error during AI call")
        raise HTTPException(status_code=500, detail="Unexpected AI error") from exc

    reply_text: Optional[str] = None
    try:
        reply_text = completion.choices[0].message.content if completion.choices else ""
    except Exception:  # pragma: no cover - defensive
        reply_text = ""

    if reply_text is None:
        reply_text = ""

    user_intends_promo = user_asked_for_promotions(request.messages)
    triggered_promo = contains_promo_hallucination(reply_text)

    final_reply = reply_text
    if triggered_promo and not user_intends_promo:
        final_reply = PROMO_FALLBACK_MESSAGE

    log_record = {
        "agent": request.agent,
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "messages": messages_payload,
        "raw_reply": reply_text,
        "final_reply": final_reply,
        "promo_triggered": triggered_promo,
        "user_intends_promo": user_intends_promo,
    }
    logger.info("AI full payload", extra={"payload": json.dumps(log_record, ensure_ascii=False)})

    return GenerateResponse(reply=final_reply)
