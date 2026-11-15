import { LOCATIESERVER } from '../config/bronnen'

export interface Zoeksuggestie {
  id: string
  weergavenaam: string
  type: string
}

export interface Locatie {
  lat: number
  lng: number
  type: string
  weergavenaam: string
}

/** Suggesties terwijl je typt (adressen, straten, postcodes, plaatsen, gemeenten). */
export async function zoekSuggesties(tekst: string, signal?: AbortSignal): Promise<Zoeksuggestie[]> {
  const params = new URLSearchParams({
    q: tekst,
    rows: '7',
    fq: 'type:(gemeente OR woonplaats OR weg OR postcode OR adres)',
  })
  const r = await fetch(`${LOCATIESERVER.suggestUrl}?${params}`, { signal })
  if (!r.ok) throw new Error(`Zoeken mislukt (foutcode ${r.status}).`)
  const data = await r.json()
  return data.response.docs as Zoeksuggestie[]
}

/** Coördinaten van een gekozen suggestie ophalen. */
export async function haalLocatieOp(id: string): Promise<Locatie> {
  const params = new URLSearchParams({ id, fl: 'id,weergavenaam,type,centroide_ll' })
  const r = await fetch(`${LOCATIESERVER.lookupUrl}?${params}`)
  if (!r.ok) throw new Error(`Locatie ophalen mislukt (foutcode ${r.status}).`)
  const doc = (await r.json()).response.docs[0]
  // centroide_ll ziet eruit als "POINT(5.85177 51.98653)"
  const [lng, lat] = String(doc.centroide_ll)
    .replace(/POINT\(|\)/g, '')
    .split(' ')
    .map(Number)
  return { lat, lng, type: doc.type, weergavenaam: doc.weergavenaam }
}

/** Passend zoomniveau per soort resultaat. */
export function zoomVoorType(type: string): number {
  switch (type) {
    case 'gemeente':
      return 12
    case 'woonplaats':
      return 13
    case 'weg':
      return 16
    case 'postcode':
      return 17
    default:
      return 18
  }
}
