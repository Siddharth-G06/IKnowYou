from db.neo4j_client import run_query, close_driver
from dotenv import load_dotenv
import os

load_dotenv()

# Point to 127.0.0.1 if needed
os.environ["NEO4J_URI"] = "bolt://127.0.0.1:7687"

# Clean up duplicate relationships: only keep the newest one for each from/to pair
print("Starting database cleanup...")
try:
    # This query finds duplicate RELATED_TO between the same persons, 
    # collects all but one, and deletes the duplicates.
    res = run_query("""
    MATCH (f:Person)-[r:RELATED_TO]->(t:Person)
    WITH f, t, collect(r) AS rels, count(r) AS c
    WHERE c > 1
    UNWIND rels[1..] AS dup
    DELETE dup
    RETURN count(dup) AS deleted_count
    """)
    if res:
        print(f"Deleted {res[0].get('deleted_count', 0)} duplicate relationships.")
    else:
        print("No duplicate relationships found.")
except Exception as e:
    print(f"Error during cleanup: {e}")
finally:
    close_driver()
    print("Cleanup finished.")
