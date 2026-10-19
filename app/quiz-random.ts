export type RandomQuestion = {
  id: string; text: string; options: string[]; answer: number | number[];
  optionOrder?: number[];
};

// Rejection sampling avoids modulo bias; each attempt gets fresh browser entropy.
function randomInt(max: number) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do { crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
  return buffer[0] % max;
}
export function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function randomizeQuiz(questions: RandomQuestion[], count: number) {
  if (new Set(questions.map(q => q.id)).size !== questions.length || count > questions.length) {
    throw new Error('문항 ID 또는 출제 수가 올바르지 않습니다.');
  }
  return shuffle(questions).slice(0, count).map(q => {
    const optionOrder = shuffle(q.options.map((_, i) => i));
    const correct = Array.isArray(q.answer) ? q.answer : [q.answer];
    const mapped = correct.map(index => optionOrder.indexOf(index));
    return { ...q, optionOrder, options: optionOrder.map(index => q.options[index]),
      answer: Array.isArray(q.answer) ? mapped : mapped[0] };
  });
}
export const correctedHealthAnswers = [2, 3, 4, 2, 1, 4, 3, 4, 2, 4];
export function validateHealthBank(questions: RandomQuestion[]) {
  if (questions.length !== 30) throw new Error('원문 30문항이 모두 필요합니다.');
  for (let i = 1; i <= 30; i++) {
    const q = questions.find(q => q.id === `health-ch15-${i}`);
    if (!q || !q.text.trim() || q.options.length !== 5 || q.options.some(o => !o.trim()) ||
        !Number.isInteger(q.answer) || Number(q.answer) < 0 || Number(q.answer) > 4) {
      throw new Error(`${i}번 문항·보기·정답을 확인해 주세요.`);
    }
    if (i >= 21 && q.answer !== correctedHealthAnswers[i - 21] - 1) {
      throw new Error(`${i}번 정답표가 교정값과 다릅니다.`);
    }
  }
}
