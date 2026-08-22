"""Genera l'icona e la schermata d'avvio di Eco Nera.

Il gioco in un'immagine sola: due coni di luce che si incrociano nel nero, uno
caldo e uno freddo — il Faro e l'Eco. Separati non coprono granche', insieme
illuminano il mezzo. E' quello che si vede giocando, e resta riconoscibile
anche a 48 pixel nel cassetto delle applicazioni.

    python tools/genera_icone.py

Produce assets/icon.png e assets/splash.png, e da quelle scrive direttamente
tutte le densita' dentro android/app/src/main/res. Le scriviamo noi invece di
usare @capacitor/assets perche' quello si appoggia a sharp, che ha bisogno di
binari nativi: una dipendenza in piu' da far funzionare per ottenere delle
immagini ridimensionate, che PIL fa gia'.
"""

import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

FONDO = (5, 7, 12)
FARO = (255, 198, 92)
ECO = (78, 205, 196)


def spegnimento(dimensione, origine, lunghezza):
    """
    Quanto e' forte la luce a ogni distanza dalla sorgente: massima addosso,
    niente in fondo. Si parte dal gradiente radiale di PIL, che e' nero al
    centro, e lo si rovescia.
    """
    lato = int(lunghezza * 2)
    radiale = ImageChops.invert(Image.radial_gradient("L").resize((lato, lato), Image.BICUBIC))
    # Elevare a potenza concentra la luce vicino alla sorgente invece di
    # spalmarla uniformemente, che e' come si comporta una torcia vera.
    radiale = radiale.point(lambda v: int(255 * (v / 255) ** 1.7))

    strato = Image.new("L", (dimensione, dimensione), 0)
    strato.paste(radiale, (int(origine[0] - lunghezza), int(origine[1] - lunghezza)))
    return strato


def settore(dimensione, origine, direzione, apertura, lunghezza):
    """La fetta di piano illuminata: un ventaglio, con i bordi ammorbiditi."""
    strato = Image.new("L", (dimensione, dimensione), 0)
    disegno = ImageDraw.Draw(strato)
    ox, oy = origine
    punte = [(ox, oy)]
    passi = 48
    for p in range(passi + 1):
        a = direzione - apertura / 2 + apertura * p / passi
        punte.append((ox + math.cos(a) * lunghezza, oy + math.sin(a) * lunghezza))
    disegno.polygon(punte, fill=255)
    return strato.filter(ImageFilter.GaussianBlur(dimensione * 0.03))


def cono(dimensione, origine, direzione, apertura, lunghezza, colore):
    """Il fascio finito: la sfumatura radiale ritagliata dentro il ventaglio."""
    maschera = ImageChops.multiply(
        spegnimento(dimensione, origine, lunghezza),
        settore(dimensione, origine, direzione, apertura, lunghezza),
    )
    tinta = Image.new("RGB", (dimensione, dimensione), colore)
    nero = Image.new("RGB", (dimensione, dimensione), (0, 0, 0))
    return Image.composite(tinta, nero, maschera)


def sorgente(immagine, dimensione, centro, colore):
    """Il puntino luminoso da cui parte il fascio, con il suo alone."""
    alone = Image.new("RGB", (dimensione, dimensione), (0, 0, 0))
    disegno = ImageDraw.Draw(alone)
    cx, cy = centro
    r = dimensione * 0.075
    disegno.ellipse([cx - r, cy - r, cx + r, cy + r], fill=tuple(c // 3 for c in colore))
    alone = alone.filter(ImageFilter.GaussianBlur(dimensione * 0.04))
    immagine = ImageChops.add(immagine, alone)

    disegno = ImageDraw.Draw(immagine)
    r = dimensione * 0.030
    disegno.ellipse([cx - r, cy - r, cx + r, cy + r], fill=colore)
    return immagine


def disegna(dimensione):
    s = dimensione
    immagine = Image.new("RGB", (s, s), FONDO)

    # Il Faro sta in basso a sinistra e guarda in alto a destra: largo e corto.
    # L'Eco sta in alto a destra e guarda in basso a sinistra: stretto e lungo.
    # Si incrociano al centro, che e' il punto di tutta l'immagine.
    faro = (s * 0.17, s * 0.80)
    eco = (s * 0.84, s * 0.17)

    immagine = ImageChops.add(
        immagine, cono(s, faro, math.radians(-45), math.radians(72), s * 0.62, FARO)
    )
    immagine = ImageChops.add(
        # Il fascio dell'Eco si ferma poco oltre l'incrocio: tirandolo fino in
        # fondo sbucava dall'altra parte del Faro e sembrava un errore.
        immagine, cono(s, eco, math.radians(135), math.radians(21), s * 0.78, ECO)
    )

    immagine = sorgente(immagine, s, faro, FARO)
    immagine = sorgente(immagine, s, eco, ECO)
    return immagine


# Le misure che Android si aspetta per ogni densita' dello schermo.
DENSITA = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}

# La schermata d'avvio, in orizzontale e in verticale.
AVVIO = {"land": (320, 200), "port": (200, 320)}
SCALE = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}


