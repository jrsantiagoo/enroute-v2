"use client";
// Client-only (loaded via the ssr:false dynamic import in RouteMap.tsx).
import { useEffect, useRef } from "react";
import {
    MapContainer,
    TileLayer,
    Polyline,
    Marker,
    Popup,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Stop } from "@/lib/types/schema";
import { useTheme } from "@/lib/theme-context";
import { ZOOM_CONTROL_LEFT, PANEL_TOP } from "./layout";

// Fix default marker icon paths under the Next.js bundler.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
    ._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// CARTO basemaps (free, no API key): Positron for light, Dark Matter for dark.
const BASEMAPS = {
    light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
} as const;

const CARTO_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>';

// Blue route line over a wider white casing so it stays readable on both basemaps.
const ROUTE_COLOR = "#2563eb";
const ROUTE_CASING = "#ffffff";
const ROUTE_WEIGHT = 6;
const ROUTE_CASING_WEIGHT = 10;

// Stop marker colors.
const START_COLOR = "#22c55e";
const END_COLOR = "#ef4444";
const MID_COLOR = ROUTE_COLOR;
const PREVIEW_COLOR = "#f97316";

function createStopIcon(label: string, color: string): L.DivIcon {
    return L.divIcon({
        html: `<div style="background:${color};color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;line-height:1;font-family:inherit;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35);box-sizing:border-box">${label}</div>`,
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 15], // circular markers are centered on the coordinate
        popupAnchor: [0, -18],
    });
}

// Fits the map to the route: OSRM polyline if available, else the raw stops.
// Left padding keeps the route clear of the ordering panel.
function FitBoundsController({
    stops,
    polyline,
}: {
    stops: Stop[];
    polyline: [number, number][];
}) {
    const map = useMap();
    const prevKey = useRef("");

    useEffect(() => {
        const key = `${stops.map((s) => s.id_).join(",")}|${polyline.length}`;
        if (key === prevKey.current) return;
        prevKey.current = key;

        const points: [number, number][] =
            polyline.length > 1
                ? polyline
                : stops.map((s) => [s.lat, s.lng] as [number, number]);

        if (points.length >= 2) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, {
                paddingTopLeft: [330, 60],
                paddingBottomRight: [60, 60],
            });
        } else if (points.length === 1) {
            map.setView(points[0], 14);
        }
    }, [stops, polyline, map]);

    return null;
}

// In-map zoom control placed to the right of the Route Plan panel (geometry
// from layout.ts), since the default top-left control rendered behind it.
// Reuses Leaflet's .leaflet-bar / zoom-button classes for styling.
function PanelZoomControl() {
    const map = useMap();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        // Don't let clicks/scroll reach the map underneath.
        L.DomEvent.disableClickPropagation(ref.current);
        L.DomEvent.disableScrollPropagation(ref.current);
    }, []);

    return (
        <div
            ref={ref}
            className="leaflet-bar"
            style={{
                position: "absolute",
                top: `${PANEL_TOP}px`,
                left: `${ZOOM_CONTROL_LEFT}px`,
                zIndex: 1000,
            }}
        >
            <a
                className="leaflet-control-zoom-in"
                href="#"
                role="button"
                aria-label="Zoom in"
                title="Zoom in"
                onClick={(e) => {
                    e.preventDefault();
                    map.zoomIn();
                }}
            >
                +
            </a>
            <a
                className="leaflet-control-zoom-out"
                href="#"
                role="button"
                aria-label="Zoom out"
                title="Zoom out"
                onClick={(e) => {
                    e.preventDefault();
                    map.zoomOut();
                }}
            >
                −
            </a>
        </div>
    );
}

// Observes the map container for size changes and tells leaflet to
// recalculate its dimensions
function MapResizeHandler() {
    const map = useMap();

    useEffect(() => {
        const container = map.getContainer();

        // Forces leaflet to recalculate and re-render tiles when
        // map container changes size
        const observer = new ResizeObserver(() => {
            map.invalidateSize();
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, [map]);

    return null;
}

interface RouteMapInnerProps {
    stops: Stop[];
    polyline: [number, number][];
    previewStop?: Stop | null;
}

export default function RouteMapInner({
    stops,
    polyline,
    previewStop,
}: RouteMapInnerProps) {
    const { theme } = useTheme();

    return (
        <MapContainer
            center={[14.5832, 120.9794]} // Metro Manila default
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
        >
            <TileLayer
                // key remounts the layer on theme toggle to swap basemaps.
                key={theme}
                attribution={CARTO_ATTRIBUTION}
                url={BASEMAPS[theme]}
                subdomains="abcd"
                maxZoom={20}
            />

            {/* Route line: white casing underneath, blue line on top, rounded caps/joins. */}
            {polyline.length > 1 && (
                <>
                    <Polyline
                        positions={polyline}
                        pathOptions={{
                            color: ROUTE_CASING,
                            weight: ROUTE_CASING_WEIGHT,
                            opacity: 1,
                            lineCap: "round",
                            lineJoin: "round",
                        }}
                    />
                    <Polyline
                        positions={polyline}
                        pathOptions={{
                            color: ROUTE_COLOR,
                            weight: ROUTE_WEIGHT,
                            opacity: 1,
                            lineCap: "round",
                            lineJoin: "round",
                        }}
                    />
                </>
            )}

            {stops.map((stop, index) => {
                const isFirst = index === 0;
                const isLast = index === stops.length - 1;
                const color = isFirst
                    ? START_COLOR
                    : isLast
                      ? END_COLOR
                      : MID_COLOR;
                const label = String(index + 1);
                return (
                    <Marker
                        key={stop.id_}
                        position={[stop.lat, stop.lng]}
                        icon={createStopIcon(label, color)}
                    >
                        <Popup>
                            <strong>{stop.name}</strong>
                            <br />
                            <small style={{ color: "#6b7280" }}>
                                {stop.address}
                            </small>
                        </Popup>
                    </Marker>
                );
            })}

            {previewStop && (
                <Marker
                    position={[previewStop.lat, previewStop.lng]}
                    icon={createStopIcon("?", PREVIEW_COLOR)}
                >
                    <Popup>
                        <strong>{previewStop.name}</strong>
                        <br />
                        <small style={{ color: "#6b7280" }}>
                            {previewStop.address}
                        </small>
                    </Popup>
                </Marker>
            )}

            <FitBoundsController stops={stops} polyline={polyline} />
            <PanelZoomControl />
            <MapResizeHandler />
        </MapContainer>
    );
}
