"use client";
// ssr:false — Leaflet touches `window` on import and breaks SSR.
import dynamic from "next/dynamic";
import { Stop } from "@/lib/types/schema";
import { useTheme } from "@/lib/theme-context";

// Themed placeholder to avoid a light flash before the basemap mounts.
function MapLoading() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    return (
        <div
            style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: isDark ? "#1a1d21" : "#f3f4f6",
                color: isDark ? "#6b7280" : "#9ca3af",
                gap: "8px",
                fontSize: "14px",
            }}
        >
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
