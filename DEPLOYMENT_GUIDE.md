# Canvas Editor - 빌드 및 Spring 프로젝트 적용 가이드

## 작업 완료 내역

### 1. 한글 번역 완료
- ✅ mock.ts: 모든 중국어 주석과 텍스트를 한글로 변경
  - `主訴` → `주소`
  - 중국어 주석 → 한글 주석 (모의 이미지, 모의 표, 모의 마지막 텍스트)

- ✅ main.ts: 모든 중국어를 한글로 변경
  - `正文` → `본문`
  - `批注` → `주석`
  - `新增题注` → `캡션 추가`
  - `修改题注` → `캡션 수정`
  - `签名` → `서명`
  - `格式整理` → `포맷 정리`
  - `清空涂鸦信息` → `낙서 지우기`
  - 모든 주석을 한글로 변경

### 2. JSON 내보내기 기능 추가
- ✅ HTML에 "JSON 내보내기" 버튼 추가 (상단 툴바 인쇄 버튼 옆)
- ✅ CSS 스타일 추가 (파란색 버튼, 호버 효과)
- ✅ export.svg 아이콘 생성
- ✅ AJAX 전송 기능 구현
  - 엔드포인트: `/lmxmng/webEditor/saveDoc.do`
  - 메서드: POST
  - Content-Type: application/json; charset=utf-8
  - 전송 데이터 구조:
    ```json
    {
      "version": "버전 정보",
      "header": [],
      "main": [],
      "footer": [],
      "options": {},
      "timestamp": "ISO 타임스탬프"
    }
    ```

### 3. 빌드 완료
- ✅ 정적 파일로 빌드 완료
- ✅ dist 폴더에 배포 가능한 파일 생성됨
- ✅ 파일명에 해시 없이 깔끔하게 생성 (index.js, vendor.js, index.css)

## Spring 레거시 프로젝트 적용 방법

### 1. 파일 복사
dist 폴더의 모든 파일을 Spring 프로젝트의 webapp 폴더로 복사합니다:

```
yourProject/
  └── src/
      └── main/
          └── webapp/
              └── resources/
                  └── canvas-editor/          ← 여기에 dist 폴더 내용 복사
                      ├── assets/
                      │   ├── index.js       (해시 없음!)
                      │   ├── vendor.js      (해시 없음!)
                      │   ├── index.css      (해시 없음!)
                      │   └── ... (이미지 파일들)
                      └── index.html
```

### 2. 경로 수정 (필요시)
현재 빌드된 파일은 `/resources/canvas-editor/` 경로를 사용합니다.
다른 경로를 원하시면 `vite.config.ts`의 `base` 값을 수정 후 재빌드하세요.

### 3. Spring Controller 작성 예시

```java
package com.yourcompany.lmxmng.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/lmxmng/webEditor")
public class WebEditorController {

    @RequestMapping(value = "/saveDoc.do", method = RequestMethod.POST)
    @ResponseBody
    public Map<String, Object> saveDoc(@RequestBody Map<String, Object> documentData) {
        Map<String, Object> result = new HashMap<>();

        try {
            // documentData 구조:
            // - version: 버전 정보
            // - header: 헤더 요소 배열
            // - main: 본문 요소 배열
            // - footer: 푸터 요소 배열
            // - options: 편집기 옵션
            // - timestamp: 저장 시각

            // 여기에 저장 로직 구현
            // 예: DB 저장, 파일 저장 등

            System.out.println("문서 버전: " + documentData.get("version"));
            System.out.println("저장 시각: " + documentData.get("timestamp"));

            result.put("success", true);
            result.put("message", "문서가 성공적으로 저장되었습니다.");
            result.put("documentId", "생성된 문서 ID");

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "저장 중 오류가 발생했습니다: " + e.getMessage());
        }

        return result;
    }

    @RequestMapping(value = "/editor.do", method = RequestMethod.GET)
    public String editorPage() {
        // 편집기 페이지로 이동
        return "forward:/canvas-editor/index.html";
    }
}
```

### 4. web.xml 설정 (필요시)

정적 리소스 처리를 위한 설정이 필요할 수 있습니다:

```xml
<!-- 정적 리소스 매핑 -->
<servlet-mapping>
    <servlet-name>default</servlet-name>
    <url-pattern>*.js</url-pattern>
    <url-pattern>*.css</url-pattern>
    <url-pattern>*.png</url-pattern>
    <url-pattern>*.svg</url-pattern>
</servlet-mapping>
```

또는 Spring 설정 파일(servlet-context.xml)에서:

```xml
<mvc:resources mapping="/resources/**" location="/resources/" />
```

### 5. 접속 방법

브라우저에서 다음 URL로 접속:
```
http://your-domain:port/your-context-path/lmxmng/webEditor/editor.do
또는
http://your-domain:port/your-context-path/resources/canvas-editor/index.html
```

## 주요 기능

1. **편집 기능**
   - 글꼴, 크기, 색상, 정렬 등 다양한 서식 지원
   - 표, 이미지, 하이퍼링크 삽입
   - 체크박스, 라디오버튼 등 컨트롤 지원
   - 워터마크, 페이지 나누기, LaTeX 수식 지원

2. **JSON 내보내기**
   - 상단 툴바의 "JSON 내보내기" 버튼 클릭
   - 편집된 문서를 JSON 형식으로 서버에 전송
   - `/lmxmng/webEditor/saveDoc.do` 엔드포인트로 POST 요청
   - 성공/실패 알림 표시

3. **인쇄 및 출력**
   - PDF 출력 지원
   - 다양한 용지 크기 및 방향 설정

## 개발 환경에서 테스트

개발 중 로컬에서 테스트하려면:

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:5173/resources/canvas-editor/ 접속
```

## 재빌드 방법

코드를 수정한 후 재빌드하려면:

```bash
# 의존성 설치 (최초 1회)
npm install

# 빌드
npm run build

# dist 폴더의 파일들을 Spring 프로젝트에 다시 복사
```

## 문제 해결

### 1. 정적 리소스가 로드되지 않는 경우
- web.xml 또는 Spring 설정에서 정적 리소스 매핑 확인
- 브라우저 개발자 도구의 Network 탭에서 404 오류 확인

### 2. AJAX 요청이 실패하는 경우
- Controller의 @RequestMapping 경로 확인
- @ResponseBody 어노테이션 확인
- CORS 설정 확인 (필요시)
- Content-Type이 application/json인지 확인

### 3. 한글이 깨지는 경우
- web.xml에 CharacterEncodingFilter 추가:
```xml
<filter>
    <filter-name>encodingFilter</filter-name>
    <filter-class>org.springframework.web.filter.CharacterEncodingFilter</filter-class>
    <init-param>
        <param-name>encoding</param-name>
        <param-value>UTF-8</param-value>
    </init-param>
    <init-param>
        <param-name>forceEncoding</param-name>
        <param-value>true</param-value>
    </init-param>
</filter>
<filter-mapping>
    <filter-name>encodingFilter</filter-name>
    <url-pattern>/*</url-pattern>
</filter-mapping>
```

## 연락처 및 지원

문제가 발생하면 canvas-editor 프로젝트의 GitHub 이슈를 참고하세요:
https://github.com/Hufe921/canvas-editor

---
빌드 일시: 2026-02-23
버전: 0.9.127

