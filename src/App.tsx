import { useCallback, useMemo, useState } from 'react'
import type { Feature, Polygon } from 'geojson'
import Kaart from './components/Kaart'
import Zijpaneel from './components/Zijpaneel'
import Rapport from './components/Rapport'
import type { ExternGebied, GebiedBron } from './components/TekenGereedschap'
import type { VliegNaar } from './components/KaartActies'
import { useNatura2000 } from './hooks/useNatura2000'
import { useWaarnemingen } from './hooks/useWaarnemingen'
import { STANDAARD_WAARNEMING_BUFFER_M } from './config/bronnen'
import type { Soort } from './types'
import { zoekBescherming } from './utils/bescherming'
import { leesDeellink } from './utils/deellink'
import { zoekPerceelOpPunt } from './services/kadaster'

// Een plangebied uit een gedeelde link (eenmalig bij het openen van de app)
const uitLink = leesDeellink()

export default function App() {
  // Het onderzoeksgebied (GeoJSON), of null als er nog niets getekend is
  const [gebied, setGebied] = useState<Feature<Polygon> | null>(null)
  // Waar het gebied vandaan komt (perceel, bestand, link …), voor in het rapport
  const [herkomst, setHerkomst] = useState<string | null>(uitLink ? 'Gedeelde link' : null)
  const [projectnaam, setProjectnaam] = useState('')
  // Gebied dat van buitenaf op de kaart gezet moet worden
  const [extern, setExtern] = useState<ExternGebied | null>(
    uitLink ? { gebied: uitLink.gebied, versie: 1 } : null,
  )
  const [vliegNaar, setVliegNaar] = useState<VliegNaar | null>(null)
  // Buffer rond het gebied voor het zoeken naar waarnemingen
  const [bufferM, setBufferM] = useState(uitLink?.bufferM ?? STANDAARD_WAARNEMING_BUFFER_M)
  // Soort die in de lijst is aangeklikt (alleen die staat dan op de kaart)
  const [geselecteerdeSoort, setGeselecteerdeSoort] = useState<number | null>(null)
  const [toonRapport, setToonRapport] = useState(false)
  // Alleen op de telefoon: kaart ingeklapt, zodat er meer ruimte is voor de gegevens
  const [kaartIngeklapt, setKaartIngeklapt] = useState(false)
  // Perceel kiezen door op de kaart te klikken
  const [perceelModus, setPerceelModus] = useState(false)
  const [perceelMelding, setPerceelMelding] = useState<string | null>(null)

  const bijGebiedGewijzigd = useCallback((nieuw: Feature<Polygon> | null, bron: GebiedBron) => {
    setGebied(nieuw)
    setGeselecteerdeSoort(null)
    if (bron === 'getekend' || bron === 'verwijderd') setHerkomst(null)
    if (bron === 'bewerkt')
      setHerkomst((h) => (h && !h.endsWith('(aangepast)') ? `${h} (aangepast)` : h))
  }, [])

  /** Een gebied van buitenaf op de kaart zetten. */
  const plaatsGebied = useCallback((nieuw: Feature<Polygon>, nieuweHerkomst: string | null) => {
    setExtern((e) => ({ gebied: nieuw, versie: (e?.versie ?? 0) + 1 }))
    setHerkomst(nieuweHerkomst)
  }, [])

  // Klik op de kaart in perceelmodus: perceel opzoeken en als gebied gebruiken
  const bijKaartKlik = useCallback(
    async (lat: number, lng: number) => {
      setPerceelMelding('Perceel zoeken…')
      try {
        const resultaat = await zoekPerceelOpPunt(lat, lng)
        if (!resultaat) {
          setPerceelMelding('Geen perceel gevonden op deze plek. Zoom verder in en probeer opnieuw.')
          return
        }
        plaatsGebied(resultaat.gebied, `Kadastraal perceel ${resultaat.info.aanduiding}`)
        setPerceelMelding(null)
        setPerceelModus(false)
      } catch (e) {
        setPerceelMelding(e instanceof Error ? e.message : 'Perceel ophalen mislukt.')
      }
    },
    [plaatsGebied],
  )

  // Zoekt automatisch Natura 2000-gebieden binnen 1 km zodra het gebied verandert
  const natura2000 = useNatura2000(gebied)
  // Haalt automatisch GBIF-waarnemingen op voor gebied + buffer
  const waarnemingen = useWaarnemingen(gebied, bufferM)

  // Soortenlijst aangevuld met Nederlandse namen en bescherming (indicatieve startlijst)
  const soorten = useMemo<Soort[]>(() => {
    if (waarnemingen.status.soort !== 'klaar') return []
    return waarnemingen.status.resultaat.soorten.map((s) => {
      const bescherming = zoekBescherming(s.wetenschappelijkeNaam)
      return {
        ...s,
        nederlandseNaam: waarnemingen.namen.get(s.key) ?? bescherming?.nederlandseNaam,
        bescherming,
      }
    })
  }, [waarnemingen.status, waarnemingen.namen])

  const soortenPerKey = useMemo(() => new Map(soorten.map((s) => [s.key, s])), [soorten])

  return (
    <>
      <div
        className={
          'app' +
          (gebied ? ' met-gebied' : ' zonder-gebied') +
          (kaartIngeklapt ? ' kaart-ingeklapt' : '')
        }
      >
        <Zijpaneel
          gebied={gebied}
          herkomst={herkomst}
          projectnaam={projectnaam}
          onProjectnaam={setProjectnaam}
          natura2000={natura2000.status}
          onNatura2000Opnieuw={natura2000.opnieuw}
          waarnemingen={waarnemingen.status}
          soorten={soorten}
          bufferM={bufferM}
          onBufferWijzig={setBufferM}
          onWaarnemingenOpnieuw={waarnemingen.opnieuw}
          geselecteerdeSoort={geselecteerdeSoort}
          onSelecteerSoort={setGeselecteerdeSoort}
          onRapport={() => setToonRapport(true)}
          onZoekGevonden={(lat, lng, zoom) => {
            setVliegNaar((v) => ({ lat, lng, zoom, versie: (v?.versie ?? 0) + 1 }))
            setKaartIngeklapt(false)
          }}
          perceelModus={perceelModus}
          onPerceelModus={(aan) => {
            setPerceelModus(aan)
            setPerceelMelding(null)
            if (aan) setKaartIngeklapt(false)
          }}
          perceelMelding={perceelMelding}
          onGeimporteerd={plaatsGebied}
        />
        <main className="kaart-container">
          <Kaart
            gebied={gebied}
            onGebiedGewijzigd={bijGebiedGewijzigd}
            zoekgebied={bufferM > 0 ? waarnemingen.zoekgebied : null}
            waarnemingen={
              waarnemingen.status.soort === 'klaar'
                ? waarnemingen.status.resultaat.waarnemingen
                : []
            }
            soorten={soortenPerKey}
            geselecteerdeSoort={geselecteerdeSoort}
            grootteSleutel={`${!!gebied}-${kaartIngeklapt}`}
            extern={extern}
            vliegNaar={vliegNaar}
            onKaartKlik={perceelModus ? bijKaartKlik : null}
          />
        </main>
        {/* Alleen zichtbaar op de telefoon (zie index.css) */}
        <button
          type="button"
          className="kaart-schakelaar"
          onClick={() => setKaartIngeklapt((k) => !k)}
          aria-expanded={!kaartIngeklapt}
        >
          {kaartIngeklapt ? '▼ Kaart tonen' : '▲ Kaart verbergen'}
        </button>
      </div>

      {/* Het rapport ligt als laag over de app, zodat de kaart (met tekening) blijft bestaan */}
      {toonRapport && gebied && (
        <Rapport
          gebied={gebied}
          herkomst={herkomst}
          projectnaam={projectnaam}
          onProjectnaam={setProjectnaam}
          bufferM={bufferM}
          zoekgebied={bufferM > 0 ? waarnemingen.zoekgebied : null}
          natura2000={natura2000.status}
          waarnemingen={waarnemingen.status}
          soorten={soorten}
          onSluiten={() => setToonRapport(false)}
        />
      )}
    </>
  )
}
