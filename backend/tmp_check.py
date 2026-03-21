import sys
sys.path.append('c:/Users/SIDDHARTH/Documents/IKnowYou/backend')
from db.neo4j_client import run_query
print(run_query("MATCH ()-[r:RELATED_TO]->() RETURN r, r.id as id, r.relation_type as type, type(r) as type_r LIMIT 1"))
