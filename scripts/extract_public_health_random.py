import glob
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

ANSWERS_1 = [
  5,4,2,5,5,3,4,1,3,5, 5,5,1,2,5,1,1,2,5,4,
  1,2,5,1,2,4,4,1,1,1, 2,2,5,5,3,5,3,4,4,5,
  5,4,5,5,2,3,1,1,3,5, 5,4,5,4,4,3,1,5,5,1,
  1,4,4,3,3,1,4,2,4,2, 1,4,4,3,4,1,5,3,2,1,
  4,3,1,1,3,3,3,3,1,2, 2,3,5,2,5,5,3,3,4,3,
  2,3,3,4,3,2,3,3,1,5, 5,2,5,1,2,5,2,1,3,4,
  2,4,3,2,2,5,5,5,3,2, 3,5,4,1,3,3,2,3,3,2,
  4,1,4,4,2,1,1,2,1,2, 3,1,3,4,2,2,2,1,1,3,
  5,1,2,5,2,5,1,4,2,2, 3,2,5,3,2,1,1,5,4,1,
  4,4,3,4,5,5,2,1,4,1, 1,4,4,4,4,4,2,4,2,3,
]

ANSWERS_2 = [
  3,1,4,4,5,2,3,3,1,1, 3,3,3,4,4,3,1,3,5,5,
  3,4,2,2,2,2,1,1,5,4, 1,2,5,4,2,4,3,4,4,5,
  1,5,3,2,4,2,4,1,4,4, 5,4,1,4,1,1,5,2,4,2,
  3,4,4,2,3,3,5,2,4,1, 1,3,5,2,2,3,1,1,4,3,
  3,2,5,5,4,5,3,2,2,1, 4,3,3,4,4,3,2,4,4,1,
  3,4,2,5,2,3,3,1,5,5, 1,2,5,1,5,2,1,3,1,1,
  2,2,4,1,2,1,2,5,3,5, 3,5,5,3,2,4,1,2,5,5,
  1,5,1,1,3,4,5,2,5,2, 4,1,1,4,5,5,5,1,2,5,
  4,3,3,2,5,4,1,5,4,2, 2,4,2,3,3,5,5,1,2,5,
  1,5,3,5,2,5,4,3,4,1, 3,1,4,3,3,2,1,2,3,1,
]

QUESTION_START = re.compile(r"(?m)^(\d{1,3})\.\s+")
MARKER_CHARS = set("()@©®<>D0123456789ㅇ㉦㉨㉭①②③④⑤")


def is_noise(line: str) -> bool:
  compact = line.replace(" ", "")
  return (
    line.startswith("작업치료사 국가")
    or "200문항" in compact
    or re.match(r"^제\s*\d+\s*장", line) is not None
    or re.fullmatch(r"-?\d+", line) is not None
  )


def strip_marker(line: str) -> str:
  parts = line.strip().split(maxsplit=1)
  if len(parts) == 2:
    token = parts[0]
    if (len(token) == 1 and token in MARKER_CHARS) or (
      2 <= len(token) <= 5 and all(char in MARKER_CHARS for char in token)
    ):
      return parts[1].strip()
  return line.strip()


def parse_questions(files: list[str], strict: bool = True) -> dict[int, dict]:
  text = "\n".join(Path(file).read_text(encoding="utf-8") for file in sorted(files))
  matches = list(QUESTION_START.finditer(text))
  result = {}
  for index, match in enumerate(matches):
    number = int(match.group(1))
    end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
    lines = [re.sub(r"\s+", " ", line).strip() for line in text[match.end():end].splitlines()]
    lines = [line for line in lines if line and not is_noise(line)]
    question_end = next((i for i, line in enumerate(lines) if "?" in line), None)
    if question_end is None:
      question_end = len(lines) - 6 if len(lines) >= 6 else None
      if question_end is None:
        if strict:
          raise ValueError(f"{number}번 질문 끝을 찾지 못했습니다.")
        continue
    prompt = " ".join(lines[: question_end + 1])
    options = lines[question_end + 1 :]
    if len(options) == 6 and len(options[-1]) <= 5:
      options.pop()
    if len(options) > 5:
      options = options[:4] + [" ".join(options[4:])]
    if len(options) != 5:
      if strict:
        raise ValueError(f"{number}번 보기 수가 {len(options)}개입니다: {options}")
      continue
    result[number] = {"prompt": prompt, "options": [strip_marker(option) for option in options]}
  return result


