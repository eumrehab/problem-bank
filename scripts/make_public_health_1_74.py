"""Build two print PDFs after verifying answers against the textbook PDF."""

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
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PDF = Path(
    r"C:\Users\admin\OneDrive\01. 26-2 학교 수업\자료\기초개념부터 핵심문제까지- 공중보건학_end.pdf"
)
OUTPUT = ROOT / "output" / "pdf"
OPTIONS = "①②③④⑤"
ANSWER_PAGES = [
    [25, 26, 27, 28],
    [52, 53, 54, 55],
    [84, 85, 86, 87],
    [156, 157, 158, 159],
    [181, 182, 183, 184],
]

pdfmetrics.registerFont(TTFont("Malgun", r"C:\Windows\Fonts\malgun.ttf"))
pdfmetrics.registerFont(TTFont("MalgunBold", r"C:\Windows\Fonts\malgunbd.ttf"))

title_style = ParagraphStyle(
    "title", fontName="MalgunBold", fontSize=20, leading=28,
    alignment=TA_CENTER, spaceAfter=10 * mm,
)
sub_style = ParagraphStyle(
    "sub", fontName="Malgun", fontSize=10, leading=16,
    alignment=TA_CENTER, textColor=colors.HexColor("#56616f"), spaceAfter=8 * mm,
)
chapter_style = ParagraphStyle(
    "chapter", fontName="MalgunBold", fontSize=13, leading=20,
    spaceBefore=7 * mm, spaceAfter=5 * mm,
)
question_style = ParagraphStyle(
    "question", fontName="MalgunBold", fontSize=10, leading=16,
    spaceAfter=2.5 * mm,
)
option_style = ParagraphStyle(
    "option", fontName="Malgun", fontSize=9.2, leading=14,
    leftIndent=5 * mm, firstLineIndent=-5 * mm, spaceAfter=1.2 * mm,
)
answer_style = ParagraphStyle(
    "answer", fontName="MalgunBold", fontSize=10, leading=17,
    textColor=colors.HexColor("#165da8"),
)
answer_chapter_style = ParagraphStyle(
    "answer_chapter", fontName="MalgunBold", fontSize=11, leading=15,
    spaceBefore=2 * mm, spaceAfter=2 * mm,
)


def footer(canvas, document):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#d4dce5"))
    canvas.line(16 * mm, 15 * mm, A4[0] - 16 * mm, 15 * mm)
    canvas.setFont("Malgun", 8)
    canvas.drawString(16 * mm, 10 * mm, "공중보건학 교재 문제 1-74")
    canvas.drawRightString(A4[0] - 16 * mm, 10 * mm, str(document.page))
    canvas.restoreState()


def load_verified_questions():
    with (ROOT / "app" / "book-question-bank.json").open(encoding="utf-8") as stream:
        subjects = json.load(stream)
    subject = next(item for item in subjects if item["id"] == "public-health")
    chapters = subject["chapters"][:5]
    reader = PdfReader(str(SOURCE_PDF))
    verified = []
    discrepancies = []

    for chapter, pages in zip(chapters, ANSWER_PAGES):
        marks = []
        for page_number in pages:
            text = reader.pages[page_number - 1].extract_text() or ""
            answer_lines = [line for line in text.splitlines() if "정 답" in line]
            if len(answer_lines) != 1:
                raise RuntimeError(f"교재 {page_number}쪽 하단 정답을 확인할 수 없습니다.")
            marks.extend(re.findall(r"[①②③④⑤]", answer_lines[0]))

        if len(marks) != 15:
            raise RuntimeError(f"{chapter['number']}장 정답 {len(marks)}개: 15개여야 합니다.")

        for offset, question in enumerate(chapter["questions"]):
            global_number = len(verified) + 1
            source_answer = OPTIONS.index(marks[offset])
            if source_answer != question["answer"]:
                discrepancies.append((global_number, source_answer + 1, question["answer"] + 1))
            if len(question["options"]) != 5:
                raise RuntimeError(f"{global_number}번 보기가 5개가 아닙니다.")
            verified.append((global_number, chapter, question, source_answer))
            if global_number == 74:
                break
        if len(verified) == 74:
            break

    if len(verified) != 74:
        raise RuntimeError(f"문항 수가 74개가 아닙니다: {len(verified)}")
    if discrepancies:
        raise RuntimeError(f"교재와 웹 데이터 정답 불일치: {discrepancies}")
    return verified


