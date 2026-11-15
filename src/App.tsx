import { useCallback, useMemo, useState } from 'react'
import type { Feature, Polygon } from 'geojson'
import Kaart from './components/Kaart'
import Zijpaneel from './components/Zijpaneel'
import Rapport from './components/Rapport'
import { useNatura2000 } from './hooks/useNatura2000'
import { useWaarnemingen } from './hooks/useWaarnemingen'
import { STANDAARD_WAARNEMING_BUFFER_M } from './config/bronnen'
import type { Soort } from './types'
import { zoekBescherming } from './utils/bescherming'

export default function App() {
  // Het getekende onderzoeksgebied (GeoJSON), of null als er nog niets getekend is
  const [gebied, setGebied] = useState<Feature<Polygon> | null>(null)
  // Buffer rond het gebied voor het zoeken naar waarnemingen
  const [bufferM, setBufferM] = useState(STANDAARD_WAARNEMING_BUFFER_M)
  // Soort die in de lijst is aangeklikt (alleen die staat dan op de kaart)
  const [geselecteerdeSoort, setGeselecteerdeSoort] = useState<number | null>(null)
  // Of de rapportpagina openstaat
  const [toonRapport, setToonRapport] = useState(false)

  // useCallback zorgt dat de kaart deze functie niet steeds opnieuw krijgt
  const bijGebiedGewijzigd = useCallback((nieuw: Feature<Polygon> | null) => {
    setGebied(nieuw)
    setGeselecteerdeSoort(null)
  }, [])

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
      <div className="app">
        <Zijpaneel
          gebied={gebied}
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
          />
        </main>
      </div>

      {/* Het rapport ligt als laag over de app, zodat de kaart (met tekening) blijft bestaan */}
      {toonRapport && gebied && (
        <Rapport
          gebied={gebied}
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
