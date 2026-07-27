# msquare.or.kr

KAIST 수학문제연구회 (MSquare) 홈페이지

- **새 사이트(작업 중) 미리보기** · <https://www.msquare.or.kr/msquare-site/> ← 이 저장소
- 현재 운영 중인 사이트 · <https://www.msquare.or.kr/> (구 저장소 `msquare-kaist.github.io`)

### 도메인 붙이기

`CNAME.disabled` 파일에 원하는 주소가 적혀 있습니다. **DNS 레코드를 먼저 만든 뒤**
`CNAME`으로 이름을 바꿔서 push하세요. 순서가 반대면 사이트 전체가
없는 주소로 301 리다이렉트되어 미리보기까지 죽습니다.

| 종류 | 호스트 | 값 |
|---|---|---|
| CNAME | `new` | `msquare-kaist.github.io` |

확정 후 `www.msquare.or.kr`로 옮길 때는, 구 저장소의 Pages 설정에서 도메인을
**먼저 비워야** 합니다 — 도메인 하나는 Pages 사이트 하나에만 연결됩니다.

정적 사이트입니다. **빌드 과정이 없습니다.** `index.html`을 고치고 push하면 GitHub Pages가 바로 배포합니다.

```
index.html               메인 페이지
departments/*.html       부서별 페이지 5개
assets/css/site.css      스타일 전부
assets/js/site.js        동작 전부 (전부 "있으면 좋은 것" — 없어도 페이지는 완전합니다)
assets/video/*.webm|png  부서별 manim 애니메이션 + 포스터 (미리 렌더된 결과물)
tools/gen_geo.py         Our Works 표지 · K5 오각형 SVG 생성기
tools/manim_scenes.py    부서별 애니메이션 장면
tools/render_videos.py   위 장면들을 webm으로 렌더
tools/checks/            회귀 테스트 3종 (아래 참고)
CNAME                    커스텀 도메인
```

`tools/`는 **전부 미리 돌려놓은 것**입니다. 사이트 자체는 파이썬을 쓰지 않고,
방문자 브라우저에서 manim이 도는 일도 없습니다. 그림을 다시 만들고 싶을 때만 실행하세요.

## 로컬에서 보기

```bash
python -m http.server 8000
# http://localhost:8000
```

`file://`로 열지 마세요 — 폰트와 마스크가 깨집니다.

사이트를 고친 뒤에는 회귀 테스트를 돌려보세요 (`pip install playwright` 필요, 서버 켠 상태에서):

```bash
python tools/checks/check1.py   # 6개 페이지 x 한/영: 언어 누출, 가로 넘침, JS 에러, 404
python tools/checks/check2.py   # JS 꺼짐 / 모션 최소화 / 영상 정책 / 연혁 축 겹침
python tools/checks/check3.py   # 등장 연출이 "완성된 상태"로 끝나는지
```

셋 다 마지막 줄에 `FAILURES: 0`이 나와야 합니다.

## 자주 바꾸는 것

| 무엇 | 어디 |
|---|---|
| **부서 소개 글** (초안 상태 — 확인 필요) | `departments/*.html` — `.dintro` 문단. 사이트에 이미 있는 사실만으로 쓴 초안이니, 각 부장님이 확인하고 고쳐주세요 |
| 회장 / 부회장 이메일 | `index.html` — `연락` 섹션의 `<dl class="dl">` |
| 부서장 이름 | `index.html`의 `.dept__lead`, 그리고 해당 `departments/*.html`의 `.dhero__lead` |
| 신청 폼 링크 (ML / KAI-Square) | `index.html` — `발간 · 자료` 섹션과 `연락` 섹션 (두 군데 모두) |
| 저작권 | `index.html` + `departments/*.html`의 `<footer>` |

## 한국어 / 영어

한 페이지에 **두 언어가 다 들어 있습니다.** CSS가 `<html data-lang>`을 보고 한쪽만 보여줍니다.

```html
<p class="dintro" data-tr="ko" lang="ko">한국어 문장</p>
<p class="dintro" data-tr="en" lang="en">English sentence</p>
```

**글을 고칠 때는 항상 두 개를 같이 고쳐주세요.** 하나만 고치면 다른 언어에서 옛날 문장이 그대로 나옵니다.

- 새 문장을 넣을 때도 `data-tr="ko"` / `data-tr="en"` 짝을 맞춰 넣으세요.
- `aria-label` 같은 **속성 안에는 절대 넣지 마세요.** 속성은 글자만 담을 수 있어서
  태그를 넣으면 따옴표가 깨지고 페이지에 이상한 글자가 튀어나옵니다.
  번역이 필요한 이름은 `class="vh"` (화면에 안 보이는) 요소에 넣고 `aria-labelledby`로 가리키세요.
- 첫 방문자는 브라우저 언어로 자동 선택되고, 한 번 고르면 그 선택이 기억됩니다.
- JS가 꺼져 있으면 두 언어가 다 보입니다 (플래그를 바꿀 방법이 없으니 아무것도 숨기지 않습니다).

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

## 부서 페이지 · 애니메이션

부서 페이지마다 manim 애니메이션이 하나씩 있습니다. 전부 **미리 렌더해서 `assets/video/`에
넣어둔 것**이라, 사이트는 그냥 `.webm` 파일 하나를 틀 뿐입니다.