def make_doc(path, story):
    document = SimpleDocTemplate(
        str(path), pagesize=A4,
        leftMargin=17 * mm, rightMargin=17 * mm,
        topMargin=17 * mm, bottomMargin=21 * mm,
        title=path.stem, author="캠퍼스 문제은행",
    )
    document.build(story, onFirstPage=footer, onLaterPages=footer)


def build_question_pdf(rows):
    story = [
        Paragraph("공중보건학 교재 문제 1-74", title_style),
        Paragraph("문제지 · 제1장~제5장 14번 · 정답은 별도 파일", sub_style),
    ]
    identity = Table(
        [["학교", "", "학번", "", "이름", ""]],
        colWidths=[15 * mm, 44 * mm, 15 * mm, 44 * mm, 15 * mm, 42 * mm],
        rowHeights=12 * mm,
        style=TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#aeb9c5")),
            ("FONTNAME", (0, 0), (-1, -1), "Malgun"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (0, 0), "CENTER"),
            ("ALIGN", (2, 0), (2, 0), "CENTER"),
            ("ALIGN", (4, 0), (4, 0), "CENTER"),
        ]),
    )
    story.extend([identity, Spacer(1, 7 * mm)])

    prior_chapter = None
    for global_number, chapter, question, _ in rows:
        if chapter["number"] != prior_chapter:
            if prior_chapter is not None:
                story.append(PageBreak())
            story.append(Paragraph(
                f"제{chapter['number']}장 {escape(chapter['title'])}", chapter_style
            ))
            prior_chapter = chapter["number"]
        parts = [Paragraph(f"{global_number:02d}. {escape(question['prompt'])}", question_style)]
        for index, option in enumerate(question["options"]):
            parts.append(Paragraph(f"{OPTIONS[index]}&nbsp; {escape(option)}", option_style))
        parts.append(Spacer(1, 3 * mm))
        story.append(KeepTogether(parts))

    path = OUTPUT / "공중보건학_교재문제_1-74_문제지.pdf"
    make_doc(path, story)
    return path


def build_answer_pdf(rows):
    story = [
        Paragraph("공중보건학 교재 문제 1-74 · 정답표", title_style),
        Paragraph("원본 교재의 각 문제 하단 정답과 대조한 정답입니다.", sub_style),
    ]
    prior_chapter = None
    chapter_entries = []
    for global_number, chapter, _, source_answer in rows:
        if chapter["number"] != prior_chapter:
            if chapter_entries:
                story.extend(answer_table(chapter_entries))
            story.append(Paragraph(
                f"제{chapter['number']}장 {escape(chapter['title'])}", answer_chapter_style
            ))
            chapter_entries = []
            prior_chapter = chapter["number"]
        chapter_entries.append((global_number, source_answer))
    story.extend(answer_table(chapter_entries))

    path = OUTPUT / "공중보건학_교재문제_1-74_정답표.pdf"
    make_doc(path, story)
    return path


def answer_table(entries):
    cells = [Paragraph(f"{number:02d}. {OPTIONS[answer]}", answer_style)
             for number, answer in entries]
    rows = [cells[index:index + 5] for index in range(0, len(cells), 5)]
    for row in rows:
        row.extend([""] * (5 - len(row)))
    table = Table(rows, colWidths=[35 * mm] * 5, rowHeights=8 * mm)
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#c1cfdf")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
    ]))
    return [table, Spacer(1, 1 * mm)]


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    rows = load_verified_questions()
    question_path = build_question_pdf(rows)
    answer_path = build_answer_pdf(rows)
    print("verified_answers=74, discrepancies=0")
    print(question_path)
    print(answer_path)


if __name__ == "__main__":
    main()
