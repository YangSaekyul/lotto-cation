import { Suspense } from "react";
import { MapHome } from "@/components/map-home";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="h-dvh w-full bg-[#F7F8F5]" />}>
      <MapHome />
    </Suspense>
  );
}
