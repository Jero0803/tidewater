import sys
import numpy as np
from PIL import Image
from scipy import ndimage

# The fish silhouette of an illustration on a plain background (white or paper-coloured): pixels that differ
# from the background colour (median of the image border), the largest blob, holes filled.
def mask_of(path, flip, thresh=None):
    im = np.asarray(Image.open(path).convert('RGB')).astype(float)
    if flip:
        im = im[:, ::-1]
    border = np.concatenate([im[:4].reshape(-1, 3), im[-4:].reshape(-1, 3), im[:, :4].reshape(-1, 3), im[:, -4:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    diff = np.abs(im - bg).max(axis=2)
    m = diff > (thresh if thresh else 30)
    m = ndimage.binary_opening(m, iterations=1)
    lab, n = ndimage.label(m)
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    m = lab == (1 + int(np.argmax(sizes)))
    m = ndimage.binary_fill_holes(m)
    return im, m
