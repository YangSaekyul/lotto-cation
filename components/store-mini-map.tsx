"use client";

import { useEffect, useRef, useState } from "react";
import { Map, Navigation } from "lucide-react";
import Link from "next/link";
import { buildNaverDirectionsUrl } from "@/lib/map-features";

type StoreMiniMapProps = {
  store: {
    id: string;
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    totalWins: number;
  };
};

export function StoreMiniMap({ store }: StoreMiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const directionsUrl = buildNaverDirectionsUrl(store);
  const mainMapUrl = store.latitude && store.longitude
    ? `/?lat=${store.latitude}&lng=${store.longitude}&storeId=${encodeURIComponent(store.id)}`
    : "/";

  useEffect(() => {
    let isCancelled = false;

    const tryInit = () => {
      if (isCancelled) return;
      if (!mapContainerRef.current || !store.latitude || !store.longitude) return;

      if (!window.naver?.maps) {
        setTimeout(tryInit, 200);
        return;
      }

      try {
        mapContainerRef.current.innerHTML = "";
        const center = new window.naver.maps.LatLng(store.latitude, store.longitude);
        const map = new window.naver.maps.Map(mapContainerRef.current, {
          center,
          zoom: 16,
          scaleControl: false,
          logoControl: true,
          mapDataControl: false,
          zoomControl: false,
          draggable: true,
          pinchZoom: true,
          scrollWheel: false,
        });

        const markerContent = `<div style="display:flex;flex-direction:column;align-items:center"><div style="display:flex;align-items:center;gap:4px;border:3px solid white;border-radius:999px;padding:6px 12px;background:#0F8A5F;color:white;font-size:13px;font-weight:900;box-shadow:0 4px 14px rgba(0,0,0,.3)">📍 ${store.name}</div><div style="width:3px;height:8px;background:#0F8A5F"></div></div>`;

        new window.naver.maps.Marker({
          position: center,
          map,
          title: store.name,
          icon: {
            content: markerContent,
            anchor: new window.naver.maps.Point(45, 36),
          },
        });

        setTimeout(() => {
          if (map && window.naver?.maps) {
            window.naver.maps.Event.trigger(map, "resize");
            map.setCenter(center);
          }
        }, 100);

        setMapLoaded(true);
      } catch (err) {
        console.error("Mini map initialization error:", err);
        setTimeout(tryInit, 500);
      }
    };

    tryInit();

    return () => {
      isCancelled = true;
    };
  }, [store]);

  if (!store.latitude || !store.longitude) {
    return null;
  }

  return (
    <section className="mt-5 rounded-2xl border border-[#DFE4DF] bg-white p-4 shadow-xs" aria-label="판매점 지도 위치">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-black text-[#0F8A5F]">위치 안내</p>
          <h2 className="text-[18px] font-black text-[#17211C]">지도 상 위치</h2>
        </div>
        <Link
          href={mainMapUrl}
          className="pressable inline-flex items-center gap-1 text-[13px] font-extrabold text-[#0F8A5F] hover:underline"
        >
          <Map size={15} />
          큰 지도로 이동 ➔
        </Link>
      </div>

      {/* MINI MAP CONTAINER */}
      <div className="relative h-48 w-full overflow-hidden rounded-xl border border-[#DCE2DD] bg-[#EAEFEA]">
        <div ref={mapContainerRef} className="h-full w-full" />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F4F6F4] text-[13px] font-bold text-[#68736D]">
            지도를 불러오는 중...
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href={mainMapUrl}
          className="pressable flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[#D7DED8] bg-white text-[13px] font-extrabold text-[#17211C] shadow-xs hover:bg-[#F6F8F6]"
        >
          <Map size={16} className="text-[#0F8A5F]" />
          메인 지도로 보기
        </Link>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pressable flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#0F8A5F] text-[13px] font-extrabold text-white shadow-xs"
        >
          <Navigation size={16} />
          네이버 길찾기
        </a>
      </div>
    </section>
  );
}
