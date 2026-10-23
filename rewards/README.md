# 기념품 섹션 (메달·도안·티셔츠·룩북·키트)

- 원본: medal/v2/page.html + medal/v2/medal.js
- 빌드: `python3 rewards/build.py <커밋SHA>` → rewards/widget.html (이미지·3D는 jsDelivr 해당 커밋에서 불러옴)
- 붙인 곳 (2026-10-23, 국문):
  - 메인: 섹션 s20261012ec9e33c637142(KIA) 맨 위 코드 위젯, 메모 "기념품 섹션 메달·티셔츠·키트"
  - /rewards: 섹션 s202609213dd8d2b3bdf4c(럭키드로우) 맨 위 코드 위젯, 같은 메모
- 위젯 첫 줄 `<style>`이 예전 "COMING SOON 기념품" 섹션을 숨김
  - 메인 #s20260919f8c0890b7d6cc, /rewards #s2026092107700f3e1171d — 줄을 지우면 다시 보임
  - /rewards는 섹션 좌우 여백 때문에 `#yh-rewards{width:100vw;margin-left:calc(50% - 50vw)}` 추가
- 수정 절차: medal/v2 수정 → 커밋·push → build.py로 widget.html 생성·커밋 → 아임웹 위젯 코드에서 첫 줄 <style>은 남기고 나머지를 새 widget.html로 교체 → 저장·게시
- 영문 사이트는 아직 (국문 확인 후 번역해서 넣기로 함)
