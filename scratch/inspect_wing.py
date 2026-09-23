import struct, json
data = open('backend/assets/3d/7168fe58-2b4f-4ebb-9dd9-b9358cfaf412.glb', 'rb').read()
clen, ctype = struct.unpack('<II', data[12:20])
meta = json.loads(data[20:20+clen])
bin_data = data[20+clen+8:]
prim = meta['meshes'][0]['primitives'][3] # MainWings_3
acc = meta['accessors'][prim['indices']]
bv = meta['bufferViews'][acc['bufferView']]
offset = bv['byteOffset'] + acc.get('byteOffset', 0)
idx_bytes = bin_data[offset:offset+acc['count']*4]
indices = struct.unpack(f"<{acc['count']}I", idx_bytes)
pos_bv = meta['bufferViews'][1]
pos_bytes = bin_data[pos_bv['byteOffset']:pos_bv['byteOffset']+pos_bv['byteLength']]
verts = [struct.unpack('<3f', pos_bytes[i*12:(i+1)*12]) for i in range(len(pos_bytes)//12)]
print('MainWings vertex indices:', indices)
for f in range(len(indices)//3):
    i0, i1, i2 = indices[f*3], indices[f*3+1], indices[f*3+2]
    print(f'Face {f}: ({i0}, {i1}, {i2})')
