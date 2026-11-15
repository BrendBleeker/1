import { GBIF, UNIELIJST } from '../config/bronnen'
import { fetchMetHerhaling } from '../utils/fetchMetHerhaling'

const CACHE_SLEUTEL = 'quickscan-unielijst-v1'
const CACHE_DAGEN = 30

interface Cache {
  opgehaald: string
  /** GBIF-soortsleutel (backbone) → wetenschappelijke naam */
  soorten: [number, string][]
}

/**
 * Haalt de EU-Unielijst van invasieve exoten op (GBIF-checklist van INBO) en geeft de
 * GBIF-soortsleutels terug, zodat we ze kunnen herkennen in de waarnemingen.
 * De lijst wordt 30 dagen in de browser bewaard.
 */
export async function haalUnielijstOp(): Promise<Map<number, string>> {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_SLEUTEL) ?? 'null') as Cache | null
    if (cache && Date.now() - Date.parse(cache.opgehaald) < CACHE_DAGEN * 86_400_000) {
      return new Map(cache.soorten)
    }
  } catch {
    // geen of kapotte cache: gewoon opnieuw ophalen
  }
  const r = await fetchMetHerhaling(
    `${GBIF.soortUrl}?datasetKey=${UNIELIJST.datasetKey}&limit=1000`,
  )
  if (!r.ok) throw new Error(`Unielijst ophalen mislukt (foutcode ${r.status}).`)
  const data = (await r.json()) as {
    results: { nubKey?: number; canonicalName?: string; rank?: string }[]
  }
  const soorten: [number, string][] = data.results
    .filter((s) => s.nubKey && s.rank === 'SPECIES')
    .map((s) => [s.nubKey!, s.canonicalName ?? ''])
  try {
    localStorage.setItem(
      CACHE_SLEUTEL,
      JSON.stringify({ opgehaald: new Date().toISOString(), soorten } satisfies Cache),
    )
  } catch {
    // opslag niet beschikbaar: niet erg
  }
  return new Map(soorten)
}
