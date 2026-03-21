import sys
sys.path.append('c:/Users/SIDDHARTH/Documents/IKnowYou/backend')
from routes.relationships import list_relationships
try:
    with open('tmp_debug.txt', 'w', encoding='utf-8') as f:
        f.write(str(list_relationships()))
except Exception as e:
    import traceback
    with open('tmp_debug.txt', 'w', encoding='utf-8') as f:
        traceback.print_exc(file=f)
