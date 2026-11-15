import { GBIF } from '../config/bronnen'
import { fetchMetHerhaling } from '../utils/fetchMetHerhaling'

interface VernacularAntwoord {
  results: { vernacularName: string; language?: string; source?: string }[]
}

const CACHE_SLEUTEL = 'quickscan-nederlandse-namen-v1'

/** Eerder opgehaalde namen (blijven bewaard in de browser, scheelt verzoeken). */
function leesCache(): Record<string, string | null> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_SLEUTEL) ?? '{}')
  } catch {
    return {}
  }
}

function schrijfCache(cache: Record<string, string | null>) {
  try {
    localStorage.setItem(CACHE_SLEUTEL, JSON.stringify(cache))
  } catch {
    // Opslag vol of uitgeschakeld: niet erg, dan halen we de namen volgende keer opnieuw op
  }
}

/** Kies de beste Nederlandse naam: bij voorkeur uit het Nederlands Soortenregister. */
function kiesNaam(antwoord: VernacularAntwoord): string | null {
  const nl = antwoord.results.filter((r) => r.language === 'nld')
  const voorkeur =
    nl.find((r) => r.source?.includes('Dutch Species Register')) ??
    nl.find((r) => r.source?.includes('EUNIS')) ??
    nl[0]
  if (!voorkeur) return null
  const naam = voorkeur.vernacularName.trim()
  return naam.charAt(0).toUpperCase() + naam.slice(1)
}

/**
 * Haalt Nederlandse namen op voor een lijst GBIF-soortsleutels.
 * Er is geen GBIF-verzoek voor veel soorten tegelijk, dus we doen één verzoek per soort
 * (4 tegelijk) en melden tussendoor de voortgang, zodat de lijst zich geleidelijk vult.
 */
export async function haalNederlandseNamenOp(
  soortKeys: number[],
  onNamen: (namen: Map<number, string>) => void,
  signal?: AbortSignal,
): Promise<void> {
  const cache = leesCache()
  const namen = new Map<number, string>()
  const teHalen: number[] = []
  for (const k of soortKeys) {
    if (k in cache) {
      const n = cache[k]
      if (n) namen.set(k, n)
    } else teHalen.push(k)
  }
  onNamen(new Map(namen))

  for (let i = 0; i < teHalen.length; i += 4) {
    if (signal?.aborted) return
    await Promise.all(
      teHalen.slice(i, i + 4).map(async (k) => {
        try {
          const r = await fetchMetHerhaling(
            `${GBIF.soortUrl}/${k}/vernacularNames?limit=300`,
            signal,
          )
          if (!r.ok) return // naam blijft leeg; geen ramp
          const naam = kiesNaam((await r.json()) as VernacularAntwoord)
          cache[k] = naam
          if (naam) namen.set(k, naam)
        } catch {
          // netwerkfout bij één naam: overslaan
        }
      }),
    )
    onNamen(new Map(namen))
    schrijfCache(cache) // tussentijds bewaren, ook als de gebruiker halverwege iets anders tekent
  }
}
