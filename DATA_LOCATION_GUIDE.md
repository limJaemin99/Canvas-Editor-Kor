# 예시 데이터 위치 및 초기화 버튼 안내

## ✅ 완료된 작업

### 초기화 버튼 추가 ✨
- **위치**: 예시 버튼 오른쪽
- **스타일**: 주황~노랑 그라데이션 (fa709a → fee140)
- **기능**: 문서를 빈 상태로 초기화

## 📍 예시 데이터 위치

### 1. 예시 데이터 저장 위치

**파일**: `src/main.ts`
**위치**: 31번째 줄부터 시작

```typescript
// src/main.ts (31-57번째 줄)

window.onload = function () {
  // ...

  // 예시 데이터 저장 ← 여기!
  const exampleData = {
    header: [
      {
        value: '제1인민병원',
        size: 32,
        rowFlex: RowFlex.CENTER
      },
      {
        value: '\n외래 진료 기록',
        size: 18,
        rowFlex: RowFlex.CENTER
      },
      {
        value: '\n',
        type: ElementType.SEPARATOR
      }
    ],
    main: <IElement[]>data,  // ← mock.ts의 data를 참조
    footer: [
      {
        value: 'canvas-editor',
        size: 12
      }
    ]
  }
  // ...
}
```

### 2. 본문 데이터 출처

**파일**: `src/mock.ts`
**내용**: 의료 진료 기록 예시 데이터

```typescript
// src/mock.ts

const text = `주소:
발열 3일, 기침 5일.
현병력:
환자는 3일 전 명확한 유발 원인 없이 감기 후 안면 부종 발견...
기왕력:
당뇨병 10년, 고혈압 2년...
유행병력:
최근 14일 내 확진 환자, 의심 환자...
신체 검사:
T: 39.5℃, P: 80bpm...
보조 검사:
2020년 6월 10일, 혈액 검사...
외래 진단: 처치 치료: 전자 서명: 【】
기타 기록:`

// 이 텍스트가 파싱되어 elementList에 저장됨
const elementList = splitText(text).map(t => ({ value: t }))

// 추가로 이미지, 표 등이 추가됨
elementList.splice(456, 0, { /* 이미지 데이터 */ })
elementList.push({ /* 표 데이터 */ })

export const data = elementList
```

## 🎯 데이터 흐름

```
┌─────────────────┐
│   src/mock.ts   │  1. 예시 텍스트 작성
│   - text        │     (의료 진료 기록)
│   - data        │
└────────┬────────┘
         │ export
         ▼
┌─────────────────┐
│   src/main.ts   │  2. mock.ts에서 import
│                 │     import { data } from './mock'
│  exampleData    │
│  - header       │  3. exampleData 객체 생성
│  - main: data   │     - header: 병원 이름, 제목
│  - footer       │     - main: mock.ts의 data
└────────┬────────┘     - footer: 로고
         │
         │ '예시' 버튼 클릭 시
         ▼
┌─────────────────┐
│     에디터      │  4. executeSetValue(exampleData)
│   문서 표시     │     에디터에 데이터 로드
└─────────────────┘
```

## 🔧 세 가지 버튼의 동작

### 1. 저장 버튼 (보라색)
```typescript
// src/main.ts (1270번째 줄 근처)

exportJsonDom.onclick = function () {
  const editorResult = instance.command.getValue()
  const jsonData = {
    version: editorResult.version,
    header: editorResult.data.header,
    main: editorResult.data.main,
    footer: editorResult.data.footer,
    options: editorResult.options,
    timestamp: new Date().toISOString()
  }

  // AJAX로 서버에 전송
  fetch('/lmxmng/webEditor/saveDoc.do', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonData)
  })
}
```

