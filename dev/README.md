# dev/ — ETF 포트폴리오 백테스터 원본과 작업 안내

이 폴더에는 앱을 고치고 다시 만드는 데 필요한 원본이 모두 들어 있어요. 저장소 맨 위의 `index.html`(GitHub Pages 사이트)은 이 폴더의 파일로 다시 만들어집니다. 새 대화(새 작업 공간)에서 이어서 작업할 때 이 문서부터 읽으면 돼요.

- 앱 주소: claude.ai 아티팩트 https://claude.ai/artifact/BeK8aVBu8VRYs3fgJFZBSj · GitHub Pages https://youncall31-glitch.github.io/EFT_BACKTESTER/
- 작업 기록: claude.ai 프로젝트 'Back test'의 문서 `claude/etf-backtester-notes.md` (버전별 변경, 검증한 숫자, 되돌리기 방법)
- 현재 버전: v8 (2026-10-16)

## 파일

| 위치 | 내용 |
|---|---|
| `src/template.html` | 화면 HTML·CSS. `__DATA__`, `__ENGINE__`, `__APP__` 자리에 아래 세 파일이 들어감. 맨 끝의 `v8` 블록이 휴대폰 우선 배치(아래 탭 막대, 가장자리까지 닿는 칸, 접는 칸, 한눈에 보기)를 정함 |
| `src/engine.js` | 계산 엔진: 월간 백테스트(Portfolio Visualizer 방식), 통계, 롤링, 최적화, 추세 보정 |
| `src/app.js` | 화면 동작: 입력(휴대폰은 포트폴리오 카드를 하나씩), 한눈에 보기, 결과 표·차트, MDD 구분, 구간별 점검, 최적화, 저장, 탭, 접는 칸 |
| `src/data.json` | 50개 티커 1972.01–2026.09 월간 총수익률·분배율, CPI-U, 단기국채 (기준일 2026-10-07) |
| `build.py` | 아래 결과물을 한 번에 만듦 |
| `tests/` | 브라우저 테스트(Playwright + Chromium) |
| `data-pipeline/` | `data.json`을 만든 스크립트(참고용). 원본 데이터 저장소·중간 파일은 들어 있지 않고 경로도 예전 작업 공간 기준이라, 다시 돌리려면 손봐야 함 |
| `../retire120/` | 다른 대화에서 만든 120세 은퇴자금 계산기. **건드리지 않음** |

`python3 dev/build.py`가 만드는 것:
- `dev/out/etf-backtester.html` — claude.ai 아티팩트에 게시할 페이지
- `dev/out/app/etf-backtester.html`, `dev/out/app/etf-backtester-app.zip` — 파일 하나 버전, 설치형 앱 묶음
- 저장소 맨 위 `index.html`, `manifest.webmanifest`, `sw.js`, 아이콘 — GitHub Pages 사이트
- `dev/tests/test.html` — 테스트가 여는 페이지

`dev/out/`, `dev/tests/test.html`, `dev/tests/shots/`는 git에 올리지 않아요(.gitignore).

## 고치고 올리는 순서

1. `dev/src/` 파일을 고친다.
2. `dev/build.py`의 `VERSION`을 올린다(예: `v8.1-2026-10-20`). 설치형 앱의 오프라인 캐시 이름이라, 올려야 새 파일이 반영돼요. `src/template.html` 맨 위 업데이트 내역(`<details class="upd">`)에도 한 줄 추가.
3. `python3 dev/build.py`
4. 테스트 (`pip install playwright pillow`; Chromium 필요)
   - `python3 dev/tests/audit8.py` — 모든 탭을 접힌 칸 닫힘/열림 두 상태로 360·390·768·1280px, 밝은/어두운 화면, 탭/한 페이지에서 확인(화면 폭 넘침, 휴대폰에서 옆으로 밀리면 안 되는 표, 콘솔 오류). `shots`를 붙이면 `tests/shots/a8_*.png` 화면도 저장
   - `python3 dev/tests/check7.py` — 화면 폭 넘침·콘솔 오류 (PC·휴대폰, 탭·한 페이지)
   - `python3 dev/tests/functest15.py` — MDD 구분 값이 다른 표와 일치, 기간 머리글, 휴대폰 카드, 점검 대기, 음수 표기
   - `python3 dev/tests/test_app.py` — 파일 하나 버전과 설치형 앱(오프라인 포함)
   - 그 밖에 `functest2~14.py` — 최적화, 배당, CSV 추가, 저장, 추세 보정, 구간 점검, 탭, 접는 칸 등. 한 페이지 배치로 여는 테스트는 시작할 때 접는 칸을 모두 펼침. `functest4.py`의 '새로고침 후 저장 목록' 줄은 헤드리스 Chromium의 file:// 저장소 때문에 가끔 비어 나와요(앱 문제 아님, 다시 돌리면 정상).
