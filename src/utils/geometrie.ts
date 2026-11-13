import area from '@turf/area'
import type { Feature, Polygon } from 'geojson'

/** Oppervlakte van een polygoon in hectare (1 ha = 10.000 m²). */
export function oppervlakteHectare(gebied: Feature<Polygon>): number {
  return area(gebied) / 10_000
}

/** Getal netjes in Nederlandse notatie, bijv. 1.234,56 */
export function formatGetal(waarde: number, decimalen = 2): string {
  return waarde.toLocaleString('nl-NL', {
    minimumFractionDigits: decimalen,
    maximumFractionDigits: decimalen,
  })
}
