# Slims a downloaded fish GLB for the game (docs/DISENO.md D59, D61).
#  - keeps only the fish that gets drawn: the meshes on the first skin (or every mesh when there is no skin);
#    other meshes (a second fish, props such as a snail), their skins and textures are dropped
#  - drops animations whose name contains one of the --drop words (e.g. Young)
#  - re-encodes the kept textures as WebP (base colour up to --albedo px, the other maps up to --maps px)
#  - repacks the binary chunk with only the data still referenced
#   python tools/fish/glb_slim.py in.glb out.glb [--albedo 2048] [--maps 1024] [--drop Young,Foo]
import io, json, struct, sys
from PIL import Image

args = sys.argv[1:]
src, dst = args[0], args[1]
opt = dict(albedo='2048', maps='1024', drop='')
for i, a in enumerate(args):
    if a.startswith('--'):
        opt[a[2:]] = args[i + 1]
ALBEDO, MAPS = int(opt['albedo']), int(opt['maps'])
DROP = [w for w in opt['drop'].split(',') if w]

f = open(src, 'rb').read()
assert struct.unpack('<I', f[:4])[0] == 0x46546C67, 'not a GLB'
cl, _ = struct.unpack('<II', f[12:20])
j = json.loads(f[20:20 + cl])
o = 20 + cl
bl, _ = struct.unpack('<II', f[o:o + 8])
binary = f[o + 8:o + 8 + bl]

# ---- what stays: drawn meshes, the first skin, the materials / textures / images they use
skinned = bool(j.get('skins'))
keep_mesh = []
for n in j['nodes']:
    if 'mesh' not in n: continue
    if skinned and n.get('skin') != 0:
        n.pop('mesh'); n.pop('skin', None)
        continue
    if n['mesh'] not in keep_mesh: keep_mesh.append(n['mesh'])
mesh_map = {old: new for new, old in enumerate(keep_mesh)}
for n in j['nodes']:
    if 'mesh' in n: n['mesh'] = mesh_map[n['mesh']]
j['meshes'] = [j['meshes'][i] for i in keep_mesh]
if skinned: j['skins'] = j['skins'][:1]
if DROP and j.get('animations'):
    j['animations'] = [a for a in j['animations'] if not any(w in a.get('name', '') for w in DROP)]
    print('animations kept:', [a.get('name') for a in j['animations']])

# old specular-glossiness materials (some scans): the diffuse map becomes the base colour, not metallic
for m in j['materials']:
    sg = (m.get('extensions') or {}).pop('KHR_materials_pbrSpecularGlossiness', None)
    if sg:
        pbr = m.setdefault('pbrMetallicRoughness', {})
        if 'diffuseTexture' in sg: pbr['baseColorTexture'] = sg['diffuseTexture']
        if 'diffuseFactor' in sg: pbr['baseColorFactor'] = sg['diffuseFactor']
        pbr['metallicFactor'] = 0.0
        pbr['roughnessFactor'] = round(1.0 - sg.get('glossinessFactor', 0.5), 3)
        if not m['extensions']: m.pop('extensions')
for key in ('extensionsUsed', 'extensionsRequired'):
    if key in j:
        j[key] = [e for e in j[key] if e != 'KHR_materials_pbrSpecularGlossiness']
        if not j[key]: j.pop(key)

# materials -> textures -> images
mats = sorted({p['material'] for m in j['meshes'] for p in m['primitives'] if 'material' in p})
mat_map = {old: new for new, old in enumerate(mats)}
j['materials'] = [j['materials'][i] for i in mats]
for m in j['meshes']:
    for p in m['primitives']:
        if 'material' in p: p['material'] = mat_map[p['material']]
role, tex_used = {}, []
def tex_ref(t, r):
    src_img = j['textures'][t['index']]['source']
    if r == 'albedo': role[src_img] = 'albedo'
    else: role.setdefault(src_img, r)
    if t['index'] not in tex_used: tex_used.append(t['index'])
for m in j['materials']:
    pbr = m.get('pbrMetallicRoughness', {})
    if 'baseColorTexture' in pbr: tex_ref(pbr['baseColorTexture'], 'albedo')
    if 'metallicRoughnessTexture' in pbr: tex_ref(pbr['metallicRoughnessTexture'], 'maps')
    if 'normalTexture' in m: tex_ref(m['normalTexture'], 'normal')
    if 'occlusionTexture' in m: tex_ref(m['occlusionTexture'], 'maps')
    if 'emissiveTexture' in m: tex_ref(m['emissiveTexture'], 'albedo')
