import asyncio
import httpx

MEMORIES = [
    "Had lunch with my amma and anna today. Amma made rasam rice.",
    "Called up Priya. She mentioned her dada is visiting from Coimbatore.",
    "Team meeting with Karthik and Suresh. Karthik is my manager.",
    "My chithappa called. He's coming for Diwali with his family.",
]

async def seed():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        for content in MEMORIES:
            resp = await client.post("/api/memories/", json={"content": content})
            print(f"Seeded: {resp.json()}")

if __name__ == "__main__":
    asyncio.run(seed())
