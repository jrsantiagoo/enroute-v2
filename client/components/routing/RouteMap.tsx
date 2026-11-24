"use client";
// ssr:false — Leaflet touches `window` on import and breaks SSR.
import dynamic from "next/dynamic";
import { Stop } from "@/lib/types/schema";

// Themed placeholder to avoid a light flash before the basemap mounts.
function MapLoading() {
    return (
        <div className="flex flex-col h-full gap-2 text-sm justify-center items-center bg-route-map-bg text-route-color">
            <span style={{ fontSize: "28px" }}>🗺️</span>
            <span>Loading map…</span>
        </div>
    );
}

const RouteMapInner = dynamic(() => import("./RouteMapInner"), {
    ssr: false,
    loading: () => <MapLoading />,
});

interface RouteMapProps {
    stops: Stop[];
    polyline: [number, number][];
    previewStop?: Stop | null;
}

export default function RouteMap({
    stops,
    polyline,
    previewStop,
}: RouteMapProps) {
    return (
        <div style={{ height: "100%", width: "100%" }}>
            <RouteMapInner
                stops={stops}
                polyline={polyline}
                previewStop={previewStop}
            />
        </div>
    );
}
