from dotenv import load_dotenv
load_dotenv()

from services.vector_store import search_memories, store_memory, get_memory_count

print("Count before:", get_memory_count())

# This will auto-recover the corrupt index then be empty
results = search_memories("Ramesh")
print("Search results after recovery:", results)

print("Count after search:", get_memory_count())


