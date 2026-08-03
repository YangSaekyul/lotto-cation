"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, LocateFixed, Search, Ticket } from "lucide-react";
import { PageFooter } from "@/components/page-footer";
import { StoreCard } from "@/components/store-card";
import type { MapStoreRecord, StoreRecord } from "@/lib/db";
import { buildNaverDirectionsUrl, getPodiumRanks, sortNearbyStores, type NearbySort, type PodiumRank } from "@/lib/map-features";

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
  1: { background: "#D4AF37", foreground: "#17211C", label: "금" },
  2: { background: "#A8AFB7", foreground: "#17211C", label: "은" },
  3: { background: "#B87333", foreground: "#FFFFFF", label: "동" },
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
  const [mapStores, setMapStores] = useState<MapStoreRecord[]>([]);
  const [sortMode, setSortMode] = useState<NearbySort>("wins");
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState<"map" | "granted" | "denied">("map");
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const centerLocationRef = useRef(DEFAULT_CENTER);
  const markersRef = useRef<any[]>([]);
  const mapIdleListenerRef = useRef<any>(null);
  const mapDragListenerRef = useRef<any>(null);
  const mapClickListenerRef = useRef<any>(null);
  const viewportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewportAbortRef = useRef<AbortController | null>(null);
  const nearbyAbortRef = useRef<AbortController | null>(null);
  const infoWindowRef = useRef<any>(null);
  const activeStoreIdRef = useRef<string | null>(null);
  const programmaticMoveRef = useRef(false);
  const programmaticMoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const radiusRef = useRef(radius);

  useEffect(() => {
    radiusRef.current = radius;
  }, [radius]);

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
      const response = await fetch(`/api/stores/nearby?lat=${lat}&lng=${lng}&radius=${selectedRadius}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Nearby API ${response.status}`);
      const data = await response.json();
      setNearbyStores(data.stores || []);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Failed to fetch nearby stores:", error);
        setNearbyStores([]);
      }
    } finally {
      if (nearbyAbortRef.current === controller) setLoading(false);
    }
  }, []);

  const fetchVisibleMapStores = useCallback(async (map: any) => {
    const bounds = map.getBounds?.();
    if (!bounds) return;
    const southWest = bounds.getSW();
    const northEast = bounds.getNE();
    const query = new URLSearchParams({
      south: String(southWest.lat()),
      west: String(southWest.lng()),
      north: String(northEast.lat()),
      east: String(northEast.lng()),
    });

    viewportAbortRef.current?.abort();
    const controller = new AbortController();
    viewportAbortRef.current = controller;
    try {
      const response = await fetch(`/api/stores/bounds?${query}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Bounds API ${response.status}`);
      const data = await response.json();
      setMapStores(data.stores || []);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Failed to fetch visible map stores:", error);
      }
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
        fetchVisibleMapStores(map);
        fetchNearbyStores(center.lat(), center.lng(), radiusRef.current);
      }, 240);
    },
    [fetchNearbyStores, fetchVisibleMapStores],
  );

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    if (!clientId) {
      const timer = setTimeout(() => setMapError("네이버 지도 Client ID가 설정되지 않았습니다. (.env.local 확인)"), 0);
      return () => clearTimeout(timer);
    }
    if (window.naver?.maps) {
      const timer = setTimeout(() => setIsMapLoaded(true), 0);
      return () => clearTimeout(timer);
    }
    const scriptId = "naver-map-script";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    const onLoad = () => (window.naver?.maps ? setIsMapLoaded(true) : setMapError("네이버 지도 API 로드에 실패했습니다."));
    const onError = () => setMapError("네이버 지도 스크립트를 불러오는데 실패했습니다.");
    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return () => {
        existing.removeEventListener("load", onLoad);
        existing.removeEventListener("error", onError);
      };
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);
    return () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      setLocationMessage("이 브라우저에서는 현재 위치를 사용할 수 없습니다. 브라우저 위치 권한을 확인해 주세요.");
      return;
    }
    setLocationMessage("현재 위치를 확인하는 중입니다...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
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
  }, [fetchNearbyStores, markProgrammaticMove]);

  useEffect(() => {
    if (!isMapLoaded || !mapElementRef.current || !window.naver?.maps || mapInstanceRef.current) return;
    const map = new window.naver.maps.Map(mapElementRef.current, {
      center: new window.naver.maps.LatLng(centerLocationRef.current.lat, centerLocationRef.current.lng),
      zoom: 14,
      scaleControl: false,
      logoControl: true,
      mapDataControl: false,
      zoomControl: true,
      zoomControlOptions: { position: window.naver.maps.Position.RIGHT_CENTER },
    });
    mapInstanceRef.current = map;
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
      if (mapIdleListenerRef.current) window.naver.maps.Event.removeListener(mapIdleListenerRef.current);
      if (mapDragListenerRef.current) window.naver.maps.Event.removeListener(mapDragListenerRef.current);
      if (mapClickListenerRef.current) window.naver.maps.Event.removeListener(mapClickListenerRef.current);
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
      if (programmaticMoveTimerRef.current) clearTimeout(programmaticMoveTimerRef.current);
      viewportAbortRef.current?.abort();
      nearbyAbortRef.current?.abort();
      infoWindowRef.current?.close();
      mapInstanceRef.current = null;
    };
  }, [isMapLoaded, scheduleViewportRefresh]);

  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !window.naver?.maps) return;
    infoWindowRef.current?.close();
    activeStoreIdRef.current = null;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const map = mapInstanceRef.current;
    const podiumRanks = getPodiumRanks(mapStores);
    const podiumIds = new Set(Object.keys(podiumRanks));
    const zoom = map.getZoom();
    const cellSize = clusterCellSize(zoom);
    const groups = new Map<string, MapStoreRecord[]>();

    for (const store of mapStores) {
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
        preview.style.cssText = "width:260px;padding:14px;border-radius:16px;background:#fff;color:#17211c;box-shadow:0 8px 24px rgba(0,0,0,.2);cursor:pointer;font-family:inherit";

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
  }, [isMapLoaded, mapStores]);

  const sortedStores = useMemo(() => sortNearbyStores(nearbyStores, sortMode), [nearbyStores, sortMode]);

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
    <main className="relative min-h-dvh overflow-x-hidden pb-20">
      <section aria-label="판매점 지도" className="map-grid relative h-[62dvh] min-h-[470px] overflow-hidden border-b border-[#D6DED7]">
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-6">
          <div className="flex min-h-12 items-center gap-2 rounded-2xl border border-[#DDE4DE] bg-white px-3.5 shadow-sm">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#0F8A5F] text-white"><Ticket aria-hidden="true" size={18} /></span>
            <div><p className="text-[18px] font-black leading-5 tracking-[-0.03em]">로또리</p><p className="text-[11px] font-bold text-[#68736D]">LOTTO + RI</p></div>
          </div>
          <button type="button" onClick={requestLocation} className="pressable flex size-12 items-center justify-center rounded-full border border-[#DDE4DE] bg-white text-[#0F8A5F] shadow-sm" aria-label="현재 위치로 이동"><LocateFixed aria-hidden="true" size={24} /></button>
        </div>

        <div className="absolute left-4 right-4 top-20 z-20 flex items-center gap-2 overflow-x-auto pb-1 sm:left-6 sm:right-6">
          <div className="flex shrink-0 items-center rounded-full border border-[#D7DED8] bg-white p-1 shadow-sm">
            {RADIUS_OPTIONS.map((option) => (
              <button key={option.value} type="button" onClick={() => handleRadiusChange(option)} className={`min-h-12 shrink-0 rounded-full px-[9px] text-[13px] font-extrabold transition-colors ${radius === option.value ? "bg-[#0F8A5F] text-white" : "text-[#556159]"}`}>{option.label}</button>
            ))}
          </div>
        </div>

        {locationStatus === "denied" && (
          <div className="absolute left-4 right-4 top-36 z-20 sm:left-6 sm:right-6">
            {locationMessage && <p className="mb-2 rounded-xl bg-white/95 px-3 py-2 text-[13px] font-bold leading-5 text-[#B23B3B] shadow-sm">{locationMessage}</p>}
            <form onSubmit={handleAddressSearch} className="flex min-h-12 items-center rounded-xl border border-[#DDE4DE] bg-white px-3 shadow-md">
              <Search size={18} className="mr-2 shrink-0 text-[#68736D]" />
              <input type="text" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="지역명 입력 (예: 강남역, 서면)" className="w-full bg-transparent text-[16px] font-bold outline-none" />
              <button type="submit" className="ml-2 min-h-12 shrink-0 rounded-lg bg-[#0F8A5F] px-3 text-[14px] font-bold text-white">검색</button>
            </form>
          </div>
        )}

        <div ref={mapElementRef} className="h-full w-full bg-[#E5E9E6]">
          {(!isMapLoaded || mapError) && (
            <div className="flex h-full flex-col items-center justify-center bg-[#F2F5F3] p-6 text-center">
              <AlertCircle size={36} className="mb-2 text-[#E54B4B]" />
              <p className="text-[16px] font-extrabold text-[#17211C]">{mapError || "네이버 지도를 불러오는 중입니다..."}</p>
              <p className="mt-1 text-[13px] font-medium text-[#68736D]">지도가 렌더링되지 않더라도 아래 목록에서 반경 내 판매점을 확인할 수 있습니다.</p>
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-[#C9D4CC] bg-white/95 px-3 py-2 text-[11px] font-extrabold text-[#4F5B54] shadow-sm">
          <span>현재 화면 {mapStores.length}곳</span><span aria-hidden="true">·</span>
          <span className="text-[#967814]">● 1위</span><span className="text-[#7A8087]">● 2위</span><span className="text-[#9A5427]">● 3위</span>
        </div>
      </section>

      <section aria-labelledby="nearby-title" className="relative z-30 -mt-7 rounded-t-[28px] border-t border-[#D8DFD9] bg-[#F7F8F5] px-4 pt-3 sm:px-6">
        <div aria-hidden="true" className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#C2CAC4]" />
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[14px] font-extrabold text-[#0F8A5F]">{locationStatus === "granted" ? "현재 위치 기준" : "선택한 중심 위치 기준"} ({radiusLabel(radius)} 반경)</p>
            <h1 id="nearby-title" className="mt-0.5 text-[24px] font-black tracking-[-0.04em]">반경 내 판매점 {nearbyStores.length}곳</h1>
          </div>
          <div className="flex w-fit rounded-xl border border-[#D8DED9] bg-white p-1" aria-label="판매점 정렬 방식">
            <button type="button" onClick={() => setSortMode("distance")} className={`min-h-12 rounded-lg px-3 text-[13px] font-extrabold ${sortMode === "distance" ? "bg-[#17211C] text-white" : "text-[#556159]"}`}>거리순</button>
            <button type="button" onClick={() => setSortMode("wins")} className={`min-h-12 rounded-lg px-3 text-[13px] font-extrabold ${sortMode === "wins" ? "bg-[#17211C] text-white" : "text-[#556159]"}`}>당첨순</button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center font-bold text-[#68736D]">판매점 데이터를 불러오는 중...</div>
        ) : sortedStores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D8DED9] bg-white p-6 py-12 text-center font-bold text-[#68736D]">선택한 반경 내 판매점이 없습니다. 반경을 넓히거나 다른 위치를 선택해 주세요.</div>
        ) : (
          <div className="space-y-3">
            {sortedStores.map((store) => <div key={store.id} className="[content-visibility:auto] [contain-intrinsic-size:150px]"><StoreCard store={store} /></div>)}
          </div>
        )}
        <PageFooter />
      </section>
    </main>
  );
}
