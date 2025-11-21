import json
from typing import Any, Dict

import requests


def main() -> None:
    url = "http://127.0.0.1:8000/generate"

    payload: Dict[str, Any] = {
        "agent": "funnel",  # expects ../agents/funnel.txt
        "messages": [
            {
                "role": "user",
                "content": "Help me outline a basic funnel for an online course about productivity.",
            }
        ],
    }

    print("POST", url)
    print("Payload:")
    print(json.dumps(payload, indent=2))

    resp = requests.post(url, json=payload, timeout=60)
    print("\nStatus:", resp.status_code)
    try:
        data = resp.json()
    except Exception:
        print("Non-JSON response body:")
        print(resp.text)
        return

    print("\nJSON response:")
    print(json.dumps(data, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
