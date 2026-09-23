import struct, json

with open(r'E:\app\bike_ce68d2f1.glb', 'rb') as f:
    data = f.read()

clen, ctype = struct.unpack('<II', data[12:20])
meta = json.loads(data[20:20+clen])
bin_offset = 20 + clen + 8

for i, prim in enumerate(meta['meshes'][0]['primitives']):
    mat = meta['materials'][prim['material']]
    acc_idx = meta['accessors'][prim['indices']]
    count = acc_idx['count']
    pos_acc = meta['accessors'][prim['attributes']['POSITION']]
    print(f"Prim {i}: {mat['name']} faces={count//3} color={mat['pbrMetallicRoughness'].get('baseColorFactor')}")
