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
