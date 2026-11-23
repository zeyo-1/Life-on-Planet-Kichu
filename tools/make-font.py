# 見出し用フォント（Mochiy Pop One）を、ゲームで使う文字だけに小さくするスクリプト
# 使い方:
#   1. https://fonts.google.com/specimen/Mochiy+Pop+One から MochiyPopOne-Regular.ttf を入手
#   2. pip install fonttools brotli
#   3. python tools/make-font.py MochiyPopOne-Regular.ttf
# story.js などに新しい漢字を足したら、もう一度実行してください
# （実行しなくても動きます。足した字だけ、ふつうの書体で表示されます）
import pathlib, sys
from fontTools import subset

src = sys.argv[1]
site = pathlib.Path(__file__).resolve().parent.parent / "site"
chars = set()
for f in list(site.glob("*.js")) + list(site.glob("*.html")):
    chars |= set(f.read_text(encoding="utf-8"))
chars |= {chr(c) for c in range(0x20, 0x7F)}           # 英数字・記号
chars |= {chr(c) for c in range(0x3000, 0x30FF + 1)}   # ひらがな・カタカナ・和文記号
chars |= {chr(c) for c in range(0xFF01, 0xFF5E + 1)}   # 全角英数字
text = "".join(sorted(c for c in chars if c.isprintable()))

opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = ["*"]
font = subset.load_font(src, opts)
sub = subset.Subsetter(opts)
sub.populate(text=text)
sub.subset(font)
out = site / "fonts" / "mochiy-pop-one-kichu.woff2"
subset.save_font(font, str(out), opts)
print(f"{len(text)} 文字 → {out} ({out.stat().st_size // 1024} KB)")
