import {
  area,
  bbox,
  booleanIntersects,
  centroid,
  booleanPointInPolygon,
  featureCollection,
  intersect,
  length,
  lineSplit,
} from '@turf/turf'
import type {
  Feature,
  Geometry,
  LineString,
  MultiLineString,
  MultiPolygon,
  Point,
  Polygon,
} from 'geojson'
import { HABITAT_BRONNEN } from '../config/bronnen'
import type { ProfielId } from '../utils/profielen'
import { bufferGebied } from '../utils/geometrie'
import { fetchMetHerhaling } from '../utils/fetchMetHerhaling'

/** Eén pand uit de BAG. */
export interface Pand {
  id: string
  bouwjaar: number | null
  gebruiksdoel: string
  status: string
  vorm: Feature<Polygon | MultiPolygon>
}

/** Een aanwijzing dat een soortgroep in het gebied kan voorkomen. */
export interface Potentie {
  soortgroep: string
  profiel: ProfielId
  niveau: 'hoog' | 'mogelijk'
  reden: string
}

export interface HabitatResultaat {
  /** Landgebruik in m² binnen het gebied (Top10NL) */
  landgebruik: { type: string; m2: number }[]
  /** Water binnen het gebied of binnen 100 m */
  water: {
    vlakkenInGebied: number
    vlakkenNabij: number
    slotenMeterInGebied: number
    slotenNabij: number
  }
  panden: Pand[]
  bomen: number
  potentie: Potentie[]
  opgehaaldOp: Date
}

/** GeoJSON-pagina van een OGC API. */
interface OgcPagina<G extends Geometry> {
  features: Feature<G, Record<string, unknown>>[]
  links?: { rel: string; href: string }[]
}

/** Alle objecten in een rechthoek ophalen, pagina voor pagina (max. 5 pagina's van 1000). */
async function haalAlleItems<G extends Geometry>(
  itemsUrl: string,
  vak: number[],
  signal?: AbortSignal,
): Promise<Feature<G, Record<string, unknown>>[]> {
  const items: Feature<G, Record<string, unknown>>[] = []
  let url: string | null = `${itemsUrl}?f=json&limit=1000&bbox=${vak.join(',')}`
  for (let pagina = 0; url && pagina < 5; pagina++) {
    const r = await fetchMetHerhaling(url, signal)
    if (!r.ok) throw new Error(`Een PDOK-dienst gaf foutcode ${r.status}.`)
    const data = (await r.json()) as OgcPagina<G>
    items.push(...data.features)
    url = data.links?.find((l) => l.rel === 'next')?.href ?? null
  }
  return items
}

/** Oppervlakte (m²) van het deel van een vlak dat binnen het gebied valt. */
function overlapM2(gebied: Feature<Polygon>, vlak: Feature<Polygon | MultiPolygon>): number {
  try {
    const deel = intersect(featureCollection([gebied, vlak]))
    return deel ? area(deel) : 0
  } catch {
    return 0 // ongeldige geometrie: overslaan
  }
}

/** Lengte (m) van een lijn binnen het gebied (benadering via opknippen op de rand). */
function lengteBinnenM(
  gebied: Feature<Polygon>,
  lijn: Feature<LineString | MultiLineString>,
): number {
  if (lijn.geometry.type !== 'LineString') return 0
  try {
    const stukken = lineSplit(lijn as Feature<LineString>, gebied).features
    const delen = stukken.length > 0 ? stukken : [lijn as Feature<LineString>]
    return delen
      .filter((d) => booleanPointInPolygon(centroid(d), gebied))
      .reduce((som, d) => som + length(d, { units: 'meters' }), 0)
  } catch {
    return 0
  }
}

/**
 * Habitatcheck van het plangebied met open PDOK-data:
 * landgebruik (Top10NL), water (Top10NL, ook binnen 100 m), gebouwen met bouwjaar (BAG)
 * en bomen (BGT, alleen waar de gemeente ze registreert).
 */
