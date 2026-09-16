type InfectiousDiseaseQuestion = {
  id: number;
  prompt: string;
  options: string[];
  answer: number;
};

type DiseaseGroup = {
  level: 1 | 2 | 3 | 4;
  category: string;
  diseases: string[];
};

const diseaseGroups: DiseaseGroup[] = [
  { level: 1, category: '출혈열', diseases: ['에볼라바이러스병', '마버그열', '라싸열', '크리미안콩고출혈열', '남아메리카출혈열', '리프트밸리열'] },
  { level: 1, category: '생물테러', diseases: ['두창', '페스트', '탄저', '보툴리눔독소증', '야토병'] },
  { level: 1, category: '신종·호흡기', diseases: ['신종감염병증후군', '중증급성호흡기증후군(SARS)', '중동호흡기증후군(MERS)', '동물인플루엔자 인체감염증', '신종인플루엔자'] },
  { level: 1, category: '기타', diseases: ['디프테리아'] },
  { level: 2, category: '장관·간염', diseases: ['콜레라', '장티푸스', '파라티푸스', '세균성이질', '장출혈성대장균감염증', 'A형간염', 'E형간염'] },
  { level: 2, category: '호흡기·발진', diseases: ['결핵', '수두', '홍역', '백일해', '유행성이하선염', '풍진', '성홍열'] },
  { level: 2, category: '신경·침습', diseases: ['폴리오', '수막구균 감염증', 'b형헤모필루스인플루엔자', '폐렴구균 감염증'] },
  { level: 2, category: '만성·내성', diseases: ['한센병', '반코마이신내성황색포도알균(VRSA) 감염증', '카바페넴내성장내세균목균종(CRE) 감염증'] },
  { level: 3, category: '간염·만성', diseases: ['B형간염', 'C형간염', '후천성면역결핍증(AIDS)', '크로이츠펠트-야콥병(CJD) 및 변종 CJD', '매독'] },
  { level: 3, category: '모기 매개', diseases: ['일본뇌염', '말라리아', '황열', '뎅기열', '웨스트나일열', '치쿤구니야열', '지카바이러스 감염증'] },
  { level: 3, category: '절지동물·리케차', diseases: ['발진티푸스', '발진열', '쯔쯔가무시증', '큐열', '라임병', '진드기매개뇌염', '중증열성혈소판감소증후군(SFTS)'] },
  { level: 3, category: '인수공통', diseases: ['렙토스피라증', '브루셀라증', '공수병', '신증후군출혈열', '유비저'] },
  { level: 3, category: '기타', diseases: ['파상풍', '레지오넬라증', '비브리오패혈증'] },
  { level: 4, category: '바이러스·증후군', diseases: ['인플루엔자', '수족구병', '급성호흡기 감염증', '엔테로바이러스 감염증', '사람유두종바이러스 감염증', '장관감염증'] },
  { level: 4, category: '기생충', diseases: ['회충증', '편충증', '요충증', '간흡충증', '폐흡충증', '장흡충증', '해외유입 기생충 감염증'] },
  { level: 4, category: '성매개', diseases: ['임질', '클라미디아 감염증', '연성하감', '성기단순포진', '첨규콘딜롬'] },
  { level: 4, category: '다제내성균', diseases: ['반코마이신내성장알균(VRE) 감염증', '메티실린내성황색포도알균(MRSA) 감염증', '다제내성녹농균(MRPA) 감염증', '다제내성아시네토박터바우마니균(MRAB) 감염증'] },
];

const levelOptions = ['제1급', '제2급', '제3급', '제4급', '법정감염병에 해당하지 않음'];

const classificationQuestions: InfectiousDiseaseQuestion[] = diseaseGroups.flatMap((group) =>
  group.diseases.map((disease) => ({
    id: 0,
    prompt: `「${disease}」의 법정감염병 분류는?`,
    options: levelOptions,
    answer: group.level - 1,
  })),
);

const reportingAndCategoryQuestions: InfectiousDiseaseQuestion[] = [
  { id: 0, prompt: '발생 또는 유행 즉시 신고해야 하는 법정감염병 분류는?', options: ['제1급', '제2급', '제3급', '제4급', '모든 급'], answer: 0 },
  { id: 0, prompt: '24시간 이내 신고하고 격리가 필요한 법정감염병 분류는?', options: ['제1급', '제2급', '제3급', '제4급', '해당 없음'], answer: 1 },
  { id: 0, prompt: '24시간 이내 신고하고 발생을 계속 감시해야 하는 법정감염병 분류는?', options: ['제1급', '제2급', '제3급', '제4급', '해당 없음'], answer: 2 },
  { id: 0, prompt: '7일 이내 신고하며 표본감시 대상으로 관리하는 법정감염병 분류는?', options: ['제1급', '제2급', '제3급', '제4급', '해당 없음'], answer: 3 },
  { id: 0, prompt: '다음 중 제1급 감염병의 출혈열 분류에 해당하지 않는 것은?', options: ['에볼라바이러스병', '마버그열', '라싸열', '리프트밸리열', '신증후군출혈열'], answer: 4 },
  { id: 0, prompt: '다음 중 제1급 감염병의 생물테러 분류에 해당하는 것은?', options: ['두창', '수두', '홍역', '풍진', '성홍열'], answer: 0 },
  { id: 0, prompt: '다음 중 제2급 감염병의 장관·간염 분류에 해당하지 않는 것은?', options: ['콜레라', '장티푸스', '세균성이질', 'A형간염', 'B형간염'], answer: 4 },
  { id: 0, prompt: '다음 중 제2급 감염병의 호흡기·발진 분류에 해당하는 것은?', options: ['결핵', '인플루엔자', '급성호흡기 감염증', '레지오넬라증', '중동호흡기증후군(MERS)'], answer: 0 },
  { id: 0, prompt: '다음 중 제3급 감염병의 모기 매개 분류에 해당하지 않는 것은?', options: ['일본뇌염', '말라리아', '뎅기열', '치쿤구니야열', '쯔쯔가무시증'], answer: 4 },
  { id: 0, prompt: '다음 중 제3급 감염병의 절지동물·리케차 분류에 해당하는 것은?', options: ['쯔쯔가무시증', '콜레라', '수족구병', '공수병', '파상풍'], answer: 0 },
  { id: 0, prompt: '다음 중 제4급 감염병의 기생충 분류에 해당하지 않는 것은?', options: ['회충증', '편충증', '간흡충증', '폐흡충증', '말라리아'], answer: 4 },
  { id: 0, prompt: '다음 중 제4급 감염병의 성매개 분류에 해당하는 것은?', options: ['임질', '매독', '후천성면역결핍증(AIDS)', 'B형간염', '지카바이러스 감염증'], answer: 0 },
  { id: 0, prompt: '다음 중 제4급 감염병의 다제내성균 분류에 해당하는 것은?', options: ['반코마이신내성장알균(VRE) 감염증', '반코마이신내성황색포도알균(VRSA) 감염증', '카바페넴내성장내세균목균종(CRE) 감염증', '탄저', '보툴리눔독소증'], answer: 0 },
];

export const infectiousDiseaseQuestions: InfectiousDiseaseQuestion[] = [
  ...classificationQuestions,
  ...reportingAndCategoryQuestions,
].map((question, index) => ({ ...question, id: index + 1 }));

if (infectiousDiseaseQuestions.length !== 100) {
  throw new Error(`감염병 문제는 100문항이어야 합니다. 현재 ${infectiousDiseaseQuestions.length}문항입니다.`);
}
