import type { Weather } from './types'

// WMO weather code → label + emoji. https://open-meteo.com/en/docs
const WMO: Record<number, [string, string]> = {
  0: ['Clear sky', '☀️'],
  1: ['Mainly clear', '🌤️'],
  2: ['Partly cloudy', '⛅'],
  3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'],
  48: ['Rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️'],
  53: ['Drizzle', '🌦️'],
  55: ['Heavy drizzle', '🌧️'],
  61: ['Light rain', '🌦️'],
  63: ['Rain', '🌧️'],
  65: ['Heavy rain', '🌧️'],
  71: ['Light snow', '🌨️'],
  73: ['Snow', '❄️'],
  75: ['Heavy snow', '❄️'],
  80: ['Rain showers', '🌦️'],
  81: ['Rain showers', '🌧️'],
  82: ['Violent showers', '⛈️'],
  95: ['Thunderstorm', '⛈️'],
  96: ['Thunderstorm + hail', '⛈️'],
  99: ['Thunderstorm + hail', '⛈️'],
}

export function describeCode(code: number): { label: string; icon: string } {
  const [label, icon] = WMO[code] ?? ['Unknown', '🌡️']
  return { label, icon }
}

/** Browser geolocation as a promise. Rejects if denied/unavailable. */
export function getPosition(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('no geolocation'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p.coords),
      (e) => reject(e),
      { timeout: 8000, maximumAge: 600_000 },
    )
  })
}

/** Fetch current weather for coordinates from open-meteo (no API key). */
export async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
  const res = await fetch(url)
  if (!res.ok) throw new Error('weather fetch failed')
  const json = await res.json()
  const code = json.current?.weather_code ?? 0
  const { label, icon } = describeCode(code)
  return { tempC: Math.round(json.current?.temperature_2m ?? 0), code, label, icon }
}

/** Reverse-geocode coordinates to a city/region label (BigDataCloud, no key). */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
  const res = await fetch(url)
  if (!res.ok) throw new Error('geocode failed')
  const j = await res.json()
  const city = j.city || j.locality || j.principalSubdivision || ''
  const region = j.principalSubdivision && j.city ? `, ${j.principalSubdivision}` : ''
  const country = j.countryCode ? ` ${j.countryCode}` : ''
  return `${city}${region}${country}`.trim()
}
