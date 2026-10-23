const ROOT_FOLDER_ID = '1R7aFmDTAE6qGLOUgDsoZfA_6geKkVms5';
const VISIBILITY_PROPERTY = 'QUIZ_VISIBILITY';
const DUPLICATE_SECONDS = 60;

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('제출 데이터가 없습니다.');
    }

    const data = JSON.parse(e.postData.contents);

    if (data.setId === 'health-indicators-ch15-v1') {
      return saveHealthIndicatorSubmission_(data);
    }

    if (data.action === 'setVisibility') {
      return setVisibility_(data);
    }

    validateSubmission_(data);

    const duplicateKey = makeDuplicateKey_(data);
    const cache = CacheService.getScriptCache();

    if (cache.get(duplicateKey)) {
      return jsonResponse_({ ok: true, duplicate: true, message: '중복 제출을 저장하지 않았습니다.' });
    }

    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const schoolFolder = getOrCreateFolder_(rootFolder, convertSchoolName_(data.school));
    const subjectName = findSubjectName_(data.setId, data.subject, data.setTitle);
    const subjectFolder = getOrCreateFolder_(schoolFolder, subjectName);
    const fileName = findFileName_(data.setId, subjectName, data.setTitle);
    const spreadsheet = getOrCreateSpreadsheet_(subjectFolder, fileName);
    const sheetName = findSheetName_(data.setId, data.setTitle);
    const sheet = getOrCreateSheet_(spreadsheet, sheetName);

    saveSubmission_(sheet, data);
    cache.put(duplicateKey, '1', DUPLICATE_SECONDS);

    return jsonResponse_({
      ok: true,
      duplicate: false,
      school: convertSchoolName_(data.school),
      subject: subjectName,
      file: fileName,
      sheet: sheetName
    });
  } catch (error) {
    return jsonResponse_({ ok: false, message: String(error && error.message ? error.message : error) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function doGet(e) {
  if (!e || !e.parameter || e.parameter.action !== 'getVisibility') {
    return jsonResponse_({ ok: false, message: '지원하지 않는 요청입니다.' });
  }

  const saved = PropertiesService.getScriptProperties().getProperty(VISIBILITY_PROPERTY);
  return jsonResponse_({ ok: true, visibility: saved ? JSON.parse(saved) : {} });
}

function setVisibility_(data) {
  if (data.adminId !== 'admin' || data.adminPassword !== 'admin') {
    return jsonResponse_({ ok: false, message: '관리자 인증에 실패했습니다.' });
  }

  PropertiesService.getScriptProperties().setProperty(
    VISIBILITY_PROPERTY,
    JSON.stringify(data.visibility || {})
  );

  return jsonResponse_({ ok: true });
}

function validateSubmission_(data) {
  if (!data.school || !data.studentId || !data.name) {
    throw new Error('학교, 학번, 이름이 필요합니다.');
  }
  if (!data.setId || !data.setTitle) {
    throw new Error('문제 세트 정보가 없습니다.');
  }
  if (!Array.isArray(data.answers) || data.answers.length === 0) {
    throw new Error('제출할 답안이 없습니다.');
  }
}

function makeDuplicateKey_(data) {
  const source = JSON.stringify({
    school: data.school,
    studentId: String(data.studentId),
    setId: data.setId,
    answers: data.answers
  });
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, source, Utilities.Charset.UTF_8);
  return 'submission-' + Utilities.base64EncodeWebSafe(digest).replace(/=+$/, '');
}

function convertSchoolName_(school) {
  const value = String(school || '').trim();
  if (value.indexOf('인제') !== -1) return '인제대';
  if (value.indexOf('동명') !== -1) return '동명대';
  if (value.indexOf('경남') !== -1) return '경남대';
  return safeName_(value || '기타 학교');
}

function normalizeRouteText_(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, '');
}

function isBookPublicHealth_(setId, suppliedSubject, setTitle) {
  const id = normalizeRouteText_(setId);
  const subject = normalizeRouteText_(suppliedSubject);
  const title = normalizeRouteText_(setTitle);

  return id.indexOf('book-public-health-') === 0 ||
    id.indexOf('public-infectious-diseases') !== -1 ||
    subject.indexOf('공중보건') !== -1 ||
    title.indexOf('교재문제·공중보건') !== -1 ||
    title.indexOf('교재공중보건') !== -1;
}

function isBookMedicalLaw_(setId, suppliedSubject, setTitle) {
  const id = normalizeRouteText_(setId);
  const subject = normalizeRouteText_(suppliedSubject);
  const title = normalizeRouteText_(setTitle);

  return id.indexOf('book-medical-law-') === 0 ||
    subject.indexOf('의료관계법규') !== -1 ||
    subject.indexOf('의료법규') !== -1 ||
    title.indexOf('교재문제·의료관계법규') !== -1 ||
    title.indexOf('교재의료관계법규') !== -1;
}

function isBookSubmission_(setId, setTitle) {
  const id = normalizeRouteText_(setId);
  const title = normalizeRouteText_(setTitle);
  return id.indexOf('book-') === 0 || title.indexOf('교재') !== -1;
}

function findSubjectName_(setId, suppliedSubject, setTitle) {
  const id = normalizeRouteText_(setId);

  if (isBookPublicHealth_(setId, suppliedSubject, setTitle)) return '공중보건';
  if (isBookMedicalLaw_(setId, suppliedSubject, setTitle)) return '의료법규';
  if (id === '2025-public-health') return '공중보건';
  if (id === '2025-medical-law') return '의료법규';
  return '기타 문제';
}

function findFileName_(setId, subjectName, setTitle) {
  const id = normalizeRouteText_(setId);

  if (isBookSubmission_(setId, setTitle) && subjectName === '공중보건') return '교재 공중보건학';
  if (isBookSubmission_(setId, setTitle) && subjectName === '의료법규') return '교재 의료관계법규';
  if (id === '2025-public-health') return '2025공중보건';
  if (id === '2025-medical-law') return '2025의료법규';
  return safeName_(subjectName + ' 응답');
}

function findSheetName_(setId, setTitle) {
  const id = String(setId || '').toLowerCase();

  if (id.indexOf('book-') === 0) {
    const parts = String(setTitle || '').split('·');
    return safeSheetName_((parts[parts.length - 1] || '교재 문제').trim());
  }
  return '응답';
}

function getOrCreateFolder_(parentFolder, name) {
  const folders = parentFolder.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parentFolder.createFolder(name);
}

function getOrCreateSpreadsheet_(folder, name) {
  const files = folder.getFilesByName(name);

  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType() === MimeType.GOOGLE_SHEETS) {
      return SpreadsheetApp.openById(file.getId());
    }
  }

  const spreadsheet = SpreadsheetApp.create(name);
  DriveApp.getFileById(spreadsheet.getId()).moveTo(folder);
  return spreadsheet;
}

