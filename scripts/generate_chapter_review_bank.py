from __future__ import annotations

from pathlib import Path
import hashlib
import json
import random
import re


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "tmp" / "review-sources"
BOOK_BANK = ROOT / "app" / "book-question-bank.json"
OUTPUT = ROOT / "app" / "public-health-chapter-review-bank.json"
CHAPTERS = [1, 2, 3, 4, 8, 10, 11, 12, 13, 14, 15]
GENERIC = {
    "정의", "개념", "특징", "분류", "종류", "내용", "방법", "기준", "관리", "예방", "사업",
    "목적", "의의", "원칙", "역할", "기능", "현황", "대책", "단계", "요인", "지표",
}


def normalize(value: str) -> str:
    value = value.strip()
    while re.match(r"^(?:[①②③④⑤⑥⑦⑧⑨⑩]|\(?\d+\)?[.)]?)\s*", value):
        value = re.sub(r"^(?:[①②③④⑤⑥⑦⑧⑨⑩]|\(?\d+\)?[.)]?)\s*", "", value, count=1)
    value = re.sub(r"\s+", " ", value)
    return value.strip(" -–—:;,.·•()[]")


def usable_term(value: str) -> bool:
    if not 2 <= len(value) <= 32 or value in GENERIC:
        return False
    if len(value.split()) > 5 or re.search(r"[?!。]", value):
        return False
    if any(char.isdigit() for char in value):
        return False
    if value.count("(") != value.count(")") or value.count("[") != value.count("]"):
        return False
    if re.search(r"(?:이다|한다|된다|있다|없다|때문이다)$", value):
        return False
    return bool(re.search(r"[가-힣A-Za-z]", value))


def sentence_parts(text: str) -> list[str]:
    text = re.sub(r"\n+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return [part.strip() for part in re.split(r"(?<=[.!?다)])\s+|(?<=이다)\s+", text) if 24 <= len(part.strip()) <= 230]


def candidate_terms(pages: list[dict], book_options: list[str]) -> list[str]:
    candidates = []
    for option in book_options:
        option = normalize(option)
        if usable_term(option):
            candidates.append(option)
    for page in pages:
        for line in page["text"].splitlines():
            line = line.strip()
            if re.match(r"^(?:[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]|\d+|[①②③④⑤⑥⑦⑧⑨⑩]|\(\d+\))", line):
                term = normalize(re.split(r"[:：]", line, maxsplit=1)[0])
                if usable_term(term):
                    candidates.append(term)
            for match in re.finditer(r"([가-힣A-Za-z][가-힣A-Za-z·\- ]{1,28})\s*\((?:[A-Za-z][^)]{1,35}|[가-힣]{2,15})\)", line):
                term = normalize(match.group(1))
                if usable_term(term):
                    candidates.append(term)
            for match in re.finditer(r"([가-힣A-Za-z][가-힣A-Za-z·\- ]{1,20})(?:이란|란)\s", line):
                term = normalize(match.group(1))
                if usable_term(term):
                    candidates.append(term)
    result = []
    seen = set()
    for term in candidates:
        key = re.sub(r"\s", "", term).lower()
        if key not in seen:
            seen.add(key)
            result.append(term)
    return result


def build_chapter(chapter: int, title: str, pages: list[dict], book_options: list[str]) -> dict:
    terms = candidate_terms(pages, book_options)
    occurrences = []
    for page in pages:
        for sentence in sentence_parts(page["text"]):
            for term in terms:
                exact_term = re.compile(rf"(?<![가-힣A-Za-z]){re.escape(term)}(?![가-힣A-Za-z])")
                if exact_term.search(sentence) and not sentence.startswith("제") and len(sentence) - len(term) >= 18:
                    occurrences.append((term, sentence, page["page"]))
    # Prefer varied answer terms, then allow a second source sentence for a term.
    occurrences.sort(key=lambda item: (terms.index(item[0]), item[2], len(item[1])))
    selected = []
    term_counts: dict[str, int] = {}
    used_sentences = set()
    for term, sentence, page in occurrences:
        sentence_key = re.sub(r"\W", "", sentence)
        if sentence_key in used_sentences or term_counts.get(term, 0) >= 2:
            continue
        selected.append((term, sentence, page))
        used_sentences.add(sentence_key)
        term_counts[term] = term_counts.get(term, 0) + 1
        if len(selected) == 50:
            break
    if len(selected) < 50:
        raise ValueError(f"제{chapter}장 문항 후보가 {len(selected)}개뿐입니다.")

    questions = []
    for index, (answer_term, sentence, page) in enumerate(selected, start=1):
        seed = int(hashlib.sha256(f"{chapter}-{index}-{answer_term}".encode()).hexdigest()[:12], 16)
        rng = random.Random(seed)
        distractor_pool = [
            term for term in terms
            if term != answer_term and term not in sentence and answer_term not in term and term not in answer_term
        ]
        distractor_pool.sort(key=lambda term: abs(len(term) - len(answer_term)))
        close_pool = distractor_pool[: max(16, min(40, len(distractor_pool)))]
        distractors = rng.sample(close_pool, 4)
        options = distractors + [answer_term]
        rng.shuffle(options)
        blanked = re.sub(rf"(?<![가-힣A-Za-z]){re.escape(answer_term)}(?![가-힣A-Za-z])", "(          )", sentence, count=1)
        questions.append({
            "id": f"lecture-{chapter}-{index}",
            "prompt": f"다음 강의안 내용의 빈칸에 들어갈 말로 가장 적절한 것은?\n\n{blanked}",
            "options": options,
            "answer": options.index(answer_term),
            "sourcePage": page,
        })
    return {"chapter": chapter, "title": title, "questions": questions}


book = json.loads(BOOK_BANK.read_text(encoding="utf-8"))
public_health = next(subject for subject in book if subject["id"] == "public-health")
book_chapters = {chapter["number"]: chapter for chapter in public_health["chapters"]}
result = []
for chapter_number in CHAPTERS:
    pages = json.loads((SOURCE_DIR / f"chapter-{chapter_number}.json").read_text(encoding="utf-8"))
    chapter = book_chapters[chapter_number]
    options = [option for question in chapter["questions"] for option in question["options"]]
    result.append(build_chapter(chapter_number, chapter["title"], pages, options))

OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps([{"chapter": item["chapter"], "title": item["title"], "count": len(item["questions"])} for item in result], ensure_ascii=False, indent=2))
