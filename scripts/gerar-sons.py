"""Gera os sons do Planner (estilo 8-bit, onda quadrada), em android/app/src/main/res/raw.
- bom_dia.wav: arpejo subindo, repetido em loop pelo alarme do Bom dia.
- aviso.wav: dois toques curtos para os avisos comuns.
Uso: python3 scripts/gerar-sons.py
"""
import math
import struct
import wave
from pathlib import Path

TAXA = 22050
SAIDA = Path(__file__).resolve().parent.parent / 'android/app/src/main/res/raw'


def nota(freq, ms, volume=0.45):
    n = int(TAXA * ms / 1000)
    amostras = []
    for i in range(n):
        onda = 1.0 if math.sin(2 * math.pi * freq * i / TAXA) >= 0 else -1.0
        # ataque e queda curtos para não estalar
        env = min(1.0, i / (TAXA * 0.004), (n - i) / (TAXA * 0.02))
        amostras.append(onda * volume * env)
    return amostras


def silencio(ms):
    return [0.0] * int(TAXA * ms / 1000)


def salvar(nome, amostras):
    with wave.open(str(SAIDA / nome), 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(TAXA)
        w.writeframes(b''.join(struct.pack('<h', int(a * 32767)) for a in amostras))


DO, MI, SOL, DO2, MI2 = 523.25, 659.25, 783.99, 1046.5, 1318.5
bom_dia = []
for _ in range(2):
    for f in (DO, MI, SOL, DO2):
        bom_dia += nota(f, 110) + silencio(25)
    bom_dia += nota(MI2, 260) + silencio(140)
bom_dia += silencio(500)
salvar('bom_dia.wav', bom_dia)

aviso = nota(SOL, 120) + silencio(60) + nota(DO2, 220) + silencio(80)
salvar('aviso.wav', aviso)
print('ok')
