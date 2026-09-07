# 문제 공개 상태 Google 연동

관리자 화면의 공개/숨김 상태를 모든 학생에게 동일하게 적용하려면 현재 Apps Script에 아래 기능을 추가하고 새 버전으로 배포합니다. 기존 `doPost(e)`의 제출 저장 코드는 삭제하거나 바꾸지 않습니다.

## 1. 기존 `doPost(e)`에 분기 추가

기존 함수에서 `const data = JSON.parse(e.postData.contents);` 바로 다음 줄에 아래 코드를 추가합니다.

```javascript
if (data.action === 'setVisibility') return setVisibility_(data);
```

## 2. 파일 맨 아래에 함수 추가

```javascript
function doGet(e) {
  if (e.parameter.action !== 'getVisibility') {
    return json_({ ok: false, message: '지원하지 않는 요청입니다.' });
  }

  const saved = PropertiesService.getScriptProperties().getProperty('QUIZ_VISIBILITY');
  return json_({ ok: true, visibility: saved ? JSON.parse(saved) : {} });
}

function setVisibility_(data) {
  if (data.adminId !== 'admin' || data.adminPassword !== 'admin') {
    return json_({ ok: false, message: '관리자 인증에 실패했습니다.' });
  }

  PropertiesService.getScriptProperties().setProperty(
    'QUIZ_VISIBILITY',
    JSON.stringify(data.visibility || {})
  );
  return json_({ ok: true });
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. 새 버전 배포

Apps Script에서 **배포 → 배포 관리 → 수정(연필) → 버전: 새 버전 → 배포** 순서로 진행합니다. 웹 앱 URL은 바뀌지 않으므로 사이트의 Google Drive 제출 주소도 그대로 유지됩니다.

> `admin/admin`은 공개 웹사이트의 초기 운영용 간편 인증입니다. 사이트 코드를 확인하면 알아낼 수 있으므로 중요한 개인정보나 고위험 관리 기능에는 사용하면 안 됩니다.
