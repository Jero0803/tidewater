# Slims a downloaded fish GLB for the game (docs/DISENO.md D59): re-encodes the textures of the first
# material as WebP (base colour at full size, the others smaller) and replaces the textures of the other
# materials (unused: SkinnedModel draws the first skinned mesh) with a 4 x 4 placeholder. Geometry and
# animations are kept as they are.
#   python tools/fish/glb_slim.py in.glb out.glb [--albedo 2048] [--maps 1024]
import io, json, struct, sys
from PIL import Image

args = sys.argv[1:]
src, dst = args[0], args[1]
opt = dict(albedo=2048, maps=1024)
for i, a in enumerate(args):
    if a.startswith('--'):
        opt[a[2:]] = int(args[i + 1])

f = open(src, 'rb').read()
assert struct.unpack('<I', f[:4])[0] == 0x46546C67, 'not a GLB'
cl, _ = struct.unpack('<II', f[12:20])
j = json.loads(f[20:20 + cl])
o = 20 + cl
bl, _ = struct.unpack('<II', f[o:o + 8])
binary = f[o + 8:o + 8 + bl]

# which image does what in the first material
m0 = j['materials'][0]
tex_img = lambda t: j['textures'][t['index']]['source']
role = {}
pbr = m0.get('pbrMetallicRoughness', {})
if 'baseColorTexture' in pbr: role[tex_img(pbr['baseColorTexture'])] = 'albedo'
for k in ('metallicRoughnessTexture',):
    if k in pbr: role.setdefault(tex_img(pbr[k]), 'maps')
for k in ('normalTexture', 'occlusionTexture'):
    if k in m0: role.setdefault(tex_img(m0[k]), 'normal' if k == 'normalTexture' else 'maps')

def webp(data, size, quality, lossless=False):
    im = Image.open(io.BytesIO(data))
    im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
    if max(im.size) > size:
        im = im.resize((size, size * im.size[1] // im.size[0]), Image.LANCZOS)
    out = io.BytesIO()
    im.save(out, 'WEBP', quality=quality, method=6, lossless=lossless)
    return out.getvalue()

new_img = {}
for i, im in enumerate(j['images']):
    bv = j['bufferViews'][im['bufferView']]
    data = binary[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
    r = role.get(i)
    if r == 'albedo': new_img[i] = webp(data, opt['albedo'], 88)
    elif r == 'normal': new_img[i] = webp(data, opt['maps'], 92)
    elif r == 'maps': new_img[i] = webp(data, opt['maps'], 85)
    else:
        out = io.BytesIO(); Image.new('RGB', (4, 4), (128, 128, 128)).save(out, 'WEBP'); new_img[i] = out.getvalue()
    print('image', i, r or 'unused', bv['byteLength'], '->', len(new_img[i]))

# rebuild the binary chunk: every non-image buffer view as it was, then the new images
img_views = {im['bufferView']: i for i, im in enumerate(j['images'])}
out = bytearray()
def pad():
    while len(out) % 4: out.append(0)
for vi, bv in enumerate(j['bufferViews']):
    if vi in img_views: continue
    data = binary[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
    pad(); bv['byteOffset'] = len(out); out += data
for vi, i in img_views.items():
    bv = j['bufferViews'][vi]
    pad(); bv['byteOffset'] = len(out); bv['byteLength'] = len(new_img[i]); out += new_img[i]
    j['images'][i]['mimeType'] = 'image/webp'
pad()
j['buffers'][0]['byteLength'] = len(out)
# the images are WebP now (EXT_texture_webp: the textures point at them through the extension)
for t in j['textures']:
    t['extensions'] = {'EXT_texture_webp': {'source': t['source']}}
j['extensionsUsed'] = sorted(set(j.get('extensionsUsed', []) + ['EXT_texture_webp']))

js = json.dumps(j, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out))
glb += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + bytes(out)
open(dst, 'wb').write(glb)
print('wrote', dst, len(f), '->', len(glb))
