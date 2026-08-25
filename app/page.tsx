'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Question = { id: string; text: string; options: string[]; answer: number };
type QuizSet = { id: string; title: string; subject: string; description: string; questions: Question[]; published: boolean };
type Student = { school: string; studentId: string; name: string };

const initialSets: QuizSet[] = [
  { id: '2025-public-health', title: '2025년도 국시 - 공중보건', subject: '공중보건', description: '제53회 작업치료사 국가시험 31~42번', published: true, questions: [
    { id: '2025-31', text: '다음 설명에 해당하는 질병 발생설은? 인체는 4액체(혈액, 점액, 황담즙, 흑담즙)로 구성되며, 나쁜 공기에 노출되면 4액체의 균형이 깨지면서 질병이 발생한다.', options: ['종교설', '점성설', '장기설', '세균설', '접촉감염설'], answer: 2 },
    { id: '2025-32', text: '콜레라 등 외래 감염병의 국내 침입으로 돌발적 유행을 나타내는 역학적 특성은?', options: ['추세변화', '주기변화', '계절변화', '단기변화', '불규칙변화'], answer: 4 },
    { id: '2025-33', text: '질병 발생의 역학적 인자들 중 다음에 해당하는 병인 형태는? 가장 많이 알려진 병인이며, 박테리아·바이러스·리케차·곰팡이·기생충 등 살아 있는 미생물이다.', options: ['물리적 병인', '정신적 병인', '생물학적 병인', '생화학적 병인', '영양소적 병인'], answer: 2 },
    { id: '2025-34', text: '각종 감염병에 감염된 후 형성되는 면역은?', options: ['선천면역', '자연능동면역', '자연수동면역', '인공능동면역', '인공수동면역'], answer: 1 },
    { id: '2025-35', text: '1948년에 설립되었고 본부가 스위스 제네바에 있으며, 국제 간 감염병 검역 대책·모자보건·재해예방·환경위생 개선 등을 수행하는 국제기구는?', options: ['세계보건기구', '국제노동기구', '유엔아동기금', '유엔환경계획', '국제적십자위원회'], answer: 0 },
    { id: '2025-36', text: '조직원의 집단적 노력을 질서 정연하게 배정하고 공동 목표를 달성하기 위한 행동 통일의 수단과 과정을 뜻하는 Gulick의 조직관리 원칙은?', options: ['목적의 원칙', '분업의 원칙', '일치의 원칙', '조정의 원칙', '명령통일의 원칙'], answer: 3 },
    { id: '2025-37', text: '보건복지부 소속기관인 것은?', options: ['국립재활원', '국립환경과학원', '한국장애인개발원', '한국장애인고용공단', '한국건강가정진흥원'], answer: 0 },
    { id: '2025-38', text: '우리나라 사회보험의 1차 사회 안전망으로, 질병·부상에 대한 예방·진단·진료·재활·출산·사망 및 건강증진에 보험급여를 제공하는 사회보장제도는?', options: ['고용보험', '국민연금', '국민건강보험', '국민기초생활보장', '노인장기요양보험'], answer: 2 },
    { id: '2025-39', text: 'Blacker의 인구변환 5단계 중 출생률이 사망률보다 낮아져 인구가 감소하며 북유럽·북아메리카·뉴질랜드·일본 등이 해당되는 단계는?', options: ['고위정지기', '초기확장기', '후기확장기', '저위정지기', '감퇴기'], answer: 4 },
    { id: '2025-40', text: '세포의 정상적인 대사 작용에 필수적인 조절소이고, 부족하면 여러 결핍 증상이 나타나며, 수용성과 지용성이 있는 영양소는?', options: ['식염', '지질', '비타민', '단백질', '탄수화물'], answer: 2 },
    { id: '2025-41', text: '측정 대상의 특성이나 성질을 나타내며 질적 수준이 가장 낮고, 성별·직업·출신 지역·인종·종교 등이 예인 척도는?', options: ['명목척도', '서열척도', '간격척도', '등간척도', '비율척도'], answer: 0 },
    { id: '2025-42', text: '어떤 연도의 영아사망수를 신생아사망수로 나눈 값이며, 1에 가까우면 그 지역의 건강 수준이 높음을 의미하는 보건 통계지표는?', options: ['사산율', 'α-index', '보통사망률', '영아사망률', '신생아사망률'], answer: 1 },
  ]},
  { id: '2025-medical-law', title: '2025년도 국시 - 의료관계법규', subject: '의료관계법규', description: '제53회 작업치료사 국가시험 71~90번', published: true, questions: [
    { id: '2025-71', text: '「의료법」상 보건복지부장관의 면허를 받은 의료인으로만 나열된 것은?', options: ['한의사, 약사', '치과의사, 약사', '의사, 치과의사', '의사, 간호조무사', '조산사, 간호조무사'], answer: 2 },
    { id: '2025-72', text: '「의료법」상 의사·치과의사·한의사 및 조산사가 사체를 검안하여 변사한 것으로 의심되는 때에는 누구에게 신고하여야 하는가?', options: ['질병관리청장', '보건복지부장관', '사체의 소재지를 관할하는 보건소장', '사체의 소재지를 관할하는 경찰서장', '사체의 소재지를 관할하는 시장·군수·구청장'], answer: 3 },
    { id: '2025-73', text: '「의료법」상 의료에 관한 광고를 할 수 없는 자는?', options: ['의사', '약사', '한의사', '의료기관의 장', '의료기관 개설자'], answer: 1 },
    { id: '2025-74', text: '「의료법」상 종합병원 중에서 중증질환에 대하여 난이도가 높은 의료행위를 전문적으로 하는 의료기관은?', options: ['전문병원', '요양병원', '한방병원', '치과병원', '상급종합병원'], answer: 4 },
    { id: '2025-75', text: '「의료법」상 의료인이 의료기관 개설자가 될 수 없는 자에게 고용되어 의료행위를 한 경우 면허자격을 몇 년의 범위에서 정지시킬 수 있는가?', options: ['1년', '2년', '3년', '4년', '5년'], answer: 0 },
    { id: '2025-76', text: '「의료법」상 한지 의료인이 허가지역을 다른 시·도로 변경하려는 경우 누구의 허가를 받아야 하는가?', options: ['질병관리청장', '보건복지부장관', '관할하는 보건소장', '의료인 단체 중앙회의 장', '관할하는 시장·군수·구청장'], answer: 1 },
    { id: '2025-77', text: '「의료기사 등에 관한 법률」상 면허 결격사유에 해당되지 않는 것은?', options: ['피성년후견인', '피한정후견인', '마약류 중독자', '정신질환자로 전문의가 의료기사등으로서 적합하다고 인정한 자', '국민건강보험법 위반으로 금고 이상의 실형을 선고받고 집행이 끝나지 않은 자'], answer: 3 },
    { id: '2025-78', text: '「의료기사 등에 관한 법률」상 면허취소 사유에 해당되는 것은?', options: ['면허를 대여한 경우', '의료기사등의 업무를 벗어나는 행위', '검사 결과를 사실과 다르게 표시하는 행위', '윤리적으로 허용되지 아니하는 방법으로 업무를 한 행위', '의사나 치과의사의 지도를 받지 아니하고 의료기사의 업무를 한 행위'], answer: 0 },
    { id: '2025-79', text: '「의료기사 등에 관한 법률」상 보수교육실시기관의 보수교육 내용과 운영에 대하여 평가할 수 있는 자는?', options: ['특별자치시장', '보건복지부장관', '시장·군수·구청장', '의료기사 중앙회의 장', '보수교육실시기관의 장'], answer: 1 },
    { id: '2025-80', text: '「의료기사 등에 관한 법률」상 작업치료사가 업무상 알게 된 비밀을 누설했을 때 벌칙은?', options: ['100만원 이하의 과태료', '500만원 이하의 과태료', '500만원 이하의 벌금', '3년 이하의 징역 또는 3천만원 이하의 벌금', '5년 이하의 징역 또는 5천만원 이하의 벌금'], answer: 3 },
    { id: '2025-81', text: '「장애인복지법」상 신체의 일부를 잃거나 관절장애가 있는 장애인은?', options: ['지체장애인', '신장장애인', '지적장애인', '시각장애인', '뇌병변장애인'], answer: 0 },
    { id: '2025-82', text: '「장애인복지법」상 장애인복지상담원으로 임용될 수 있는 자는?', options: ['언어재활사', '점역·교정사', '한국수어 통역사', '장애인재활상담사', '특수학교의 교사자격증 소지자'], answer: 4 },
    { id: '2025-83', text: '「장애인복지법」상 장애인복지관 및 장애인 주간이용시설에 해당되는 장애인복지시설은?', options: ['장애인 쉼터', '장애인 거주시설', '장애인 의료재활시설', '장애인 직업재활시설', '장애인 지역사회재활시설'], answer: 4 },
    { id: '2025-84', text: '「장애인복지법」상 장애인이 장애 예방·보완과 기능 향상을 위하여 사용하는 의지·보조기 및 일상생활 편의 증진을 위해 사용하는 생활용품은?', options: ['장애인생산품', '장애인보조기구', '장애인편의용품', '장애인자조도구', '장애인편의증진기구'], answer: 1 },
    { id: '2025-85', text: '「정신건강증진 및 정신질환자 복지서비스 지원에 관한 법률」상 정신건강작업치료사가 제공할 수 있는 개별 업무는?', options: ['심리평가', '생활훈련', '작업 수행 평가', '정신재활시설의 운영', '사회서비스 지원 등에 대한 조사'], answer: 2 },
    { id: '2025-86', text: '「정신건강증진 및 정신질환자 복지서비스 지원에 관한 법률」상 정신의료기관의 장은 응급입원을 의뢰받은 사람에게 공휴일을 제외하고 며칠 이내의 기간 동안 응급입원을 시킬 수 있는가?', options: ['3일', '5일', '7일', '10일', '15일'], answer: 0 },
    { id: '2025-87', text: '「정신건강증진 및 정신질환자 복지서비스 지원에 관한 법률」상 정신의료기관이 구성하는 협의체의 결정 없이 제공할 수 있는 치료 또는 요법은?', options: ['정신외과요법', '전기충격요법', '작업치료', '마취하최면요법', '인슐린혼수요법'], answer: 2 },
    { id: '2025-88', text: '「노인복지법」상 노인의 보건 및 복지에 관한 실태조사를 실시하고 그 결과를 공표하는 자는?', options: ['대통령', '보건소장', '질병관리청장', '지방자치단체장', '보건복지부장관'], answer: 4 },
    { id: '2025-89', text: '「노인복지법」상 노인에 대한 사회적 관심과 공경의식을 높이기 위한 노인의 날은?', options: ['4월 20일', '5월 8일', '6월 15일', '10월 2일', '10월 10일'], answer: 3 },
    { id: '2025-90', text: '「노인복지법」상 노인들에게 가정과 같은 주거여건과 급식, 그 밖에 일상생활에 필요한 편의를 제공함을 목적으로 하는 노인주거복지시설은?', options: ['양로시설', '노인요양시설', '노인복지주택', '노인공동생활가정', '노인요양공동생활가정'], answer: 3 },
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
  const [pdfBusy, setPdfBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [newSet, setNewSet] = useState({ title: '', subject: '', description: '', questions: '' });

  useEffect(() => { const saved = localStorage.getItem('campus-quiz-sets-2025'); if (saved) { try { setSets(JSON.parse(saved)); } catch {} } }, []);
  const selected = useMemo(() => sets.find((s) => s.id === selectedId), [sets, selectedId]);
  const score = selected ? selected.questions.filter((q) => answers[q.id] === q.answer).length : 0;
  const wrongQuestions = selected ? selected.questions.filter((q) => answers[q.id] !== q.answer) : [];
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
    const next = [...sets, { id: `set-${Date.now()}`, ...newSet, questions, published: true }]; setSets(next); localStorage.setItem('campus-quiz-sets-2025', JSON.stringify(next)); setNewSet({ title: '', subject: '', description: '', questions: '' }); notify('새 문제 세트가 공개되었습니다.');
  }
  function reset() { setStudent({ school: '', studentId: '', name: '' }); setSelectedId(''); setAnswers({}); setView('start'); }

  async function downloadReviewPdf() {
    if (!selected) return;
    const review = document.getElementById('review-pdf');
    if (!review) return;
    setPdfBusy(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
      const canvas = await html2canvas(review, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 190;
      const pageHeight = 277;
      const sliceHeight = Math.floor(canvas.width * (pageHeight / pageWidth));
      let offset = 0;
      let page = 0;
      while (offset < canvas.height) {
        const height = Math.min(sliceHeight, canvas.height - offset);
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = height;
        const context = slice.getContext('2d');
        if (!context) throw new Error('PDF canvas unavailable');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, slice.width, slice.height);
        context.drawImage(canvas, 0, offset, canvas.width, height, 0, 0, canvas.width, height);
        if (page > 0) pdf.addPage();
        pdf.addImage(slice.toDataURL('image/jpeg', 0.94), 'JPEG', 10, 10, pageWidth, (height / canvas.width) * pageWidth);
        offset += height;
        page += 1;
      }
      const safeTitle = selected.title.replace(/[^가-힣a-zA-Z0-9_-]/g, '_');
      pdf.save(`${safeTitle}_${student.studentId}_${student.name}_오답노트.pdf`);
    } catch {
      notify('PDF 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setPdfBusy(false);
    }
  }

  return <main className="min-h-screen bg-[#f4f7fb] text-[#182338]">
    <header className="sticky top-0 z-20 border-b border-[#dfe5ee] bg-white/95 px-5 py-3 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center justify-between"><button onClick={reset} className="flex items-center gap-3 text-left"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#176b5b] text-lg font-black text-white">Q</span><span><b className="block tracking-tight">캠퍼스 문제은행</b><small className="text-[#6b778c]">보건의료 학습센터</small></span></button><button onClick={() => setView(view === 'admin' ? 'start' : 'admin')} className="rounded-lg px-3 py-2 text-sm font-bold text-[#667085] hover:bg-[#f1f4f8]">{view === 'admin' ? '학생 화면' : '관리자'}</button></div></header>

    {view === 'start' && <section className="mx-auto grid max-w-5xl gap-8 px-5 py-10 md:grid-cols-[1fr_420px] md:items-center md:py-20"><div><span className="pill">모바일 문제풀이</span><h1 className="mt-5 text-4xl font-black leading-tight tracking-[-.04em] md:text-5xl">오늘의 학습을<br/>가볍게 시작해요.</h1><p className="mt-4 max-w-md leading-7 text-[#667085]">학교와 학생 정보를 입력하고, 교수님이 등록한 문제 세트를 선택해 바로 풀어보세요.</p><div className="mt-7 hidden gap-6 text-sm text-[#667085] md:flex"><span>✓ 로그인 없이 시작</span><span>✓ 자동 제출 저장</span></div></div><form className="card p-6" onSubmit={start}><div className="mb-6"><p className="eyebrow">STEP 01</p><h2 className="mt-1 text-2xl font-extrabold">학생 정보 입력</h2><p className="mt-1 text-sm text-[#7a8496]">정확한 정보를 입력해 주세요.</p></div><label className="field-label">학교</label><select className="field" value={student.school} onChange={(e) => setStudent({...student, school:e.target.value})}><option value="">학교를 선택해 주세요</option>{schools.map((s) => <option key={s}>{s}</option>)}</select><div className="mt-4 grid grid-cols-2 gap-3"><div><label className="field-label">학번</label><input className="field" inputMode="numeric" placeholder="20260001" value={student.studentId} onChange={(e) => setStudent({...student, studentId:e.target.value})}/></div><div><label className="field-label">이름</label><input className="field" placeholder="홍길동" value={student.name} onChange={(e) => setStudent({...student, name:e.target.value})}/></div></div><button className="primary mt-6">문제 세트 선택하기 →</button><p className="mt-4 text-center text-xs leading-5 text-[#8a94a6]">입력한 정보는 답안 제출 및 결과 확인에만 사용됩니다.</p></form></section>}

    {view === 'sets' && <section className="mx-auto max-w-3xl px-5 py-9"><button className="back" onClick={() => setView('start')}>← 학생 정보 수정</button><div className="mt-5"><p className="eyebrow">STEP 02</p><h1 className="text-3xl font-black tracking-tight">풀 문제를 선택하세요</h1><p className="mt-2 text-[#667085]">{student.school} · {student.studentId} · {student.name}</p></div><div className="mt-7 grid gap-4">{sets.filter((s) => s.published).map((set) => <button key={set.id} onClick={() => choose(set)} className="card flex items-center gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-[#9ec7bd]"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e7f3f0] text-xl">📘</span><span className="min-w-0 flex-1"><b className="block text-lg">{set.title}</b><small className="mt-1 block text-[#778195]">{set.description || set.subject} · {set.questions.length}문제</small></span><span className="text-[#176b5b]">→</span></button>)}</div></section>}

    {view === 'quiz' && selected && <section className="mx-auto max-w-3xl px-5 py-7"><div className="flex items-center justify-between text-sm"><button className="back" onClick={() => setView('sets')}>← 나가기</button><b>{current + 1} / {selected.questions.length}</b></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-[#dfe5ee]"><div className="h-full rounded-full bg-[#176b5b] transition-all" style={{width:`${((current + 1) / selected.questions.length) * 100}%`}}/></div><div className="mt-6 card p-6 md:p-8"><p className="eyebrow">{selected.title}</p><h1 className="mt-3 text-xl font-extrabold leading-8"><span className="mr-2 text-[#176b5b]">Q{current + 1}.</span>{selected.questions[current].text}</h1><div className="mt-7 grid gap-3">{selected.questions[current].options.map((option, i) => <button key={option} onClick={() => setAnswers({...answers, [selected.questions[current].id]:i})} className={`option ${answers[selected.questions[current].id] === i ? 'option-selected' : ''}`}><span>{i + 1}</span>{option}</button>)}</div></div><div className="mt-5 flex gap-3"><button disabled={current === 0} onClick={() => setCurrent(current - 1)} className="secondary disabled:opacity-40">이전</button>{current < selected.questions.length - 1 ? <button onClick={() => setCurrent(current + 1)} className="primary">다음 문제</button> : <button onClick={submitQuiz} className="primary">답안 제출하기</button>}</div></section>}

    {view === 'result' && selected && submitted && <section className="mx-auto max-w-3xl px-5 py-12"><div className="card p-8 text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#e1f3ed] text-4xl">✓</div><p className="eyebrow mt-6">제출 완료</p><h1 className="mt-2 text-3xl font-black">수고했어요, {student.name}님!</h1><p className="mt-3 text-[#667085]">{selected.title} 답안이 안전하게 저장되었습니다.</p><div className="mx-auto my-7 grid h-36 w-36 place-items-center rounded-full border-[10px] border-[#dff0eb]"><div><b className="text-4xl text-[#176b5b]">{score}</b><span className="text-lg text-[#7a8496]"> / {selected.questions.length}</span><small className="mt-1 block text-[#7a8496]">정답 수</small></div></div><div className="grid gap-3 sm:grid-cols-2"><button onClick={downloadReviewPdf} disabled={pdfBusy} className="primary disabled:opacity-60">{pdfBusy ? 'PDF 만드는 중…' : '오답노트 PDF 받기'}</button><button onClick={() => setView('sets')} className="secondary">다른 문제 풀기</button></div><button onClick={reset} className="mt-3 w-full py-3 text-sm font-bold text-[#667085]">처음으로 돌아가기</button></div>
      <div id="review-pdf" className="mt-7 rounded-[1.35rem] bg-white p-5 text-left md:p-8"><div className="border-b border-[#dfe5ee] pb-6"><p className="eyebrow">개인 오답노트</p><h2 className="mt-2 text-2xl font-black">{selected.title}</h2><div className="mt-3 grid gap-1 text-sm text-[#667085] sm:grid-cols-2"><p>학교: {student.school}</p><p>학번: {student.studentId}</p><p>이름: {student.name}</p><p>결과: {score}/{selected.questions.length}점 · 오답 {wrongQuestions.length}개</p></div></div>
        {wrongQuestions.length === 0 ? <div className="py-12 text-center"><p className="text-4xl">🎉</p><h3 className="mt-3 text-xl font-black">모든 문제를 맞혔어요!</h3><p className="mt-2 text-sm text-[#667085]">완벽하게 학습을 마쳤습니다.</p></div> : <div className="mt-6 grid gap-5">{wrongQuestions.map((q) => { const selectedAnswer = answers[q.id]; const sourceNumber = q.id.split('-').pop(); return <article key={q.id} className="review-question"><div className="flex items-start justify-between gap-3"><h3 className="font-extrabold leading-7"><span className="mr-2 text-red-600">{sourceNumber}번</span>{q.text}</h3><span className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-extrabold text-red-600">오답</span></div><ol className="mt-4 grid gap-2">{q.options.map((option, index) => <li key={option} className={`review-option ${index === q.answer ? 'review-correct' : ''} ${index === selectedAnswer && index !== q.answer ? 'review-wrong' : ''}`}><span>{index + 1}</span><p>{option}</p>{index === q.answer && <b>정답</b>}{index === selectedAnswer && index !== q.answer && <b>내 답</b>}</li>)}</ol><div className="mt-4 grid gap-2 rounded-xl bg-[#f7f9fc] p-4 text-sm sm:grid-cols-2"><p><b>내가 선택한 답:</b> {selectedAnswer === undefined ? '미응답' : `${selectedAnswer + 1}번 ${q.options[selectedAnswer]}`}</p><p className="text-[#176b5b]"><b>정답:</b> {q.answer + 1}번 {q.options[q.answer]}</p></div></article>; })}</div>}
        <p className="mt-8 border-t border-[#dfe5ee] pt-4 text-center text-xs text-[#8a94a6]">캠퍼스 문제은행 · 자율학습 오답노트</p>
      </div>
    </section>}

    {view === 'admin' && <section className="mx-auto max-w-4xl px-5 py-9"><span className="pill">관리자 베타</span><h1 className="mt-4 text-3xl font-black">문제 세트 관리</h1><p className="mt-2 text-[#667085]">1차 버전은 이 기기에 저장됩니다. 추후 계정과 중앙 DB를 연결할 수 있는 구조입니다.</p><div className="mt-7 grid gap-6 md:grid-cols-[1fr_1.2fr]"><div><h2 className="mb-3 font-extrabold">등록된 세트</h2><div className="grid gap-3">{sets.map((s) => <div className="card p-4" key={s.id}><div className="flex justify-between gap-3"><div><b>{s.title}</b><p className="mt-1 text-xs text-[#7a8496]">{s.subject} · {s.questions.length}문제</p></div><button className="text-xs font-bold text-red-500" onClick={() => { const next=sets.filter((x)=>x.id!==s.id); setSets(next); localStorage.setItem('campus-quiz-sets-2025',JSON.stringify(next)); }}>삭제</button></div></div>)}</div></div><form className="card p-6" onSubmit={addSet}><h2 className="text-xl font-extrabold">새 문제 세트</h2><div className="mt-5 grid gap-4"><div><label className="field-label">세트 제목</label><input className="field" placeholder="2회차 공중보건" value={newSet.title} onChange={(e)=>setNewSet({...newSet,title:e.target.value})}/></div><div><label className="field-label">과목</label><input className="field" placeholder="공중보건" value={newSet.subject} onChange={(e)=>setNewSet({...newSet,subject:e.target.value})}/></div><div><label className="field-label">설명</label><input className="field" placeholder="핵심 개념 점검" value={newSet.description} onChange={(e)=>setNewSet({...newSet,description:e.target.value})}/></div><div><label className="field-label">문제 일괄 입력</label><textarea className="field min-h-36" placeholder={'질문 | 보기1 | 보기2 | 보기3 | 보기4 | 정답번호\n두 번째 질문 | 보기1 | 보기2 | 보기3 | 보기4 | 2'} value={newSet.questions} onChange={(e)=>setNewSet({...newSet,questions:e.target.value})}/><p className="mt-2 text-xs leading-5 text-[#7a8496]">한 줄에 한 문제, 각 항목은 | 기호로 구분합니다. 정답번호는 1~4입니다.</p></div></div><button className="primary mt-5">등록하고 공개하기</button></form></div></section>}
    {toast && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#172338] px-5 py-3 text-sm font-bold text-white shadow-xl">{toast}</div>}
  </main>;
}
