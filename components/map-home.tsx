"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, LocateFixed, Search, Ticket } from "lucide-react";
import { PageFooter } from "@/components/page-footer";
import { StoreCard } from "@/components/store-card";
import type { StoreRecord } from "@/lib/db";
import { buildNaverDirectionsUrl, getPodiumRanks, sortNearbyStores, haversineDistance, formatDistance, getBoundsFromCenterAndRadius, type NearbySort, type PodiumRank } from "@/lib/map-features";

declare global {
  interface Window {
    naver: any;
  }
}

type NearbyStoreRecord = Pick<
  StoreRecord,
  "id" | "name" | "address" | "latitude" | "longitude" | "distanceKm" | "distanceFormatted" | "totalWins" | "rankCounts" | "status"
>;

type RadiusOption = { value: number; label: string; zoom: number };

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const RADIUS_OPTIONS: RadiusOption[] = [
  { value: 0.3, label: "300m", zoom: 16 },
  { value: 0.5, label: "500m", zoom: 15 },
  { value: 1, label: "1km", zoom: 14 },
  { value: 3, label: "3km", zoom: 13 },
  { value: 5, label: "5km", zoom: 12 },
  { value: 10, label: "10km", zoom: 11 },
];
const PODIUM_STYLES: Record<PodiumRank, { background: string; foreground: string; label: string }> = {
  1: { background: "#D4AF37", foreground: "#17211C", label: "1위" },
  2: { background: "#A8AFB7", foreground: "#17211C", label: "2위" },
  3: { background: "#CD7F32", foreground: "#FFFFFF", label: "3위" },
  4: { background: "#2563EB", foreground: "#FFFFFF", label: "4위" },
  5: { background: "#7C3AED", foreground: "#FFFFFF", label: "5위" },
};

function radiusLabel(radius: number): string {
  return RADIUS_OPTIONS.find((option) => option.value === radius)?.label ?? `${radius}km`;
}

function clusterCellSize(zoom: number): number {
  if (zoom >= 14) return 0;
  if (zoom === 13) return 0.006;
  if (zoom === 12) return 0.014;
  if (zoom === 11) return 0.03;
  if (zoom === 10) return 0.07;
  return 0.15;
}

