import { useCallback, useState } from 'react'
import type { Feature, Polygon } from 'geojson'
import Kaart from './components/Kaart'
import Zijpaneel from './components/Zijpaneel'

export default function App() {
  // Het getekende onderzoeksgebied (GeoJSON), of null als er nog niets getekend is
  const [gebied, setGebied] = useState<Feature<Polygon> | null>(null)

  // useCallback zorgt dat de kaart deze functie niet steeds opnieuw krijgt
  const bijGebiedGewijzigd = useCallback((nieuw: Feature<Polygon> | null) => {
    setGebied(nieuw)
  }, [])

  return (
    <div className="app">
      <Zijpaneel gebied={gebied} />
      <main className="kaart-container">
        <Kaart onGebiedGewijzigd={bijGebiedGewijzigd} />
      </main>
    </div>
  )
}