def tondo(immagine):
    """La versione circolare, per i lanciatori che la vogliono cosi'."""
    from PIL import ImageDraw

    maschera = Image.new("L", immagine.size, 0)
    ImageDraw.Draw(maschera).ellipse([0, 0, immagine.size[0] - 1, immagine.size[1] - 1], fill=255)
    fuori = Image.new("RGBA", immagine.size, (0, 0, 0, 0))
    dentro = immagine.convert("RGBA")
    return Image.composite(dentro, fuori, maschera)


def in_primo_piano(immagine):
    """
    Il livello davanti dell'icona adattiva. Android ne ritaglia il bordo — un
    lanciatore puo' mostrarla tonda, quadrata o a goccia — quindi il disegno
    va rimpicciolito dentro la zona sicura, che e' circa i due terzi centrali.
    """
    lato = immagine.size[0]
    tela = Image.new("RGBA", (lato, lato), (0, 0, 0, 0))
    dentro = immagine.resize((int(lato * 0.66), int(lato * 0.66)), Image.LANCZOS).convert("RGBA")
    scarto = (lato - dentro.size[0]) // 2
    tela.paste(dentro, (scarto, scarto))
    return tela


def scrivi_risorse_android(radice, icona, avvio):
    res = radice / "android" / "app" / "src" / "main" / "res"
    if not res.exists():
        print("nessun progetto android: salto le risorse")
        return

    for nome, lato in DENSITA.items():
        cartella = res / f"mipmap-{nome}"
        cartella.mkdir(parents=True, exist_ok=True)
        piccola = icona.resize((lato, lato), Image.LANCZOS)
        piccola.save(cartella / "ic_launcher.png")
        tondo(piccola).save(cartella / "ic_launcher_round.png")
        in_primo_piano(icona.resize((lato * 2, lato * 2), Image.LANCZOS)).save(
            cartella / "ic_launcher_foreground.png"
        )

    # Il fondo dell'icona adattiva: il nero del gioco, non il bianco di serie.
    sfondo = [
        '<?xml version="1.0" encoding="utf-8"?>',
        "<resources>",
        '    <color name="ic_launcher_background">#05070C</color>',
        "</resources>",
        "",
    ]
    (res / "values" / "ic_launcher_background.xml").write_text(
        "\n".join(sfondo), encoding="utf-8"
    )

    for verso, (larghezza, altezza) in AVVIO.items():
        for nome, scala in SCALE.items():
            cartella = res / f"drawable-{verso}-{nome}"
            cartella.mkdir(parents=True, exist_ok=True)
            ritaglio(avvio, int(larghezza * scala), int(altezza * scala)).save(
                cartella / "splash.png"
            )
    ritaglio(avvio, 480, 320).save(res / "drawable" / "splash.png")
    print(f"risorse android aggiornate in {res}")


def ritaglio(avvio, larghezza, altezza):
    """Prende dal centro della schermata d'avvio il rettangolo richiesto."""
    lato = min(avvio.size)
    scala = max(larghezza / lato, altezza / lato)
    ridotta = avvio.resize((int(lato * scala), int(lato * scala)), Image.LANCZOS)
    x = (ridotta.size[0] - larghezza) // 2
    y = (ridotta.size[1] - altezza) // 2
    return ridotta.crop((x, y, x + larghezza, y + altezza))


def main():
    radice = Path(__file__).resolve().parent.parent
    assets = radice / "assets"
    assets.mkdir(exist_ok=True)

    icona = disegna(1024)
    icona.save(assets / "icon.png")

    # La schermata d'avvio e' quadrata e grande: Android la ritaglia da sola a
    # seconda dello schermo, quindi il disegno sta al centro con aria intorno.
    avvio = Image.new("RGB", (2732, 2732), FONDO)
    dentro = disegna(1600)
    avvio.paste(dentro, ((2732 - 1600) // 2, (2732 - 1600) // 2))
    avvio.save(assets / "splash.png")
    avvio.save(assets / "splash-dark.png")
    print(f"icona e schermata d'avvio in {assets}")

    scrivi_risorse_android(radice, icona, avvio)


if __name__ == "__main__":
    main()
