# 교재 문제 과목별 Google Sheet 분리

교재 문제의 세트 ID는 다음 형식입니다.

- 공중보건학: `book-public-health-...`
- 의료관계법규: `book-medical-law-...`

기존 Apps Script의 `findSubjectName(setId)`와 `findFileName(setId, subjectName)`이 이 형식을 판별하지 못하면 두 과목이 `기타 문제`에 함께 저장됩니다.

## 1. `findSubjectName(setId)` 맨 위에 추가

기존 조건을 지우지 말고 함수의 첫 부분에 아래 두 조건을 추가합니다.

```javascript
function findSubjectName(setId) {
  setId = String(setId || '');

  if (setId.indexOf('book-public-health-') === 0) return '공중보건';
  if (setId.indexOf('book-medical-law-') === 0) return '의료법규';

  // 이 아래의 기존 코드는 그대로 유지
}
```

## 2. `findFileName(setId, subjectName)` 맨 위에 추가

기존 조건을 지우지 말고 함수의 첫 부분에 아래 두 조건을 추가합니다.

```javascript
function findFileName(setId, subjectName) {
  setId = String(setId || '');

  if (setId.indexOf('book-public-health-') === 0) return '교재 공중보건학';
  if (setId.indexOf('book-medical-law-') === 0) return '교재 의료관계법규';

  // 이 아래의 기존 코드는 그대로 유지
}
```

수정 후 **배포 → 배포 관리 → 문제은행 웹 배포 → 수정(연필) → 새 버전 → 배포**를 진행합니다. 이후 제출부터 학교별 폴더 안에서 다음과 같이 분리됩니다.

- `공중보건/교재 공중보건학`
- `의료법규/교재 의료관계법규`

이미 `기타 문제` 시트에 저장된 과거 응답은 자동 이동되지 않습니다.
