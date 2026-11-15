import { area } from '@turf/turf'
import type { Feature, FeatureCollection, Geometry, Polygon, Position } from 'geojson'
import type { Soort } from '../types'
import { SOORTGROEPEN } from './soortgroepen'

/** Een bestand laten downloaden door de browser. */
export function downloadBestand(naam: string, inhoud: string, type: string) {
  const blob = new Blob([inhoud], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = naam
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Bestandsnaam-vriendelijke tekst. */
export function veiligeNaam(tekst: string): string {
  return (tekst || 'plangebied').replace(/[^a-z0-9-_]+/gi, '_').slice(0, 60)
}

// ---------- Exporteren ----------

export function naarGeoJSON(gebied: Feature<Polygon>, naam: string): string {
  const fc: FeatureCollection = {
    type: 'FeatureCollection',
    features: [{ ...gebied, properties: { ...gebied.properties, naam } }],
  }
  return JSON.stringify(fc, null, 2)
}

export function naarKML(gebied: Feature<Polygon>, naam: string): string {
  const ring = (r: Position[]) => r.map(([x, y]) => `${x},${y},0`).join(' ')
  const [buiten, ...gaten] = gebied.geometry.coordinates
  const escape = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escape(naam)}</name>
    <Style id="plangebied"><LineStyle><color>ff0054d3</color><width>3</width></LineStyle><PolyStyle><color>260054d3</color></PolyStyle></Style>
    <Placemark>
      <name>${escape(naam)}</name>
      <styleUrl>#plangebied</styleUrl>
      <Polygon>
        <outerBoundaryIs><LinearRing><coordinates>${ring(buiten)}</coordinates></LinearRing></outerBoundaryIs>
${gaten.map((g) => `        <innerBoundaryIs><LinearRing><coordinates>${ring(g)}</coordinates></LinearRing></innerBoundaryIs>`).join('\n')}
      </Polygon>
    </Placemark>
  </Document>
</kml>`
}

/** Soortenlijst als CSV (puntkomma's en BOM, zodat Excel het goed opent). */
export function soortenNaarCSV(soorten: Soort[]): string {
  const kop = [
    'Soortgroep',
    'Nederlandse naam',
    'Wetenschappelijke naam',
    'Aantal waarnemingen',
    'Laatste datum',
    'Beschermd (indicatief)',
    'Invasieve exoot (Unielijst)',
    'GBIF soort-ID',
  ]
  const cel = (v: string | number | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rijen = soorten.map((s) =>
    [
      SOORTGROEPEN[s.groep].naam,
      s.nederlandseNaam,
      s.wetenschappelijkeNaam,
      s.aantal,
      s.laatsteDatum,
      s.bescherming?.regime ?? '',
      s.exoot ? 'ja' : '',
      s.key,
    ]
      .map(cel)
      .join(';'),
  )
  return '﻿' + [kop.map(cel).join(';'), ...rijen].join('\r\n')
}

// ---------- Importeren ----------

/** Zoekt in willekeurige GeoJSON de grootste polygoon. */
function grootstePolygoon(geometrieen: Geometry[]): Polygon | null {
  const kandidaten: Polygon[] = []
  for (const g of geometrieen) {
    if (g.type === 'Polygon') kandidaten.push(g)
    else if (g.type === 'MultiPolygon')
      for (const c of g.coordinates) kandidaten.push({ type: 'Polygon', coordinates: c })
    else if (g.type === 'GeometryCollection') {
      const p = grootstePolygoon(g.geometries)
      if (p) kandidaten.push(p)
    }
  }
  if (kandidaten.length === 0) return null
  return kandidaten.reduce((a, b) =>
    area({ type: 'Feature', properties: {}, geometry: a }) >=
    area({ type: 'Feature', properties: {}, geometry: b })
      ? a
      : b,
  )
}

function geometrieenUitGeoJSON(data: unknown): Geometry[] {
  const obj = data as { type?: string; features?: { geometry: Geometry }[]; geometry?: Geometry }
  if (obj.type === 'FeatureCollection') return (obj.features ?? []).map((f) => f.geometry).filter(Boolean)
  if (obj.type === 'Feature' && obj.geometry) return [obj.geometry]
  if (obj.type) return [obj as Geometry]
  return []
}

function geometrieenUitKML(tekst: string): Geometry[] {
  const doc = new DOMParser().parseFromString(tekst, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error('Het KML-bestand kon niet gelezen worden.')
  const leesRing = (el: Element | null): Position[] =>
    (el?.textContent ?? '')
      .trim()
      .split(/\s+/)
      .map((t) => t.split(',').slice(0, 2).map(Number))
      .filter((c) => c.length === 2 && c.every(Number.isFinite))
  return [...doc.getElementsByTagName('Polygon')].map((p) => {
    const buiten = leesRing(p.querySelector('outerBoundaryIs coordinates'))
    const gaten = [...p.querySelectorAll('innerBoundaryIs coordinates')].map(leesRing)
    return { type: 'Polygon', coordinates: [buiten, ...gaten] } as Polygon
  })
}

/**
 * Leest een plangebied uit een GeoJSON- of KML-bestand.
 * Bevat het bestand meerdere vlakken, dan nemen we het grootste.
 * Coördinaten moeten in WGS84 (graden) staan; RD-coördinaten (meters) worden herkend en geweigerd.
 */
export async function leesPlangebied(bestand: File): Promise<{ gebied: Feature<Polygon>; melding?: string }> {
  const tekst = await bestand.text()
  const isKml = bestand.name.toLowerCase().endsWith('.kml') || tekst.trimStart().startsWith('<')
  let geometrieen: Geometry[]
  if (isKml) geometrieen = geometrieenUitKML(tekst)
  else {
    let data: unknown
    try {
      data = JSON.parse(tekst)
    } catch {
      throw new Error('Dit is geen geldig GeoJSON-bestand.')
    }
    geometrieen = geometrieenUitGeoJSON(data)
  }
  const polygoon = grootstePolygoon(geometrieen)
  if (!polygoon) throw new Error('Geen vlak (polygoon) gevonden in het bestand.')
  const [x, y] = polygoon.coordinates[0][0]
  if (Math.abs(x) > 180 || Math.abs(y) > 90) {
    throw new Error(
      'De coördinaten lijken in RD (meters) te staan. Sla het bestand op in WGS84 (EPSG:4326), bijvoorbeeld via QGIS.',
    )
  }
  const aantalVlakken = geometrieen.length
  return {
    gebied: { type: 'Feature', properties: {}, geometry: polygoon },
    melding: aantalVlakken > 1 ? `Het bestand bevat ${aantalVlakken} vlakken; het grootste is gebruikt.` : undefined,
  }
}
