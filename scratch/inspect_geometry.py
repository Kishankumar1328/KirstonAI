import struct, json

path = r'backend/assets/3d/7168fe58-2b4f-4ebb-9dd9-b9358cfaf412.glb'
data = open(path, 'rb').read()

clen, ctype = struct.unpack('<II', data[12:20])
meta = json.loads(data[20:20+clen])
bin_data = data[20+clen+8:]

def get_buffer(bv_idx):
    bv = meta['bufferViews'][bv_idx]
    start = bv['byteOffset']
    end = start + bv['byteLength']
    return bin_data[start:end]

pos_bv = meta['accessors'][0]['bufferView']
pos_bytes = get_buffer(pos_bv)
vertices = [struct.unpack('<3f', pos_bytes[i*12:(i+1)*12]) for i in range(len(pos_bytes)//12)]

norm_bv = meta['accessors'][1]['bufferView']
norm_bytes = get_buffer(norm_bv)
normals = [struct.unpack('<3f', norm_bytes[i*12:(i+1)*12]) for i in range(len(norm_bytes)//12)]

print(f"Total vertices: {len(vertices)}")

for prim_idx, prim in enumerate(meta['meshes'][0]['primitives']):
    mat_name = meta['materials'][prim['material']]['name']
    acc = meta['accessors'][prim['indices']]
    idx_bv = acc['bufferView']
    offset = acc.get('byteOffset', 0)
    count = acc['count']
    idx_bytes = get_buffer(idx_bv)[offset:offset+count*4]
    indices = struct.unpack(f'<{count}I', idx_bytes)
    
    print(f"\nPrim {prim_idx} ({mat_name}): index range [{min(indices)}, {max(indices)}], count={count}")
    # Check first 2 faces
    for f in range(min(2, count//3)):
        i0, i1, i2 = indices[f*3], indices[f*3+1], indices[f*3+2]
        print(f"  Face {f}: idx=({i0}, {i1}, {i2})")
        print(f"    v0={vertices[i0]} norm={normals[i0]}")
        print(f"    v1={vertices[i1]} norm={normals[i1]}")
        print(f"    v2={vertices[i2]} norm={normals[i2]}")
