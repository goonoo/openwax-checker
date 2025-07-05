# 웹 접근성 자동 점검 규칙 설명서

이 문서는 `src/utils/rule.ts`에 정의된 주요 웹 접근성 검사 함수들의 목적, 검사 원리, 적용 규정(넘버링 포함)을 한글로 쉽게 설명합니다.

---

## 5.1.1 적절한 대체 텍스트 제공 (img) 검사: `checkImages`

- **목적**: 모든 `img`, `input[type="image"]`, `area` 요소에 적절한 `alt` 속성이 제공되는지 검사합니다.
- **원리**:
  - `alt` 속성이 있으면 pass, 없으면 fail, 빈 문자열이면 warning을 반환합니다.
  - 숨겨진 이미지는 `hidden: true`로 표시합니다.
  - `longdesc` 속성도 함께 반환합니다.
- **적용 규정**: 5.1.1

---

## 5.1.1 적절한 대체 텍스트 제공 (bg) 검사: `checkBgImages`

- **목적**: CSS `background-image`가 적용된 요소에 대체 텍스트(`aria-label` 또는 `title`)가 제공되는지 검사합니다.
- **원리**:
  - background-image가 있는 모든 요소를 검사합니다.
  - `aria-label` 또는 `title` 속성을 `alt`로 반환합니다.
  - 숨겨진 요소는 `hidden: true`로 표시합니다.
- **적용 규정**: 5.1.1

---

## 5.3.1 표의 구성 검사: `checkTables`

- **목적**: 표(`table`)가 올바른 구조와 레이블을 갖추고 있는지 검사합니다.
- **원리**:
  - `role="presentation"`이면 warning.
  - `caption`과 `scope` 속성이 있는 `th`가 모두 있으면 pass.
  - `caption`만 있고 scope 없는 `th`만 있으면 warning.
  - `caption`, `summary`, `scope` 있는 `th`가 모두 없으면 warning(레이아웃 테이블로 간주).
  - 그 외는 fail.
  - 각 표의 구조(캡션, 요약, thead, tfoot, tbody, 제목셀 등)를 상세히 반환합니다.
- **적용 규정**: 5.3.1

---

## 6.4.1 반복 영역 건너뛰기 검사: `checkSkipNav`

- **목적**: 페이지 내 반복되는 영역을 건너뛸 수 있는 skip navigation 링크가 제대로 연결되어 있는지 검사합니다.
- **원리**:
  - `a[href^="#"]` 형태의 링크를 최대 20개까지 검사.
  - 해당 id/name이 실제로 존재하면 pass, 없으면 fail.
  - `href="#"`만 있는 경우는 무조건 fail.
- **적용 규정**: 6.4.1

---

## 6.4.2 제목 제공 - 페이지 검사: `checkPageTitle`

- **목적**: 페이지에 적절한 제목이 제공되는지 검사합니다.
- **원리**:
  - `document.title`이 존재하고, 중복 특수문자가 없으면 pass.
  - 없거나 중복 특수문자가 있으면 fail.
- **적용 규정**: 6.4.2

---

## 6.4.2 제목 제공 - 프레임 검사: `checkFrames`

- **목적**: 모든 `iframe`에 제목(`title` 속성)이 제공되는지 검사합니다.
- **원리**:
  - `title` 속성이 있으면 pass, 없으면 fail.
  - 숨겨진 프레임은 `hidden: true`로 표시합니다.
- **적용 규정**: 6.4.2

---

## 6.4.2 제목 제공 - 콘텐츠 블록 검사: `checkHeadings`

- **목적**: 콘텐츠 블록(섹션 등)에 적절한 제목(heading)이 제공되는지 검사합니다.
- **원리**:
  - `h1`~`h6` 태그를 모두 pass로 반환.
  - 숨겨진 헤딩은 `hidden: true`로 표시합니다.
- **적용 규정**: 6.4.2

---

## 7.1.1 기본 언어 표시 검사: `checkPageLang`

- **목적**: 페이지(및 프레임)에 `lang` 속성이 올바르게 지정되어 있는지 검사합니다.
- **원리**:
  - `<html lang="...">`가 있으면 pass, 없으면 fail.
  - 프레임 내 문서도 모두 검사합니다.
- **적용 규정**: 7.1.1

---

## 7.3.2 레이블 제공 검사: `checkInputLabels`

- **목적**: 입력 필드(`input`, `textarea`)에 적절한 레이블(label)이 제공되는지 검사합니다.
- **원리**:
  - `label[for=...]` 또는 부모 label이 있으면 pass.
  - label이 없고 `title` 속성만 있으면 warning.
  - 둘 다 없으면 fail.
  - 숨겨진 입력 필드는 `hidden: true`로 표시합니다.
- **적용 규정**: 7.3.2