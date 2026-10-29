from pathlib import Path
import json
import re

import pdfplumber


SOURCE_DIR = Path(r"C:/Users/admin/OneDrive/01. 26-2 학교 수업/공중보건학 강의안/기초개념부터 핵심문제까지- 공중보건학_ppt")
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "tmp" / "review-sources"
FILES = {
    1: "2026_기초-핵심_공중보건학_제1장_필기.pdf",
    2: "2026_기초-핵심_공중보건학_제2장_필기.pdf",
    3: "2026_기초-핵심_공중보건학_제3장_필기.pdf",
    4: "2026_기초-핵심_공중보건학_제4장_필기.pdf",
    8: "2026_기초-핵심_공중보건학_제8장_필기.pdf",
    10: "2026_기초-핵심_공중보건학_제10장_필기.pdf",
    11: "2026_기초-핵심_공중보건학_제11장_필기.pdf",
    12: "2026_기초-핵심_공중보건학_제12장_필기.pdf",
    13: "2026_기초-핵심_공중보건학_제13장_필기.pdf",
    14: "2026_기초-핵심_공중보건학_제14장_261006_221415.pdf",
    15: "2026_기초-핵심_공중보건학_제15장_261019_012056.pdf",
}


def clean(text: str) -> str:
    text = text.replace("\x00", " ").replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
summary = []
for chapter, filename in FILES.items():
    source = SOURCE_DIR / filename
    page_texts = []
    with pdfplumber.open(source) as pdf:
        for index, page in enumerate(pdf.pages, start=1):
            page_texts.append({"page": index, "text": clean(page.extract_text() or "")})
    output = OUTPUT_DIR / f"chapter-{chapter}.json"
    output.write_text(json.dumps(page_texts, ensure_ascii=False, indent=2), encoding="utf-8")
    nonempty = sum(bool(page["text"]) for page in page_texts)
    characters = sum(len(page["text"]) for page in page_texts)
    summary.append({"chapter": chapter, "file": filename, "pages": len(page_texts), "nonempty": nonempty, "characters": characters})

(OUTPUT_DIR / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(summary, ensure_ascii=False, indent=2))
