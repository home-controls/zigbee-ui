# icon.png (128x128) + logo.png (wordmark) for a Home Assistant add-on, from the shared Zigbee logo.
import sys
from PIL import Image, ImageDraw, ImageFont
mark, name, outdir = sys.argv[1], sys.argv[2], sys.argv[3]
m = Image.open(mark).convert("RGBA")
m.resize((128, 128), Image.LANCZOS).save(f"{outdir}/icon.png", optimize=True)
H = 120; pad = 14
font = ImageFont.truetype("C:/Windows/Fonts/segoeuisl.ttf", 54)
bold = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 54)
first, rest = name.split(" ", 1)
d0 = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
w1 = d0.textlength(first + " ", font=bold); w2 = d0.textlength(rest, font=font)
W = pad + 92 + 18 + int(w1 + w2) + pad
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
img.alpha_composite(m.resize((92, 92), Image.LANCZOS), (pad, (H - 92) // 2))
d = ImageDraw.Draw(img)
x = pad + 92 + 18; y = H // 2
ink = (0, 160, 219, 255)  # the logo's own blue, readable on light and dark store pages
d.text((x, y), first + " ", font=bold, fill=ink, anchor="lm")
d.text((x + w1, y), rest, font=font, fill=ink, anchor="lm")
img.save(f"{outdir}/logo.png", optimize=True)
print(outdir, img.size)
