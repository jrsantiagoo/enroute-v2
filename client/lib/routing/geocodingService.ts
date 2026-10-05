export interface GeocodingResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

function parseCoordinates(query: string): { lat: number; lng: number } | null {
  const match = query.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export async function searchLocation(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const coords = parseCoordinates(trimmed);
  if (coords) {
    return [
      {
        id: `coord-${coords.lat}-${coords.lng}`,
        name: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
        address: `Coordinates: ${coords.lat}, ${coords.lng}`,
        lat: coords.lat,
        lng: coords.lng,
      },
    ];
  }

  const params = new URLSearchParams({
    q: trimmed,
    format: 'json',
    limit: '5',
    countrycodes: 'ph',
    addressdetails: '1',
  });

  const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: { 'User-Agent': 'ACESOFT-RouteManagement/1.0' },
    signal,
  });

  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);

  const data = (await res.json()) as Array<{
    place_id: number;
    display_name: string;
    name?: string;
    lat: string;
    lon: string;
  }>;

  return data.map((item) => ({
    id: String(item.place_id),
    name: item.name || item.display_name.split(',')[0].trim(),
    address: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}
