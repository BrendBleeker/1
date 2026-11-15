import {
  bbox,
  booleanIntersects,
  pointToLineDistance,
  lineString,
  point,
  coordEach,
} from '@turf/turf'
import type { Feature, FeatureCollection, LineString, MultiPolygon, Polygon } from 'geojson'
import { NATURA2000 } from '../config/bronnen'
import { bufferGebied } from '../utils/geometrie'

/** Eén Natura 2000-gebied in of nabij het onderzoeksgebied. */
export interface NabijNatura2000 {
  naam: string
  nummer: string
  /** VR = Vogelrichtlijn, HR = Habitatrichtlijn, VR+HR = beide */
  bescherming: string
  /** true als het gebied het onderzoeksgebied raakt of overlapt */
  overlapt: boolean
  /** Kortste afstand in meters (0 bij overlap) */
  afstandM: number
}

interface N2kEigenschappen {
  naam_n2k?: string
  nr?: string | number
  beschermin?: string
}

type N2kFeature = Feature<Polygon | MultiPolygon, N2kEigenschappen>

interface OgcPagina extends FeatureCollection<Polygon | MultiPolygon, N2kEigenschappen> {
  links?: { rel: string; href: string }[]
}

/** Veiligheidsgrens: nooit meer dan zoveel pagina's ophalen. */
const MAX_PAGINAS = 10

/**
 * Haalt alle Natura 2000-gebieden op die binnen `afstandM` meter van het gebied liggen.
 * Werkwijze:
 *  1. Leg een bufferzone van `afstandM` om het gebied.
 *  2. Vraag de OGC API om alle gebieden in de omhullende rechthoek (bbox) van die zone.
 *  3. Controleer per gebied precies of het de zone raakt, en bereken de afstand.
 */
export async function zoekNatura2000Nabij(
  gebied: Feature<Polygon>,
  afstandM: number,
  signal?: AbortSignal,
): Promise<NabijNatura2000[]> {
  const zone = bufferGebied(gebied, afstandM)
  const [west, zuid, oost, noord] = bbox(zone)

  // Alle pagina's ophalen (de API geeft resultaten in delen terug)
  const kandidaten: N2kFeature[] = []
  let url: string | null =
    `${NATURA2000.apiItemsUrl}?f=json&limit=50&bbox=${west},${zuid},${oost},${noord}`
  for (let pagina = 0; url && pagina < MAX_PAGINAS; pagina++) {
    const antwoord = await fetch(url, { signal })
    if (!antwoord.ok) {
      throw new Error(`De Natura 2000-dienst van PDOK gaf foutcode ${antwoord.status}.`)
    }
    const data = (await antwoord.json()) as OgcPagina
    kandidaten.push(...data.features)
    url = data.links?.find((l) => l.rel === 'next')?.href ?? null
  }

  const resultaten: NabijNatura2000[] = []
  for (const f of kandidaten) {
    if (!booleanIntersects(zone, f)) continue // ligt in de bbox maar verder weg
    const overlapt = booleanIntersects(gebied, f)
    resultaten.push({
      naam: f.properties?.naam_n2k ?? 'Onbekend gebied',
      nummer: String(f.properties?.nr ?? '–'),
      bescherming: f.properties?.beschermin ?? '–',
      overlapt,
      afstandM: overlapt ? 0 : kortsteAfstand(gebied, f, [west, zuid, oost, noord]),
    })
  }
  return resultaten.sort((a, b) => a.afstandM - b.afstandM)
}

/**
 * Kortste afstand (m) tussen de rand van het gebied en een Natura 2000-gebied
 * dat niet overlapt. We meten beide kanten op:
 *  - van elk hoekpunt van het onderzoeksgebied naar de rand van het N2000-gebied
 *  - van elk hoekpunt van het N2000-gebied (binnen de zoekzone) naar de rand van het onderzoeksgebied
 */
function kortsteAfstand(
  gebied: Feature<Polygon>,
  n2k: N2kFeature,
  [west, zuid, oost, noord]: number[],
): number {
  let minimum = Infinity

  const randen = randLijnen(n2k)
  const gebiedRanden = randLijnen(gebied)

  // Hoekpunten van het onderzoeksgebied → rand N2000
  coordEach(gebied, (c) => {
    for (const rand of randen) {
      minimum = Math.min(minimum, pointToLineDistance(point(c), rand, { units: 'meters' }))
    }
  })

  // Hoekpunten van N2000 binnen de zoekzone → rand onderzoeksgebied
  coordEach(n2k, (c) => {
    const [x, y] = c
    if (x < west || x > oost || y < zuid || y > noord) return
    for (const rand of gebiedRanden) {
      minimum = Math.min(minimum, pointToLineDistance(point(c), rand, { units: 'meters' }))
    }
  })

  return minimum
}

/** Alle randen (buitenrand en eventuele gaten) van een (multi)polygoon als losse lijnen. */
function randLijnen(f: Feature<Polygon | MultiPolygon>): Feature<LineString>[] {
  const polygonen =
    f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  return polygonen.flat().map((ring) => lineString(ring))
}
