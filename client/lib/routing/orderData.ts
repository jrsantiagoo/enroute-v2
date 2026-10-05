import { Stop, OrderPriority, RoutePlan } from "../types/schema";

export interface MockOrder {
    orderId: number;
    customer: string;
    address: string;
    lat: number;
    lng: number;
    priority: OrderPriority;
    area: string;
}

// A location that groups every order sharing the same address/coordinates.
export interface OrderLocation {
    id: string;
    orderIds: number[];
    address: string;
    lat: number;
    lng: number;
    priority: OrderPriority; // urgent if any order at this address is urgent
    area: string;
}

// Stand-in order book while there is no backend. Several orders intentionally
// share an address so grouping collapses them into one stop card.
export const MOCK_ORDERS: MockOrder[] = [
    {
        orderId: 1678,
        customer: "Ayala Land Corp.",
        address: "Makati CBD, Ayala Avenue, Makati 1226",
        lat: 14.5547,
        lng: 121.0244,
        priority: "normal",
        area: "Area 1",
    },
    {
        orderId: 1999,
        customer: "Glorietta Retail",
        address: "Makati CBD, Ayala Avenue, Makati 1226",
        lat: 14.5547,
        lng: 121.0244,
        priority: "normal",
        area: "Area 1",
    },
    {
        orderId: 1668,
        customer: "High Street Deli",
        address: "Bonifacio Global City, High Street, BGC, Taguig 1634",
        lat: 14.5492,
        lng: 121.0523,
        priority: "urgent",
        area: "Area 1",
    },
    {
        orderId: 1873,
        customer: "BGC Central Pharmacy",
        address: "Bonifacio Global City, High Street, BGC, Taguig 1634",
        lat: 14.5492,
        lng: 121.0523,
        priority: "normal",
        area: "Area 1",
    },
    {
        orderId: 1998,
        customer: "Uptown Grocers",
        address: "Bonifacio Global City, High Street, BGC, Taguig 1634",
        lat: 14.5492,
        lng: 121.0523,
        priority: "normal",
        area: "Area 1",
    },
    {
        orderId: 1720,
        customer: "MOA Seaside Cafe",
        address: "SM Mall of Asia, J.W. Diokno Blvd, Pasay 1300",
        lat: 14.5352,
        lng: 120.9831,
        priority: "normal",
        area: "Area 2",
    },
    {
        orderId: 1801,
        customer: "Quiapo Fresh Market",
        address: "Plaza Miranda, Quiapo, Manila 1001",
        lat: 14.5995,
        lng: 120.9842,
        priority: "urgent",
        area: "Area 2",
    },
    {
        orderId: 1802,
        customer: "Carriedo Hardware",
        address: "Plaza Miranda, Quiapo, Manila 1001",
        lat: 14.5995,
        lng: 120.9842,
        priority: "normal",
        area: "Area 2",
    },
    {
        orderId: 1750,
        customer: "Divisoria Textile Hub",
        address: "C.M. Recto Ave, Divisoria, Manila",
        lat: 14.6021,
        lng: 120.9726,
        priority: "normal",
        area: "Area 2",
    },
    {
        orderId: 1900,
        customer: "Eastwood Tech Supply",
        address: "Bagumbayan, Eastwood City, Quezon City 1110",
        lat: 14.607,
        lng: 121.0779,
        priority: "normal",
        area: "Area 1",
    },
    {
        orderId: 1640,
        customer: "North EDSA Bookstore",
        address: "North Avenue, SM City North EDSA, Quezon City 1106",
        lat: 14.6566,
        lng: 121.0333,
        priority: "normal",
        area: "Area 1",
    },
];

