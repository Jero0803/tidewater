# Prepares an illustrated fish skin: python tools/fish/skin_prep.py <species> <out.webp> (run from the folder with the
# source images; SPEC lists the source, orientation, body fraction and the fin columns skipped by the profile).
# Needs Pillow, numpy and scipy. skin_grid.py draws a measuring grid on a source image (fin and eye landmarks).
# Turns a side-view fish illustration (white background) into a skin layer for the game:
# canonical frame 1024 x 512, u = z + 0.5 (snout at the right edge), v = 0.5 - 2 y (y in total lengths),
# background filled with the nearest fish colour (alpha keeps the silhouette). Prints the body profile
# (top / bot over body u) measured from the silhouette, skipping fin columns.
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, '.')
from analyze_lib import mask_of

# carp_rot.png: carp.jpg rotated 2.9 degrees (counter-clockwise, white fill) so snout and tail stalk are level
SPEC = {
    'brownTrout': dict(src='brown.jpg', flip=True, body=0.84,
                       topSkip=[(0.38, 0.57), (0.72, 0.81)], botSkip=[(0.15, 0.30), (0.48, 0.59), (0.64, 0.83)]),
    'carp': dict(src='carp_rot.png', flip=False, body=0.80,
                 topSkip=[(0.34, 0.76)], botSkip=[(0.20, 0.33), (0.40, 0.57), (0.67, 0.78)]),
    # tint: a black and white drawing (only its shading is used); outside the silhouette it is paper white
    'guapucha': dict(src='guap1915.jpg', flip=True, body=0.84, tint=True,
                     topSkip=[(0.47, 0.59)], botSkip=[(0.18, 0.37), (0.40, 0.70)]),
}
W, H = 1024, 512

def run(name, out):
    S = SPEC[name]
    im, m = mask_of(S['src'], S['flip'])
    cols = np.where(m.any(axis=0))[0]
    x0, x1 = cols[0], cols[-1]
    L = x1 - x0
    # axis: through the snout tip (mean row of the silhouette in the first 0.5 % of the length)
    tipc = [x for x in range(x1 - max(2, int(L * 0.005)), x1 + 1)]
    rows = np.concatenate([np.where(m[:, x])[0] for x in tipc])
    axis = rows.mean()
    print(name, 'L', L, 'axis row', round(axis, 1))

    # body profile at body-u samples (total-length units), interpolating over fins
    us = [0, 0.03, 0.08, 0.16, 0.28, 0.42, 0.56, 0.7, 0.84, 1.0]
    def edge(top):
        skip = S['topSkip' if top else 'botSkip']
        xs, vs = [], []
        for x in range(x0, x1 + 1):
            ut = (x1 - x) / L
            if any(a <= ut <= b for a, b in skip) or ut > S['body'] + 0.01:
                continue
            r = np.where(m[:, x])[0]
            if not len(r):
                continue
            vs.append((axis - r[0]) / L if top else (r[-1] - axis) / L)
            xs.append(ut)
        xs = np.array(xs[::-1]); vs = np.array(vs[::-1])
        return [round(float(np.interp(u * S['body'], xs, vs)), 4) for u in us]
    t, b = edge(True), edge(False)
    print('  top:', json.dumps([[u, v] for u, v in zip(us, t)]))
    print('  bot:', json.dumps([[u, v] for u, v in zip(us, b)]))

    # canonical layer
    zz = (np.arange(W) + 0.5) / W - 0.5
    yy = 0.25 - (np.arange(H) + 0.5) / H * 0.5
    Z, Y = np.meshgrid(zz, yy)
    xs = x1 - (0.5 - Z) * L
    ys = axis - Y * L
    # silhouette eroded a little (no white fringe), then colours bled outward
    core = ndimage.binary_erosion(m, iterations=2)
    _, (iy, ix) = ndimage.distance_transform_edt(~core, return_indices=True)
    bled = im[iy, ix]
    if S.get('tint'):
        # grey, paper white = 255, and white outside the silhouette (no darkening there)
        g = im.mean(axis=2)
        paper = np.percentile(g[m], 97)
        g = np.clip(g / paper * 255, 0, 255)
        g[~ndimage.binary_dilation(m, iterations=2)] = 255
        bled = np.repeat(g[:, :, None], 3, axis=2)
    rgb = np.stack([ndimage.map_coordinates(bled[:, :, c], [ys, xs], order=1, mode='nearest') for c in range(3)], -1)
    a = ndimage.map_coordinates(m.astype(float), [ys, xs], order=1, mode='constant', cval=0)
    img = np.clip(rgb, 0, 255).astype(np.uint8)
    Image.fromarray(img, 'RGB').save(out, 'WEBP', quality=90, method=6)
    Image.fromarray(img).save(out.replace('.webp', '_check.png'))

run(sys.argv[1], sys.argv[2])
