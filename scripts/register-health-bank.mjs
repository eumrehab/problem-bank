import { readFileSync, writeFileSync } from 'node:fs';
import { validateHealthBank, correctedHealthAnswers } from '../app/quiz-random.ts';

// Input: { questions: [{id:"health-ch15-1",text,options:[five strings],answer:0}] }
// answer is the ORIGINAL option index, zero based. Preserve 1–20 from source.
const input = process.argv[2];
if (!input) throw new Error('원문 JSON 파일 경로가 필요합니다.');
const source = JSON.parse(readFileSync(input, 'utf8'));
const questions = source.questions.map(q => ({ ...q }));
for (const q of questions) {
  const n = Number(q.id.replace('health-ch15-', ''));
  if (n >= 21 && n <= 30) q.answer = correctedHealthAnswers[n - 21] - 1;
}
validateHealthBank(questions);
const target = new URL('../app/health-indicators.json', import.meta.url);
writeFileSync(target, JSON.stringify({ id: 'health-indicators-ch15-v1', title: '15장 특별 문제 — 보건지표', status: 'ready', questions }, null, 2) + '\n');
writeFileSync(new URL('../HEALTH_INDICATORS_BANK.gs', import.meta.url),
  '// Generated from the confirmed original questions. Original indexes are zero based.\nconst HEALTH_INDICATORS_BANK = ' + JSON.stringify(questions) + ';\n');
console.log('30문항 검증 및 등록 완료. 21~30번 정답 교정 적용. 배포는 별도로 승인받아야 합니다.');