function getOrCreateSheet_(spreadsheet, name) {
  let sheet = spreadsheet.getSheetByName(name);
  if (sheet) return sheet;

  const sheets = spreadsheet.getSheets();
  if (sheets.length === 1 && sheets[0].getLastRow() === 0) {
    sheet = sheets[0];
    sheet.setName(name);
    return sheet;
  }

  return spreadsheet.insertSheet(name);
}

function saveSubmission_(sheet, data) {
  const baseHeaders = ['제출시각', '학번', '이름', '정답수', '응답수', '정답률', '오답수'];
  const answers = data.answers || [];

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, baseHeaders.length).setValues([baseHeaders]);
  }

  let lastColumn = Math.max(sheet.getLastColumn(), baseHeaders.length);
  let headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  answers.forEach(function(answer, index) {
    const label = questionLabel_(answer.questionId, index);
    if (headers.indexOf(label) === -1) {
      headers.push(label);
    }
  });

  if (headers.length > lastColumn) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    lastColumn = headers.length;
  }

  const total = Number(data.total || answers.length);
  const score = Number(data.score || 0);
  const wrong = Math.max(0, total - score);
  const percent = total > 0 ? Math.round(score / total * 100) + '%' : '0%';
  const submittedAt = data.submittedAt ? new Date(data.submittedAt) : new Date();
  const timestamp = Utilities.formatDate(submittedAt, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  const row = new Array(lastColumn).fill('');

  row[0] = timestamp;
  row[1] = String(data.studentId);
  row[2] = String(data.name);
  row[3] = score;
  row[4] = total;
  row[5] = percent;
  row[6] = wrong;

  answers.forEach(function(answer, index) {
    const label = questionLabel_(answer.questionId, index);
    const column = headers.indexOf(label);
    const selected = Number(answer.selected) + 1;
    const correct = Number(answer.correct) + 1;
    row[column] = selected === correct ? selected + ' ✓' : selected + ' → 정답 ' + correct;
  });

  sheet.appendRow(row);
  formatSheet_(sheet, headers.length);
}

