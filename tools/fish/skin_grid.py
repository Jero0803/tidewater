import sys
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, '.')
from analyze_lib import mask_of

path, flip, out = sys.argv[1], sys.argv[2] == '1', sys.argv[3]
im, m = mask_of(path, flip)
cols = np.where(m.any(axis=0))[0]
x0, x1 = cols[0], cols[-1]
L = x1 - x0
img = Image.fromarray(im.astype(np.uint8)).resize((im.shape[1] * 2, im.shape[0] * 2))
d = ImageDraw.Draw(img)
for i in range(0, 21):
    x = (x1 - L * i / 20) * 2
    d.line([(x, 0), (x, img.height)], fill=(255, 0, 0) if i % 5 == 0 else (0, 120, 255), width=1)
    d.text((x + 2, 2), f'{i*5}', fill=(255, 0, 0))
for j in range(0, img.height, 40):
    d.line([(0, j), (img.width, j)], fill=(0, 200, 0), width=1)
    d.text((2, j + 2), f'{j//2}', fill=(0, 140, 0))
img.save(out)
