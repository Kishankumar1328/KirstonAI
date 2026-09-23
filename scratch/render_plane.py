import struct, json
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection

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

fig = plt.figure(figsize=(10, 8))
ax = fig.add_subplot(111, projection='3d')

for prim_idx, prim in enumerate(meta['meshes'][0]['primitives']):
    mat = meta['materials'][prim['material']]
    color = mat['pbrMetallicRoughness'].get('baseColorFactor', [0.7, 0.7, 0.7, 1.0])
    acc = meta['accessors'][prim['indices']]
    idx_bv = acc['bufferView']
    offset = acc.get('byteOffset', 0)
    count = acc['count']
    idx_bytes = get_buffer(idx_bv)[offset:offset+count*4]
    indices = struct.unpack(f'<{count}I', idx_bytes)
    
    triangles = []
    for f in range(count // 3):
        i0, i1, i2 = indices[f*3], indices[f*3+1], indices[f*3+2]
        triangles.append([vertices[i0], vertices[i1], vertices[i2]])
    
    poly = Poly3DCollection(triangles, alpha=1.0, facecolor=color[:3], edgecolor='k', linewidths=0.2)
    ax.add_collection3d(poly)

ax.set_xlim([-2.5, 2.5])
ax.set_ylim([-2.5, 2.5])
ax.set_zlim([-2.5, 2.5])
ax.view_init(elev=25, azim=-60)
plt.title("Rendered 7168fe58 Airplane")
plt.savefig(r'scratch/rendered_plane.png', dpi=150)
print("Saved scratch/rendered_plane.png successfully!")
