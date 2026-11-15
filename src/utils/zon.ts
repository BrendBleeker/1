/**
 * Zonsopkomst en zonsondergang berekenen (de 'sunrise equation', nauwkeurig tot enkele minuten).
 * Geen internet nodig.
 */
const RAD = Math.PI / 180

export interface ZonTijden {
  opkomst: Date | null
  ondergang: Date | null
}

export function zonTijden(datum: Date, lat: number, lng: number): ZonTijden {
  // Juliaanse dag rond het middaguur van de gekozen dag
  const middag = Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate(), 12)
  const jd = middag / 86_400_000 + 2440587.5
  const n = Math.round(jd - 2451545 + 0.0008)
  const jSter = n - lng / 360
  const M = (357.5291 + 0.98560028 * jSter) % 360
  const C =
    1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD)
  const lambda = (M + C + 180 + 102.9372) % 360
  const jTransit =
    2451545 + jSter + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD)
  const sinDelta = Math.sin(lambda * RAD) * Math.sin(23.4397 * RAD)
  const cosDelta = Math.cos(Math.asin(sinDelta))
  const cosOmega =
    (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * sinDelta) / (Math.cos(lat * RAD) * cosDelta)
  if (cosOmega < -1 || cosOmega > 1) return { opkomst: null, ondergang: null }
  const omega = Math.acos(cosOmega) / RAD
  const naarDatum = (j: number) => new Date((j - 2440587.5) * 86_400_000)
  return {
    opkomst: naarDatum(jTransit - omega / 360),
    ondergang: naarDatum(jTransit + omega / 360),
  }
}

/** Tijd in Nederlandse tijd, bijv. "17:02". */
export function formatTijd(d: Date | null): string {
  if (!d) return '–'
  return d.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  })
}

/** Datum plus/min een aantal minuten. */
export function plusMinuten(d: Date | null, minuten: number): Date | null {
  return d ? new Date(d.getTime() + minuten * 60_000) : null
}
