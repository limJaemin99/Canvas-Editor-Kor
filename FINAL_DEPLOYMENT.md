# Canvas Editor - 최종 배포 준비 완료

## ✅ 경로 설정 완료!

모든 파일이 `webapp/resources/canvas-editor/` 경로에 맞춰 빌드되었습니다.

### 빌드 결과

```
dist/
├── index.html                    ← /resources/canvas-editor/index.html
└── assets/
    ├── index.js                  ← /resources/canvas-editor/assets/index.js
    ├── vendor.js                 ← /resources/canvas-editor/assets/vendor.js
    ├── index.css                 ← /resources/canvas-editor/assets/index.css
    ├── favicon.png
    ├── export.svg
    └── ... (기타 SVG 아이콘들)
```

### 참조 경로 확인

**index.html** 내부의 모든 경로가 자동으로 업데이트됨:
```html
<link rel="icon" href="/resources/canvas-editor/assets/favicon.png" />
<script src="/resources/canvas-editor/assets/index.js"></script>
<link rel="modulepreload" href="/resources/canvas-editor/assets/vendor.js">
<link rel="stylesheet" href="/resources/canvas-editor/assets/index.css">
```

## 📦 Spring 프로젝트에 배포하기

### 1단계: 파일 복사

```bash
# Windows PowerShell
Copy-Item -Path "C:\Users\das\IdeaProjects\canvas-editor\dist\*" `
          -Destination "yourProject\src\main\webapp\resources\canvas-editor\" `
          -Recurse -Force
```

또는 수동으로:
```
canvas-editor/dist/ 의 모든 파일과 폴더를
↓ 복사
yourProject/src/main/webapp/resources/canvas-editor/
```

### 최종 구조

```
yourProject/
└── src/main/webapp/
    └── resources/
        └── canvas-editor/
            ├── index.html
            └── assets/
                ├── index.js
                ├── vendor.js
                ├── index.css
                ├── favicon.png
                ├── export.svg
                └── ... (100개 이상의 SVG 아이콘)
```

### 2단계: Spring 설정

#### servlet-context.xml (또는 *-servlet.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:mvc="http://www.springframework.org/schema/mvc"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="
           http://www.springframework.org/schema/beans
           http://www.springframework.org/schema/beans/spring-beans.xsd
           http://www.springframework.org/schema/mvc
           http://www.springframework.org/schema/mvc/spring-mvc.xsd">

    <!-- 정적 리소스 매핑 -->
    <mvc:resources mapping="/resources/**" location="/resources/" />

    <!-- 어노테이션 기반 컨트롤러 활성화 -->
    <mvc:annotation-driven />

</beans>
```

#### web.xml - UTF-8 인코딩 필터

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

### 3단계: Controller 작성

**com.yourcompany.lmxmng.web.WebEditorController.java**

```java
package com.yourcompany.lmxmng.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@Controller
@RequestMapping("/lmxmng/webEditor")
public class WebEditorController {

    /**
     * 에디터 페이지 열기
     */
    @RequestMapping(value = "/editor.do", method = RequestMethod.GET)
    public String editorPage() {
        // forward 방식으로 정적 파일 제공
        return "forward:/resources/canvas-editor/index.html";
    }

    /**
     * 문서 저장 (JSON 내보내기 버튼 클릭 시 호출됨)
     */
    @RequestMapping(value = "/saveDoc.do",
                    method = RequestMethod.POST,
                    produces = "application/json; charset=utf-8")
    @ResponseBody
    public Map<String, Object> saveDoc(@RequestBody Map<String, Object> documentData) {
        Map<String, Object> result = new HashMap<>();

        try {
            // 받은 데이터 구조:
            // - version: "0.9.127"
            // - header: [...]  // 헤더 요소 배열
            // - main: [...]    // 본문 요소 배열
            // - footer: [...]  // 푸터 요소 배열
            // - options: {...} // 편집기 옵션
            // - timestamp: "2026-02-23T08:00:00.000Z"

            String version = (String) documentData.get("version");
            List<Object> mainContent = (List<Object>) documentData.get("main");
            String timestamp = (String) documentData.get("timestamp");

            // 로깅
            System.out.println("=== 문서 저장 요청 ===");
            System.out.println("버전: " + version);
            System.out.println("본문 요소 개수: " + (mainContent != null ? mainContent.size() : 0));
            System.out.println("저장 시각: " + timestamp);

            // TODO: 여기에 실제 저장 로직 구현
            // 예시:
            // 1. DB에 저장
            //    documentService.saveDocument(documentData);
            // 2. 파일로 저장
            //    fileService.saveAsJson(documentData);
            // 3. 세션에 임시 저장
            //    session.setAttribute("editorData", documentData);

            // 성공 응답
            result.put("success", true);
            result.put("message", "문서가 성공적으로 저장되었습니다.");
            result.put("documentId", UUID.randomUUID().toString());
            result.put("savedAt", new Date());

        } catch (Exception e) {
            e.printStackTrace();

            // 실패 응답
            result.put("success", false);
            result.put("message", "저장 중 오류가 발생했습니다: " + e.getMessage());
        }

        return result;
    }

    /**
     * 문서 불러오기 (선택사항)
     */
    @RequestMapping(value = "/loadDoc.do", method = RequestMethod.GET)
    @ResponseBody
    public Map<String, Object> loadDoc(@RequestParam String documentId) {
        Map<String, Object> result = new HashMap<>();

        try {
            // TODO: DB나 파일에서 문서 불러오기
            // Map<String, Object> documentData = documentService.load(documentId);

            result.put("success", true);
            // result.put("data", documentData);

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "문서를 불러올 수 없습니다: " + e.getMessage());
        }

        return result;
    }
}
```

