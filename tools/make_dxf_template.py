"""Genera src/js/11-dxf-template.js: lo scheletro DXF R2000 (AC1015) usato dall'export di CanaloCAD.

Lo scheletro (HEADER, CLASSES, TABLES, BLOCKS, OBJECTS) è prodotto da ezdxf, così
handle, tabelle obbligatorie, layout e dizionari sono sempre coerenti e AutoCAD apre il file.
L'app inserisce solo le entità nella sezione ENTITIES e aggiorna $HANDSEED / $EXTMIN / $EXTMAX.

Va rigenerato solo se cambiano layer o stili di testo:
    pip install ezdxf==1.3.4
    python tools/make_dxf_template.py
"""
import io
import json
import pathlib
import ezdxf

# Deve corrispondere a CAD_LAYERS_SPEC in src/js/11-export.js (nome: (ACI, truecolor, lineweight))
LAYERS = {
    "Canalina": (140, 0x38BDF8, 50),
    "Cavi": (30, 0xF59E0B, 35),
    "Anime_Cavi": (40, 0xFBBF24, 25),
    "STAFFAGGI": (252, 0x94A3B8, 35),
    "FASCETTE_ANCORAGGIO": (4, 0x06B6D4, 35),
    "Bandierine": (40, 0xFBBF24, 20),
    "Testi": (7, 0xF8FAFC, 25),
    "QUOTE": (40, 0xFBBF24, 25),
    "TABELLA": (140, 0x38BDF8, 30),
    "CURVA_CARICO": (90, 0x22C55E, 35),
    "ETICHETTA_PIANTA": (80, 0x4ADE80, 35),
    "VISTA_3D_ISO": (251, 0x475569, 30),
    "CORNICE": (251, 0x475569, 60),
    "SFONDI_RIEMPIMENTI": (250, 0x1E293B, 0),
}
STYLES = {"ARIAL": "arial.ttf", "MONO_CAD": "isocp.shx", "TITLE_CAD": "arial.ttf"}
NL = chr(10)

doc = ezdxf.new("R2000", setup=False)
doc.header["$INSUNITS"] = 4        # millimetri
doc.header["$MEASUREMENT"] = 1     # metrico
doc.header["$DWGCODEPAGE"] = "ANSI_1252"
for name, (aci, _tc, lw) in LAYERS.items():
    doc.layers.add(name, color=aci, lineweight=lw)
for name, font in STYLES.items():
    doc.styles.add(name, font=font)

buf = io.StringIO()
doc.write(buf)
lines = buf.getvalue().replace(chr(13), "").split(NL)

# $HANDSEED -> marcatore (prossimo handle libero, calcolato dall'app)
i = lines.index("$HANDSEED")
assert lines[i + 1].strip() == "5"
first_handle = int(lines[i + 2], 16)
lines[i + 2] = "@@HANDSEED@@"

# $EXTMIN / $EXTMAX -> marcatori (limiti reali del disegno)
for var, tx, ty in (("$EXTMIN", "@@EXTMINX@@", "@@EXTMINY@@"), ("$EXTMAX", "@@EXTMAXX@@", "@@EXTMAXY@@")):
    i = lines.index(var)  # seguono: 10, x, 20, y, 30, z
    assert [lines[i + k].strip() for k in (1, 3, 5)] == ["10", "20", "30"], var
    lines[i + 2], lines[i + 4], lines[i + 6] = tx, ty, "0.0"

# Divide alla sezione ENTITIES (vuota): head termina con "2 / ENTITIES", tail inizia con "0 / ENDSEC"
j = lines.index("ENTITIES")
assert lines[j - 1].strip() == "2" and lines[j - 2] == "SECTION" and lines[j + 2] == "ENDSEC", "ENTITIES non vuota"
head = NL.join(lines[: j + 1]) + NL
tail = NL.join(lines[j + 1:])

msp_owner = doc.modelspace().block_record_handle

out = pathlib.Path(__file__).resolve().parent.parent / "src" / "js" / "11-dxf-template.js"
out.write_text(
    "    // GENERATO da tools/make_dxf_template.py (ezdxf " + ezdxf.__version__ + ") - non modificare a mano." + NL
    + "    // Scheletro DXF R2000 (AC1015) con tabelle, blocchi, layout e dizionari coerenti." + NL
    + "    const DXF_R2000_TEMPLATE = {" + NL
    + "      head: " + json.dumps(head) + "," + NL
    + "      tail: " + json.dumps(tail) + "," + NL
    + "      modelSpaceOwner: " + json.dumps(msp_owner) + "," + NL
    + "      firstHandle: " + str(first_handle) + NL
    + "    };" + NL + NL,
    encoding="utf-8",
)
print("scritto", out.name, "| handle iniziale", hex(first_handle), "| owner model space", msp_owner, "| byte", len(head) + len(tail))