export async function analyseerHabitat(
  gebied: Feature<Polygon>,
  signal?: AbortSignal,
): Promise<HabitatResultaat> {
  const vak = bbox(gebied)
  const omgeving = bufferGebied(gebied, 100)
  const vakOmgeving = bbox(omgeving)

  const [terreinen, waterVlakken, waterLijnen, bagPanden, bgtBomen] = await Promise.all([
    haalAlleItems<Polygon | MultiPolygon>(HABITAT_BRONNEN.top10nlTerrein, vak, signal),
    haalAlleItems<Polygon | MultiPolygon>(HABITAT_BRONNEN.top10nlWaterVlak, vakOmgeving, signal),
    haalAlleItems<LineString | MultiLineString>(
      HABITAT_BRONNEN.top10nlWaterLijn,
      vakOmgeving,
      signal,
    ),
    haalAlleItems<Polygon | MultiPolygon>(HABITAT_BRONNEN.bagPand, vak, signal),
    haalAlleItems<Point>(HABITAT_BRONNEN.bgtVegetatiePunt, vak, signal),
  ])

  // Landgebruik
  const perType = new Map<string, number>()
  for (const t of terreinen) {
    const m2 = overlapM2(gebied, t)
    if (m2 < 1) continue
    let type = String(t.properties.typelandgebruik ?? 'onbekend')
    if (type === 'overig') type = 'overig (o.a. bebouwing, erven, verharding)'
    perType.set(type, (perType.get(type) ?? 0) + m2)
  }
  const landgebruik = [...perType.entries()]
    .map(([type, m2]) => ({ type, m2 }))
    .sort((a, b) => b.m2 - a.m2)

  // Water
  const water = {
    vlakkenInGebied: waterVlakken.filter((w) => booleanIntersects(gebied, w)).length,
    vlakkenNabij: waterVlakken.filter((w) => booleanIntersects(omgeving, w)).length,
    slotenMeterInGebied: Math.round(waterLijnen.reduce((s, l) => s + lengteBinnenM(gebied, l), 0)),
    slotenNabij: waterLijnen.filter((l) => booleanIntersects(omgeving, l)).length,
  }

  // Gebouwen (BAG): alle panden die het gebied raken
  const panden: Pand[] = bagPanden
    .filter((p) => booleanIntersects(gebied, p))
    .map((p) => ({
      id: String(p.properties.identificatie),
      bouwjaar: Number(p.properties.bouwjaar) || null,
      gebruiksdoel: String(p.properties.gebruiksdoel ?? ''),
      status: String(p.properties.status ?? ''),
      vorm: p,
    }))

  // Bomen (BGT vegetatieobject met plus-type 'boom')
  const bomen = bgtBomen.filter(
    (b) => b.properties.plus_type === 'boom' && booleanPointInPolygon(b, gebied),
  ).length

  return {
    landgebruik,
    water,
    panden,
    bomen,
    potentie: bepaalPotentie(landgebruik, water, panden, bomen),
    opgehaaldOp: new Date(),
  }
}

/**
 * Vertaalt de habitatgegevens naar aanwijzingen per soortgroep.
 * Dit zijn vuistregels voor het bureauonderzoek; het veldbezoek is leidend.
 */
