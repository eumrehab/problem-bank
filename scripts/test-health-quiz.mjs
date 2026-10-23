import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { randomizeQuiz, validateHealthBank, correctedHealthAnswers } from '../app/quiz-random.ts';
import { POST } from '../app/api/submissions/route.ts';

// Synthetic fixtures exercise the algorithm; they are never registered as content.
const questions = Array.from({ length: 30 }, (_, i) => ({ id: `health-ch15-${i + 1}`,
  text: `Fixture ${i}`, options: ['a', 'b', 'c', 'd', 'e'], answer: i < 20 ? i % 5 : correctedHealthAnswers[i - 20] - 1 }));
validateHealthBank(questions);
assert.throws(() => validateHealthBank(questions.slice(1)));
assert.throws(() => validateHealthBank(questions.map((q, i) => i === 20 ? { ...q, answer: 4 } : q)));
const combinations = new Set();
for (let i = 0; i < 500; i++) {
  const quiz = randomizeQuiz(questions, 20);
  assert.equal(quiz.length, 20); assert.equal(new Set(quiz.map(q => q.id)).size, 20);
  combinations.add(quiz.map(q => q.id).join(','));
  for (const q of quiz) {
    const original = questions.find(o => o.id === q.id);
    assert.deepEqual([...q.optionOrder].sort(), [0, 1, 2, 3, 4]);
    assert.equal(q.optionOrder[q.answer], original.answer);
    assert.equal(q.options[q.answer], original.options[original.answer]);
  }
}
assert.equal(combinations.size, 500);
const quiz = randomizeQuiz(questions, 20);
assert.deepEqual(JSON.parse(JSON.stringify(quiz)), quiz); // persisted order/mapping roundtrip
const rows = [];
const sheet = {
  getLastRow: () => rows.length,
  getRange: (row, col, count) => ({ setValues: values => rows.push(...values), getValues: () => rows.slice(row - 1, row - 1 + count) }),
  setFrozenRows: () => {}, appendRow: row => rows.push(row),
};
const context = vm.createContext({ HEALTH_INDICATORS_BANK: questions,
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  DriveApp: { getFolderById: () => ({}) }, SpreadsheetApp: { flush() {} },
  Utilities: { formatDate: () => '2026-10-19 12:00:00' },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) },
});
vm.runInContext(readFileSync(new URL('../APPS_SCRIPT_FULL.gs', import.meta.url), 'utf8'), context);
context.getOrCreateSpreadsheet_ = () => ({});
context.getOrCreateSheet_ = () => sheet;
const payload = { setId: 'health-indicators-ch15-v1', attemptId: crypto.randomUUID(),
  school: '인제대학교', studentId: '00123', name: '=test', score: 999,
  questionIds: quiz.map(q => q.id), answers: quiz.map(q => ({ questionId: q.id, selected: q.answer, optionOrder: q.optionOrder })) };
const submit = data => context.doPost({ postData: { contents: JSON.stringify(data) } });
assert.equal(submit(payload).score, 20); assert.equal(rows.length, 2);
assert.equal(submit(payload).duplicate, true); assert.equal(rows.length, 2);
const repeatAttempt = submit({ ...payload, attemptId: crypto.randomUUID() });
assert.equal(repeatAttempt.ok, true); assert.equal(repeatAttempt.duplicate, false);
assert.equal(rows.length, 3);
assert.equal(rows[1][1], "'00123"); assert.equal(rows[1][2], "'=test");
assert.equal(submit({ ...payload, school: 'other' }).ok, false);
assert.equal(submit({ ...payload, questionIds: Array(20).fill(quiz[0].id) }).ok, false);
assert.equal(submit({ ...payload, answers: payload.answers.map((a, i) => i === 0 ? { ...a, optionOrder: [0, 0, 0, 0, 0] } : a) }).ok, false);
assert.equal(rows.length, 3);

const previousEndpoint = process.env.GOOGLE_SCRIPT_URL;
const originalFetch = globalThis.fetch;
try {
  delete process.env.GOOGLE_SCRIPT_URL;
  assert.equal((await POST(new Request('https://local/api', { method: 'POST', body: JSON.stringify({ setId: 'health-indicators-ch15-v1' }) }))).status, 503);
  process.env.GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/test/exec';
  globalThis.fetch = async () => Response.json({ ok: false, message: 'save failed' });
  assert.equal((await POST(new Request('https://local/api', { method: 'POST', body: JSON.stringify({ setId: 'health-indicators-ch15-v1' }) }))).status, 502);
  globalThis.fetch = async () => Response.json({ ok: true, attemptId: payload.attemptId });
  assert.equal((await POST(new Request('https://local/api', { method: 'POST', body: JSON.stringify({ setId: 'health-indicators-ch15-v1' }) }))).status, 200);
} finally {
  globalThis.fetch = originalFetch;
  if (previousEndpoint === undefined) delete process.env.GOOGLE_SCRIPT_URL;
  else process.env.GOOGLE_SCRIPT_URL = previousEndpoint;
}
console.log('PASS: 500 random draws, option/answer mapping, corrected key, persisted order, server grading, durable duplicate rejection, invalid payloads, and verified-save responses.');
