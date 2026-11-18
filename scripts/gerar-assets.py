"""Gera as imagens-fonte do ícone e da abertura do Android a partir do mascote.json.
Depois: npx @capacitor/assets generate --android
Uso: python3 scripts/gerar-assets.py
"""
import json
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
m = json.loads((RAIZ / 'docs/mascote/mascote.json').read_text())
quadro = m['quadros']['padrao']
FUNDO_CLARO = (0xF1, 0xFA, 0xFA, 255)
FUNDO_ESCURO = (0x10, 0x2A, 0x2F, 255)


def cor(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def mascote(px, paleta):
    """Mascote com 'px' pixels de tela por célula da grade (corpo inteiro, olhos por cima)."""
    p = m['paletas'][paleta]
    img = Image.new('RGBA', (len(quadro[0]) * px, len(quadro) * px), (0, 0, 0, 0))
    for y, linha in enumerate(quadro):
        for x, c in enumerate(linha):
            if c != '.':
                img.paste(cor(p['B']), (x * px, y * px, (x + 1) * px, (y + 1) * px))
            if c == 'E':
                img.paste(cor(p['E']), (x * px, y * px, (x + 1) * px, (y + 1) * px))
    return img


def centralizar(tam, fundo, px, paleta):
    img = Image.new('RGBA', (tam, tam), fundo)
    mas = mascote(px, paleta)
    img.alpha_composite(mas, ((tam - mas.width) // 2, (tam - mas.height) // 2))
    return img


saida = RAIZ / 'assets'
saida.mkdir(exist_ok=True)
# Ícone simples: mascote sobre o fundo do modo claro (como docs/mascote/logo-planner.svg).
centralizar(1024, FUNDO_CLARO, 26, 'claro').save(saida / 'icon-only.png')
# Ícone adaptativo: frente transparente (mascote dentro da área segura) + fundo liso.
centralizar(1024, (0, 0, 0, 0), 20, 'claro').save(saida / 'icon-foreground.png')
Image.new('RGBA', (1024, 1024), FUNDO_CLARO).save(saida / 'icon-background.png')
# Tela de abertura (claro e escuro).
centralizar(2732, FUNDO_CLARO, 24, 'claro').save(saida / 'splash.png')
centralizar(2732, FUNDO_ESCURO, 24, 'escuro').save(saida / 'splash-dark.png')
print('ok')