export function bepaalPotentie(
  landgebruik: HabitatResultaat['landgebruik'],
  water: HabitatResultaat['water'],
  panden: Pand[],
  bomen: number,
): Potentie[] {
  const m2 = (filter: (t: string) => boolean) =>
    landgebruik.filter((l) => filter(l.type)).reduce((s, l) => s + l.m2, 0)
  const bos = m2(
    (t) => t.startsWith('bos') || t.includes('boomgaard') || t.includes('boomkwekerij'),
  )
  const open = m2((t) => t === 'grasland' || t === 'akkerland')
  const heideZand = m2((t) => t.includes('heide') || t.includes('zand') || t.includes('braak'))
  const potentie: Potentie[] = []

  if (panden.length > 0) {
    const oud = panden.filter((p) => p.bouwjaar && p.bouwjaar < 1992).length
    const reden =
      oud > 0
        ? `${oud} van de ${panden.length} gebouwen zijn van vóór 1992; oudere gebouwen hebben vaker open stootvoegen, spouwmuren en pannendaken.`
        : `${panden.length} gebouw(en), allemaal van na 1991; minder kans op invliegopeningen, maar controleer daken en gevels.`
    potentie.push({
      soortgroep: 'Vleermuizen (gebouwbewonend)',
      profiel: 'vleermuizen-gebouw',
      niveau: oud > 0 ? 'hoog' : 'mogelijk',
      reden,
    })
    potentie.push({
      soortgroep: 'Huismus en gierzwaluw (jaarrond beschermde nesten)',
      profiel: 'jaarrond-nesten',
      niveau: oud > 0 ? 'hoog' : 'mogelijk',
      reden: 'Nestplaatsen onder dakpannen, in gevels en nestkasten.',
    })
    potentie.push({
      soortgroep: 'Steenmarter',
      profiel: 'zoogdieren',
      niveau: 'mogelijk',
      reden: 'Gebruikt zolders, schuren en kruipruimtes als verblijfplaats.',
    })
  }
  if (bomen > 0 || bos > 0) {
    const reden = [
      bos > 0 ? `${Math.round(bos).toLocaleString('nl-NL')} m² bos/bomenrijk terrein` : '',
      bomen > 0 ? `${bomen} geregistreerde boom/bomen (BGT)` : '',
    ]
      .filter(Boolean)
      .join(', ')
    potentie.push({
      soortgroep: 'Vleermuizen (boombewonend)',
      profiel: 'vleermuizen-boom',
      niveau: bos > 2000 ? 'hoog' : 'mogelijk',
      reden: `${reden}; holtes, spleten en loszittende schors.`,
    })
    potentie.push({
      soortgroep: 'Roofvogels en uilen (horsten, jaarrond beschermd)',
      profiel: 'jaarrond-nesten',
      niveau: bos > 5000 ? 'hoog' : 'mogelijk',
      reden: 'Horsten van buizerd, havik, ransuil in (oudere) bomen.',
    })
    potentie.push({
      soortgroep: 'Eekhoorn',
      profiel: 'zoogdieren',
      niveau: 'mogelijk',
      reden: 'Kobels in bomen, vooral bij naald- en gemengd bos.',
    })
  }
  if (water.vlakkenNabij > 0 || water.slotenNabij > 0) {
    const inGebied = water.vlakkenInGebied > 0 || water.slotenMeterInGebied > 0
    potentie.push({
      soortgroep: 'Amfibieën',
      profiel: 'amfibieen',
      niveau: inGebied ? 'hoog' : 'mogelijk',
      reden: inGebied
        ? `Water in het gebied${water.slotenMeterInGebied ? ` (o.a. ${water.slotenMeterInGebied} m sloot/waterloop)` : ''}.`
        : 'Water binnen 100 m; landhabitat (overwintering) kan in het gebied liggen.',
    })
    potentie.push({
      soortgroep: 'Vissen (bijv. grote modderkruiper, bittervoorn)',
      profiel: 'vissen',
      niveau: 'mogelijk',
      reden: 'Sloten en poelen; let op bij dempen of baggeren.',
    })
    potentie.push({
      soortgroep: 'Vleermuizen (vliegroute/foerageergebied)',
      profiel: 'vleermuizen-boom',
      niveau: 'mogelijk',
      reden: 'Watergangen en oevers worden vaak als vliegroute gebruikt.',
    })
  }
  if (open > 0) {
    potentie.push({
      soortgroep: 'Broedvogels van open terrein (weide-/akkervogels)',
      profiel: 'broedvogels',
      niveau: open > 10000 ? 'hoog' : 'mogelijk',
      reden: `${Math.round(open).toLocaleString('nl-NL')} m² grasland/akker.`,
    })
    potentie.push({
      soortgroep: 'Grondgebonden zoogdieren (bijv. das, foerageergebied)',
      profiel: 'zoogdieren',
      niveau: 'mogelijk',
      reden: 'Open terrein grenzend aan bos of houtwallen.',
    })
  }
  if (heideZand > 0) {
    potentie.push({
      soortgroep: 'Reptielen (zandhagedis, levendbarende hagedis)',
      profiel: 'reptielen',
      niveau: 'hoog',
      reden: `${Math.round(heideZand).toLocaleString('nl-NL')} m² heide/zand/braak.`,
    })
    potentie.push({
      soortgroep: 'Rugstreeppad (pioniersituaties)',
      profiel: 'amfibieen',
      niveau: 'mogelijk',
      reden: 'Kale, zandige terreinen met tijdelijke plassen.',
    })
  }
  if (panden.length > 0 || bomen > 0 || bos > 0 || open > 0) {
    potentie.push({
      soortgroep: 'Broedvogels (algemeen)',
      profiel: 'broedvogels',
      niveau: 'mogelijk',
      reden: 'Vrijwel elk terrein met begroeiing of gebouwen kan broedvogels herbergen.',
    })
  }
  return potentie
}