### 4단계: 접속

#### 방법 1: Controller를 통해 접속 (권장)
```
http://localhost:8080/yourContext/lmxmng/webEditor/editor.do
```

#### 방법 2: 직접 접속
```
http://localhost:8080/yourContext/resources/canvas-editor/index.html
```

## 🎯 테스트 체크리스트

### 기본 기능 확인
- [ ] 페이지가 정상적으로 로드되는가?
- [ ] 상단 툴바의 모든 버튼이 표시되는가?
- [ ] 텍스트 입력이 정상적으로 되는가?
- [ ] 서식 변경 (글꼴, 크기, 색상 등)이 작동하는가?

### JSON 내보내기 기능 확인
- [ ] "JSON 내보내기" 버튼이 표시되는가?
- [ ] 버튼 클릭 시 서버로 요청이 전송되는가?
- [ ] 성공 메시지가 표시되는가?
- [ ] 브라우저 개발자 도구 > Network 탭에서 요청/응답 확인

### 한글 확인
- [ ] 메뉴와 버튼이 모두 한글로 표시되는가?
- [ ] 우클릭 메뉴가 한글로 표시되는가?
- [ ] 다이얼로그 창의 텍스트가 한글인가?

## 🐛 문제 해결

### 1. 페이지가 로드되지 않음 (404 오류)

**원인**: 정적 리소스 매핑이 안 됨

**해결**:
```xml
<!-- servlet-context.xml -->
<mvc:resources mapping="/resources/**" location="/resources/" />
```

### 2. CSS/JS 파일이 로드되지 않음

**확인사항**:
1. 파일이 올바른 위치에 있는지 확인
   ```
   webapp/resources/canvas-editor/assets/index.js
   webapp/resources/canvas-editor/assets/index.css
   ```

2. 브라우저 개발자 도구 > Network 탭에서 404 오류 확인

3. web.xml에 정적 파일 매핑 추가:
   ```xml
   <servlet-mapping>
       <servlet-name>default</servlet-name>
       <url-pattern>*.js</url-pattern>
   </servlet-mapping>
   <servlet-mapping>
       <servlet-name>default</servlet-name>
       <url-pattern>*.css</url-pattern>
   </servlet-mapping>
   ```

### 3. JSON 내보내기 실패

**원인**: Controller 매핑 오류 또는 CORS 문제

**해결**:
1. Controller의 `@RequestMapping` 경로 확인
2. `@ResponseBody` 어노테이션 확인
3. Jackson 라이브러리 의존성 확인 (pom.xml):
   ```xml
   <dependency>
       <groupId>com.fasterxml.jackson.core</groupId>
       <artifactId>jackson-databind</artifactId>
       <version>2.13.0</version>
   </dependency>
   ```

### 4. 한글이 깨짐

**원인**: UTF-8 인코딩 미설정

**해결**: web.xml에 CharacterEncodingFilter 추가 (위 설정 참고)

## 📁 파일 구조 요약

```
yourProject/
├── src/main/
│   ├── java/
│   │   └── com/yourcompany/lmxmng/web/
│   │       └── WebEditorController.java  ← 생성
│   └── webapp/
│       ├── WEB-INF/
│       │   ├── web.xml                   ← 수정 (UTF-8 필터)
│       │   └── spring/
│       │       └── servlet-context.xml   ← 수정 (리소스 매핑)
│       └── resources/
│           └── canvas-editor/            ← dist 폴더 내용 복사
│               ├── index.html
│               └── assets/
│                   ├── index.js
│                   ├── vendor.js
│                   └── index.css
```

## 🎉 완료!

이제 모든 준비가 끝났습니다!

1. ✅ 한글 번역 완료
2. ✅ JSON 내보내기 기능 추가
3. ✅ 해시 없는 빌드
4. ✅ `/resources/canvas-editor/` 경로 설정
5. ✅ Spring 프로젝트 적용 준비 완료

**dist 폴더**를 복사하고 **Controller**를 작성하면 바로 사용할 수 있습니다!

---
최종 빌드: 2026년 2월 23일
경로: /resources/canvas-editor/
버전: 0.9.127

