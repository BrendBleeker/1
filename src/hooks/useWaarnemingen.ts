import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import { haalWaarnemingenOp, type GbifResultaat } from '../services/gbif'
import { haalNederlandseNamenOp } from '../services/nederlandseNamen'
import { bufferGebied } from '../utils/geometrie'

export type WaarnemingenStatus =
  | { soort: 'leeg' }
  | { soort: 'laden'; geladen: number; totaal: number }
  | { soort: 'fout'; melding: string }
  | { soort: 'klaar'; resultaat: GbifResultaat }

interface Antwoord {
  sleutel: string
  status: WaarnemingenStatus
}

/**
 * Haalt GBIF-waarnemingen op voor het gebied plus de gekozen buffer,
 * en daarna (op de achtergrond) de Nederlandse soortnamen.
 */
export function useWaarnemingen(gebied: Feature<Polygon> | null, bufferM: number) {
  const [antwoord, setAntwoord] = useState<Antwoord | null>(null)
  const [voortgang, setVoortgang] = useState({ sleutel: '', geladen: 0, totaal: 0 })
  const [namen, setNamen] = useState<Map<number, string>>(new Map())
  const [poging, setPoging] = useState(0)

  // Het gebied waarin we zoeken: het getekende gebied plus de buffer
  const zoekgebied = useMemo<Feature<Polygon | MultiPolygon> | null>(() => {
    if (!gebied) return null
    return bufferM > 0 ? bufferGebied(gebied, bufferM) : gebied
  }, [gebied, bufferM])

  // Unieke sleutel per zoekopdracht, zodat oude antwoorden genegeerd worden
  const sleutel = zoekgebied ? `${JSON.stringify(gebied?.geometry)}|${bufferM}|${poging}` : ''

  useEffect(() => {
    if (!zoekgebied) return
    const afbreken = new AbortController()
    const timer = setTimeout(() => afbreken.abort('timeout'), 90_000)

    haalWaarnemingenOp(zoekgebied, afbreken.signal, (geladen, totaal) =>
      setVoortgang({ sleutel, geladen, totaal }),
    )
      .then((resultaat) => {
        setAntwoord({ sleutel, status: { soort: 'klaar', resultaat } })
        // Nederlandse namen ophalen; de lijst vult zich geleidelijk
        return haalNederlandseNamenOp(
          resultaat.soorten.map((s) => s.key),
          setNamen,
          afbreken.signal,
        )
      })
      .catch((fout: unknown) => {
        if (afbreken.signal.aborted && afbreken.signal.reason !== 'timeout') return
        const melding =
          afbreken.signal.reason === 'timeout'
            ? 'GBIF reageert te traag (na 90 seconden gestopt). Probeer een kleiner gebied of later opnieuw.'
            : fout instanceof TypeError
              ? 'Geen verbinding met GBIF. Controleer je internetverbinding.'
              : fout instanceof Error
                ? fout.message
                : 'Onbekende fout bij het ophalen van waarnemingen.'
        setAntwoord({ sleutel, status: { soort: 'fout', melding } })
      })
      .finally(() => clearTimeout(timer))

    return () => {
      clearTimeout(timer)
      afbreken.abort()
    }
  }, [zoekgebied, sleutel])

  let status: WaarnemingenStatus
  if (!zoekgebied) status = { soort: 'leeg' }
  else if (antwoord?.sleutel === sleutel) status = antwoord.status
  else
    status = {
      soort: 'laden',
      geladen: voortgang.sleutel === sleutel ? voortgang.geladen : 0,
      totaal: voortgang.sleutel === sleutel ? voortgang.totaal : 0,
    }

  const opnieuw = useCallback(() => setPoging((p) => p + 1), [])
  return { status, namen, zoekgebied, opnieuw }
}
