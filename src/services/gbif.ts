import { rewind, simplify, truncate } from '@turf/turf'
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson'
import { GBIF } from '../config/bronnen'
import type { Soort, Waarneming } from '../types'
import { bepaalSoortgroep } from '../utils/soortgroepen'
import { fetchMetHerhaling } from '../utils/fetchMetHerhaling'

/** Resultaat van één zoekopdracht bij GBIF. */
export interface GbifResultaat {
  waarnemingen: Waarneming[]
  soorten: Soort[]
  /** Totaal aantal waarnemingen in GBIF voor dit gebied en deze periode */
  totaal: number
  /** true als er meer waarnemingen zijn dan we als punten hebben opgehaald */
  afgekapt: boolean
  /** Zoekperiode (JJJJ-MM-DD) */
  vanaf: string
  tot: string
  opgehaaldOp: Date
  /** Link naar dezelfde zoekopdracht op gbif.org (voor de bronvermelding) */
  gbifLink: string
}

/** De velden van een GBIF-waarneming die we gebruiken. */
interface GbifRecord {
  key: number
  speciesKey?: number
  species?: string
  kingdom?: string
  class?: string
  eventDate?: string
  decimalLatitude?: number
  decimalLongitude?: number
  datasetName?: string
}

interface GbifZoekAntwoord {
  count: number
  endOfRecords: boolean
  results: GbifRecord[]
  facets?: { field: string; counts: { name: string; count: number }[] }[]
}

/**
 * Zet een (multi)polygoon om naar WKT voor GBIF.
 * - GBIF wil de buitenrand tegen de klok in (rewind regelt dat)
 * - lange WKT's maken de URL te lang, dus we vereenvoudigen tot max. ~150 punten
 * - 6 decimalen (± 10 cm) is ruim voldoende
 */
export function naarWkt(gebied: Feature<Polygon | MultiPolygon>): string {
  let vorm = gebied
  let tolerantie = 0.00002
  while (aantalPunten(vorm) > 150 && tolerantie < 0.01) {
    vorm = simplify(gebied, { tolerance: tolerantie, highQuality: true })
    tolerantie *= 2
  }
  vorm = truncate(rewind(vorm) as Feature<Polygon | MultiPolygon>, { precision: 6 })

  const ring = (r: Position[]) => '(' + r.map(([x, y]) => `${x} ${y}`).join(',') + ')'
  const poly = (p: Position[][]) => '(' + p.map(ring).join(',') + ')'
  const g = vorm.geometry
  return g.type === 'Polygon'
    ? `POLYGON${poly(g.coordinates)}`
    : `MULTIPOLYGON(${g.coordinates.map(poly).join(',')})`
}

function aantalPunten(f: Feature<Polygon | MultiPolygon>): number {
  return JSON.stringify(f.geometry.coordinates).split('],[').length
}

function datumTekst(d: Date): string {
  return d.toISOString().slice(0, 10)
}

async function haalJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const antwoord = await fetchMetHerhaling(url, signal)
  if (antwoord.status === 429) {
    throw new Error(
      'GBIF krijgt op dit moment te veel verzoeken (429). Wacht een minuut en probeer het opnieuw.',
    )
  }
  if (!antwoord.ok) throw new Error(`GBIF gaf foutcode ${antwoord.status}.`)
  return (await antwoord.json()) as T
}

/**
 * Haalt waarnemingen uit GBIF voor het zoekgebied (gebied + buffer), laatste 10 jaar.
 * Werkwijze:
 *  1. Eén verzoek met een telling per soort (facet). Dit geeft de volledige soortenlijst
 *     met aantallen, ook als er heel veel waarnemingen zijn.
 *  2. De waarnemingen zelf ophalen in pagina's van 300, tot maximaal 5000.
 *     Die gebruiken we voor de punten op de kaart en de laatste datum per soort.
 *  3. Soorten die wel in de telling zitten maar niet in de opgehaalde waarnemingen
 *     (alleen bij > 5000 waarnemingen) apart opzoeken voor naam en soortgroep.
 */
