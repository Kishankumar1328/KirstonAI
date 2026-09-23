import asyncio
import base64
from openai import AsyncOpenAI
from app.core.config import settings

async def main():
    api_key = settings.NVIDIA_API_KEY.strip('"').strip("'")
    client = AsyncOpenAI(api_key=api_key, base_url=settings.NVIDIA_BASE_URL)

    # 1x1 transparent PNG pixel base64 for testing vision endpoint format
    dummy_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What is in this image? Answer briefly."},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{dummy_b64}"
                    }
                }
            ]
        }
    ]

    try:
        res = await client.chat.completions.create(
            model="meta/llama-3.2-11b-vision-instruct",
            messages=messages,
            max_tokens=100
        )
        print("VISION API SUCCESS:", res.choices[0].message.content)
    except Exception as e:
        print("VISION API ERROR:", e)

if __name__ == "__main__":
    asyncio.run(main())
