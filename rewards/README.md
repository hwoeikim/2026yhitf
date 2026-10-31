# 기념품 섹션 (메달·도안·티셔츠·룩북·키트)

- 원본: medal/v2/page.html + medal/v2/medal.js
- 빌드: `python3 rewards/build.py <커밋SHA> main|rewards` → rewards/widget_main.html (메인) · widget_rewards.html (/rewards) (이미지·3D는 jsDelivr 해당 커밋에서 불러옴)
- 상금 데이터·스타일: rewards/prize_src.txt (css / 상금 섹션 #yh-money / 메인 띠 #yh-mstrip, "=====" 줄로 구분). 2~5위 null = COMING SOON
  - 주의: 기존 경품 위젯이 #yh-prize를 쓰므로 그 id는 쓰지 말 것
- 붙인 곳 (2026-10-23, 국문):
  - 메인: 섹션 s20261012ec9e33c637142(KIA) 맨 위 위젯 w20261023c36a0887cd466 = 굿즈 + 1위 상금 띠(→/rewards)
  - /rewards: 섹션 s202610237b8174ebf78dd(가로 100% 확장) 순서 = 굿즈+상금 위젯 → KIA → 경품 2·3·4등 → 러닝클래스 (아래 셋은 메인에서 위젯 복사·붙여넣기)
- 위젯 첫 줄 `<style>`이 예전 "COMING SOON 기념품" 섹션을 숨김
  - 메인 #s20260919f8c0890b7d6cc, /rewards #s2026092107700f3e1171d — 줄을 지우면 다시 보임
  - /rewards는 섹션 좌우 여백 때문에 `#yh-rewards{width:100vw;margin-left:calc(50% - 50vw)}` 추가
- 수정 절차: medal/v2 수정 → 커밋·push → build.py로 widget.html 생성·커밋 → 아임웹 위젯 코드에서 첫 줄 <style>은 남기고 나머지를 새 widget.html로 교체 → 저장·게시
- 영문 사이트는 아직 (국문 확인 후 번역해서 넣기로 함)
- 주의(2026-10-23): 저장소가 jsDelivr 한도(50MB)를 넘어서 새 커밋은 CDN이 403("Package size exceeded")을 줄 때가 있음
  - 이미지·medal.js가 안 바뀌었으면 build.py에 예전에 잘 뜨던 커밋 SHA(현재 c1129c1…)를 넣어 자산 주소를 고정
  - 위젯 코드 자체는 raw.githubusercontent.com/<SHA>/rewards/widget_*.html 에서 받아 붙여넣기 (응답 길이·id 확인 후 교체)
- 해결(2026-10-23 저녁): 자산 전용 가벼운 브랜치 `goods-assets`(medal/v2만, 약 4.5MB)를 만들어 jsDelivr가 이 브랜치 커밋에서 이미지를 받도록 함
  - 자산 바꾼 뒤: `sh rewards/sync_assets.sh` → 나온 SHA로 `python3 rewards/build.py <SHA> main|rewards`


## Live (2026-10-24 02:2x KST)
- widget commit 7b06829316c5e7e5f19f65403c30ce8c352a2c8c, assets cacf7b5a49ab36c29793fe9a7aa1f3d8de0dcf40 (main + /rewards)
- previous live: widget 3c071d4…, assets b36ee1b…

- 2026-10-24 ~02:55 KST: widget f5c902de (yx- class prefix, medal line art), assets af634b23
- 2026-10-24 ~03:30 KST: widget 5f1f0a3f (mobile: 3D width, caption order, swipe lookbook), assets 37982c15
- 2026-10-24 ~03:40 KST: widget 09f55a19 (3D medal removed for now; full prize table on main), assets 0043497e. 3D code kept in medal.js for later.
- 2026-10-24 ~03:50 KST: widget 0535ac0e (mobile caption back under photo), assets 77f1bec9
- 2026-10-26 ~15:50 KST: widget 42a5043e (jacket size chart men XS-2XL, women XS-L), assets 9cd10aa9; /registration: jacket notice + size tables inserted (kr/registration_jacket_size_addon.html)
- 2026-10-26 PM: women's jacket chart + XL/2XL (men's values) + note; widget 075a0e2 on main & /rewards; KR /registration updated; published
- 2026-10-26 PM: EN /registration jacket notice + charts (record en/registration_jacket_size_addon.html); published
- 2026-10-26 16:40: 3XL added (men; women = men's 3XL) on main, /rewards (widget a20f243), KR & EN /registration; all published
- 2026-10-26 17:50: my-entry (KR/EN) shows finisher jacket row for trail entries; published
- 2026-10-26 19:30: leaflet 99af14e (Firefox: visible faces ignore backface-visibility) published KR; EN pending (extension permission)
- 2026-10-26 19:45: leaflet 597f283 (Firefox flat crossfade fallback, ?yhff=1 to preview) published KR+EN
- 2026-10-27 18:40: Samtree chickpea kit item (06), renumbered; widget 6eb24e8, assets 8b23424 — KR/EN main + /rewards published
- 2026-10-27 19:10: medal renamed to '2026 YHITF 기념 메달' / 'Commemorative Medal'; widget 3ee8ef9 — KR/EN main + /rewards published
- 2026-10-28 AM: tee size chart restyled like the jacket chart (horizontal, white card); widget cdef090, KR/EN main + /rewards published
- 2026-10-28 AM: jacket back image (jk_back_mock.webp) replaced with a properly clipped file; assets 1652c6c, widget 5860f57, KR/EN main + /rewards published
- 2026-10-28: size chart notices posted on the KR and EN notice boards (tables only)
- 2026-10-28: Samtree sponsor logo (medal/v2/logo_samtree.png via goods-assets e47ba76) added after Nature Valley in yh-sp, yh-roll (main) and yh-inv (/invited), KR + EN; EN name map 'Samtree'

## 2026-10-29
- 교통 및 집결지 안내: guide/transport/widget.html (KR /access), widget_en.html (EN /gettinghere). 정보 출처 88run.kr 오시는 길. 지도 OSM+Leaflet, 역 좌표 OSM 기준.
- 사이트 공통: common/site_tweaks_kr.html / _en.html 을 떠 있는 버튼 위젯(KR "하단 좌측 고정위젯", EN "하단 버튼 고정 위젯") 코드 맨 끝에 추가. 헤더 불투명, 노트북 높이(≤860px)에서 메인 첫 화면 위 여백 80px, 스크롤 시 버튼 85% 축소.

- 10/29 23:10 교통안내 v7 배포 (KR /access, EN /gettinghere): 목록+패널을 지도 블록으로, 하단 마감 배너(참가신청 CTA), 라벨 1.6초 후 대중교통 자동 열림·라벨 숨김. commit ea4adeb

- 10/30 배포 (KR/EN)
  - 푸터: 사업자정보 파란 밴드, 호스팅 숨김, EN 라벨 영문화 (site_tweaks)
  - 지도: Google Maps API 중지 → gmshim.js(Leaflet+OSM)로 메인·코스 지도 4곳 교체 (@73544ea)
  - 러닝클래스: 10월 1·2회차 마감 / 11월 오픈 예정, 버튼 숨김 (메인·시상 페이지)
  - 기념품: 여성 XL+ '남성용' 표시, 디자인 변경·대체 문구 통합 (메인·/rewards)
  - 제19조 보험 조항 교체 + 나./B. 보험 안내: 공지·약관·상품상세·신청서·규정 모달 (KR/EN)
  - 공지 신규: 스포츠활동안심공제 KR idx=175344676 / EN idx=175344686
- 2026-10-31 PM: AMINOREGEN (아미노리젠) — logo (two-line ®, ratio 2.5) after Samtree/last in yh-sp, yh-roll, yh-inv KR+EN; kit 09 에너지젤 스퍼트 + 10 오리지널 (15K·28K trail only), jacket → 11; line art l_gel.svg, l_stick.svg; photo e_amino.webp; lookbook caption fix (number no-shrink, name wraps). assets d9d7313, widget 546e13d — KR/EN main + /rewards published. Note: EN name map typo broke EN main logo sections ~25 min, fixed.
- 2026-10-31 18:xx: lookbook 3rd row (09–10 AMINOREGEN, 11 finisher jacket e_jkfit.webp) with orange '15KM · 28KM만' tags; assets 0bc30f2, widget b02a616 — KR/EN main + /rewards. Sponsor order unified on /invited KR+EN (KEEN, 진안홍삼, 네이처밸리, 샘트리, 아미노리젠). KR /course schedule mobile top spacing 72px.
- 10/31 e_amino.webp 그림자 좌우 잘림 수정(여백 두고 재합성) — assets 1840c0d / widget 9ea0728, KR·EN 메인·/rewards 4곳 게시·라이브 확인 (EN 메인 KIA 코드 유지)
- 10/31 19:xx e_jkfit.webp 교체(사용자가 덮어쓴 '완주자켓 모델핏 추가수정.png' 반영) — assets 1e12b2b / widget 6da9bf5, KR·EN 메인·/rewards 4곳 게시·라이브 확인 (EN 메인 KIA 유지)
