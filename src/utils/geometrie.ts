import { area, buffer } from '@turf/turf'
import type { Feature, Polygon, MultiPolygon } from 'geojson'

/** Oppervlakte van een polygoon in hectare (1 ha = 10.000 m²). */
export function oppervlakteHectare(gebied: Feature<Polygon>): number {
  return area(gebied) / 10_000
}

/** Zone van `meters` rond het gebied (bijv. de 1 km-zone voor Natura 2000). */
export function bufferGebied(
  gebied: Feature<Polygon>,
  meters: number,
): Feature<Polygon | MultiPolygon> {
  const resultaat = buffer(gebied, meters, { units: 'meters' })
  if (!resultaat) throw new Error('Kon geen bufferzone rond het gebied berekenen.')
  return resultaat
}

/** Getal netjes in Nederlandse notatie, bijv. 1.234,56 */
export function formatGetal(waarde: number, decimalen = 2): string {
  return waarde.toLocaleString('nl-NL', {
    minimumFractionDigits: decimalen,
    maximumFractionDigits: decimalen,
  })
}

/** Afstand leesbaar maken: "350 m" of "1,2 km". */
export function formatAfstand(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`
  return `${formatGetal(meters / 1000, 1)} km`
}

/** Oppervlakte leesbaar: kleine gebieden in m², grotere in hectare. */
export function formatOppervlakte(gebied: Feature<Polygon>): string {
  const ha = oppervlakteHectare(gebied)
  const m2 = `${Math.round(ha * 10_000).toLocaleString('nl-NL')} m²`
  if (ha < 0.01) return m2
  if (ha < 1) return `${m2} (${formatGetal(ha, 2)} ha)`
  return `${formatGetal(ha)} ha`
}