```bash
pip install manim                  # ffmpeg + LaTeX 필요
python tools/render_videos.py      # 전부 다시 렌더
python tools/render_videos.py ml   # 하나만
```

- 장면을 고치려면 `tools/manim_scenes.py`. 색은 `site.css`의 토큰과 맞춰져 있으니 같이 바꿔주세요.
- `preload="none"`이라 화면에 보이기 전까지는 영상 데이터를 아예 받지 않습니다.
- 모션 최소화 설정을 켠 사람에게는 재생되지 않고 포스터 이미지(완성 프레임)만 보입니다.
- 포스터(`*.png`)는 영상 끝부분 프레임입니다 — 정지 화면에서도 완성된 그림이 보이도록.

## 건드리기 전에 알아둘 것

- **M² 로고는 이미지가 아니라 CSS 마스크입니다.** `FHD_logo.png`의 알파 채널을 마스크로 쓰고
  그 위에 SVG 그라디언트를 깔았습니다. 그래서 라이트/다크 양쪽에서 자동으로 맞고, 크기를 키워도
  안 깨집니다. `site.css`의 `.m2__ink` 퍼센트 값들은 로고의 잉크 bounding box에서 계산된
  값이니 "정리"하지 마세요.
- **`filter`는 `.m2__glow`(부모)에만.** 마스크와 필터를 같은 요소에 걸면 글로우가 잘려서 사라집니다.
- **`.nav`에 `backdrop-filter`를 직접 걸지 마세요.** `backdrop-filter`가 걸린 요소는
  `position:fixed` 자식의 기준 박스가 되어버려서 모바일 메뉴가 64px로 찌그러집니다.
  그래서 블러는 `.nav::before`에 있습니다.
- **메인 페이지의 수학 모티프는 딱 3개입니다**: 삼각격자 + k-NN 그래프, 실수 축, K5(오각형).
  그리고 M² 곡선. 네 번째를 추가하지 마세요 — `site.css` 맨 위 주석 참고.
  (부서 페이지 애니메이션은 별개 지면이라 이 예산에 포함되지 않습니다.)
- **연혁 카드 높이는 언어마다 다릅니다.** 영어 제목이 한국어보다 길어서, 영어일 때는
  `--tl-year`(1년당 픽셀)를 더 크게 잡습니다. 축척은 "칸이 균일한가"가 지키는 것이지
  "상수가 같은가"가 지키는 게 아닙니다. `site.css`의 `COLLISION BUDGET` 주석 참고.
- **Newsreader는 라틴 전용 폰트입니다.** 한글에 적용하면 한글이 없는 세리프로 떨어져서 깨집니다.
  한글에는 절대 쓰지 마세요 (`.work__desc[data-tr="en"]`처럼 영어 노드에만).
- **폰트는 세 단계입니다**: 큰 제목 = Hahmlet(한글 세리프, 가변), 본문/UI = Pretendard,
  라벨 = IBM Plex Mono, 영어 디스플레이 문장 = Newsreader 이탤릭. 이 위계를 섞지 마세요.
- **M² 로고 색은 `--mark-a/b/c` 토큰입니다.** 다크 = 흰색 계열, 라이트 = 먹색 계열.
  흰 로고는 흰 배경에서 안 보이므로 라이트 모드를 흰색으로 바꾸지 마세요.
  보라색은 로고 "안"이 아니라 로고 "주변"(글로우·오로라)에 삽니다.
- **부서 영상은 장식입니다** (`aria-hidden`, `pointer-events:none`, 컨트롤 없음, GIF처럼 자동 반복).
  모션 최소화 설정에서는 재생되지 않고 포스터(완성 프레임)가 대신 보입니다.
- **부서 섹션의 오각형은 사실 4차원 정오포체(5-cell)입니다.** K5는 4-simplex의 변 그래프라서,
  JS(`site.js` §6b)가 4D 회전을 투영해 좌표만 바꿔 그립니다. 마크업의 납작한 오각형이
  JS 없음/모션 최소화 상태 그 자체이니, `data-a/b/dept` 속성을 지우면 안 됩니다.
- **브랜드 보라색(`--ink-*`)은 장식 전용입니다.** 대비가 모자라서 글자에 쓰면 안 됩니다.
  글자는 `--text` / `--muted` / `--accent`만.
- `opacity`로 글자를 흐리게 하지 마세요. 검증된 대비값이 조용히 깨집니다.
- **연출(모션)은 전부 `.js`가 붙어 있을 때만 동작합니다.** 히어로 등장, 연혁 축이 그려지는 효과 등은
  JS가 있을 때만 켜지고, 없으면 완성된 상태로 바로 보입니다. 새 애니메이션도 이 방식을 따르세요.
- 밑줄이 hover 때 그려지는 링크(`.work__go`, `.dept__more`, `.dback`)는 `background-origin: content-box`로
  글자 상자 기준에서 위치를 잡습니다 — padding이 있는 링크에서 밑줄이 글자 가운데(취소선처럼)로 올라가는 것을 막기 위해서입니다.

## 원칙

JS가 꺼져 있어도, 모션을 줄인 설정에서도 페이지는 **완성된 상태**로 보여야 합니다.
`.reveal`은 기본이 보이는 상태이고, `<head>`의 인라인 스크립트가 붙이는 `.js` 클래스가 있을 때만
숨겼다가 나타납니다. 새 기능을 넣을 때도 이 방향을 지켜주세요.
