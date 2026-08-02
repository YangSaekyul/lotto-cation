export type PodiumRank = 1 | 2 | 3;
export type NearbySort = 'distance' | 'wins';

export function buildNaverDirectionsUrl(store: {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}): string {
  if (store.latitude !== null && store.longitude !== null) {
    return `https://map.naver.com/v5/directions/-/${store.latitude},${store.longitude},${encodeURIComponent(store.name)}/-/walk`;
  }
  return `https://map.naver.com/v5/search/${encodeURIComponent(`${store.name} ${store.address}`)}`;
}

type RankCounts = Partial<Record<1 | 2 | 3 | 4 | 5, number>>;

type RankedStore = {
  id: string;
  totalWins: number;
  distanceKm?: number;
  rankCounts: RankCounts;
};

function comparePastWins<T extends RankedStore>(a: T, b: T): number {
  return (
    b.totalWins - a.totalWins ||
    (b.rankCounts[1] ?? 0) - (a.rankCounts[1] ?? 0) ||
    (b.rankCounts[2] ?? 0) - (a.rankCounts[2] ?? 0) ||
    (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY) ||
    a.id.localeCompare(b.id, 'ko')
  );
}

export function getPodiumRanks<T extends RankedStore>(stores: readonly T[]): Record<string, PodiumRank> {
  const topThree = [...stores].sort(comparePastWins).slice(0, 3);
  return Object.fromEntries(topThree.map((store, index) => [store.id, (index + 1) as PodiumRank]));
}

export function sortNearbyStores<T extends RankedStore>(stores: readonly T[], sort: NearbySort): T[] {
  const sorted = [...stores];
  if (sort === 'wins') return sorted.sort(comparePastWins);
  return sorted.sort(
    (a, b) =>
      (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY) ||
      comparePastWins(a, b),
  );
}
