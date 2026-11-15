import { useCallback, useEffect, useState } from 'react'
import type { Feature, Polygon } from 'geojson'
import { zoekNatura2000Nabij, type NabijNatura2000 } from '../services/natura2000'
import { NATURA2000_ZOEKAFSTAND_M } from '../config/bronnen'

/** De vier mogelijke toestanden van de Natura 2000-controle. */
export type Natura2000Status =
  | { soort: 'leeg' } // nog geen gebied getekend
  | { soort: 'laden' }
  | { soort: 'fout'; melding: string }
  | { soort: 'klaar'; gebieden: NabijNatura2000[]; opgehaaldOp: Date }

/** Een afgerond antwoord, samen met het gebied en de poging waar het bij hoort. */
interface Antwoord {
  gebied: Feature<Polygon>
  poging: number
  status: Natura2000Status
}

/**
 * Zoekt automatisch Natura 2000-gebieden zodra het getekende gebied verandert.
 * Een oude, nog lopende zoekopdracht wordt afgebroken als het gebied opnieuw verandert.
 */
export function useNatura2000(gebied: Feature<Polygon> | null) {
  const [antwoord, setAntwoord] = useState<Antwoord | null>(null)
  const [poging, setPoging] = useState(0) // verhogen = opnieuw proberen

  useEffect(() => {
    if (!gebied) return
    const afbreken = new AbortController()
    // Na 30 seconden opgeven, zodat de gebruiker niet eindeloos wacht
    const timer = setTimeout(() => afbreken.abort('timeout'), 30_000)
    const klaar = (status: Natura2000Status) => setAntwoord({ gebied, poging, status })

    zoekNatura2000Nabij(gebied, NATURA2000_ZOEKAFSTAND_M, afbreken.signal)
      .then((gebieden) => klaar({ soort: 'klaar', gebieden, opgehaaldOp: new Date() }))
      .catch((fout: unknown) => {
        if (afbreken.signal.aborted && afbreken.signal.reason !== 'timeout') return
        const melding =
          afbreken.signal.reason === 'timeout'
            ? 'De Natura 2000-dienst reageert niet (na 30 seconden). Probeer het later opnieuw.'
            : fout instanceof TypeError
              ? 'Geen verbinding met de Natura 2000-dienst van PDOK. Controleer je internetverbinding.'
              : fout instanceof Error
                ? fout.message
                : 'Onbekende fout bij het ophalen van Natura 2000-gebieden.'
        klaar({ soort: 'fout', melding })
      })
      .finally(() => clearTimeout(timer))

    return () => {
      clearTimeout(timer)
      afbreken.abort()
    }
  }, [gebied, poging])

  // De status volgt uit wat er nu getekend is en welk antwoord er al binnen is
  let status: Natura2000Status
  if (!gebied) status = { soort: 'leeg' }
  else if (antwoord?.gebied === gebied && antwoord.poging === poging) status = antwoord.status
  else status = { soort: 'laden' }

  const opnieuw = useCallback(() => setPoging((p) => p + 1), [])
  return { status, opnieuw }
}
