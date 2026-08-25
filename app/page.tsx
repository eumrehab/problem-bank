'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Question = { id: string; text: string; options: string[]; answer: number };
type QuizSet = { id: string; title: string; subject: string; description: string; questions: Question[]; published: boolean };
type Student = { school: string; studentId: string; name: string };

const initialSets: QuizSet[] = [
  { id: 'public-health-01', title: '1회차 공중보건', subject: '공중보건', description: '역학·환경보건·보건행정 핵심 개념', published: true, questions: [
    { id: 'ph-1', text: '질병 발생의 원인과 분포를 연구하는 학문은?', options: ['보건행정학', '역학', '병리학', '의료사회학'], answer: 1 },
    { id: 'ph-2', text: '일정 기간 새롭게 발생한 환자의 비율을 나타내는 지표는?', options: ['유병률', '치명률', '발생률', '사망률'], answer: 2 },
    { id: 'ph-3', text: 'WHO가 제시한 건강의 정의에 포함되지 않는 것은?', options: ['신체적 안녕', '정신적 안녕', '사회적 안녕', '경제적 풍요'], answer: 3 },
  ]},
  { id: 'medical-law-01', title: '1회차 의료법규', subject: '의료법규', description: '의료법 기본 원칙과 의료인의 의무', published: true, questions: [
    { id: 'ml-1', text: '의료법상 의료인에 해당하지 않는 사람은?', options: ['의사', '간호사', '약사', '조산사'], answer: 2 },
    { id: 'ml-2', text: '의료인이 진료기록부를 거짓으로 작성해서는 안 되는 이유로 가장 적절한 것은?', options: ['광고 제한', '진료의 연속성과 환자 보호', '수가 계산', '병상 관리'], answer: 1 },
  ]},
];

const schools = ['인제대학교', '동명대학교', '경남대학교'];

