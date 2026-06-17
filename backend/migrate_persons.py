import sys
sys.path.append('.')
from db.neo4j_client import run_query
from services import vector_store
from datetime import datetime, timezone
import uuid

rows = run_query('MATCH (p:Person) RETURN p')
count = 0
for row in rows:
    p = row['p']
    pid = p['id']
    name = p['name']
    notes = p.get('notes', '')
    tags = p.get('tags', [])
    categories = p.get('categories', [])
    all_tags = set(tags + categories)
    
    mem_query = "MATCH (m:Memory) MATCH (p:Person {id: $pid})-[:MENTIONED_IN]->(m) WHERE m.raw_text STARTS WITH 'I added' RETURN m.id LIMIT 1"
    res = run_query(mem_query, {'pid': pid})
    if not res and name != 'I' and name != 'KEC':
        mem_id = str(uuid.uuid4())
        mem_text = f'I added {name} to my network.'
        if all_tags:
            mem_text += f' Categories: {", ".join(all_tags)}.'
        if notes:
            mem_text += f' Notes: {notes}'
            
        q = '''
            CREATE (m:Memory {
                id: $mem_id,
                raw_text: $mem_text,
                created_at: $now
            })
            WITH m
            MATCH (p:Person {id: $pid})
            MERGE (p)-[:MENTIONED_IN]->(m)
        '''
        
        run_query(q, {
            'mem_id': mem_id,
            'mem_text': mem_text,
            'now': datetime.now(timezone.utc).isoformat(),
            'pid': pid
        })
        
        metadata = {'person_ids': [pid], 'created_at': datetime.now(timezone.utc).isoformat()}
        vector_store.store_memory(mem_id, mem_text, metadata)
        count += 1

print(f'Migrated {count} persons into searchable memories.')
