# Google Sheets 응답 저장 연결

1. Google Drive에서 새 Google Sheets를 만들고 이름을 `캠퍼스 문제은행 응답`으로 지정합니다.
2. 상단 메뉴에서 **확장 프로그램 → Apps Script**를 엽니다.
3. 기본 코드를 아래 코드로 교체하고 저장합니다.

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('응답')
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet('응답');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['제출시각', '학교', '학번', '이름', '세트ID', '문제세트', '점수', '총문제수', '답안JSON']);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([data.submittedAt, data.school, data.studentId, data.name, data.setId, data.setTitle, data.score, data.total, JSON.stringify(data.answers)]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
```

4. **배포 → 새 배포 → 웹 앱**을 선택합니다. 실행 사용자는 본인, 액세스 권한은 `모든 사용자`로 지정합니다.
5. 발급된 `/exec` URL을 `.env.local`의 `NEXT_PUBLIC_GOOGLE_SCRIPT_URL` 값으로 넣고 사이트를 다시 시작합니다.

연결 전에는 제출 결과가 데모 확인을 위해 학생 기기의 브라우저 저장소에 보관됩니다. 실제 운영 전에는 관리자 인증, 개인정보 처리 안내, 재제출 정책을 추가하는 것을 권장합니다.