### 2. 예시 버튼 (분홍색)
```typescript
// src/main.ts (1310번째 줄 근처)

exampleDom.onclick = function () {
  const confirmed = confirm('현재 문서 내용이 예시 데이터로 대체됩니다. 계속하시겠습니까?')
  if (confirmed) {
    // exampleData는 위에서 정의된 객체
    instance.command.executeSetValue(exampleData)
    alert('예시 데이터를 불러왔습니다.')
  }
}
```

### 3. 초기화 버튼 (주황색) ← 새로 추가!
```typescript
// src/main.ts (1321번째 줄 근처)

resetDom.onclick = function () {
  const confirmed = confirm('문서를 초기화하시겠습니까? 모든 내용이 삭제됩니다.')
  if (confirmed) {
    instance.command.executeSetValue({
      header: [],
      main: [{ value: '\n' }],  // 빈 문서
      footer: []
    })
    alert('문서가 초기화되었습니다.')
  }
}
```

## 📝 예시 데이터 수정 방법

### 방법 1: mock.ts 수정 (본문 데이터)

**파일**: `src/mock.ts` (10번째 줄)

```typescript
const text = `주소:
여기에 원하는 텍스트를 입력하세요.
현병력:
다른 내용을 추가할 수 있습니다.`
```

### 방법 2: main.ts에서 header/footer 수정

**파일**: `src/main.ts` (35-56번째 줄)

```typescript
const exampleData = {
  header: [
    {
      value: '우리 병원',  // ← 병원 이름 수정
      size: 32,
      rowFlex: RowFlex.CENTER
    },
    {
      value: '\n진료 기록서',  // ← 제목 수정
      size: 18,
      rowFlex: RowFlex.CENTER
    }
  ],
  main: <IElement[]>data,
  footer: [
    {
      value: 'My Editor',  // ← 푸터 텍스트 수정
      size: 12
    }
  ]
}
```

### 방법 3: 완전히 새로운 데이터로 교체

```typescript
const exampleData = {
  header: [],
  main: [
    {
      value: '안녕하세요\n',
      size: 24,
      bold: true
    },
    {
      value: '이것은 새로운 예시 데이터입니다.\n',
      size: 14
    },
    {
      value: '필요한 내용을 자유롭게 추가하세요.',
      size: 14,
      color: '#0000FF'
    }
  ],
  footer: []
}
```

## 🎨 버튼 스타일

### 저장 버튼 (보라색)
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
```

### 예시 버튼 (분홍색)
```css
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
```

### 초기화 버튼 (주황색) ← 새로 추가!
```css
background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)
```

## 🔄 사용 시나리오

### 시나리오 1: 처음 시작
1. 페이지 열기 → **빈 문서**

### 시나리오 2: 예시 보기
1. **예시** 버튼 클릭
2. 확인 → 의료 진료 기록 예시 로드

### 시나리오 3: 다시 초기화
1. **초기화** 버튼 클릭
2. 확인 → 빈 문서로 돌아감

### 시나리오 4: 저장
1. 문서 작성
2. **저장** 버튼 클릭
3. 서버로 JSON 전송

## 📦 파일 구조 요약

```
src/
├── main.ts          ← 버튼 이벤트 & exampleData 저장
│   ├── exampleData (35-57줄)
│   ├── 저장 버튼 (1270줄)
│   ├── 예시 버튼 (1310줄)
│   └── 초기화 버튼 (1321줄)
│
├── mock.ts          ← 예시 본문 데이터
│   ├── text (10줄)
│   ├── elementList
│   └── export data
│
└── style.css        ← 버튼 스타일
    ├── .menu-item__export-json (저장)
    ├── .menu-item__example (예시)
    └── .menu-item__reset (초기화)
```

## ✅ 빌드 완료!

- ✅ 초기화 버튼 추가
- ✅ 주황색 그라데이션 스타일
- ✅ 확인 대화상자 포함
- ✅ 빈 문서로 초기화 기능

**dist 폴더**를 `webapp/resources/canvas-editor/`로 복사하면 완료!

---
업데이트: 2026년 2월 23일
추가 기능: 초기화 버튼

