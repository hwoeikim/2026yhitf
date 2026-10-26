"""Make the English goods/prize section sources from the Korean ones.
medal/v2/page.html -> medal/v2/page_en.html, rewards/prize_src.txt -> rewards/prize_src_en.txt
then: python3 rewards/build.py <assetSHA> en"""
import re, sys
V = '/home/claude/2026yhitf/medal/v2/'
R = '/home/claude/2026yhitf/rewards/'

T = {
 # whole sentences first (they contain smaller keys)
 '<p class="yx-lead">15KM · 28KM 트레일런 완주 시,<br><strong>완주를 기념하는 자켓</strong>을 받으실 수 있습니다.</p>':
   '<p class="yx-lead">Finish the 15KM or 28KM Trail Run<br><strong>and the finisher jacket is yours.</strong></p>',
 '<b>10만원 상당</b> 러닝 키트,<br>참가자 전원 증정': 'A running kit <b>worth KRW 100,000</b>,<br>for every runner',
 '2026 YHITF 공식 협찬사 KEEN 콜라보 기념 티셔츠': 'Commemorative T-shirt with KEEN, official partner of 2026 YHITF',
 '일상부터 대회까지, 미국 포틀랜드 아웃도어의 기능성과 활동성을 선사합니다.': 'From everyday runs to race day — the function and freedom of Portland outdoor gear.',
 '일상부터 대회까지,<br>달리는 것 그 이상.': 'From everyday to race day,<br>more than running.',
 '이미지는 연출된 것으로 실제 제품과 차이가 있을 수 있습니다.': 'Images are for illustration only. Actual products may differ.',
 'XL 이상은 남성 자켓으로 지급됩니다.': "Sizes XL and above are provided as men's jackets.",
 # alt / aria text
 '어두운 네이비 배경에 세워 둔 2026 YHITF 완주 메달. 은색과 로즈골드 띠가 얽힌 투각 디자인, 위로 메달끈': '2026 YHITF finisher medal standing on a dark navy background: an openwork design of interlaced silver and rose gold bands, lanyard above',
 '앞면: 가슴 중앙에 민트 KEEN 로고, 왼쪽 소매에 KEEN for the Trails': 'Front: mint KEEN logo at the center of the chest, KEEN for the Trails on the left sleeve',
 '뒷면: 등 상단에 흰색 YHITF 로고, 아래에 민트 Keen for the Trails와 KEEN 로고': 'Back: white YHITF logo across the upper back, mint Keen for the Trails and KEEN logo below',
 '블랙 롱슬리브 기념 티셔츠를 입은 두 러너가 콘크리트 벽 앞에 앉아 있다. 남성 가슴에 KEEN 로고, 여성 등에 YHITF 로고': 'Two runners in the black long-sleeve T-shirt sit against a concrete wall: KEEN logo on his chest, YHITF logo on her back',
 '두 러너가 마주 앉아 있다. 남성 앞면에 KEEN 로고, 여성 뒷면에 YHITF 로고와 Keen for the Trails': 'Two runners sit facing each other: KEEN logo on his front, YHITF logo and Keen for the Trails on her back',
 '앞면 도안: 가슴 KEEN 로고, 소매 KEEN for the Trails 그래픽': 'Front artwork: KEEN logo on the chest, KEEN for the Trails graphic on the sleeve',
 '뒷면 도안: 등 YHITF 로고와 대회명, 하단 Keen for the Trails와 KEEN 로고': 'Back artwork: YHITF logo and race name on the back, Keen for the Trails and KEEN logo below',
 '네이비 후드 자켓 여성용과 남성용. 왼쪽 가슴에 YHITF 로고, 오른쪽 소매에 FINISHER 프린트': "Navy hooded jacket, women's and men's: YHITF logo on the left chest, FINISHER print on the right sleeve",
 '자켓 뒷면 여성용과 남성용. 등 하단에 YHITF 로고, 소매에 FINISHER 프린트': "Back of the jacket, women's and men's: YHITF logo on the lower back, FINISHER print on the sleeve",
 '파란 하늘 아래 완주 기념 자켓을 입고 걷는 남성, 왼쪽 가슴에 YHITF 로고': 'A man walking under a blue sky in the finisher jacket, YHITF logo on the left chest',
 '완주 기념 자켓을 입은 여성 모델, 왼쪽 가슴에 YHITF 로고': 'A woman wearing the finisher jacket, YHITF logo on the left chest',
 '자켓 소매 끝 엄지 구멍과 스티치 디테일': 'Thumbhole and stitching at the jacket cuff',
 '종목별 메달끈을 단 완주 메달 세 개': 'Three finisher medals with race lanyards',
 'KEEN 콜라보 기념 티셔츠 앞면과 뒷면': 'Front and back of the KEEN collaboration T-shirt',
 '흰색 92 BCN 자수 모자, 옆면에 황영조 감독 사인': "White cap with 92 BCN embroidery, Hwang Young-cho's signature on the side",
 '네이버밸리 에너지바 두 종류': 'Two Nature Valley energy bars',
 '네이처밸리 에너지바 두 종류': 'Two Nature Valley energy bars',
 '타포린백 앞면과 뒷면': 'Front and back of the tarpaulin bag',
 '베이지, 스트라이프, 블랙 기능성 마스크': 'Performance masks in beige, stripe and black',
 "바위 위에 놓인 '달리는 것, 그 이상.' 문구의 2026 YHITF 키트 박스 세 개, 흰색·오렌지·블루": 'Three 2026 YHITF kit boxes in white, orange and blue on a rock',
 '앞면 메달끈을 건 모습': 'Front with lanyard',
 '뒷면 메달끈을 건 모습': 'Back with lanyard',
 # kit list
 '92 바르셀로나 기념 황영조 감독 사인 모자': "Hwang Young-cho Signed Cap ('92 Barcelona)",
 '네이처밸리 오츠 앤 다크 초콜릿': "Nature Valley Oats 'n Dark Chocolate",
 '네이처밸리 크런치 초콜릿칩': 'Nature Valley Crunchy Chocolate Chip',
 '색상 3종 중 랜덤 1': '1 of 3 colors, random',
 '15KM · 28KM 트레일런 참가자 대상': '15KM · 28KM Trail Run runners',
 '완주 기념 자켓 (완주 시)': 'Finisher Jacket (on finishing)',
 '러닝 키트 구성품 일러스트': 'Running kit line art',
 '15KM · 28KM 트레일런만 해당': '15KM · 28KM Trail Run only',
 '15KM · 28KM 트레일런 한정': '15KM · 28KM Trail Run only',
 '러닝 키트 연출 사진': 'Running kit photos',
 '01 2026 YHITF 완주 메달': '01 2026 YHITF Finisher Medal',
 '02 KEEN 콜라보 기념 티셔츠': '02 KEEN Collaboration T-shirt',
 '03 황영조 감독 사인 모자': '03 Hwang Young-cho Signed Cap',
 '04–05 네이처밸리 에너지바 2종': '04–05 Nature Valley Energy Bars',
 '06 타포린백': '06 Tarpaulin Bag',
 '07 기능성 마스크': '07 Performance Mask',
 '2026 YHITF 완주 메달': '2026 YHITF Finisher Medal',
 'KEEN 콜라보 기념 티셔츠': 'KEEN Collaboration T-shirt',
 '황영조 감독 사인 모자': 'Hwang Young-cho Signed Cap',
 '네이처밸리 에너지바 2종': 'Nature Valley Energy Bars (2)',
 '트레일런 완주 기념 자켓': 'Trail Run Finisher Jacket',
 '완주 기념 자켓 착용 컷': 'Finisher jacket on model',
 '기념 티셔츠 착용 컷': 'T-shirt on model',
 '완주 기념 자켓': 'Finisher Jacket',
 '실버 &amp; 로즈골드 투톤': 'Silver &amp; rose gold two-tone',
 '메달 · 메달끈 도안': 'Medal &amp; lanyard artwork',
 '종목별 메달끈': 'Lanyards by race',
 '2026 연합뉴스 하남': '2026 Yonhap News Hanam',
 '국제 트레일런 페스티벌': 'International Trail Run Festival',
 'YHITF 기념품 시안': 'YHITF goods',
 '사이즈표 선택': 'Choose size chart',
 '도안 면 선택': 'Choose side',
 '총장(옷 길이)': 'Length',
 '권장 신장 (cm)': 'Rec. height (cm)',
 '권장 체중 (kg)': 'Rec. weight (kg)',
 '전 종목 공통': 'All races',
 '프린트 도안': 'Print artwork',
 '앞면 도안': 'Front artwork',
 '뒷면 도안': 'Back artwork',
 '여성 뒷면': 'Women · back',
 '남성 뒷면': 'Men · back',
 '소매 디테일': 'Sleeve detail',
 '단위: cm': 'Unit: cm',
 '가슴단면': 'Chest (half)',
 '가슴둘레': 'Chest',
 '밑단둘레': 'Hem',
 '어깨너비': 'Shoulder',
 '소매길이': 'Sleeve',
 '사이즈표': 'Size chart',
 '완주 메달': 'Finisher Medal',
 '착용 컷': 'On model',
 '타포린백': 'Tarpaulin bag',
 '기능성 마스크': 'Performance mask',
 '구성품': 'Item',
 '사이즈': 'Size',
 '항목': 'Size',
 '수량': 'Qty',
 '기장': 'Length',
 '앞면': 'Front',
 '뒷면': 'Back',
 '여성': 'Women',
 '남성': 'Men',
}
P = {
 '<h2 id="yh-money-t">종목별 <b>상금</b></h2>': '<h2 id="yh-money-t"><b>Prize money</b> by race</h2>',
 'aria-label="종목 선택"': 'aria-label="Choose race"',
 '<h3>남자부</h3>': '<h3>Men</h3>', '<h3>여자부</h3>': '<h3>Women</h3>',
 '<b>1위</b>': '<b>1ST</b>',
 '"note":"토·일 각 회차별 시상"': '"note":"Awarded in each Saturday and Sunday wave"',
 "el.innerHTML=won(n)+'<small>원</small>'": "el.innerHTML=won(n)+'<small>KRW</small>'",
 "el.innerHTML=won(Math.round(n*e/1000)*1000)+'<small>원</small>'": "el.innerHTML=won(Math.round(n*e/1000)*1000)+'<small>KRW</small>'",
 "(j+2)+'<span>위</span>": "(j+2)+'<span>'+['ND','RD','TH','TH'][j]+'</span>",
 "won(x)+'원</span>'": "won(x)+' KRW</span>'",
 "toLocaleString('ko-KR')": "toLocaleString('en-US')",
 '<span>남녀 종목별</span>1위 상금': '<span>Men and women, by race</span>1st place prize',
 '>전체 시상 보기<': '>All prizes<',
 '<small>원</small>': '<small>KRW</small>',
}

def tr(s, D):
    for k in sorted(D, key=len, reverse=True):
        s = s.replace(k, D[k])
    return s

def left(s):
    body = re.sub(r'<style.*?</style>', '', s, flags=re.S)
    return sorted(set(m.strip() for m in re.findall(r'[^<>"\'\n]*[가-힣][^<>"\'\n]*', body)))

src = open(V+'page.html').read()
en = tr(src, T)
en = en.replace('<html lang="ko">', '<html lang="en">')
open(V+'page_en.html', 'w').write(en)
p = open(R+'prize_src.txt').read()
pe = tr(p, P)
open(R+'prize_src_en.txt', 'w').write(pe)
rest = left(en) + left(pe)
print('untranslated:', rest)