export async function haalWaarnemingenOp(
  zoekgebied: Feature<Polygon | MultiPolygon>,
  signal?: AbortSignal,
  onVoortgang?: (geladen: number, totaal: number) => void,
): Promise<GbifResultaat> {
  const tot = new Date()
  const vanaf = new Date(tot)
  vanaf.setFullYear(tot.getFullYear() - GBIF.jarenTerug)

  const filters = new URLSearchParams({
    geometry: naarWkt(zoekgebied),
    eventDate: `${datumTekst(vanaf)},${datumTekst(tot)}`,
    hasCoordinate: 'true',
    hasGeospatialIssue: 'false',
    occurrenceStatus: 'PRESENT', // geen "niet aangetroffen"-records
  })

  // 1. Telling per soort
  const telling = await haalJson<GbifZoekAntwoord>(
    `${GBIF.zoekUrl}?${filters}&limit=0&facet=speciesKey&facetLimit=3000&facetMincount=1`,
    signal,
  )
  const totaal = telling.count
  const aantallen = new Map<number, number>()
  for (const c of telling.facets?.[0]?.counts ?? []) aantallen.set(Number(c.name), c.count)

  // 2. Waarnemingen in pagina's ophalen (2 tegelijk, om GBIF niet te overbelasten)
  const teHalen = Math.min(totaal, GBIF.maxWaarnemingen)
  const offsets: number[] = []
  for (let o = 0; o < teHalen; o += GBIF.paginaGrootte) offsets.push(o)
  const records: GbifRecord[] = []
  onVoortgang?.(0, teHalen)
  for (let i = 0; i < offsets.length; i += 2) {
    const paginas = await Promise.all(
      offsets
        .slice(i, i + 2)
        .map((offset) =>
          haalJson<GbifZoekAntwoord>(
            `${GBIF.zoekUrl}?${filters}&limit=${GBIF.paginaGrootte}&offset=${offset}`,
            signal,
          ),
        ),
    )
    for (const p of paginas) records.push(...p.results)
    onVoortgang?.(Math.min(records.length, teHalen), teHalen)
  }
  records.length = Math.min(records.length, teHalen) // precies op de grens afkappen

  // Omzetten naar waarnemingen en per soort samenvatten
  const waarnemingen: Waarneming[] = []
  const soorten = new Map<number, Soort>()
  for (const r of records) {
    if (!r.speciesKey || !r.species || r.decimalLatitude == null || r.decimalLongitude == null)
      continue
    const datum = r.eventDate?.slice(0, 10) ?? ''
    waarnemingen.push({
      key: r.key,
      soortKey: r.speciesKey,
      wetenschappelijkeNaam: r.species,
      datum,
      lat: r.decimalLatitude,
      lng: r.decimalLongitude,
      bron: r.datasetName ?? 'onbekende dataset',
    })
    const soort = soorten.get(r.speciesKey)
    if (soort) {
      if (datum > (soort.laatsteDatum ?? '')) soort.laatsteDatum = datum
    } else {
      soorten.set(r.speciesKey, {
        key: r.speciesKey,
        wetenschappelijkeNaam: r.species,
        groep: bepaalSoortgroep(r.kingdom, r.class),
        aantal: aantallen.get(r.speciesKey) ?? 1,
        laatsteDatum: datum || undefined,
      })
    }
  }

  // 3. Soorten uit de telling die niet in de opgehaalde waarnemingen zitten
  const ontbrekend = [...aantallen.keys()].filter((k) => !soorten.has(k))
  for (let i = 0; i < ontbrekend.length; i += 3) {
    const details = await Promise.all(
      ontbrekend
        .slice(i, i + 3)
        .map((k) =>
          haalJson<{ key: number; canonicalName?: string; kingdom?: string; class?: string }>(
            `${GBIF.soortUrl}/${k}`,
            signal,
          ).catch(() => null),
        ),
    )
    for (const d of details) {
      if (!d) continue
      soorten.set(d.key, {
        key: d.key,
        wetenschappelijkeNaam: d.canonicalName ?? `soort ${d.key}`,
        groep: bepaalSoortgroep(d.kingdom, d.class),
        aantal: aantallen.get(d.key) ?? 0,
      })
    }
  }

  // Aantallen uit de telling zijn leidend (die zijn volledig)
  for (const s of soorten.values()) s.aantal = aantallen.get(s.key) ?? s.aantal

  const websiteFilters = new URLSearchParams(filters)
  return {
    waarnemingen,
    soorten: [...soorten.values()],
    totaal,
    afgekapt: totaal > records.length,
    vanaf: datumTekst(vanaf),
    tot: datumTekst(tot),
    opgehaaldOp: new Date(),
    gbifLink: `${GBIF.websiteZoekUrl}?${websiteFilters}`,
  }
}