5. claude.ai 아티팩트: `dev/out/etf-backtester.html`을 같은 주소(위 URL)로 다시 게시.
6. GitHub: 커밋 후 `main`에 푸시 → GitHub Pages가 1~2분 안에 자동 배포. 다른 대화가 같은 저장소에 올린 것이 있을 수 있으니 푸시 전에 `git fetch` 후 필요하면 rebase.
7. 프로젝트 문서 `claude/etf-backtester-notes.md`를 새 버전 내용으로 고친다.

## 방문 통계 (선택)

`dev/build.py`의 `GOATCOUNTER`에 GoatCounter 사이트 코드(예: `etfbt` → https://etfbt.goatcounter.com)를 넣고 빌드하면, GitHub Pages 주소(`*.github.io`)에서 열 때만 방문을 셉니다. 쿠키를 쓰지 않고, 아티팩트와 파일 하나 버전에서는 불러오지 않아요. 통계는 GoatCounter 대시보드에서 봅니다.

## 사용자가 원하는 방식 (지금까지의 대화에서)

- 휴대폰에서 초보자도 한눈에 보고 쓸 수 있게. 복잡한 것은 ‘고급’ 표시를 붙여 접어 두고(익숙한 사람만 펼쳐 봄), 항목마다 짧은 설명 한 줄. 설명이 오히려 방해되면 빼기.
- 한국어로, 초보도 알아보기 쉽게. 표마다 어느 기간·어느 MDD인지 이름을 붙이고, 구분선·색으로 영역을 나눔. 어두운 화면에서도 잘 보이게.
- 업데이트는 claude.ai 아티팩트와 GitHub 두 곳 모두에 반영.
- 화면은 탭 배치(v7.2)를 유지. 한 페이지 배치는 선택 사항으로 남김(도움말 › 화면 설정).
- 맨 위에 최신 업데이트 날짜와 내용을 보여줌(`<details class="upd">`).
- 숫자는 독립 계산으로 확인한 뒤 올림. 투자 자문이 아니라 과거 데이터 분석임을 밝힘.

## 화면 구조 메모 (v8)

- 탭: 입력 · 결과 · 점검 · 최적화 · 도움말 (`TAB_IDS`). 휴대폰(640px 이하) 탭 배치에서는 위쪽 막대 대신 아이콘 탭 막대(`#bnav`).
- 접는 칸: `<details class="fold" data-fold="…">`. ‘고급’ 표시는 `.adv-b`. 펼친 칸은 `localStorage['etf-backtester.folds.v1']`에 기기마다 기억. 도움말 › 화면 설정의 ‘모두 펼치기/접기’. 접힌 칸 안의 차트는 펼칠 때 다시 그림.
- 입력 탭 순서: 포트폴리오(980px 이하는 `#port-tabs`로 카드 하나씩) → 결과 미리보기 → 기간과 금액 → 고급 설정(접힘, 요약 한 줄 `#adv-sum`) → 저장한 포트폴리오(접힘).
- 결과 탭: 한눈에 보기(`#hero`, 기간 칩 `#quick2`) → 차트 → 최근 N년 성과(900px 이하는 기간 칩 `#trail-pick`) → MDD 구분(760px 이하는 한 화면 표) → 고급: 자세한 지표·수익과 위험·연도별 수익률·롤링.
- 점검 탭: 판정만 보이고, 표·지도·직접 고른 구간·추세 보정은 고급. 최적화 탭: 대상 자산·기준은 접힌 칸(요약 한 줄), 기간별 최적 비중만 펼쳐 둠.
- v7의 간단히/자세히(`etf-backtester.view.v1`)는 없앰(남아 있으면 지움).

## 버전 요약

- v8 (2026-10-16) 휴대폰·초보자 우선 화면: 한눈에 보기(최종 금액·연 수익률·최대 낙폭·최장 회복·자산 곡선), ‘고급’ 접는 칸(기기마다 기억), 항목별 한 줄 설명과 용어 풀이, 아이콘 탭 막대, 포트폴리오 카드 하나씩, 최근 N년 기간 고르기, 한 화면 MDD 표
- v7.3 (2026-10-10) MDD 구분 표, 표마다 기간 표시(머리글 겹침 수정), 휴대폰 표 카드, 점검 대기·0 표기·중앙값·음수 기호 수정
- v7.2 탭 화면(1 입력 · 2 결과 · 3 점검 · 4 최적화 · 5 도움말), 입력 탭 결과 미리보기
- v7.1 수익과 위험 지표(보통의 10년, 평균 낙폭, 울서 지수, 마틴 비율, 큰 하락 목록)
- v7 내 포트폴리오 추세 보정 백테스트, 구간별 점검, 간단히/자세히, 어두운 화면 개선
- v6 최근·가장 과거 10·20·30년 최적화, 설치형 앱 · v5 배당 현금 수령 · v4 추세 유지 보정 · v1–v3 백테스트·기간별 비교·최적화·생애 주기·과최적화 점검·저장
