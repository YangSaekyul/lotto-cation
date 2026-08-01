# 로또케이션 (LottoCation)

> 가까운 로또 판매점과 과거 당첨 이력을 쉽게 찾는 모바일 웹

30대 이상 사용자를 위한 **모바일 우선 로또 판매점 탐색 서비스**의 신규 저장소다.

- Git: https://github.com/YangSaekyul/lotto-cation
- Project URL: 미배포 — 지도 MVP와 데이터 검증 후 확정
- Product plan: [`PRODUCT_PLAN.md`](./PRODUCT_PLAN.md)

## 데이터 상태

- Legacy historical store data: 1·2등 이력 51,456건, 1168회까지 보존
- Official refresh: 1169~1234회 결과 66회 및 1~5등 판매점 28,136건을 동행복권 공식 엔드포인트에서 수집
- Latest verified completed draw: 1234회 (2026-07-25)

데이터는 과거 당첨 이력 탐색용이다. 과거 이력·번호 통계는 향후 당첨 확률을 높이지 않는다.

## 시작 전 남은 데이터 작업

1. legacy 1·2등 이력과 official 1169~1234회 1~5등 이력을 정규화·병합한다.
2. 기존 14,079개 주소 중 좌표가 없는 과거 판매점을 지오코딩한다.
3. 동행복권 원천의 최신 회차와 판매점 이력을 매주 갱신하는 job을 만든다.

기존 `YangSaekyul/lotto` 코드는 사용하지 않는다. 이 저장소는 데이터와 새 기획만 보존하며 앱 코드는 데이터 병합 검증 이후 추가한다.
