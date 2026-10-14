import type { Page } from '@playwright/test';

type LngLat = [number, number];

// Stands in for the public OSRM demo server (client/lib/routing/routingService.ts) so route
// tests don't depend on a third-party service. Returns one straight-line route through the
// requested points: N points -> N-1 legs, distances in metres, durations in seconds.
export async function stubOsrm(page: Page) {
  await page.route('https://router.project-osrm.org/route/v1/driving/**', async (route) => {
    const { pathname } = new URL(route.request().url());
    const coords = decodeURIComponent(pathname.slice(pathname.lastIndexOf('/') + 1))
      .split(';')
      .map((pair) => pair.split(',').map(Number) as LngLat);

    const legs = coords.slice(1).map((to, i) => {
      const distance = metersBetween(coords[i], to);
      return { distance, duration: distance / 8.33 }; // ~30 km/h city driving
    });

    await route.fulfill({
      json: {
        code: 'Ok',
        routes: [
          {
            distance: legs.reduce((sum, leg) => sum + leg.distance, 0),
            duration: legs.reduce((sum, leg) => sum + leg.duration, 0),
            geometry: { type: 'LineString', coordinates: coords },
            legs,
          },
        ],
      },
    });
  });
}

// Haversine great-circle distance in metres.
function metersBetween([lng1, lat1]: LngLat, [lng2, lat2]: LngLat) {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(a));
}
