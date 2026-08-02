import fs from 'fs';
import path from 'path';

export type WinRank = 1 | 2 | 3 | 4 | 5;

export type WinningHistoryItem = {
  draw: number;
  rank: WinRank;
  count: number;
  source?: string;
};

export type StoreRecord = {
  id: string;
  name: string;
  address: string;
  normalized_name: string;
  normalized_address: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm?: number;
  distanceFormatted?: string;
  is_online: boolean;
  status: "좌표 확인" | "확인 필요";
  geocode_status: "official_verified" | "geocoded" | "pending";
  totalWins: number;
  rankCounts: Record<WinRank, number>;
  history: WinningHistoryItem[];
  latest_draw: number;
  hours: string;
  phone: string;
  region: string;
  updated_at: string;
};

export type MapStoreRecord = Pick<
  StoreRecord,
  "id" | "name" | "address" | "latitude" | "longitude" | "totalWins" | "rankCounts" | "latest_draw"
>;

export type DrawResult = {
  draw_no: number;
  draw_date: string;
  winning_numbers: number[];
  bonus_number: number;
  winner_counts: Record<string, number>;
  prize_amounts?: Record<string, string>;
  source_url: string;
  collected_at: string;
};

export type NumberFrequency = {
  number: number;
  count: number;
  level: "low" | "mid" | "high";
};


type NormalizedDbSchema = {
  meta: {
    generated_at: string;
    total_stores: number;
    offline_stores_with_coordinates: number;
    total_winning_records: number;
    total_draws: number;
    latest_draw: number;
  };
  draws: Array<{
    draw_no: number;
    draw_date: string;
    numbers: number[];
    bonus_number: number;
    winner_counts: Record<string, number>;
    source_url: string;
  }>;
  stores: Array<{
    id: string;
    name: string;
    normalized_name: string;
    address: string;
    normalized_address: string;
    latitude: number | null;
    longitude: number | null;
    is_online: boolean;
    is_closed: boolean;
    geocode_status: "official_verified" | "geocoded" | "pending";
    rank_counts: Record<number, number>;
    total_wins: number;
    latest_draw: number;
    history: Array<{ draw: number; rank: WinRank; count: number; source?: string }>;
  }>;
};

let cachedDb: NormalizedDbSchema | null = null;

function loadDb(): NormalizedDbSchema {
  if (cachedDb) return cachedDb;
  const dbPath = path.join(process.cwd(), 'data', 'normalized_db.json');
  if (fs.existsSync(dbPath)) {
    const raw = fs.readFileSync(dbPath, 'utf8');
    cachedDb = JSON.parse(raw);
    return cachedDb!;
  }
  // Fallback empty schema if file not generated yet
  return {
    meta: {
      generated_at: new Date().toISOString(),
      total_stores: 0,
      offline_stores_with_coordinates: 0,
      total_winning_records: 0,
      total_draws: 0,
      latest_draw: 1234,
    },
    draws: [],
    stores: [],
  };
}

