import { OPEN_METEO } from '../config/bronnen'

export interface WeerUur {
  /** Lokale tijd "JJJJ-MM-DDTUU:MM" (Europe/Amsterdam) */
  tijd: string
  temperatuur: number
  neerslagMm: number
  windKmh: number
}

/** Uurlijkse weersverwachting voor één dag (alleen binnen de komende 16 dagen). */
export async function haalWeerOp(lat: number, lng: number, datum: string): Promise<WeerUur[]> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    hourly: 'temperature_2m,precipitation,wind_speed_10m',
    timezone: 'Europe/Amsterdam',
    forecast_days: String(OPEN_METEO.maxDagen),
  })
  const r = await fetch(`${OPEN_METEO.forecastUrl}?${params}`)
  if (r.status === 429)
    throw new Error('De weerdienst krijgt te veel verzoeken; probeer het later opnieuw.')
  if (!r.ok) throw new Error(`De weerdienst gaf foutcode ${r.status}.`)
  const data = await r.json()
  const u = data?.hourly
  if (!u?.time) throw new Error('Onverwacht antwoord van de weerdienst.')
  return (u.time as string[])
    .map((tijd, i) => ({
      tijd,
      temperatuur: u.temperature_2m[i],
      neerslagMm: u.precipitation[i],
      windKmh: u.wind_speed_10m[i],
    }))
    .filter((w) => w.tijd.startsWith(datum))
}

/**
 * Globale geschiktheid voor vleermuisonderzoek (indicatief, naar het Vleermuisprotocol):
 * droog, niet te koud (± ≥ 10 °C) en weinig wind (± ≤ 4 Beaufort ≈ 28 km/h).
 */
export function geschiktVoorVleermuizen(w: WeerUur): { ok: boolean; reden: string } {
  if (w.neerslagMm > 0.2) return { ok: false, reden: 'neerslag' }
  if (w.temperatuur < 10) return { ok: false, reden: 'te koud' }
  if (w.windKmh > 28) return { ok: false, reden: 'te veel wind' }
  return { ok: true, reden: 'geschikt' }
}
