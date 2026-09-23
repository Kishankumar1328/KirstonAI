import struct, json

path = r'backend/assets/3d/7168fe58-2b4f-4ebb-9dd9-b9358cfaf412.glb'
data = open(path, 'rb').read()

clen, ctype = struct.unpack('<II', data[12:20])
meta = json.loads(data[20:20+clen])

print("Materials:")
for i, m in enumerate(meta.get('materials', [])):
    print(f"  Mat {i}: {m}")

print("\nPrimitives:")
for i, p in enumerate(meta['meshes'][0]['primitives']):
    acc = meta['accessors'][p['indices']]
    mat = meta['materials'][p['material']]['name']
    mode = p.get('mode', 4)
    print(f"  Prim {i}: {mat}, mode={mode}, index_count={acc['count']}")
