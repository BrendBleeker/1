import { useCallback, useEffect, useState } from 'react'
import type { Feature, Polygon } from 'geojson'
import { analyseerHabitat, type HabitatResultaat } from '../services/habitat'

export type HabitatStatus =
  | { soort: 'leeg' }
  | { soort: 'laden' }
  | { soort: 'fout'; melding: string }
  | { soort: 'klaar'; resultaat: HabitatResultaat }

/** Voert de habitatcheck uit zodra het gebied verandert. */
export function useHabitat(gebied: Feature<Polygon> | null) {
  const [antwoord, setAntwoord] = useState<{
    gebied: Feature<Polygon>
    poging: number
    status: HabitatStatus
  } | null>(null)
  const [poging, setPoging] = useState(0)

  useEffect(() => {
    if (!gebied) return
    const afbreken = new AbortController()
    const klaar = (status: HabitatStatus) => setAntwoord({ gebied, poging, status })
    analyseerHabitat(gebied, afbreken.signal)
      .then((resultaat) => klaar({ soort: 'klaar', resultaat }))
      .catch((fout: unknown) => {
        if (afbreken.signal.aborted) return
        klaar({
          soort: 'fout',
          melding:
            fout instanceof TypeError
              ? 'Geen verbinding met PDOK. Controleer je internetverbinding.'
              : fout instanceof Error
                ? fout.message
                : 'Onbekende fout bij de habitatcheck.',
        })
      })
    return () => afbreken.abort()
  }, [gebied, poging])

  let status: HabitatStatus
  if (!gebied) status = { soort: 'leeg' }
  else if (antwoord?.gebied === gebied && antwoord.poging === poging) status = antwoord.status
  else status = { soort: 'laden' }

  const opnieuw = useCallback(() => setPoging((p) => p + 1), [])
  return { status, opnieuw }
}
