-- ============================================================================
-- LottoRi / Lotto-cation — RLS 보안 마이그레이션 (보안 경고 대응)
-- 대상: Supabase project lotto-map-recovered (ref: kkjpadnjsitnhsqltiuf)
-- 이유: Supabase Advisor 보안 경고 — RLS 미활성화 테이블이 public으로 노출됨
-- 시작일: 2026-08-04
-- 적용 방법: Supabase 대시보드 → SQL Editor에 붙여넣고 Run (트랜잭션 내 실행)
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. 운영 테이블 전부 RLS 활성화
--    (schema.sql 기준 stores / winning_store_records / draw_results 가 RLS 꺼짐,
--     store_reports 는 이미 RLS ON — 재확인차 포함)
-- ---------------------------------------------------------------------------
ALTER TABLE stores               ENABLE ROW LEVEL SECURITY;
ALTER TABLE winning_store_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_results         ENABLE ROW LEVEL SECURITY;
-- 이미 켜져 있어도 안전(idempotent)
ALTER TABLE store_reports        ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. 공개 읽기 정책 (선택적: 앱이 anon key 로 표시용 데이터를 읽는 경우에만)
--    판매점·당첨 내역·회차 결과는 공개 조회돼도 무방 → SELECT 허용.
--    단, 쓰기/수정/삭제는 service_role 전용으로 차단.
-- ---------------------------------------------------------------------------
CREATE POLICY "public_read_stores" ON stores
  FOR SELECT USING (true);
CREATE POLICY "public_read_winning_store_records" ON winning_store_records
  FOR SELECT USING (true);
CREATE POLICY "public_read_draw_results" ON draw_results
  FOR SELECT USING (true);

-- 쓰기 정책: anon/authenticated 는 어떤 테이블에도 INSERT/UPDATE/DELETE 없음
-- (기본적으로 권한 없음 — REVOKE 로 이중 안전장치)
REVOKE ALL ON stores, winning_store_records, draw_results FROM anon, authenticated;
GRANT SELECT ON stores, winning_store_records, draw_results TO anon, authenticated;

-- store_reports 는 서버(service_role) 전용.
-- public policy 만들지 않는다 — 브라우저 직접 접근 금지.
REVOKE ALL ON store_reports FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_store_report(VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR)
  TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. (권장) 예제/유령 테이블 정리 — rls_disabled_in_public
--    이 테이블은 Supabase 스타터 템플릿이 만들어낸 예제 테이블이며
--    schema.sql 에 없는 비운영 테이블. 보안 표면 축소를 위해 삭제 권장.
--    정말 사용 중이라면 아래 줄을 주석 처리.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS rls_disabled_in_public;

-- ---------------------------------------------------------------------------
-- 4. 검증 쿼리 (적용 후 실행해 확인)
-- ---------------------------------------------------------------------------
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
-- → 모든 테이블 rowsecurity = true 여야 함

COMMIT;
