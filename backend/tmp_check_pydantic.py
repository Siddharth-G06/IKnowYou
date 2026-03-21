import sys
sys.path.append('c:/Users/SIDDHARTH/Documents/IKnowYou/backend')
from routes.relationships import list_relationships
from models.relationship import RelationshipResponse

data = list_relationships()
try:
    for item in data:
        RelationshipResponse(**item)
    print("Pydantic validation passed.")
except Exception as e:
    import traceback
    traceback.print_exc()
