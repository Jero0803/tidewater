import sys
import numpy as np
from PIL import Image
from scipy import ndimage

def mask_of(path, flip):
    im = np.asarray(Image.open(path).convert('RGB')).astype(float)
    if flip:
        im = im[:, ::-1]
    mn = im.min(axis=2); mx = im.max(axis=2)
    m = (mn < 225) | (mx - mn > 28)
    m = ndimage.binary_opening(m, iterations=1)
    lab, n = ndimage.label(m)
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    m = lab == (1 + int(np.argmax(sizes)))
    m = ndimage.binary_fill_holes(m)
    return im, m
