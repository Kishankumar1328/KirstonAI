import asyncio
from openai import AsyncOpenAI
from app.core.config import settings

async def main():
    api_key = settings.NVIDIA_API_KEY.strip('"').strip("'")
    client = AsyncOpenAI(api_key=api_key, base_url=settings.NVIDIA_BASE_URL)
    
    models_to_test = [
        "meta/llama-3.2-11b-vision-instruct",
        "meta/llama-3.2-90b-vision-instruct",
        "nvidia/nemotron-4-340b-instruct",
        "meta/llama3-70b-instruct",
        "deepseek-ai/deepseek-r1"
    ]

    for model in models_to_test:
        try:
            res = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": "Hello! Reply with 'OK'"}]
            )
            print(f"SUCCESS model '{model}': {res.choices[0].message.content.strip()[:100]}")
        except Exception as e:
            print(f"FAILED model '{model}': {e}")

if __name__ == "__main__":
    asyncio.run(main())
