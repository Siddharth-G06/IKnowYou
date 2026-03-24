"""
Run this once to nuke the corrupt ChromaDB collection.
Stop your uvicorn backend first, then run:
    .\\venv\\Scripts\\python reset_chroma.py
"""
from dotenv import load_dotenv
load_dotenv()

import os
import shutil

persist_dir = os.getenv("CHROMA_PERSIST_DIR", "../data/chroma")
abs_dir = os.path.abspath(persist_dir)
print(f"Chroma persist dir: {abs_dir}")

import chromadb

client = chromadb.PersistentClient(path=abs_dir)

# List existing collections
cols = client.list_collections()
print("Existing collections:", [c.name for c in cols])

# Delete the corrupt collection
try:
    client.delete_collection("kinledger_memories")
    print("Deleted 'kinledger_memories' collection.")
except Exception as e:
    print(f"Could not delete (may not exist): {e}")

# Recreate fresh
col = client.get_or_create_collection("kinledger_memories")
print(f"Fresh collection created. count={col.count()}")
print("Done! Now restart the backend and re-add your memories.")
