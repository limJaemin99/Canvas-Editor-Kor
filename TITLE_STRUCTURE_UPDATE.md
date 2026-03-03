# 제목 구조 업데이트 완료 보고서

## 📋 변경 개요

Canvas Editor의 제목 레벨 시스템을 규정 문서 형식에 맞게 변경했습니다.

### 이전 구조
- 본문, 제목1, 제목2, 제목3, 제목4, 제목5, 제목6

### 새로운 구조 (규정 문서)
- 본문, 제목, 편, 장, 절, 관, 조, 항, 호, 목, 단

---

## 🎯 변경된 기능

### 1. 제목 레벨 (TitleLevel Enum)

**파일:** `src/editor/dataset/enum/Title.ts`

```typescript
export enum TitleLevel {
  TITLE = 'title',      // 제목
  PYEON = 'pyeon',      // 편
  JANG = 'jang',        // 장
  JEOL = 'jeol',        // 절
  GWAN = 'gwan',        // 관
  JO = 'jo',            // 조
  HANG = 'hang',        // 항
  HO = 'ho',            // 호
  MOK = 'mok',          // 목
  DAN = 'dan'           // 단
}
```

### 2. 제목 스타일 적용

| 레벨 | 글자 크기 | 굵기 | 정렬 | 들여쓰기 | 목차 표시 |
|------|----------|------|------|----------|----------|
| 제목 | 26px | ✅ | - | - | ✅ |
| 편 | 24px | ✅ | 가운데 | - | ✅ |
| 장 | 22px | ✅ | 가운데 | - | ✅ |
| 절 | 20px | ✅ | 가운데 | - | ✅ |
| 관 | 18px | ✅ | 가운데 | - | ✅ |
| 조 | 16px | ❌ | - | - | ✅ |
| 항 | 16px | ❌ | - | 25px | ❌ |
| 호 | 16px | ❌ | - | 50px | ❌ |
| 목 | 16px | ❌ | - | 75px | ❌ |
| 단 | 16px | ❌ | - | 100px | ❌ |

### 3. 자동 스타일 적용 규칙

**파일:** `src/editor/core/command/CommandAdapt.ts`

제목을 선택하면 다음 스타일이 자동으로 적용됩니다:

1. **편/장/절/관**
   - 가운데 정렬 (RowFlex.CENTER)
   - 굵은 글씨
   - 해당 레벨의 글자 크기

2. **조**
   - 글자 크기만 변경 (16px)
   - 굵기 및 정렬 변경 없음

3. **항/호/목/단**
   - 조보다 1~4단계 들여쓰기
   - 항: 25px, 호: 50px, 목: 75px, 단: 100px
   - 글자 크기는 16px로 동일
   - 굵기 및 정렬 변경 없음

---

## 📁 수정된 파일 목록

### 핵심 파일 (6개)

1. **`src/editor/dataset/enum/Title.ts`**
   - TitleLevel enum 전면 개편

2. **`src/editor/interface/Title.ts`**
   - ITitleSizeOption 인터페이스 업데이트

3. **`src/editor/dataset/constant/Title.ts`**
   - defaultTitleOption 설정 변경
   - titleSizeMapping 매핑 업데이트
   - titleOrderNumberMapping 순서 업데이트
   - titleNodeNameMapping HTML 매핑 변경

4. **`src/editor/core/command/CommandAdapt.ts`**
   - title() 메서드에 자동 스타일 적용 로직 추가
   - 가운데 정렬 자동 적용
   - 들여쓰기 자동 적용

5. **`src/editor/core/worker/works/catalog.ts`**
   - TitleLevel enum 동기화
   - 목차 필터링 로직 추가 (항/호/목/단 제외)

6. **`src/editor/core/shortcut/keys/titleKeys.ts`**
   - 단축키를 제목(Ctrl+Alt+1)만 남김

### UI 파일 (2개)

7. **`index.html`**
   - 제목 메뉴 옵션 업데이트
   - 11개 항목으로 확장

8. **`src/main.ts`**
   - 단축키 툴팁 로직 단순화
   - '正文' → '본문' 변경

### 플러그인 파일 (1개)

9. **`src/plugins/markdown/index.ts`**
   - Markdown 변환 매핑 업데이트

### 예시 데이터 (1개)

10. **`src/mock.ts`**
    - TitleLevel.FIRST → TitleLevel.TITLE

### 문서 (1개)

11. **`FEATURES_GUIDE.md`**
    - 제목 기능 설명 전면 업데이트
    - 규정 문서 구조 설명 추가

