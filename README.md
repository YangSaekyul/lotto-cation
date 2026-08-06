# 로또리 (LottoRi)

> 가까운 로또 판매점과 과거 당첨 이력을 쉽게 찾는 모바일 웹

**이름 유래:** 'Lotto'(로또) + 'Rotary'(로터리, 회전·돌림)의 합성어. 당첨 번호가 돌아가는 로터리처럼, 판매점과 이력을 한 바퀴 돌며 찾아준다는 뜻이다.

30대 이상 사용자를 위한 모바일 우선 로또 판매점 탐색 서비스다. 동행복권과 무관한 정보 서비스이며 과거 당첨 이력은 향후 당첨 확률을 높이지 않는다.

- Git: https://github.com/YangSaekyul/lotto-cation
- Project URL: 미배포
- Product plan: [`PRODUCT_PLAN.md`](./PRODUCT_PLAN.md)

## 로컬 실행

```bash
cp .env.example .env.local
npm ci
npm run dev
```

필수 지도 환경변수:

```text
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=[REDACTED]
```

제보 기능을 사용할 때만 필요한 서버 환경변수:

```text
SUPABASE_URL=[REDACTED]
SUPABASE_SERVICE_ROLE_KEY=[REDACTED]
REPORT_HASH_SALT=[REDACTED]
```

설정되지 않으면 지도 또는 제보 기능은 명시적인 준비 중 오류를 반환하며 가짜 성공을 표시하지 않는다. 제보는 DB 함수에서 시간당 5건 제한을 원자적으로 적용한다. 1년 보존기한을 실제 집행하려면 같은 Supabase 두 값을 GitHub Actions secret에도 등록해야 하며, `.github/workflows/purge-reports.yml`이 매일 오래된 제보를 삭제한다.

## 주요 화면·API

| 경로 | 기능 |
| --- | --- |
| `/` | 네이버 지도, 거리·등수 필터, 현재 위치, 가까운 판매점 |
| `/store/[id]` | 판매점 정보, 최근 당첨 이력 5건, 네이버 길찾기, 제보 |
| `/draw/latest` | 공식 직전 회차 번호와 1~5등 당첨자 수 |
| `/stats` | 1개월~5년 공식 당첨 번호 출현 횟수 |
| `/stores/ranking` | 등수·지역별 판매점 누적 이력 순위 |
| `/report?storeId=...` | 검증·rate limit·Supabase 영속화를 적용한 제보 |
| `/privacy` | 개인정보 및 위치정보 처리 안내 |

## 공식 데이터

```bash
python3 scripts/refresh_official_lotto_data.py
python3 scripts/build_unified_store_records.py
npm run import-data
```

- 공식 회차 결과: 1회부터 최신 완료 회차까지 수집
- 판매점 이력: legacy 262~1168회 1·2등 + 공식 1169회 이후 1~5등
- 지도: 공식 원천 또는 네이버 지오코딩으로 좌표가 검증된 오프라인 판매점만 표시
- 자동 갱신: `.github/workflows/refresh-data.yml`, 매주 토요일 22:30 KST

좌표가 없는 과거 판매점은 현재 위치 검색과 지도에서 제외한다. Naver Geocoding 자격 증명을 서버 환경에 설정한 뒤 아래처럼 200건으로 성공률을 먼저 확인하고 점진적으로 확대한다.

```bash
python3 scripts/geocode_missing_stores.py --limit 200
npm run import-data
```

## 품질 검증

```bash
npm run lint
npm test
npm run build
```

## 배포 준비

1. Naver Cloud Platform에서 Web Dynamic Map을 활성화하고 운영 도메인을 등록한다.
2. Supabase SQL Editor에서 [`db/schema.sql`](./db/schema.sql)을 실행한다.
3. Vercel에 `.env.example`의 필요한 환경변수를 secret으로 등록한다.
4. Vercel 프로젝트를 GitHub 저장소와 연결한다.
5. 실제 휴대폰에서 위치 허용·거부, 지도, 길찾기, 제보를 확인한다.
