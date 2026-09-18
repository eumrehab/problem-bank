"""Print medical-law questions 1-74 with textbook-verified answer key."""

import json
import re
from html import escape
from pathlib import Path

from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\admin\OneDrive\01. 26-2 학교 수업\자료\2026_작업치료사_의료관계법규_end (2).pdf")
OUTPUT = ROOT / "output" / "pdf"
MARKS = "①②③④⑤"
BLUE = colors.HexColor("#165da8")
GRID = colors.HexColor("#c1cfdf")

pdfmetrics.registerFont(TTFont("Malgun", r"C:\Windows\Fonts\malgun.ttf"))
pdfmetrics.registerFont(TTFont("MalgunBold", r"C:\Windows\Fonts\malgunbd.ttf"))

TITLE = ParagraphStyle("title", fontName="MalgunBold", fontSize=20, leading=28,
                       alignment=TA_CENTER, spaceAfter=7 * mm)
SUBTITLE = ParagraphStyle("subtitle", fontName="Malgun", fontSize=10, leading=15,
                          alignment=TA_CENTER, textColor=colors.HexColor("#56616f"),
                          spaceAfter=8 * mm)
QUESTION = ParagraphStyle("question", fontName="MalgunBold", fontSize=10, leading=16,
                          spaceAfter=2.5 * mm)
OPTION = ParagraphStyle("option", fontName="Malgun", fontSize=9.2, leading=14,
                        leftIndent=5 * mm, firstLineIndent=-5 * mm,
                        spaceAfter=1.2 * mm)
ANSWER = ParagraphStyle("answer", fontName="MalgunBold", fontSize=10, leading=16,
                        textColor=BLUE)


def verified_questions():
    with (ROOT / "app" / "book-question-bank.json").open(encoding="utf-8") as stream:
        data = json.load(stream)
    subject = next(item for item in data if item["id"] == "medical-law")
    questions = subject["chapters"][0]["questions"][:74]
    reader = PdfReader(str(SOURCE))
    source_answers = []

    # The book prints the answers at the bottom of each problem page.
    for page_number in range(177, 214):
        text = reader.pages[page_number - 1].extract_text() or ""
        for line in text.splitlines():
            if "정 답" in line:
                source_answers.extend(MARKS.index(mark) for mark in re.findall(r"[①②③④⑤]", line))

    source_answers = source_answers[:74]  # Page 213 also contains question 75.
    if len(questions) != 74 or len(source_answers) != 74:
        raise RuntimeError("문항 또는 교재 하단 정답이 74개가 아닙니다.")
    mismatches = [(index + 1, question["answer"] + 1, answer + 1)
                  for index, (question, answer) in enumerate(zip(questions, source_answers))
                  if question["answer"] != answer]
    if mismatches:
        raise RuntimeError(f"웹 데이터와 교재 정답 불일치: {mismatches}")
    if any(len(question["options"]) != 5 for question in questions):
        raise RuntimeError("보기 5개가 아닌 문항이 있습니다.")
    return questions, source_answers


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(GRID)
    canvas.line(17 * mm, 15 * mm, A4[0] - 17 * mm, 15 * mm)
    canvas.setFont("Malgun", 8)
    canvas.drawString(17 * mm, 10 * mm, "의료관계법규 교재 문제 1-74")
    canvas.drawRightString(A4[0] - 17 * mm, 10 * mm, str(doc.page))
    canvas.restoreState()


def build_pdf(path, story):
    doc = SimpleDocTemplate(str(path), pagesize=A4,
                            leftMargin=17 * mm, rightMargin=17 * mm,
                            topMargin=17 * mm, bottomMargin=21 * mm,
                            title=path.stem, author="캠퍼스 문제은행")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


def make_question_pdf(questions, randomized=False):
    edition = " · 무작위 배열" if randomized else ""
    story = [
        Paragraph(f"의료관계법규 교재 문제 1-74{edition}", TITLE),
        Paragraph("문제지 · 제1장 의료법 · 정답은 별도 파일", SUBTITLE),
    ]
    identity = Table([["학교", "", "학번", "", "이름", ""]],
                     colWidths=[15 * mm, 44 * mm, 15 * mm, 44 * mm, 15 * mm, 42 * mm],
                     rowHeights=12 * mm)
    identity.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, GRID),
        ("FONTNAME", (0, 0), (-1, -1), "Malgun"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, 0), "CENTER"),
        ("ALIGN", (2, 0), (2, 0), "CENTER"),
        ("ALIGN", (4, 0), (4, 0), "CENTER"),
    ]))
    story.extend([identity, Spacer(1, 8 * mm)])
    for number, question in enumerate(questions, start=1):
        block = [Paragraph(f"{number:02d}. {escape(question['prompt'])}", QUESTION)]
        for index, option in enumerate(question["options"]):
            block.append(Paragraph(f"{MARKS[index]}&nbsp; {escape(option)}", OPTION))
        block.append(Spacer(1, 3 * mm))
        story.append(KeepTogether(block))

    filename = "의료관계법규_교재문제_1-74_무작위_문제지.pdf" if randomized else "의료관계법규_교재문제_1-74_문제지.pdf"
    path = OUTPUT / filename
    build_pdf(path, story)
    return path


def make_answer_pdf(answers, randomized=False):
    edition = " · 무작위 배열" if randomized else ""
    story = [
        Paragraph(f"의료관계법규 교재 문제 1-74{edition} · 정답표", TITLE),
        Paragraph("제1장 의료법 · 원본 교재의 문제 하단 정답과 대조", SUBTITLE),
    ]
    cells = [Paragraph(f"{number:02d}. {MARKS[answer]}", ANSWER)
             for number, answer in enumerate(answers, start=1)]
    rows = [cells[index:index + 5] for index in range(0, len(cells), 5)]
    for row in rows:
        row.extend([""] * (5 - len(row)))
    table = Table(rows, colWidths=[35 * mm] * 5, rowHeights=9 * mm)
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.45, GRID),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
    ]))
    story.append(table)
    filename = "의료관계법규_교재문제_1-74_무작위_정답표.pdf" if randomized else "의료관계법규_교재문제_1-74_정답표.pdf"
    path = OUTPUT / filename
    build_pdf(path, story)
    return path


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    questions, answers = verified_questions()
    print("verified_answers=74, discrepancies=0")
    print(make_question_pdf(questions))
    print(make_answer_pdf(answers))


if __name__ == "__main__":
    main()
