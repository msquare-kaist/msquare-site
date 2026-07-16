# msquare.or.kr

KAIST 수학문제연구회 (MSquare) 홈페이지 · <https://www.msquare.or.kr/>

정적 사이트입니다. **빌드 과정이 없습니다.** `index.html`을 고치고 push하면 GitHub Pages가 바로 배포합니다.

```
index.html          페이지 전체 (여기만 고치면 됩니다)
assets/css/site.css 스타일 전부
assets/js/site.js   동작 전부 (전부 "있으면 좋은 것" — 없어도 페이지는 완전합니다)
tools/gen_geo.py    Our Works 표지와 K5 오각형 SVG 생성기 (평소엔 실행할 일 없음)
CNAME               커스텀 도메인
```

## 로컬에서 보기

```bash
python -m http.server 8000
# http://localhost:8000
```

`file://`로 열지 마세요 — 폰트와 마스크가 깨집니다.

## 자주 바꾸는 것

| 무엇 | 어디 |
|---|---|
| 회장 / 부회장 이메일 | `index.html` — `연락` 섹션의 `<dl class="dl">` |
| 부서장 이름 | `index.html` — `<li class="dept" data-dept="N">` 안의 `.dept__lead` |
| 신청 폼 링크 (ML / KAI-Square) | `index.html` — `발간 · 자료` 섹션과 `연락` 섹션 (두 군데 모두) |
| 저작권 | `index.html` — `<footer>` |

### 연혁에 항목 추가하기

축은 **실제 시간 축척**입니다. 세로 위치 = 연도. 항목을 추가하려면 `--y`에 연도만 넣으세요:

```html
<div class="tl-item reveal" style="--y:2027" data-side="r">
```

`data-side`는 데스크톱에서 좌/우를 번갈아 놓기 위한 것입니다 — **번갈아 두는 게 중요합니다.**
같은 쪽 항목끼리 최소 2년(168px)은 떨어져야 카드가 겹치지 않습니다.
자세한 계산은 `site.css`의 `COLLISION BUDGET` 주석을 보세요.

1989–2011 구간은 의도적으로 **축척 생략(axis break)** 처리되어 있습니다. 비어 있는 게 아니라,
"기록이 없는 24년"을 숨기지 않고 드러낸 것입니다.

## 건드리기 전에 알아둘 것

- **M² 로고는 이미지가 아니라 CSS 마스크입니다.** `FHD_logo.png`의 알파 채널을 마스크로 쓰고
  그 위에 SVG 그라디언트를 깔았습니다. 그래서 라이트/다크 양쪽에서 자동으로 맞고, 크기를 키워도
  안 깨집니다. `site.css`의 `.m2__ink` 퍼센트 값들은 로고의 잉크 bounding box에서 계산된
  값이니 "정리"하지 마세요.
- **`filter`는 `.m2__glow`(부모)에만.** 마스크와 필터를 같은 요소에 걸면 글로우가 잘려서 사라집니다.
- **`.nav`에 `backdrop-filter`를 직접 걸지 마세요.** `backdrop-filter`가 걸린 요소는
  `position:fixed` 자식의 기준 박스가 되어버려서 모바일 메뉴가 64px로 찌그러집니다.
  그래서 블러는 `.nav::before`에 있습니다.
- **수학 모티프는 딱 3개입니다**: 삼각격자 + k-NN 그래프, 실수 축, K5(오각형). 그리고 M² 곡선.
  네 번째를 추가하지 마세요 — `site.css` 맨 위 주석 참고.
- **브랜드 보라색(`--ink-*`)은 장식 전용입니다.** 대비가 모자라서 글자에 쓰면 안 됩니다.
  글자는 `--text` / `--muted` / `--accent`만.
- `opacity`로 글자를 흐리게 하지 마세요. 검증된 대비값이 조용히 깨집니다.

## 원칙

JS가 꺼져 있어도, 모션을 줄인 설정에서도 페이지는 **완성된 상태**로 보여야 합니다.
`.reveal`은 기본이 보이는 상태이고, `<head>`의 인라인 스크립트가 붙이는 `.js` 클래스가 있을 때만
숨겼다가 나타납니다. 새 기능을 넣을 때도 이 방향을 지켜주세요.
