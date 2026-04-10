import sys
sys.path.append('c:/Users/SIDDHARTH/Documents/IKnowYou/backend')
from routes.relationships import create_relationship
from models.relationship import RelationshipCreate
try:
    rel = RelationshipCreate(from_person_id="1", to_person_id="2", relation_type="friend")
    res = create_relationship(rel)
    print("SUCCESS:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
