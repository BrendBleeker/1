import { useCallback, useState } from 'react'
import type { Feature, Polygon } from 'geojson'
import Kaart from './components/Kaart'
import Zijpaneel from './components/Zijpaneel'
import { useNatura2000 } from './hooks/useNatura2000'

export default function App() {
  // Het getekende onderzoeksgebied (GeoJSON), of null als er nog niets getekend is
  const [gebied, setGebied] = useState<Feature<Polygon> | null>(null)

  // useCallback zorgt dat de kaart deze functie niet steeds opnieuw krijgt
  const bijGebiedGewijzigd = useCallback((nieuw: Feature<Polygon> | null) => {
    setGebied(nieuw)
  }, [])

  // Zoekt automatisch Natura 2000-gebieden binnen 1 km zodra het gebied verandert
  const natura2000 = useNatura2000(gebied)

  return (
    <div className="app">
      <Zijpaneel
        gebied={gebied}
        natura2000={natura2000.status}
        onNatura2000Opnieuw={natura2000.opnieuw}
      />
      <main className="kaart-container">
        <Kaart gebied={gebied} onGebiedGewijzigd={bijGebiedGewijzigd} />
      </main>
    </div>
  )
}