// Orders at the same rounded coordinates count as one location.
function locationKey(lat: number, lng: number): string {
    return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export function groupOrdersByLocation(
    orders: MockOrder[] = MOCK_ORDERS,
): OrderLocation[] {
    const byKey = new Map<string, OrderLocation>();

    for (const order of orders) {
        const key = locationKey(order.lat, order.lng);
        const existing = byKey.get(key);
        if (existing) {
            existing.orderIds.push(order.orderId);
            if (order.priority === "urgent") existing.priority = "urgent";
        } else {
            byKey.set(key, {
                id: `order-loc-${key}`,
                orderIds: [order.orderId],
                address: order.address,
                lat: order.lat,
                lng: order.lng,
                priority: order.priority,
                area: order.area,
            });
        }
    }

    return [...byKey.values()];
}

// "ORDER #1678, #1999"
export function formatOrderLabel(orderIds: number[]): string {
    if (orderIds.length === 0) return "";
    return `ORDER ${orderIds.map((id) => `#${id}`).join(", ")}`;
}

export function orderLocationToStop(loc: OrderLocation): Stop {
    return {
        id_: loc.id,
        name: formatOrderLabel(loc.orderIds),
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
        orderIds: loc.orderIds,
        priority: loc.priority,
        area: loc.area,
    };
}

// ── City/area tags for the Saved Routes table ───────────────────────────────
// Derived from each stop's name + address. Known districts are checked before
// their parent city so a BGC stop tags as "BGC" rather than "Taguig".

interface KnownArea {
    label: string;
    keywords: string[];
}

// Order matters: districts/business areas first, parent cities last.
const KNOWN_AREAS: KnownArea[] = [
    {
        label: "BGC",
        keywords: ["bgc", "bonifacio global city", "fort bonifacio"],
    },
    { label: "Makati", keywords: ["makati"] },
    { label: "Ortigas", keywords: ["ortigas"] },
    { label: "Eastwood", keywords: ["eastwood"] },
    { label: "Cubao", keywords: ["cubao"] },
    { label: "Alabang", keywords: ["alabang"] },
    { label: "Quiapo", keywords: ["quiapo"] },
    { label: "Divisoria", keywords: ["divisoria"] },
    { label: "Intramuros", keywords: ["intramuros"] },
    { label: "Binondo", keywords: ["binondo"] },
    { label: "Malate", keywords: ["malate"] },
    { label: "Ermita", keywords: ["ermita"] },
    { label: "Pasay", keywords: ["pasay", "mall of asia"] },
    { label: "Taguig", keywords: ["taguig"] },
    { label: "Pasig", keywords: ["pasig"] },
    { label: "Mandaluyong", keywords: ["mandaluyong"] },
    { label: "San Juan", keywords: ["san juan"] },
    { label: "Marikina", keywords: ["marikina"] },
    { label: "Parañaque", keywords: ["parañaque", "paranaque"] },
    { label: "Las Piñas", keywords: ["las piñas", "las pinas"] },
    { label: "Muntinlupa", keywords: ["muntinlupa"] },
    { label: "Caloocan", keywords: ["caloocan"] },
    { label: "Valenzuela", keywords: ["valenzuela"] },
    { label: "Malabon", keywords: ["malabon"] },
    { label: "Navotas", keywords: ["navotas"] },
    { label: "Pateros", keywords: ["pateros"] },
    { label: "Quezon City", keywords: ["quezon city"] },
    { label: "Manila", keywords: ["manila"] },
];

// Region/country labels that are never useful as a tag on their own.
const ADDRESS_STOP_WORDS = new Set([
    "philippines",
    "metro manila",
    "national capital region",
    "ncr",
]);

function truncate(value: string, max: number): string {
    const trimmed = value.trim();
    return trimmed.length > max ? `${trimmed.slice(0, max).trim()}…` : trimmed;
}

// Best-effort city from a comma-separated address (e.g. Nominatim output):
// walk from the end, skip country/region and postal-code fragments.
function parseCityFromAddress(address: string): string {
    const segments = address
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i].replace(/\d+/g, "").trim();
        if (!seg || ADDRESS_STOP_WORDS.has(seg.toLowerCase())) continue;
        return seg;
    }
    return "";
}

function deriveAreaTag(stop: Stop): string {
    const haystack = `${stop.name} ${stop.address}`.toLowerCase();
    const known = KNOWN_AREAS.find((area) =>
        area.keywords.some((k) => haystack.includes(k)),
    );
    if (known) return known.label;

    const city = parseCityFromAddress(stop.address);
    if (city) return city;

    return truncate(stop.name, 18);
}

// City/area tags for a saved route, deduped and in first-seen order.
export function getRouteAreaTags(route: RoutePlan): string[] {
    const seen = new Set<string>();
    const tags: string[] = [];
    for (const stop of route.stops) {
        const tag = deriveAreaTag(stop);
        const key = tag.toLowerCase();
        if (tag && !seen.has(key)) {
            seen.add(key);
            tags.push(tag);
        }
    }
    return tags;
}
