import { useEffect, useRef, useState } from 'react'
import {
  haalLocatieOp,
  zoekSuggesties,
  zoomVoorType,
  type Zoeksuggestie,
} from '../services/locatieserver'

interface Props {
  onGevonden: (lat: number, lng: number, zoom: number) => void
}

/** Zoeken op adres, straat, postcode of plaats (PDOK Locatieserver). */
export default function ZoekBalk({ onGevonden }: Props) {
  const [tekst, setTekst] = useState('')
  const [suggesties, setSuggesties] = useState<Zoeksuggestie[]>([])
  const [fout, setFout] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  // Na het kiezen van een suggestie niet opnieuw gaan zoeken op de ingevulde naam
  const netGekozen = useRef(false)

  // Suggesties ophalen 300 ms nadat je stopt met typen
  useEffect(() => {
    if (tekst.trim().length < 3) return
    if (netGekozen.current) {
      netGekozen.current = false
      return
    }
    const afbreken = new AbortController()
    const timer = setTimeout(() => {
      zoekSuggesties(tekst, afbreken.signal)
        .then((s) => {
          setSuggesties(s)
          setFout(null)
          setOpen(true)
        })
        .catch((e: unknown) => {
          if (!afbreken.signal.aborted) setFout(e instanceof Error ? e.message : 'Zoeken mislukt.')
        })
    }, 300)
    return () => {
      clearTimeout(timer)
      afbreken.abort()
    }
  }, [tekst])

  const kies = async (s: Zoeksuggestie) => {
    netGekozen.current = true
    setTekst(s.weergavenaam)
    setOpen(false)
    try {
      const loc = await haalLocatieOp(s.id)
      onGevonden(loc.lat, loc.lng, zoomVoorType(loc.type))
    } catch (e) {
      setFout(e instanceof Error ? e.message : 'Locatie ophalen mislukt.')
    }
  }

  return (
    <div className="zoekbalk" role="search">
      <input
        type="search"
        value={tekst}
        onChange={(e) => {
          setTekst(e.target.value)
          if (e.target.value.trim().length < 3) setOpen(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && suggesties[0]) kies(suggesties[0])
          if (e.key === 'Escape') setOpen(false)
        }}
        onFocus={() => suggesties.length > 0 && setOpen(true)}
        placeholder="🔍 Zoek adres, straat, postcode of plaats"
        aria-label="Zoek een locatie"
      />
      {open && suggesties.length > 0 && (
        <ul className="zoek-suggesties">
          {suggesties.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => kies(s)}>
                {s.weergavenaam} <small>{s.type}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && suggesties.length === 0 && tekst.trim().length >= 3 && !fout && (
        <p className="voetnoot">Niets gevonden.</p>
      )}
      {fout && <p className="melding melding-fout">{fout}</p>}
    </div>
  )
}
