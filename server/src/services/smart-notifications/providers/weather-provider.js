import { ProviderError } from "./provider-error.js";

// Open-Meteo is free and needs no API key. See https://open-meteo.com/en/docs
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 8000;

async function getJson(url, fetchImpl) {
    const response = await fetchImpl(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok)
        throw new ProviderError(`weather HTTP ${response.status}`);
    return response.json();
}

// Current rainfall plus a 16-day daily forecast.
export async function fetchWeather({ lat, lng }, fetchImpl = fetch) {
    const url = new URL(FORECAST_URL);
    url.search = new URLSearchParams({
        latitude: lat,
        longitude: lng,
        timezone: "Asia/Manila",
        forecast_days: 16,
        current: "precipitation",
        daily: "precipitation_sum,precipitation_probability_max",
    });

    const json = await getJson(url, fetchImpl);
    if (!json.daily?.time)
        throw new ProviderError("weather: malformed response");

    return {
        fetchedAt: new Date(),
        currentPrecipMm: json.current?.precipitation ?? 0,
        daily: Object.fromEntries(
            json.daily.time.map((day, i) => [
                day,
                {
                    precipMm: json.daily.precipitation_sum[i] ?? 0,
                    probMax:
                        json.daily.precipitation_probability_max?.[i] ?? null,
                },
            ]),
        ),
    };
}

// Past daily rainfall excluding today, used to label historical trips as rainy or dry. Open-Meteo allows at most 92 past days.
export async function fetchDailyWeatherHistory(
    { lat, lng },
    pastDays,
    fetchImpl = fetch,
) {
    const url = new URL(FORECAST_URL);
    url.search = new URLSearchParams({
        latitude: lat,
        longitude: lng,
        timezone: "Asia/Manila",
        past_days: Math.min(92, Math.max(1, pastDays)),
        forecast_days: 1,
        daily: "precipitation_sum",
    });

    const json = await getJson(url, fetchImpl);
    if (!json.daily?.time)
        throw new ProviderError("weather history: malformed response");

    return json.daily.time.slice(0, -1).map((day, i) => ({
        dateKey: day,
        precipMm: json.daily.precipitation_sum[i] ?? 0,
    }));
}