def quality(text: str) -> int:
  hangul = len(re.findall(r"[가-힣]", text))
  latin_noise = len(re.findall(r"[A-Za-z]{2,}", text))
  symbols = len(re.findall(r"[\[\]{}_=<>]", text))
  return hangul * 2 - latin_noise * 12 - symbols * 4


def choose_text(primary: str, alternate: str | None) -> str:
  if not alternate:
    return primary
  chosen = alternate if quality(alternate) > quality(primary) else primary
  replacements = {
    "옮은": "옳은", "원술로": "윈슬로", "재드윅": "채드윅",
    "참여시기는": "참여시키는", "지워한다": "지원한다",
  }
  for wrong, correct in replacements.items():
    chosen = chosen.replace(wrong, correct)
  return chosen


def build_set(set_number: int, answers: list[int]) -> list[dict]:
  tesseract = parse_questions(glob.glob(str(ROOT / f"tmp/pdfs/set{set_number}-400/*.txt")))
  windows = parse_questions(glob.glob(str(ROOT / f"tmp/pdfs/set{set_number}/*.win.txt")), strict=False)
  if sorted(tesseract) != list(range(1, 201)) or len(answers) != 200:
    raise ValueError(f"세트 {set_number} 문항 또는 정답 수가 올바르지 않습니다.")
  questions = []
  for number in range(1, 201):
    primary = tesseract[number]
    alternate = windows.get(number)
    prompt = choose_text(primary["prompt"], alternate["prompt"] if alternate else None)
    options = [
      choose_text(option, alternate["options"][i] if alternate else None)
      for i, option in enumerate(primary["options"])
    ]
    question = {
      "id": f"ph200-{set_number}-{number}",
      "sourceSet": set_number,
      "sourceNumber": number,
      "prompt": prompt,
      "options": options,
      "answer": answers[number - 1] - 1,
    }
    override = OVERRIDES.get(question["id"])
    if override:
      question.update(override)
    questions.append(question)
  return questions


# Scanned source pages manually checked where OCR could not preserve Korean text
# or separators reliably.
OVERRIDES = {
  "ph200-1-4": {
    "prompt": "이동이 어려운 저소득 노인에게 방문건강관리 인력을 우선 배치하였다. 가장 직접적으로 추구한 원칙은?",
    "options": ["수익성", "획일적 배분", "기밀성", "경쟁성", "형평"],
  },
  "ph200-1-68": {
    "prompt": "괴혈병 환자에게 감귤류를 제공한 군에서 증상 호전을 관찰한 연구자는?",
    "options": ["윈슬로", "린드", "블래커", "라마찌니", "던"],
  },
  "ph200-1-166": {
    "options": ["상담", "광고", "캠페인", "홍보", "조직개발"],
  },
  "ph200-1-170": {
    "prompt": "KAP 모형이 가정하는 기본적인 변화의 순서는?",
    "options": ["지식→실천→태도", "지식→태도→실천", "태도→실천→지식", "실천→태도→지식", "실천→지식→태도"],
  },
  "ph200-2-90": {
    "prompt": "장출혈성대장균감염증의 중요한 동물병원소로 강의안에서 강조한 것은?",
    "options": ["소", "모기", "닭", "개", "돼지"],
  },
  "ph200-2-93": {
    "prompt": "DPT 계열 백신의 예방 대상 조합으로 옳은 것은?",
    "options": ["수두·일본뇌염·말라리아", "결핵·콜레라·장티푸스", "디프테리아·백일해·파상풍", "홍역·풍진·유행성이하선염", "A형간염·B형간염·공수병"],
  },
  "ph200-2-94": {
    "prompt": "MMR 백신의 예방 대상으로만 묶인 것은?",
    "options": ["결핵·공수병·폴리오", "디프테리아·백일해·파상풍", "홍역·수두·콜레라", "홍역·풍진·유행성이하선염", "풍진·일본뇌염·장티푸스"],
  },
}


all_questions = build_set(1, ANSWERS_1) + build_set(2, ANSWERS_2)
target = ROOT / "app/public-health-random-bank.json"
target.write_text(json.dumps(all_questions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"wrote {len(all_questions)} questions to {target}")
