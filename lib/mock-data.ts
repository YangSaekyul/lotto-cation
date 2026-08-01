export type WinRank = 1 | 2 | 3 | 4 | 5;

export type WinningHistory = {
  draw: number;
  rank: WinRank;
  count: number;
  method?: "자동" | "수동" | "반자동";
};

export type StoreRecord = {
  id: string;
  name: string;
  address: string;
  distance: string;
  status: "영업 중" | "확인 필요";
  totalWins: number;
  rankCounts: Partial<Record<WinRank, number>>;
  history: WinningHistory[];
  hours: string;
  phone: string;
  region: string;
};

export type DrawResult = {
  draw: number;
  date: string;
  numbers: number[];
  bonus: number;
  winners: Array<{ rank: WinRank; count: number; prize: string }>;
};

export type NumberFrequency = {
  number: number;
  count: number;
  level: "low" | "mid" | "high";
};

export const stores: StoreRecord[] = [
  {
    id: "green-lottery",
    name: "그린복권방",
    address: "서울 마포구 월드컵로 112",
    distance: "도보 4분 · 280m",
    status: "영업 중",
    totalWins: 18,
    rankCounts: { 1: 3, 2: 6, 3: 9 },
    history: [
      { draw: 1232, rank: 2, count: 1 },
      { draw: 1211, rank: 1, count: 1, method: "자동" },
      { draw: 1198, rank: 3, count: 2 },
      { draw: 1174, rank: 2, count: 1 },
    ],
    hours: "매일 08:00–21:30",
    phone: "02-123-4567",
    region: "서울",
  },
  {
    id: "sunny-ticket",
    name: "햇살복권",
    address: "서울 마포구 성산로 38",
    distance: "도보 7분 · 510m",
    status: "영업 중",
    totalWins: 13,
    rankCounts: { 1: 1, 2: 4, 3: 8 },
    history: [
      { draw: 1228, rank: 3, count: 1 },
      { draw: 1180, rank: 1, count: 1, method: "수동" },
    ],
    hours: "월–토 09:00–20:30",
    phone: "02-234-5678",
    region: "서울",
  },
  {
    id: "corner-lotto",
    name: "모퉁이로또",
    address: "서울 서대문구 연희로 91",
    distance: "차량 5분 · 1.2km",
    status: "확인 필요",
    totalWins: 9,
    rankCounts: { 2: 3, 3: 6 },
    history: [{ draw: 1209, rank: 2, count: 1 }],
    hours: "운영 시간 미확인",
    phone: "전화번호 미확인",
    region: "서울",
  },
];

export const rankingStores: StoreRecord[] = [
  stores[0],
  {
    ...stores[1],
    id: "river-lottery",
    name: "강변복권판매점",
    address: "부산 수영구 광안해변로 143",
    region: "부산",
    totalWins: 16,
    rankCounts: { 1: 2, 2: 5, 3: 9 },
  },
  {
    ...stores[2],
    id: "central-lotto",
    name: "중앙로또",
    address: "대전 중구 중앙로 71",
    region: "대전",
    totalWins: 14,
    rankCounts: { 1: 1, 2: 5, 3: 8 },
  },
  stores[1],
];

export const latestDraw: DrawResult = {
  draw: 1234,
  date: "2026. 7. 25. 추첨",
  numbers: [8, 15, 21, 27, 34, 42],
  bonus: 6,
  winners: [
    { rank: 1, count: 12, prize: "각 23억 4,820만원" },
    { rank: 2, count: 68, prize: "각 6,908만원" },
    { rank: 3, count: 2_812, prize: "각 167만원" },
    { rank: 4, count: 143_921, prize: "각 5만원" },
    { rank: 5, count: 2_396_501, prize: "각 5천원" },
  ],
};

export const numberFrequencies: NumberFrequency[] = Array.from({ length: 45 }, (_, index) => {
  const number = index + 1;
  const count = 2 + ((number * 7 + 3) % 9);
  return {
    number,
    count,
    level: count >= 8 ? "high" : count >= 5 ? "mid" : "low",
  };
});

export function getStore(id: string): StoreRecord {
  return stores.find((store) => store.id === id) ?? stores[0];
}