export function extractRegion(address: string): string {
  if (!address) return "기타";
  const trimmed = address.trim();
  if (trimmed.startsWith("서울")) return "서울";
  if (trimmed.startsWith("경기")) return "경기";
  if (trimmed.startsWith("부산")) return "부산";
  if (trimmed.startsWith("대구")) return "대구";
  if (trimmed.startsWith("인천")) return "인천";
  if (trimmed.startsWith("광주")) return "광주";
  if (trimmed.startsWith("대전")) return "대전";
  if (trimmed.startsWith("울산")) return "울산";
  if (trimmed.startsWith("세종")) return "세종";
  if (trimmed.startsWith("강원")) return "강원";
  if (trimmed.startsWith("충북") || trimmed.startsWith("충청북도")) return "충북";
  if (trimmed.startsWith("충남") || trimmed.startsWith("충청남도")) return "충남";
  if (trimmed.startsWith("전북") || trimmed.startsWith("전라북도")) return "전북";
  if (trimmed.startsWith("전남") || trimmed.startsWith("전라남도")) return "전남";
  if (trimmed.startsWith("경북") || trimmed.startsWith("경상북도")) return "경북";
  if (trimmed.startsWith("경남") || trimmed.startsWith("경상남도")) return "경남";
  if (trimmed.startsWith("제주")) return "제주";
  return "기타";
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

function mapStoreRecord(store: NormalizedDbSchema['stores'][0], distanceKm?: number): StoreRecord {
  const rankCounts: Record<WinRank, number> = {
    1: store.rank_counts[1] || 0,
    2: store.rank_counts[2] || 0,
    3: store.rank_counts[3] || 0,
    4: store.rank_counts[4] || 0,
    5: store.rank_counts[5] || 0,
  };

  return {
    id: store.id,
    name: store.name,
    address: store.address,
    normalized_name: store.normalized_name,
    normalized_address: store.normalized_address,
    latitude: store.latitude,
    longitude: store.longitude,
    distanceKm,
    distanceFormatted: distanceKm !== undefined ? formatDistance(distanceKm) : undefined,
    is_online: store.is_online,
    status: store.geocode_status === 'official_verified' ? "좌표 확인" : "확인 필요",
    geocode_status: store.geocode_status,
    totalWins: store.total_wins,
    rankCounts,
    history: (store.history || []).map((h) => ({
      draw: h.draw,
      rank: h.rank,
      count: h.count || 1,
      source: h.source,
    })),
    latest_draw: store.latest_draw,
    hours: "영업시간 정보 없음",
    phone: "정보 없음",
    region: extractRegion(store.address),
    updated_at: `당첨 이력 ${store.latest_draw}회 기준`,
  };
}

export function getStoresNearby(
  lat: number,
  lng: number,
  radiusKm: number = 5,
  rankFilter: "all" | WinRank = "all",
  limit?: number,
): StoreRecord[] {
  const db = loadDb();
  const results: Array<{ store: StoreRecord; dist: number }> = [];

  for (const s of db.stores) {
    // Exclude online stores and stores without coordinates
    if (s.is_online || s.latitude === null || s.longitude === null) {
      continue;
    }

    const dist = haversineDistance(lat, lng, s.latitude, s.longitude);
    if (dist > radiusKm) {
      continue;
    }

    if (rankFilter !== "all") {
      const count = s.rank_counts[rankFilter] || 0;
      if (count <= 0) continue;
    }

    results.push({
      store: mapStoreRecord(s, dist),
      dist,
    });
  }

  results.sort((a, b) => a.dist - b.dist);
  const selected = limit === undefined ? results : results.slice(0, limit);
  return selected.map((result) => result.store);
}

export function getStoresInBounds(
  south: number,
  west: number,
  north: number,
  east: number,
): MapStoreRecord[] {
  const db = loadDb();
  return db.stores
    .filter(
      (store) =>
        !store.is_online &&
        store.latitude !== null &&
        store.longitude !== null &&
        store.latitude >= south &&
        store.latitude <= north &&
        store.longitude >= west &&
        store.longitude <= east,
    )
    .map((store) => {
      const mapped = mapStoreRecord(store);
      return {
        id: mapped.id,
        name: mapped.name,
        address: mapped.address,
        latitude: mapped.latitude,
        longitude: mapped.longitude,
        totalWins: mapped.totalWins,
        rankCounts: mapped.rankCounts,
        latest_draw: mapped.latest_draw,
      };
    });
}

export function getStoreById(id: string): StoreRecord | null {
  const db = loadDb();
  const found = db.stores.find((s) => s.id === id || s.normalized_name === id);
  if (!found) return null;
  return mapStoreRecord(found);
}

export function getTopStores(
  rankFilter: "all" | WinRank = "all",
  regionFilter: string = "전체",
  limit: number = 50
): StoreRecord[] {
  const db = loadDb();
  let stores = db.stores.filter((s) => !s.is_online);

  if (regionFilter !== "전체") {
    stores = stores.filter((s) => extractRegion(s.address) === regionFilter);
  }

  if (rankFilter !== "all") {
    stores = stores.filter((s) => (s.rank_counts[rankFilter] || 0) > 0);
  }

  const mapped = stores.map((s) => mapStoreRecord(s));

  mapped.sort((a, b) => {
    if (rankFilter === 1) {
      return b.rankCounts[1] - a.rankCounts[1] || b.rankCounts[2] - a.rankCounts[2];
    }
    if (rankFilter === 2) {
      return b.rankCounts[2] - a.rankCounts[2] || b.rankCounts[1] - a.rankCounts[1];
    }
    if (rankFilter === 3) {
      return b.rankCounts[3] - a.rankCounts[3] || b.rankCounts[1] - a.rankCounts[1];
    }
    // Default primary 1st rank, then 2nd rank, then total wins
    if (b.rankCounts[1] !== a.rankCounts[1]) {
      return b.rankCounts[1] - a.rankCounts[1];
    }
    if (b.rankCounts[2] !== a.rankCounts[2]) {
      return b.rankCounts[2] - a.rankCounts[2];
    }
    return b.totalWins - a.totalWins;
  });

  return mapped.slice(0, limit);
}

export function getLatestDraw(): DrawResult {
  const db = loadDb();
  const latest = db.draws[0];
  if (!latest) throw new Error("공식 회차 데이터가 준비되지 않았습니다.");

  const rawDate = latest.draw_date;
  const formattedDate =
    rawDate.length === 8
      ? `${rawDate.slice(0, 4)}. ${parseInt(rawDate.slice(4, 6))}. ${parseInt(rawDate.slice(6, 8))}. 추첨`
      : rawDate;

  return {
    draw_no: latest.draw_no,
    draw_date: formattedDate,
    winning_numbers: latest.numbers,
    bonus_number: latest.bonus_number,
    winner_counts: latest.winner_counts,

    source_url: latest.source_url || "https://www.dhlottery.co.kr",
    collected_at: db.meta.generated_at || new Date().toISOString(),
  };
}

export function getNumberStatistics(months: number = 6): NumberFrequency[] {
  const db = loadDb();
  const latestRawDate = db.draws[0]?.draw_date;
  if (!latestRawDate || !/^\d{8}$/.test(latestRawDate)) return [];

  const year = Number(latestRawDate.slice(0, 4));
  const monthIndex = Number(latestRawDate.slice(4, 6)) - 1;
  const day = Number(latestRawDate.slice(6, 8));
  const cutoff = new Date(Date.UTC(year, monthIndex, 1));
  cutoff.setUTCMonth(cutoff.getUTCMonth() - Math.max(1, months));
  const lastDayOfCutoffMonth = new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate();
  cutoff.setUTCDate(Math.min(day, lastDayOfCutoffMonth));
  const cutoffKey = cutoff.toISOString().slice(0, 10).replaceAll("-", "");
  const selectedDraws = db.draws.filter((draw) => /^\d{8}$/.test(draw.draw_date) && draw.draw_date >= cutoffKey);

  const freqMap: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) {
    freqMap[i] = 0;
  }

  for (const draw of selectedDraws) {
    for (const num of draw.numbers) {
      if (num >= 1 && num <= 45) {
        freqMap[num] = (freqMap[num] || 0) + 1;
      }
    }
  }

  const result: NumberFrequency[] = [];
  const maxCount = Math.max(...Object.values(freqMap), 1);
  const minCount = Math.min(...Object.values(freqMap));

  for (let i = 1; i <= 45; i++) {
    const count = freqMap[i];
    let level: "low" | "mid" | "high" = "mid";
    if (count >= maxCount * 0.7) level = "high";
    else if (count <= minCount + 1) level = "low";

    result.push({
      number: i,
      count,
      level,
    });
  }

  return result;
}


export function getDbMeta() {
  const db = loadDb();
  return db.meta;
}

export function getSitemapStores(): Array<{ id: string; latestDraw: number }> {
  return loadDb().stores
    .filter((store) => !store.is_online)
    .map((store) => ({ id: store.id, latestDraw: store.latest_draw }));
}
