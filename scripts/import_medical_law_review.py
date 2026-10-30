import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

SOURCE = Path(r'C:/Users/admin/OneDrive/01. 26-2 학교 수업/의료관계법규_1~4장_각50문항_총200문항_정답해설.docx')
ROOT = Path(__file__).resolve().parents[1]
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile(SOURCE) as archive:
    xml = ET.fromstring(archive.read('word/document.xml'))
paragraphs = [''.join(t.text or '' for t in p.findall('.//w:t', NS)).strip() for p in xml.findall('.//w:body//w:p', NS)]
markers = '①②③④⑤'
questions = {}
solutions = {}
for i, paragraph in enumerate(paragraphs):
    answer = re.match(r'^(\d+)\.\s*정답\s*([①②③④⑤])\s*(.*)', paragraph)
    if answer:
        number = int(answer[1])
        assert number not in solutions, ('duplicate solution', number)
        solutions[number] = {
            'answer': markers.index(answer[2]), 'answerText': answer[3].strip(),
            'explanation': paragraphs[i + 1], 'sourceReference': paragraphs[i + 2],
        }
        continue
    start = re.match(r'^(\d+)\.\s*(.+)', paragraph)
    if start and i + 5 < len(paragraphs) and all(paragraphs[i + j + 1].startswith(markers[j]) for j in range(5)):
        number = int(start[1])
        assert number not in questions, ('duplicate question', number)
        questions[number] = {'id': f'law-review-200-{number}', 'sourceNumber': number, 'prompt': start[2],
                             'options': [paragraphs[i + j + 1][1:].strip() for j in range(5)]}
assert sorted(questions) == list(range(1, 201))
assert sorted(solutions) == list(range(1, 201))
for number, question in questions.items():
    solution = solutions[number]
    assert question['options'][solution['answer']] == solution['answerText'], (number, 'answer text mismatch')
    assert solution['sourceReference'].startswith('근거'), number
    question.update({key: solution[key] for key in ['answer', 'explanation', 'sourceReference']})
titles = ['의료법', '의료기사 등에 관한 법률', '장애인복지법', '노인복지법']
bank = [{'chapter': chapter, 'title': title,
         'questions': [questions[n] for n in range((chapter - 1) * 50 + 1, chapter * 50 + 1)]}
        for chapter, title in enumerate(titles, 1)]
(ROOT / 'app/medical-law-review-bank.json').write_text(json.dumps(bank, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Imported 4 chapters, 200 questions; all answer texts match the supplied explanations.')