function questionLabel_(questionId, fallbackIndex) {
  const id = String(questionId || '');
  const number = id.split('-').pop();
  return /^\d+$/.test(number) ? number + '번' : '문항 ' + (fallbackIndex + 1);
}

function formatSheet_(sheet, columnCount) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, columnCount)
    .setFontWeight('bold')
    .setBackground('#176b5b')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');
  sheet.setRowHeight(1, 32);
  sheet.setColumnWidth(1, 145);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 90);
  for (let column = 4; column <= columnCount; column += 1) {
    sheet.setColumnWidth(column, column <= 7 ? 75 : 105);
  }
}

function safeName_(value) {
  return String(value || '').replace(/[\\/:*?"<>|]/g, ' ').trim().substring(0, 100) || '기타';
}

function safeSheetName_(value) {
  return String(value || '').replace(/[\\/?*\[\]:]/g, ' ').trim().substring(0, 100) || '응답';
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Runs under doPost's script-wide lock. The response row itself is the durable
// idempotency record: retries after timeouts cannot create an extra row.
function saveHealthIndicatorSubmission_(data) {
  if (typeof HEALTH_INDICATORS_BANK === 'undefined' || HEALTH_INDICATORS_BANK.length !== 30) {
    throw new Error('15장 특별 문제 원문 등록이 아직 완료되지 않았습니다.');
  }
  const school = String(data.school || '').trim();
  const studentId = String(data.studentId || '').trim();
  const name = String(data.name || '').trim();
  if (['인제대학교', '동명대학교', '경남대학교'].indexOf(school) === -1 ||
      !studentId || studentId.length > 40 || !name || name.length > 80 ||
      !/^[a-zA-Z0-9-]{20,80}$/.test(String(data.attemptId || ''))) {
    throw new Error('학교, 학번, 이름, 응시 ID를 확인해 주세요.');
  }
  if (!Array.isArray(data.answers) || data.answers.length !== 20 ||
      !Array.isArray(data.questionIds) || data.questionIds.length !== 20 ||
      new Set(data.questionIds).size !== 20) throw new Error('서로 다른 20문항이 필요합니다.');
  let score = 0;
  const answers = data.answers.map(function(answer, index) {
    if (answer.questionId !== data.questionIds[index]) throw new Error('문항 순서가 일치하지 않습니다.');
    const question = HEALTH_INDICATORS_BANK.find(function(q) { return q.id === answer.questionId; });
    const order = answer.optionOrder;
    if (!question || !Array.isArray(order) || order.length !== 5 ||
        [0, 1, 2, 3, 4].some(function(n) { return order.indexOf(n) === -1; }) ||
        !Number.isInteger(answer.selected) || answer.selected < 0 || answer.selected > 4) {
      throw new Error('문항 또는 보기 매핑이 올바르지 않습니다.');
    }
    const originalSelected = order[answer.selected];
    if (originalSelected === question.answer) score++;
    return { questionId: question.id, displayedSelected: answer.selected + 1,
      originalSelected: originalSelected + 1, originalCorrect: question.answer + 1, optionOrder: order.map(function(n) { return n + 1; }) };
  });
  const folder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const spreadsheet = getOrCreateSpreadsheet_(folder, '15장 특별 문제 — 보건지표 응답');
  const sheet = getOrCreateSheet_(spreadsheet, '응답');
  const headers = ['학교', '학번', '이름', '세트ID', '세트명', '20개 문항 ID', '응답JSON', '정답수', '점수(100점)', '제출시각', '응시ID'];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]); sheet.setFrozenRows(1);
  }
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues() : [];
  const existing = rows.find(function(row) {
    return String(row[10]) === String(data.attemptId);
  });
  if (existing) {
    // Retrying the same request is idempotent. A new attempt ID is a valid
    // repeat attempt and is stored as a new row below.
    return jsonResponse_({ ok: true, duplicate: true, attemptId: existing[10], score: existing[7], total: 20, submittedAt: existing[9] });
  }
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  // Prefix user-entered cells to retain leading zeroes and prevent formulas.
  sheet.appendRow([school, "'" + studentId, "'" + name, data.setId, '15장 특별 문제 — 보건지표',
    JSON.stringify(data.questionIds), JSON.stringify(answers), score, score * 5, timestamp, data.attemptId]);
  SpreadsheetApp.flush();
  return jsonResponse_({ ok: true, duplicate: false, attemptId: data.attemptId, score: score, total: 20, submittedAt: timestamp });
}
