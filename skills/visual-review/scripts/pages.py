#!/usr/bin/env python3
"""A finished output -> one self-contained review.html: pages as images, with the viewer inside.

usage: pages.py INPUT [--out DIR] [--title TITLE] [--dpi 160]

INPUT is a deck or document (pptx, docx, odp, odt), a PDF, or an image. DIR starts empty on every run, so no page of an
earlier round stays behind. Prints the path of the page. Exit 2 with the missing tools named when a dependency is absent.
"""
import argparse, base64, json, mimetypes, os, shutil, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
DOCS = {".pptx", ".ppt", ".odp", ".docx", ".doc", ".odt"}
IMAGES = {".png", ".jpg", ".jpeg", ".webp", ".gif"}


def tool(name, *extra):
    for c in (shutil.which(name), *extra):
        if c and os.access(c, os.X_OK):
            return c


def to_pdf(src, out):
    soffice = tool("soffice", os.environ.get("SOFFICE", ""), "/Applications/LibreOffice.app/Contents/MacOS/soffice")
    if not soffice:
        sys.exit("missing: LibreOffice (soffice), which turns " + src.suffix + " into a PDF. Ask the person before installing it.")
    subprocess.run([soffice, "--headless", "--convert-to", "pdf", "--outdir", str(out), str(src)], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return out / (src.stem + ".pdf")


def pdf_pages(pdf, out, dpi):
    try:
        try:
            import pymupdf as fitz
        except ImportError:
            import fitz
    except ImportError:
        if not tool("pdftoppm"):
            sys.exit("missing: PyMuPDF (python3 -m pip install pymupdf) or poppler (pdftoppm), which turn a PDF into images. Ask the person before installing.")
        subprocess.run(["pdftoppm", "-png", "-r", str(dpi), str(pdf), str(out / "page")], check=True)
        return sorted(out.glob("page-*.png"))
    paths = []
    for i, page in enumerate(fitz.open(pdf), 1):
        p = out / f"page-{i:03d}.png"
        page.get_pixmap(dpi=dpi).save(p)
        paths.append(p)
    return paths


def slim(path):
    """imgslim shrinks an image to a patch-aligned size; the original stays. Without it, the image goes as it is."""
    exe = tool("imgslim", str(Path.home() / ".local/bin/imgslim"))
    if not exe:
        return path
    r = subprocess.run([exe, "optimize", str(path)], capture_output=True, text=True)
    out = r.stdout.strip().splitlines()[-1] if r.returncode == 0 and r.stdout.strip() else ""
    return Path(out) if out and Path(out).exists() else path


def data_uri(path):
    mime = mimetypes.guess_type(path.name)[0] or "image/png"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input"); ap.add_argument("--out"); ap.add_argument("--title"); ap.add_argument("--dpi", type=int, default=160)
    a = ap.parse_args()
    src = Path(a.input).expanduser().resolve()
    if not src.exists():
        sys.exit("no such file: " + str(src))
    out = Path(a.out or Path(tempfile.gettempdir()) / ("review-" + src.stem))
    shutil.rmtree(out, ignore_errors=True); out.mkdir(parents=True)

    ext = src.suffix.lower()
    if ext in IMAGES:
        pages = [src]
    elif ext == ".pdf" or ext in DOCS:
        pdf = src if ext == ".pdf" else to_pdf(src, out)
        pages = pdf_pages(pdf, out, a.dpi)
    else:
        sys.exit("a file of type " + ext + " is not handled: turn it into a PDF or an image first")

    viewer = (HERE / "viewer.js").read_text(encoding="utf-8").replace("</script", "<\\/script")
    review = {"title": a.title or src.stem, "pages": [{"src": data_uri(slim(p)), "name": ""} for p in pages]}
    html = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + review["title"] + '</title></head><body>\n'
            "<script>window.REVIEW = " + json.dumps(review).replace("</", "<\\/") + ";</script>\n"
            "<script>" + viewer + "</script>\n</body></html>")
    (out / "review.html").write_text(html, encoding="utf-8")
    print(out / "review.html", f"({len(pages)} pages)")


if __name__ == "__main__":
    main()