export function MapHome() {
  const [centerLocation, setCenterLocation] = useState(DEFAULT_CENTER);
  const [radius, setRadius] = useState(1);
  const [nearbyStores, setNearbyStores] = useState<NearbyStoreRecord[]>([]);
  const [selectedWinRanks, setSelectedWinRanks] = useState<number[]>([]);
  const [sortMode, setSortMode] = useState<NearbySort>("wins");
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState<"locating" | "granted" | "denied" | "map">("locating");
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const centerLocationRef = useRef(DEFAULT_CENTER);
  const locationStatusRef = useRef<"locating" | "granted" | "denied" | "map">("locating");
  const markersRef = useRef<any[]>([]);
  const mapIdleListenerRef = useRef<any>(null);
  const mapDragListenerRef = useRef<any>(null);
  const mapClickListenerRef = useRef<any>(null);
  const viewportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nearbyAbortRef = useRef<AbortController | null>(null);
  const infoWindowRef = useRef<any>(null);
  const activeStoreIdRef = useRef<string | null>(null);
  const programmaticMoveRef = useRef(false);
  const programmaticMoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const radiusRef = useRef(radius);

  useEffect(() => {
    radiusRef.current = radius;
  }, [radius]);

  useEffect(() => {
    locationStatusRef.current = locationStatus;
  }, [locationStatus]);

  const markProgrammaticMove = useCallback(() => {
    programmaticMoveRef.current = true;
    if (programmaticMoveTimerRef.current) clearTimeout(programmaticMoveTimerRef.current);
    programmaticMoveTimerRef.current = setTimeout(() => {
      programmaticMoveRef.current = false;
    }, 800);
  }, []);

  const fetchNearbyStores = useCallback(async (lat: number, lng: number, selectedRadius: number) => {
    nearbyAbortRef.current?.abort();
    const controller = new AbortController();
    nearbyAbortRef.current = controller;
    setLoading(true);
    try {
      const map = mapInstanceRef.current;
      let south: number;
      let west: number;
      let north: number;
      let east: number;

      if (map && window.naver?.maps && typeof map.getBounds === "function") {
        try {
          const bounds = map.getBounds();
          const sw = typeof bounds.getMin === "function" ? bounds.getMin() : typeof bounds.getSW === "function" ? bounds.getSW() : (bounds.min || bounds._min);
          const ne = typeof bounds.getMax === "function" ? bounds.getMax() : typeof bounds.getNE === "function" ? bounds.getNE() : (bounds.max || bounds._max);
          const rawSouth = sw ? (typeof sw.lat === "function" ? sw.lat() : sw._lat ?? sw.y) : null;
          const rawWest = sw ? (typeof sw.lng === "function" ? sw.lng() : sw._lng ?? sw.x) : null;
          const rawNorth = ne ? (typeof ne.lat === "function" ? ne.lat() : ne._lat ?? ne.y) : null;
          const rawEast = ne ? (typeof ne.lng === "function" ? ne.lng() : ne._lng ?? ne.x) : null;

          if (
            typeof rawSouth === "number" &&
            typeof rawWest === "number" &&
            typeof rawNorth === "number" &&
            typeof rawEast === "number"
          ) {
            south = Math.min(rawSouth, rawNorth);
            north = Math.max(rawSouth, rawNorth);
            west = Math.min(rawWest, rawEast);
            east = Math.max(rawWest, rawEast);
          } else {
            const fallback = getBoundsFromCenterAndRadius(lat, lng, selectedRadius);
            south = fallback.south;
            west = fallback.west;
            north = fallback.north;
            east = fallback.east;
          }

          if (
            !Number.isFinite(south) ||
            !Number.isFinite(north) ||
            !Number.isFinite(west) ||
            !Number.isFinite(east) ||
            north - south < 0.0001 ||
            east - west < 0.0001 ||
            north - south > 25 ||
            east - west > 45
          ) {
            const fallback = getBoundsFromCenterAndRadius(lat, lng, selectedRadius);
            south = fallback.south;
            west = fallback.west;
            north = fallback.north;
            east = fallback.east;
          }
        } catch {
          const fallback = getBoundsFromCenterAndRadius(lat, lng, selectedRadius);
          south = fallback.south;
          west = fallback.west;
          north = fallback.north;
          east = fallback.east;
        }
      } else {
        const fallback = getBoundsFromCenterAndRadius(lat, lng, selectedRadius);
        south = fallback.south;
        west = fallback.west;
        north = fallback.north;
        east = fallback.east;
      }

      south = Math.max(-85, Math.min(85, south));
      north = Math.max(-85, Math.min(85, north));
      west = Math.max(-180, Math.min(180, west));
      east = Math.max(-180, Math.min(180, east));
      if (south >= north) north = south + 0.01;
      if (west >= east) east = west + 0.01;

      const url = `/api/stores/bounds?south=${encodeURIComponent(south.toFixed(6))}&west=${encodeURIComponent(west.toFixed(6))}&north=${encodeURIComponent(north.toFixed(6))}&east=${encodeURIComponent(east.toFixed(6))}`;

      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        console.warn(`Bounds API responded with ${response.status}`);
        return;
      }
      const data = await response.json();
      const stores = (data.stores || []).map((store: any) => {
        const dist = haversineDistance(lat, lng, store.latitude, store.longitude);
        return {
          ...store,
          distanceKm: dist,
          distanceFormatted: formatDistance(dist),
          status: store.status || "좌표 확인",
        };
      });
      setNearbyStores(stores);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Failed to fetch stores in bounds:", error);
        setNearbyStores([]);
      }
    } finally {
      if (nearbyAbortRef.current === controller) setLoading(false);
    }
  }, []);

  const scheduleViewportRefresh = useCallback(
    (map: any) => {
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
      viewportTimerRef.current = setTimeout(() => {
        const center = map.getCenter();
        const nextCenter = { lat: center.lat(), lng: center.lng() };
        centerLocationRef.current = nextCenter;
        setCenterLocation(nextCenter);
        if (locationStatusRef.current === "locating") return;
        // 마커와 반경 목록 모두 같은 반경 데이터(radius)로 채운다 → 두 카운터가 항상 일치.
        fetchNearbyStores(center.lat(), center.lng(), radiusRef.current);
      }, 240);
    },
    [fetchNearbyStores],
  );

  useEffect(() => {
    const checkMap = () => {
      if (typeof window !== "undefined" && window.naver?.maps) {
        setIsMapLoaded(true);
        setMapError(null);
        return true;
      }
      return false;
    };

    if (checkMap()) return;

    const interval = setInterval(() => {
      if (checkMap()) {
        clearInterval(interval);
      }
    }, 100);

    const timer = setTimeout(() => {
      clearInterval(interval);
      if (!window.naver?.maps) {
        setMapError("네이버 지도 API를 불러오지 못했습니다. 새로고침을 시도해 주세요.");
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const applyUserLocation = useCallback(
    (coords: { lat: number; lng: number }) => {
      centerLocationRef.current = coords;
      setCenterLocation(coords);
      setLocationStatus("granted");
      setLocationMessage(null);
      fetchNearbyStores(coords.lat, coords.lng, radiusRef.current);
      const map = mapInstanceRef.current;
      if (map && window.naver?.maps) {
        markProgrammaticMove();
        map.setCenter(new window.naver.maps.LatLng(coords.lat, coords.lng));
        map.setZoom(RADIUS_OPTIONS.find((option) => option.value === radiusRef.current)?.zoom ?? 14);
      }
    },
    [fetchNearbyStores, markProgrammaticMove],
  );

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      setLocationMessage("이 브라우저에서는 현재 위치를 사용할 수 없습니다. 브라우저 위치 권한을 확인해 주세요.");
      return;
    }
    setLocationMessage("현재 위치를 확인하는 중입니다...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        console.warn("Geolocation denied or error:", error);
        setLocationStatus("denied");
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? "현재 위치 권한이 차단됐습니다. 브라우저 주소창의 위치 권한과 macOS 위치 서비스를 허용해 주세요."
            : "현재 위치를 가져오지 못했습니다. 잠시 후 다시 누르거나 지도를 직접 이동해 주세요.",
        );
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 60_000 },
    );
  }, [applyUserLocation]);

  useEffect(() => {
    if (!navigator.geolocation) {
      const timer = setTimeout(() => {
        setLocationStatus("denied");
        setLocationMessage("이 브라우저에서는 현재 위치를 사용할 수 없습니다. 기본 위치(서울) 기준으로 보여드립니다.");
        const fallback = DEFAULT_CENTER;
        fetchNearbyStores(fallback.lat, fallback.lng, radiusRef.current);
      }, 0);
      return () => clearTimeout(timer);
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (locationStatusRef.current !== "locating") return;
        applyUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        if (locationStatusRef.current !== "locating") return;
        console.warn("Auto geolocation denied or error:", error);
        setLocationStatus("denied");
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? "현재 위치 권한이 차단됐습니다. 브라우저 주소창의 위치 권한과 macOS 위치 서비스를 허용해 주세요. 지금은 기본 위치(서울) 기준으로 보여드립니다."
            : "현재 위치를 가져오지 못했습니다. 지금은 기본 위치(서울) 기준으로 보여드립니다. 잠시 후 다시 누르거나 지역을 검색해 주세요.",
        );
        const fallback = DEFAULT_CENTER;
        fetchNearbyStores(fallback.lat, fallback.lng, radiusRef.current);
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 60_000 },
    );
  }, [applyUserLocation, fetchNearbyStores]);

  useEffect(() => {
    if (!isMapLoaded || !mapElementRef.current || !window.naver?.maps || mapInstanceRef.current) return;
    mapElementRef.current.innerHTML = "";
    const map = new window.naver.maps.Map(mapElementRef.current, {
      center: new window.naver.maps.LatLng(centerLocationRef.current.lat, centerLocationRef.current.lng),
      zoom: RADIUS_OPTIONS.find((option) => option.value === radiusRef.current)?.zoom ?? 14,
      scaleControl: false,
      logoControl: true,
      mapDataControl: false,
      zoomControl: true,
      zoomControlOptions: { position: window.naver.maps.Position.RIGHT_CENTER },
    });
    mapInstanceRef.current = map;

    const syncMapSize = () => {
      if (mapInstanceRef.current && window.naver?.maps) {
        window.naver.maps.Event.trigger(mapInstanceRef.current, "resize");
        mapInstanceRef.current.setCenter(
          new window.naver.maps.LatLng(centerLocationRef.current.lat, centerLocationRef.current.lng)
        );
      }
    };

    syncMapSize();
    const rafId = requestAnimationFrame(syncMapSize);
    const timer1 = setTimeout(syncMapSize, 100);
    const timer2 = setTimeout(syncMapSize, 400);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && mapElementRef.current) {
      resizeObserver = new ResizeObserver(() => syncMapSize());
      resizeObserver.observe(mapElementRef.current);
    }

    mapIdleListenerRef.current = window.naver.maps.Event.addListener(map, "idle", () => scheduleViewportRefresh(map));
    mapDragListenerRef.current = window.naver.maps.Event.addListener(map, "dragstart", () => {
      if (programmaticMoveRef.current) return;
      setLocationStatus("map");
      setLocationMessage(null);
    });
    mapClickListenerRef.current = window.naver.maps.Event.addListener(map, "click", () => {
      infoWindowRef.current?.close();
      activeStoreIdRef.current = null;
    });
    scheduleViewportRefresh(map);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      resizeObserver?.disconnect();
      if (mapIdleListenerRef.current) window.naver.maps.Event.removeListener(mapIdleListenerRef.current);
      if (mapDragListenerRef.current) window.naver.maps.Event.removeListener(mapDragListenerRef.current);
      if (mapClickListenerRef.current) window.naver.maps.Event.removeListener(mapClickListenerRef.current);
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
      if (programmaticMoveTimerRef.current) clearTimeout(programmaticMoveTimerRef.current);
      nearbyAbortRef.current?.abort();
      infoWindowRef.current?.close();
      try {
        if (mapInstanceRef.current && typeof mapInstanceRef.current.destroy === "function") {
          mapInstanceRef.current.destroy();
        }
      } catch {}
      mapInstanceRef.current = null;
    };
  }, [isMapLoaded, scheduleViewportRefresh]);

  const toggleWinRank = (rank: number) => {
    setSelectedWinRanks((prev) =>
      prev.includes(rank) ? prev.filter((r) => r !== rank) : [...prev, rank]
    );
  };

  const filteredStores = useMemo(() => {
    if (selectedWinRanks.length === 0) return nearbyStores;
    return nearbyStores.filter((store) =>
      selectedWinRanks.some((rank) => (store.rankCounts?.[rank as 1 | 2 | 3 | 4 | 5] ?? 0) > 0)
    );
  }, [nearbyStores, selectedWinRanks]);

  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !window.naver?.maps) return;
    infoWindowRef.current?.close();
    activeStoreIdRef.current = null;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const map = mapInstanceRef.current;
    // 지도 마커는 필터링된 filteredStores 데이터로 렌더링 → 마커 수 == "반경 내 판매점" 수.
    const podiumRanks = getPodiumRanks(filteredStores);
    const podiumIds = new Set(Object.keys(podiumRanks));
    const zoom = map.getZoom();
    const cellSize = clusterCellSize(zoom);
    const groups = new Map<string, NearbyStoreRecord[]>();

    for (const store of filteredStores) {
      if (podiumIds.has(store.id) || cellSize === 0) {
        groups.set(`store:${store.id}`, [store]);
        continue;
      }
      const key = `${Math.floor((store.latitude ?? 0) / cellSize)}:${Math.floor((store.longitude ?? 0) / cellSize)}`;
      const group = groups.get(key) ?? [];
      group.push(store);
      groups.set(key, group);
    }

    for (const group of groups.values()) {
      if (group.length > 1) {
        const latitude = group.reduce((sum, store) => sum + (store.latitude ?? 0), 0) / group.length;
        const longitude = group.reduce((sum, store) => sum + (store.longitude ?? 0), 0) / group.length;
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(latitude, longitude),
          map,
          title: `판매점 ${group.length}곳`,
          icon: {
            content: `<div style="display:flex;align-items:center;justify-content:center;min-width:38px;height:38px;padding:0 9px;border:3px solid white;border-radius:999px;background:#0F8A5F;color:white;font-size:13px;font-weight:900;box-shadow:0 3px 10px rgba(0,0,0,.25)">${group.length}</div>`,
            anchor: new window.naver.maps.Point(19, 19),
          },
        });
        window.naver.maps.Event.addListener(marker, "click", () => {
          map.setCenter(new window.naver.maps.LatLng(latitude, longitude));
          map.setZoom(Math.min(zoom + 2, 18));
        });
        markersRef.current.push(marker);
        continue;
      }

      const store = group[0];
      if (store.latitude === null || store.longitude === null) continue;
      const podiumRank = podiumRanks[store.id];
      const podiumStyle = podiumRank ? PODIUM_STYLES[podiumRank] : null;
      const content = podiumStyle
        ? `<div style="display:flex;flex-direction:column;align-items:center"><div style="display:flex;align-items:center;gap:4px;border:3px solid white;border-radius:999px;padding:5px 9px;background:${podiumStyle.background};color:${podiumStyle.foreground};font-size:12px;font-weight:900;box-shadow:0 3px 10px rgba(0,0,0,.25)">${podiumRank}위 · ${store.totalWins}회</div><div style="width:3px;height:8px;background:${podiumStyle.background}"></div></div>`
        : `<div style="display:flex;width:42px;height:42px;align-items:center;justify-content:center"><div style="width:20px;height:20px;border:3px solid white;border-radius:999px;background:#0F8A5F;box-shadow:0 2px 7px rgba(0,0,0,.3)"></div></div>`;
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(store.latitude, store.longitude),
        map,
        title: store.name,
        icon: { content, anchor: new window.naver.maps.Point(podiumRank ? 38 : 21, podiumRank ? 32 : 21) },
        zIndex: podiumRank ? 100 - podiumRank : 1,
      });
      window.naver.maps.Event.addListener(marker, "click", () => {
        const detailUrl = `/store/${encodeURIComponent(store.id)}`;
        if (activeStoreIdRef.current === store.id) {
          window.location.href = detailUrl;
          return;
        }

        infoWindowRef.current?.close();
        const preview = document.createElement("div");
        preview.setAttribute("role", "button");
        preview.tabIndex = 0;
        preview.style.cssText = "width:min(260px,calc(100vw - 48px));padding:14px;border-radius:16px;background:#fff;color:#17211c;box-shadow:0 8px 24px rgba(0,0,0,.2);cursor:pointer;font-family:inherit";

        const title = document.createElement("strong");
        title.textContent = store.name;
        title.style.cssText = "display:block;font-size:16px;line-height:1.35;margin-bottom:5px";
        const address = document.createElement("p");
        address.textContent = store.address;
        address.style.cssText = "margin:0 0 8px;color:#68736d;font-size:13px;line-height:1.4";
        const wins = document.createElement("p");
        wins.textContent = `과거 당첨 이력 총 ${store.totalWins}회`;
        wins.style.cssText = "margin:0 0 11px;color:#0f8a5f;font-size:13px;font-weight:800";
        const actions = document.createElement("div");
        actions.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px";
        const hint = document.createElement("span");
        hint.textContent = "한 번 더 누르면 상세";
        hint.style.cssText = "font-size:11px;color:#7b867f";
        const directions = document.createElement("a");
        directions.href = buildNaverDirectionsUrl(store);
        directions.target = "_blank";
        directions.rel = "noopener noreferrer";
        directions.textContent = "길찾기";
        directions.style.cssText = "display:flex;min-height:40px;align-items:center;border-radius:10px;background:#0f8a5f;padding:0 14px;color:#fff;font-size:13px;font-weight:900;text-decoration:none";
        directions.addEventListener("click", (event) => event.stopPropagation());
        actions.append(hint, directions);
        preview.append(title, address, wins, actions);
        preview.addEventListener("click", () => { window.location.href = detailUrl; });
        preview.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") window.location.href = detailUrl;
        });

        const infoWindow = new window.naver.maps.InfoWindow({
          content: preview,
          borderWidth: 0,
          backgroundColor: "transparent",
          disableAnchor: true,
          disableAutoPan: true,
          pixelOffset: new window.naver.maps.Point(0, 22),
        });
        infoWindow.open(map, marker);
        infoWindowRef.current = infoWindow;
        activeStoreIdRef.current = store.id;
      });
      markersRef.current.push(marker);
    }
  }, [isMapLoaded, filteredStores]);

  const sortedStores = useMemo(() => sortNearbyStores(filteredStores, sortMode), [filteredStores, sortMode]);

  const handleAddressSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    const locations: Record<string, { lat: number; lng: number }> = {
      강남: { lat: 37.4979, lng: 127.0276 }, 강남역: { lat: 37.4979, lng: 127.0276 }, 홍대: { lat: 37.5563, lng: 126.9228 },
      홍대입구: { lat: 37.5563, lng: 126.9228 }, 신촌: { lat: 37.5552, lng: 126.9369 }, 종로: { lat: 37.5704, lng: 126.9922 },
      여의도: { lat: 37.5216, lng: 126.9242 }, 부산: { lat: 35.1796, lng: 129.0756 }, 서면: { lat: 35.1578, lng: 129.0592 },
      대구: { lat: 35.8714, lng: 128.6014 }, 인천: { lat: 37.4563, lng: 126.7052 }, 광주: { lat: 35.1595, lng: 126.8526 },
      대전: { lat: 36.3504, lng: 127.3845 }, 울산: { lat: 35.5384, lng: 129.3114 }, 수원: { lat: 37.2636, lng: 127.0286 },
    };
    const matched = Object.keys(locations).find((key) => searchQuery.trim().includes(key));
    if (!matched) {
      setLocationMessage("검색 가능한 지역명을 확인해 주세요. 예: 강남역, 홍대, 부산, 수원");
      return;
    }
    const target = locations[matched];
    centerLocationRef.current = target;
    setCenterLocation(target);
    setLocationStatus("map");
    setLocationMessage(null);
    fetchNearbyStores(target.lat, target.lng, radius);
    if (mapInstanceRef.current && window.naver?.maps) {
      mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(target.lat, target.lng));
    }
  };

  const handleRadiusChange = (option: RadiusOption) => {
    radiusRef.current = option.value;
    setRadius(option.value);
    const map = mapInstanceRef.current;
    if (map) {
      const mapCenter = map.getCenter();
      const nextCenter = { lat: mapCenter.lat(), lng: mapCenter.lng() };
      centerLocationRef.current = nextCenter;
      setCenterLocation(nextCenter);
      fetchNearbyStores(mapCenter.lat(), mapCenter.lng(), option.value);
      markProgrammaticMove();
      map.setZoom(option.zoom);
    } else {
      fetchNearbyStores(centerLocation.lat, centerLocation.lng, option.value);
    }
  };

  return (
    <main className="relative min-h-dvh overflow-x-hidden pb-24">
      <section aria-label="판매점 지도" className="map-grid relative h-[58dvh] min-h-[min(460px,55dvh)] overflow-hidden border-b border-[#D6DED7]">
        {/* Top Floating Bar */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3.5 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-6">
          <div className="flex min-h-11 items-center gap-2 rounded-2xl border border-[#DDE4DE] bg-white/95 px-3 py-1 shadow-sm backdrop-blur-md">
            <span className="flex size-7.5 items-center justify-center rounded-lg bg-[#0F8A5F] text-white shadow-xs">
              <Ticket aria-hidden="true" size={17} />
            </span>
            <div>
              <p className="text-[17px] font-black leading-tight tracking-[-0.03em] text-[#17211C]">로또리</p>
              <p className="text-[10px] font-extrabold text-[#0F8A5F] tracking-wide">LOTTO + RI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestLocation}
            className="pressable flex size-11 items-center justify-center rounded-2xl border border-[#DDE4DE] bg-white/95 text-[#0F8A5F] shadow-sm backdrop-blur-md active:bg-[#E8F4EF]"
            aria-label="현재 위치로 이동"
          >
            <LocateFixed aria-hidden="true" size={22} />
          </button>
        </div>

        {/* Row 1: Radius Selector */}
        <div className="no-scrollbar absolute left-3.5 right-3.5 top-[60px] z-20 flex items-center gap-2 overflow-x-auto pb-1 pt-[max(0.25rem,env(safe-area-inset-top))] sm:left-6 sm:right-6">
          <div className="flex shrink-0 items-center rounded-full border border-[#D7DED8] bg-white/95 p-1 shadow-sm backdrop-blur-md">
            {RADIUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleRadiusChange(option)}
                className={`min-h-9 shrink-0 rounded-full px-3 text-[13px] font-extrabold transition-all ${
                  radius === option.value
                    ? "bg-[#0F8A5F] text-white shadow-xs"
                    : "text-[#556159] hover:text-[#17211C] active:bg-[#F2F5F3]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Win Rank Multi-Select Filter */}
        <div className="no-scrollbar absolute left-3.5 right-3.5 top-[108px] z-20 flex items-center gap-1.5 overflow-x-auto pb-1 pt-[max(0.25rem,env(safe-area-inset-top))] sm:left-6 sm:right-6">
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-[#D7DED8] bg-white/95 p-1 shadow-sm backdrop-blur-md">
            <button
              type="button"
              onClick={() => setSelectedWinRanks([])}
              className={`min-h-9 shrink-0 rounded-full px-3 text-[12px] font-extrabold transition-all ${
                selectedWinRanks.length === 0
                  ? "bg-[#17211C] text-white shadow-xs"
                  : "text-[#68736D] hover:text-[#17211C] active:bg-[#F2F5F3]"
              }`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => toggleWinRank(1)}
              className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-extrabold transition-all ${
                selectedWinRanks.includes(1)
                  ? "border border-[#F59E0B] bg-[#FEF3C7] font-black text-[#92400E] shadow-xs"
                  : "text-[#556159] hover:text-[#17211C]"
              }`}
            >
              <span className="inline-block size-2 rounded-full bg-[#D4AF37]" />
              1등 배출
            </button>
            <button
              type="button"
              onClick={() => toggleWinRank(2)}
              className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-extrabold transition-all ${
                selectedWinRanks.includes(2)
                  ? "border border-[#94A3B8] bg-[#F1F5F9] font-black text-[#1E293B] shadow-xs"
                  : "text-[#556159] hover:text-[#17211C]"
              }`}
            >
              <span className="inline-block size-2 rounded-full bg-[#A8AFB7]" />
              2등 배출
            </button>
            <button
              type="button"
              onClick={() => toggleWinRank(3)}
              className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-extrabold transition-all ${
                selectedWinRanks.includes(3)
                  ? "border border-[#F97316] bg-[#FFEDD5] font-black text-[#9A3412] shadow-xs"
                  : "text-[#556159] hover:text-[#17211C]"
              }`}
            >
              <span className="inline-block size-2 rounded-full bg-[#CD7F32]" />
              3등 배출
            </button>
          </div>
        </div>

        {/* Location Denied Search Form */}
        {locationStatus === "denied" && (
          <div className="absolute left-3.5 right-3.5 top-[152px] z-20 sm:left-6 sm:right-6">
            {locationMessage && (
              <p className="mb-2 rounded-xl bg-white/95 px-3 py-2 text-[12px] font-bold leading-5 text-[#B23B3B] shadow-sm backdrop-blur-md">
                {locationMessage}
              </p>
            )}
            <form
              onSubmit={handleAddressSearch}
              className="flex min-h-12 items-center rounded-2xl border border-[#DDE4DE] bg-white px-3 shadow-md"
            >
              <Search size={18} className="mr-2 shrink-0 text-[#68736D]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="지역명 입력 (예: 강남역, 서면)"
                className="w-full bg-transparent text-[16px] font-bold outline-none"
              />
              <button
                type="submit"
                className="pressable ml-2 min-h-9 shrink-0 rounded-xl bg-[#0F8A5F] px-3.5 text-[13px] font-black text-white shadow-xs"
              >
                검색
              </button>
            </form>
          </div>
        )}

        {/* Floating Thumb GPS Button on Bottom-Right of Map */}
        <div className="absolute bottom-10 right-4 z-20">
          <button
            type="button"
            onClick={requestLocation}
            className="pressable flex size-12 items-center justify-center rounded-2xl border border-[#DDE4DE] bg-white text-[#0F8A5F] shadow-lg active:scale-95"
            aria-label="현재 위치로 이동"
          >
            <LocateFixed aria-hidden="true" size={22} />
          </button>
        </div>

        {/* Map Container */}
        <div className="relative h-full min-h-[min(460px,55dvh)] w-full bg-[#E5E9E6]">
          <div
            ref={mapElementRef}
            className="h-full min-h-[min(460px,55dvh)] w-full"
            style={{ width: "100%", height: "100%", minHeight: "min(460px, 55dvh)" }}
          />
          {(!isMapLoaded || mapError) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#F2F5F3] p-6 text-center">
              <AlertCircle size={36} className="mb-2 text-[#E54B4B]" />
              <p className="text-[16px] font-extrabold text-[#17211C]">{mapError || "네이버 지도를 불러오는 중입니다..."}</p>
              <p className="mt-1 text-[13px] font-medium text-[#68736D]">지도가 렌더링되지 않더라도 아래 목록에서 반경 내 판매점을 확인할 수 있습니다.</p>
            </div>
          )}
        </div>

        {locationStatus === "locating" && isMapLoaded && !mapError && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#F2F5F3]/40 backdrop-blur-xs">
            <div className="rounded-full border border-[#C9D4CC] bg-white px-4 py-2 text-[13px] font-extrabold text-[#0F8A5F] shadow-md animate-pulse">
              현재 위치를 확인하는 중입니다...
            </div>
          </div>
        )}
      </section>

      {/* Bottom Store List Drawer */}
      <section aria-labelledby="nearby-title" className="relative z-30 -mt-7 rounded-t-[32px] border-t border-[#D8DFD9] bg-[#F7F8F5] px-4 pt-3.5 shadow-[0_-6px_24px_rgba(0,0,0,0.04)] sm:px-6">
        <div aria-hidden="true" className="mx-auto mb-3.5 h-1.5 w-12 rounded-full bg-[#C2CAC4]" />
        <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[13px] font-extrabold text-[#0F8A5F]">
              {locationStatus === "granted" ? "현재 위치 기준" : locationStatus === "locating" ? "현재 위치 확인 중" : "선택한 중심 위치 기준"} ({radiusLabel(radius)} 반경)
              {selectedWinRanks.length > 0 && ` · ${selectedWinRanks.sort().map((r) => `${r}등`).join("·")} 배출 필터`}
            </p>
            <h1 id="nearby-title" className="mt-0.5 text-[22px] font-black tracking-[-0.04em] text-[#17211C] sm:text-[24px]">
              반경 내 판매점 {filteredStores.length}곳
            </h1>
          </div>
          <div className="flex w-fit self-end sm:self-auto rounded-2xl border border-[#D8DED9] bg-white p-1 shadow-xs" aria-label="판매점 정렬 방식">
            <button
              type="button"
              onClick={() => setSortMode("distance")}
              className={`min-h-9 rounded-xl px-3.5 text-[13px] font-extrabold transition-all ${
                sortMode === "distance" ? "bg-[#17211C] text-white shadow-xs" : "text-[#556159] hover:text-[#17211C]"
              }`}
            >
              거리순
            </button>
            <button
              type="button"
              onClick={() => setSortMode("wins")}
              className={`min-h-9 rounded-xl px-3.5 text-[13px] font-extrabold transition-all ${
                sortMode === "wins" ? "bg-[#17211C] text-white shadow-xs" : "text-[#556159] hover:text-[#17211C]"
              }`}
            >
              당첨순
            </button>
          </div>
        </div>

        {locationStatus === "locating" ? (
          <div className="py-14 text-center font-bold text-[#94A199]">현재 위치를 확인하는 중입니다. 잠시만 기다려 주세요...</div>
        ) : loading ? (
          <div className="py-14 text-center font-bold text-[#68736D]">판매점 데이터를 불러오는 중...</div>
        ) : sortedStores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D8DED9] bg-white p-6 py-12 text-center font-bold text-[#68736D]">
            {selectedWinRanks.length > 0
              ? `선택한 당첨 등수(${selectedWinRanks.sort().map((r) => `${r}등`).join(", ")})를 배출한 판매점이 반경 내에 없습니다.`
              : "선택한 반경 내 판매점이 없습니다. 반경을 넓히거나 다른 위치를 선택해 주세요."}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedStores.map((store) => (
              <div key={store.id} className="[content-visibility:auto] [contain-intrinsic-size:150px]">
                <StoreCard store={store} />
              </div>
            ))}
          </div>
        )}
        <PageFooter />
      </section>
    </main>
  );
}
