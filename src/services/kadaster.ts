import { booleanPointInPolygon, point } from '@turf/turf'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import { KADASTER_PERCELEN } from '../config/bronnen'

export interface PerceelInfo {
  /** Bijv. "Oosterbeek C 2800" */
  aanduiding: string
  /** Kadastrale grootte in m² */
  grootteM2: number
}

/**
 * Zoekt het kadastrale perceel op een punt.
 * We vragen de percelen in een heel klein vierkantje rond het punt op en kiezen het perceel
 * waar het punt echt in ligt.
 */
export async function zoekPerceelOpPunt(
  lat: number,
  lng: number,
): Promise<{ gebied: Feature<Polygon>; info: PerceelInfo } | null> {
  const d = 0.0002
  const url = `${KADASTER_PERCELEN.itemsUrl}?f=json&limit=50&bbox=${lng - d},${lat - d},${lng + d},${lat + d}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`De kadastrale kaart gaf foutcode ${r.status}.`)
  const data = await r.json()
  const pt = point([lng, lat])
  const raak = (data.features as Feature<Polygon | MultiPolygon, Record<string, string>>[]).find(
    (f) => booleanPointInPolygon(pt, f),
  )
  if (!raak) return null

  // Een perceel is bijna altijd één vlak; bij meerdere delen nemen we het deel met het punt
  let geometrie: Polygon
  if (raak.geometry.type === 'Polygon') geometrie = raak.geometry
  else {
    const deel =
      raak.geometry.coordinates.find((c) =>
        booleanPointInPolygon(pt, { type: 'Polygon', coordinates: c }),
      ) ?? raak.geometry.coordinates[0]
    geometrie = { type: 'Polygon', coordinates: deel }
  }

  const p = raak.properties
  const info: PerceelInfo = {
    aanduiding: `${p.kadastrale_gemeente_waarde} ${p.sectie} ${p.perceelnummer}`,
    grootteM2: Number(p.kadastrale_grootte_waarde),
  }
  return {
    gebied: { type: 'Feature', properties: { perceel: info.aanduiding }, geometry: geometrie },
    info,
  }
}