tex_map = {old: new for new, old in enumerate(tex_used)}
imgs = []
for ti in tex_used:
    s = j['textures'][ti]['source']
    if s not in imgs: imgs.append(s)
img_map = {old: new for new, old in enumerate(imgs)}
def remap_tex(t):
    if t: t['index'] = tex_map[t['index']]
for m in j['materials']:
    pbr = m.get('pbrMetallicRoughness', {})
    remap_tex(pbr.get('baseColorTexture')); remap_tex(pbr.get('metallicRoughnessTexture'))
    remap_tex(m.get('normalTexture')); remap_tex(m.get('occlusionTexture')); remap_tex(m.get('emissiveTexture'))
j['textures'] = [dict(j['textures'][i]) for i in tex_used]
for t in j['textures']:
    t['source'] = img_map[t['source']]
    t.pop('extensions', None)

# ---- new binary: each referenced accessor copied tightly into its own buffer view, then the images
SIZES = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
COMPS = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT2': 4, 'MAT3': 9, 'MAT4': 16}
used_acc = []
def use(a):
    if a is not None and a not in used_acc: used_acc.append(a)
for m in j['meshes']:
    for p in m['primitives']:
        for a in p['attributes'].values(): use(a)
        use(p.get('indices'))
        for t in p.get('targets', []):
            for a in t.values(): use(a)
for s in j.get('skins', []): use(s.get('inverseBindMatrices'))
for an in j.get('animations', []):
    for sm in an['samplers']: use(sm['input']); use(sm['output'])
acc_map = {old: new for new, old in enumerate(used_acc)}

out = bytearray(); views = []
def pad():
    while len(out) % 4: out.append(0)
new_acc = []
for ai in used_acc:
    a = dict(j['accessors'][ai])
    assert 'sparse' not in a, 'sparse accessors are not handled'
    if 'bufferView' in a:
        bv = j['bufferViews'][a['bufferView']]
        el = SIZES[a['componentType']] * COMPS[a['type']]
        stride = bv.get('byteStride', el)
        start = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        if stride == el:
            data = binary[start:start + el * a['count']]
        else:
            data = b''.join(binary[start + k * stride:start + k * stride + el] for k in range(a['count']))
        pad()
        v = {'buffer': 0, 'byteOffset': len(out), 'byteLength': len(data)}
        if 'target' in bv: v['target'] = bv['target']
        out += data
        a['bufferView'] = len(views); a['byteOffset'] = 0
        views.append(v)
    new_acc.append(a)
j['accessors'] = new_acc
def ra(x): return acc_map[x]
for m in j['meshes']:
    for p in m['primitives']:
        p['attributes'] = {k: ra(v) for k, v in p['attributes'].items()}
        if 'indices' in p: p['indices'] = ra(p['indices'])
        if 'targets' in p: p['targets'] = [{k: ra(v) for k, v in t.items()} for t in p['targets']]
for s in j.get('skins', []):
    if 'inverseBindMatrices' in s: s['inverseBindMatrices'] = ra(s['inverseBindMatrices'])
for an in j.get('animations', []):
    for sm in an['samplers']: sm['input'] = ra(sm['input']); sm['output'] = ra(sm['output'])

def webp(data, size, quality):
    im = Image.open(io.BytesIO(data))
    im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
    if max(im.size) > size:
        im = im.resize((size, size * im.size[1] // im.size[0]), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, 'WEBP', quality=quality, method=6)
    return b.getvalue()

new_imgs = []
for old in imgs:
    im = j['images'][old]
    bv = j['bufferViews'][im['bufferView']]
    data = binary[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
    r = role.get(old, 'maps')
    w = webp(data, ALBEDO if r == 'albedo' else MAPS, 88 if r == 'albedo' else (92 if r == 'normal' else 85))
    print('image', old, r, bv['byteLength'], '->', len(w))
    pad()
    views.append({'buffer': 0, 'byteOffset': len(out), 'byteLength': len(w)})
    out += w
    new_imgs.append({'bufferView': len(views) - 1, 'mimeType': 'image/webp'})
pad()
j['images'] = new_imgs
j['bufferViews'] = views
j['buffers'] = [{'byteLength': len(out)}]
for t in j['textures']:
    t['extensions'] = {'EXT_texture_webp': {'source': t['source']}}
j['extensionsUsed'] = sorted(set(j.get('extensionsUsed', []) + ['EXT_texture_webp']))

js = json.dumps(j, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out))
glb += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + bytes(out)
open(dst, 'wb').write(glb)
print('wrote', dst, len(f), '->', len(glb), '| meshes', len(j['meshes']), '| materials', len(j['materials']), '| images', len(j['images']))
