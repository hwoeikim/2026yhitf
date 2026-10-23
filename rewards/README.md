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
