# Marketa Python AI Microservice

This directory contains a standalone Python AI microservice that mirrors the behavior of the Node `aiService.js` backend.

- Framework: FastAPI
- Endpoint: `GET /health`, `POST /generate`
- Model provider: OpenAI / OpenRouter-compatible API via the official `openai` Python client
- System prompts are loaded from `../agents/<agent>.txt`

The service can run independently (Node is **not** required) and exposes a simple JSON interface:

```json
{
  "reply": "<text>"
}
```

## 1. Setup & Run Locally

From the repo root, change into this directory:

```bash
cd Server/py_ai_service
```

### 1.1. Install dependencies

```bash
pip install -r requirements.txt
```

### 1.2. Environment variables

Copy the example file and edit it with your values:

```bash
cp .env.example .env
```

The key variables are:

- `PY_OPENAI_KEY` – your API key (OpenAI or OpenRouter).
- `PY_OPENAI_BASE_URL` – optional custom base URL for OpenRouter, e.g. `https://openrouter.ai/api/v1`.
- `PY_AI_MODEL` – model name, default `gpt-4o-mini`.
- `PY_AI_TEMPERATURE` – temperature, default `0.1`.
- `PY_AI_MAX_TOKENS` – max tokens, default `800`.

Make sure your shell loads the `.env` file. One simple way during development is to use a tool like `direnv` or to export variables manually before running uvicorn.

### 1.3. Run the FastAPI app with uvicorn

```bash
uvicorn ai_service:app --host 0.0.0.0 --port 8000
```

The health check is then available at:

```bash
curl http://127.0.0.1:8000/health
```

### 1.4. Test the /generate endpoint locally

With the server running, in another terminal (still in `Server/py_ai_service`):

```bash
python test_local_request.py
```

This script sends a sample `POST /generate` request using the `funnel` agent (expects `../agents/funnel.txt` to exist) and prints the JSON response.

## 2. Running via Docker

### 2.1. Build the image

From `Server/py_ai_service`:

```bash
docker build -t marketa-py-ai-service .
```

### 2.2. Run the container

Pass the necessary environment variables. For example, with OpenRouter:

```bash
docker run --rm -p 8000:8000 \
  -e PY_OPENAI_KEY=your_key_here \
  -e PY_OPENAI_BASE_URL=https://openrouter.ai/api/v1 \
  -e PY_AI_MODEL=gpt-4o-mini \
  -e PY_AI_TEMPERATURE=0.1 \
  -e PY_AI_MAX_TOKENS=800 \
  marketa-py-ai-service
```

The API will be available at `http://127.0.0.1:8000` on your host.

## 3. Uvicorn helper script

This directory includes a small convenience script:

```bash
./uvicorn_start.sh
```

If you are on a Unix-like system and it is not executable yet, run:

```bash
chmod +x uvicorn_start.sh
```

This simply runs:

```bash
uvicorn ai_service:app --host 0.0.0.0 --port 8000
```

## 4. Request/Response format

### 4.1. Request body for `POST /generate`

```json
{
  "agent": "funnel",
  "messages": [
    { "role": "user", "content": "Your question or instructions" }
  ]
}
```

- `agent` corresponds to `../agents/<agent>.txt`.
- `messages` is a standard Chat-style array of `{role, content}` items.

### 4.2. Response body

```json
{
  "reply": "Generated text here"
}
```

If the model produces unrelated promotional content (e.g., generic sales, discounts) when the user did **not** ask for promotional copy, the service will instead return a safe clarification message:

```text
The AI output appears unrelated to your request. Please clarify what you need or ask specifically for promotional/campaign copy.
