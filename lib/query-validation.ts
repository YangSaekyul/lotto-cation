export type NearbyQuery = { lat: number; lng: number; radius: number };
export type NearbyValidation = { ok: true; data: NearbyQuery } | { ok: false; message: string };
export type BoundsQuery = { south: number; west: number; north: number; east: number };
export type BoundsValidation = { ok: true; data: BoundsQuery } | { ok: false; message: string };

const ALLOWED_RADII = new Set([0.3, 0.5, 1, 3, 5, 10]);

export function validateNearbyQuery(
  latValue: string | null,
  lngValue: string | null,
  radiusValue = "5",
): NearbyValidation {
  if (latValue === null || lngValue === null) return { ok: false, message: "위도와 경도가 필요합니다." };
  const lat = Number(latValue);
  const lng = Number(lngValue);
  const radius = Number(radiusValue);
  if (![lat, lng, radius].every(Number.isFinite)) return { ok: false, message: "숫자 형식이 올바르지 않습니다." };
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return { ok: false, message: "좌표 범위가 올바르지 않습니다." };
  if (!ALLOWED_RADII.has(radius)) return { ok: false, message: "지원하지 않는 검색 반경입니다." };
  return { ok: true, data: { lat, lng, radius } };
}

export function validateBoundsQuery(
  southValue: string | null,
  westValue: string | null,
  northValue: string | null,
  eastValue: string | null,
): BoundsValidation {
  if ([southValue, westValue, northValue, eastValue].some((value) => value === null)) {
    return { ok: false, message: "지도 범위 좌표가 필요합니다." };
  }
  const south = Number(southValue);
  const west = Number(westValue);
  const north = Number(northValue);
  const east = Number(eastValue);
  if (![south, west, north, east].every(Number.isFinite)) return { ok: false, message: "숫자 형식이 올바르지 않습니다." };
  if (south < -90 || north > 90 || west < -180 || east > 180 || south >= north || west >= east) {
    return { ok: false, message: "지도 범위가 올바르지 않습니다." };
  }
  if (north - south > 30 || east - west > 50) {
    return { ok: false, message: "한 번에 조회할 수 있는 지도 범위를 초과했습니다." };
  }
  return { ok: true, data: { south, west, north, east } };
}