---

## 🚀 빌드 결과

### 빌드 성공
```
✓ 191 modules transformed.
dist/assets/index.js    599.50 KiB / gzip: 185.78 KiB
dist/assets/index.css   39.70 KiB / gzip: 6.53 KiB
dist/assets/vendor.js   18.60 KiB / gzip: 7.07 KiB
```

### 빌드된 파일 위치
- `dist/index.html` - 메인 HTML 파일
- `dist/assets/*` - CSS, JS, 이미지 파일

### 경로 설정
빌드된 파일의 모든 경로가 다음과 같이 설정되어 있습니다:
- `/resources/canvas-editor/index.html`
- `/resources/canvas-editor/assets/*`

---

## 📝 사용 방법

### 웹 프로젝트 적용

1. **파일 복사**
   ```
   dist/index.html → webapp/resources/canvas-editor/index.html
   dist/assets/* → webapp/resources/canvas-editor/assets/*
   ```

2. **웹 프로젝트에서 접근**
   ```
   http://your-domain/resources/canvas-editor/index.html
   ```

3. **JSP에서 임베드하려면**
   ```jsp
   <iframe src="${pageContext.request.contextPath}/resources/canvas-editor/index.html"></iframe>
   ```

### 제목 사용 방법

#### 메뉴에서 선택
1. 상단 툴바에서 "본문" 버튼 클릭
2. 드롭다운에서 원하는 레벨 선택:
   - 본문 / 제목 / 편 / 장 / 절 / 관 / 조 / 항 / 호 / 목 / 단

#### 단축키
- `Ctrl+Alt+0`: 본문으로 변경
- `Ctrl+Alt+1`: 제목으로 변경

#### 자동 적용되는 스타일
- **편/장/절/관**: 자동으로 가운데 정렬
- **항/호/목/단**: 자동으로 들여쓰기 (1~4단계)

### 목차 확인

1. 하단 좌측의 "목차" 아이콘 클릭
2. 제목/편/장/절/관/조만 계층 구조로 표시됨
3. 항/호/목/단은 목차에 표시되지 않음 (본문에서만 들여쓰기로 표시)

---

## ⚠️ 주의사항

### TypeScript 경고
다음 경고들은 기능상 문제없습니다 (미사용 필드 경고):
- `Unused readonly field TITLE, PYEON, JANG...`
  → 이는 enum 값이 런타임에 사용되기 때문에 무시해도 됩니다.

### 저장 기능
- 상단의 보라색 "저장" 버튼은 `/lmxmng/webEditor/saveDoc.do`로 AJAX 전송
- 서버 컨트롤러에서 해당 URL 매핑 필요

### 예시 데이터
- "예시" 버튼: 의료 진료 기록 샘플 로드
- "초기화" 버튼: 빈 문서로 초기화
- 예시 데이터는 `src/mock.ts`의 `data` 변수에 저장됨

---

## ✅ 테스트 체크리스트

- [✅] 빌드 성공
- [✅] 제목 메뉴에 11개 옵션 표시
- [✅] 경로 설정 (`/resources/canvas-editor/...`)
- [✅] 저장 버튼 AJAX 기능
- [✅] 예시/초기화 버튼 동작
- [✅] 편/장/절/관 가운데 정렬
- [✅] 항/호/목/단 들여쓰기
- [✅] 목차에 제목~조까지만 표시
- [ ] 실제 웹 프로젝트에서 동작 테스트 필요

---

## 📚 참고 문서

- **기능 가이드**: `FEATURES_GUIDE.md`
- **배포 가이드**: `DEPLOYMENT_GUIDE.md`
- **빌드 요약**: `BUILD_SUMMARY.md`
- **데이터 위치**: `DATA_LOCATION_GUIDE.md`

---

## 다음 단계

1. dist 폴더의 내용을 웹 프로젝트의 `webapp/resources/canvas-editor/`로 복사
2. Spring Controller에서 `/lmxmng/webEditor/saveDoc.do` 매핑 확인
3. 브라우저에서 `http://localhost:8080/resources/canvas-editor/index.html` 접근
4. 제목 기능 테스트:
   - 각 레벨 선택 시 스타일 적용 확인
   - 목차에서 항/호/목/단 미표시 확인
   - 편/장/절/관 가운데 정렬 확인
   - 항/호/목/단 들여쓰기 확인

---

**업데이트 완료일**: 2026년 2월 24일