export default function Home() {
  const [view, setView] = useState<'start'|'sets'|'quiz'|'result'|'admin'>('start');
  const [student, setStudent] = useState<Student>({ school: '', studentId: '', name: '' });
  const [sets, setSets] = useState<QuizSet[]>(initialSets);
  const [selectedId, setSelectedId] = useState('');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState('');
  const [newSet, setNewSet] = useState({ title: '', subject: '', description: '', questions: '' });

  useEffect(() => { const saved = localStorage.getItem('campus-quiz-sets'); if (saved) { try { setSets(JSON.parse(saved)); } catch {} } }, []);
  const selected = useMemo(() => sets.find((s) => s.id === selectedId), [sets, selectedId]);
  const score = selected ? selected.questions.filter((q) => answers[q.id] === q.answer).length : 0;
  const notify = (message: string) => { setToast(message); setTimeout(() => setToast(''), 2600); };

  function start(e: FormEvent) { e.preventDefault(); if (!student.school || !student.studentId.trim() || !student.name.trim()) return notify('학생 정보를 모두 입력해 주세요.'); setView('sets'); }
  function choose(set: QuizSet) { setSelectedId(set.id); setAnswers({}); setCurrent(0); setSubmitted(false); setView('quiz'); window.scrollTo(0, 0); }
  async function submitQuiz() {
    if (!selected) return;
    if (Object.keys(answers).length < selected.questions.length && !confirm('아직 풀지 않은 문제가 있습니다. 그래도 제출할까요?')) return;
    const payload = { submittedAt: new Date().toISOString(), ...student, setId: selected.id, setTitle: selected.title, score, total: selected.questions.length, answers: selected.questions.map((q) => ({ questionId: q.id, selected: answers[q.id] ?? '', correct: q.answer })) };
    const endpoint = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
    try { if (endpoint) await fetch(endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) }); else { const demo = JSON.parse(localStorage.getItem('demo-submissions') || '[]'); localStorage.setItem('demo-submissions', JSON.stringify([...demo, payload])); } setSubmitted(true); setView('result'); } catch { notify('제출 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.'); }
  }
  function addSet(e: FormEvent) {
    e.preventDefault();
    const lines = newSet.questions.split('\n').map((v) => v.trim()).filter(Boolean);
    const questions: Question[] = lines.map((line, i) => { const parts = line.split('|').map((v) => v.trim()); return { id: `custom-${Date.now()}-${i}`, text: parts[0] || `문제 ${i + 1}`, options: parts.slice(1, 5), answer: Math.max(0, Number(parts[5] || 1) - 1) }; }).filter((q) => q.options.length === 4);
    if (!newSet.title || !newSet.subject || !questions.length) return notify('제목, 과목과 올바른 문제를 입력해 주세요.');
    const next = [...sets, { id: `set-${Date.now()}`, ...newSet, questions, published: true }]; setSets(next); localStorage.setItem('campus-quiz-sets', JSON.stringify(next)); setNewSet({ title: '', subject: '', description: '', questions: '' }); notify('새 문제 세트가 공개되었습니다.');
  }
  function reset() { setStudent({ school: '', studentId: '', name: '' }); setSelectedId(''); setAnswers({}); setView('start'); }

  return <main className="min-h-screen bg-[#f4f7fb] text-[#182338]">
    <header className="sticky top-0 z-20 border-b border-[#dfe5ee] bg-white/95 px-5 py-3 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center justify-between"><button onClick={reset} className="flex items-center gap-3 text-left"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#176b5b] text-lg font-black text-white">Q</span><span><b className="block tracking-tight">캠퍼스 문제은행</b><small className="text-[#6b778c]">보건의료 학습센터</small></span></button><button onClick={() => setView(view === 'admin' ? 'start' : 'admin')} className="rounded-lg px-3 py-2 text-sm font-bold text-[#667085] hover:bg-[#f1f4f8]">{view === 'admin' ? '학생 화면' : '관리자'}</button></div></header>

    {view === 'start' && <section className="mx-auto grid max-w-5xl gap-8 px-5 py-10 md:grid-cols-[1fr_420px] md:items-center md:py-20"><div><span className="pill">모바일 문제풀이</span><h1 className="mt-5 text-4xl font-black leading-tight tracking-[-.04em] md:text-5xl">오늘의 학습을<br/>가볍게 시작해요.</h1><p className="mt-4 max-w-md leading-7 text-[#667085]">학교와 학생 정보를 입력하고, 교수님이 등록한 문제 세트를 선택해 바로 풀어보세요.</p><div className="mt-7 hidden gap-6 text-sm text-[#667085] md:flex"><span>✓ 로그인 없이 시작</span><span>✓ 자동 제출 저장</span></div></div><form className="card p-6" onSubmit={start}><div className="mb-6"><p className="eyebrow">STEP 01</p><h2 className="mt-1 text-2xl font-extrabold">학생 정보 입력</h2><p className="mt-1 text-sm text-[#7a8496]">정확한 정보를 입력해 주세요.</p></div><label className="field-label">학교</label><select className="field" value={student.school} onChange={(e) => setStudent({...student, school:e.target.value})}><option value="">학교를 선택해 주세요</option>{schools.map((s) => <option key={s}>{s}</option>)}</select><div className="mt-4 grid grid-cols-2 gap-3"><div><label className="field-label">학번</label><input className="field" inputMode="numeric" placeholder="20260001" value={student.studentId} onChange={(e) => setStudent({...student, studentId:e.target.value})}/></div><div><label className="field-label">이름</label><input className="field" placeholder="홍길동" value={student.name} onChange={(e) => setStudent({...student, name:e.target.value})}/></div></div><button className="primary mt-6">문제 세트 선택하기 →</button><p className="mt-4 text-center text-xs leading-5 text-[#8a94a6]">입력한 정보는 답안 제출 및 결과 확인에만 사용됩니다.</p></form></section>}

    {view === 'sets' && <section className="mx-auto max-w-3xl px-5 py-9"><button className="back" onClick={() => setView('start')}>← 학생 정보 수정</button><div className="mt-5"><p className="eyebrow">STEP 02</p><h1 className="text-3xl font-black tracking-tight">풀 문제를 선택하세요</h1><p className="mt-2 text-[#667085]">{student.school} · {student.studentId} · {student.name}</p></div><div className="mt-7 grid gap-4">{sets.filter((s) => s.published).map((set) => <button key={set.id} onClick={() => choose(set)} className="card flex items-center gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-[#9ec7bd]"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e7f3f0] text-xl">📘</span><span className="min-w-0 flex-1"><b className="block text-lg">{set.title}</b><small className="mt-1 block text-[#778195]">{set.description || set.subject} · {set.questions.length}문제</small></span><span className="text-[#176b5b]">→</span></button>)}</div></section>}

    {view === 'quiz' && selected && <section className="mx-auto max-w-3xl px-5 py-7"><div className="flex items-center justify-between text-sm"><button className="back" onClick={() => setView('sets')}>← 나가기</button><b>{current + 1} / {selected.questions.length}</b></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-[#dfe5ee]"><div className="h-full rounded-full bg-[#176b5b] transition-all" style={{width:`${((current + 1) / selected.questions.length) * 100}%`}}/></div><div className="mt-6 card p-6 md:p-8"><p className="eyebrow">{selected.title}</p><h1 className="mt-3 text-xl font-extrabold leading-8"><span className="mr-2 text-[#176b5b]">Q{current + 1}.</span>{selected.questions[current].text}</h1><div className="mt-7 grid gap-3">{selected.questions[current].options.map((option, i) => <button key={option} onClick={() => setAnswers({...answers, [selected.questions[current].id]:i})} className={`option ${answers[selected.questions[current].id] === i ? 'option-selected' : ''}`}><span>{i + 1}</span>{option}</button>)}</div></div><div className="mt-5 flex gap-3"><button disabled={current === 0} onClick={() => setCurrent(current - 1)} className="secondary disabled:opacity-40">이전</button>{current < selected.questions.length - 1 ? <button onClick={() => setCurrent(current + 1)} className="primary">다음 문제</button> : <button onClick={submitQuiz} className="primary">답안 제출하기</button>}</div></section>}

    {view === 'result' && selected && submitted && <section className="mx-auto max-w-lg px-5 py-12 text-center"><div className="card p-8"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#e1f3ed] text-4xl">✓</div><p className="eyebrow mt-6">제출 완료</p><h1 className="mt-2 text-3xl font-black">수고했어요, {student.name}님!</h1><p className="mt-3 text-[#667085]">{selected.title} 답안이 안전하게 저장되었습니다.</p><div className="mx-auto my-7 grid h-36 w-36 place-items-center rounded-full border-[10px] border-[#dff0eb]"><div><b className="text-4xl text-[#176b5b]">{score}</b><span className="text-lg text-[#7a8496]"> / {selected.questions.length}</span><small className="mt-1 block text-[#7a8496]">정답 수</small></div></div><button onClick={() => setView('sets')} className="primary">다른 문제 풀기</button><button onClick={reset} className="mt-3 w-full py-3 text-sm font-bold text-[#667085]">처음으로 돌아가기</button></div></section>}

    {view === 'admin' && <section className="mx-auto max-w-4xl px-5 py-9"><span className="pill">관리자 베타</span><h1 className="mt-4 text-3xl font-black">문제 세트 관리</h1><p className="mt-2 text-[#667085]">1차 버전은 이 기기에 저장됩니다. 추후 계정과 중앙 DB를 연결할 수 있는 구조입니다.</p><div className="mt-7 grid gap-6 md:grid-cols-[1fr_1.2fr]"><div><h2 className="mb-3 font-extrabold">등록된 세트</h2><div className="grid gap-3">{sets.map((s) => <div className="card p-4" key={s.id}><div className="flex justify-between gap-3"><div><b>{s.title}</b><p className="mt-1 text-xs text-[#7a8496]">{s.subject} · {s.questions.length}문제</p></div><button className="text-xs font-bold text-red-500" onClick={() => { const next=sets.filter((x)=>x.id!==s.id); setSets(next); localStorage.setItem('campus-quiz-sets',JSON.stringify(next)); }}>삭제</button></div></div>)}</div></div><form className="card p-6" onSubmit={addSet}><h2 className="text-xl font-extrabold">새 문제 세트</h2><div className="mt-5 grid gap-4"><div><label className="field-label">세트 제목</label><input className="field" placeholder="2회차 공중보건" value={newSet.title} onChange={(e)=>setNewSet({...newSet,title:e.target.value})}/></div><div><label className="field-label">과목</label><input className="field" placeholder="공중보건" value={newSet.subject} onChange={(e)=>setNewSet({...newSet,subject:e.target.value})}/></div><div><label className="field-label">설명</label><input className="field" placeholder="핵심 개념 점검" value={newSet.description} onChange={(e)=>setNewSet({...newSet,description:e.target.value})}/></div><div><label className="field-label">문제 일괄 입력</label><textarea className="field min-h-36" placeholder={'질문 | 보기1 | 보기2 | 보기3 | 보기4 | 정답번호\n두 번째 질문 | 보기1 | 보기2 | 보기3 | 보기4 | 2'} value={newSet.questions} onChange={(e)=>setNewSet({...newSet,questions:e.target.value})}/><p className="mt-2 text-xs leading-5 text-[#7a8496]">한 줄에 한 문제, 각 항목은 | 기호로 구분합니다. 정답번호는 1~4입니다.</p></div></div><button className="primary mt-5">등록하고 공개하기</button></form></div></section>}
    {toast && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#172338] px-5 py-3 text-sm font-bold text-white shadow-xl">{toast}</div>}
  </main>;
}
