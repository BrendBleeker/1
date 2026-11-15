import { GeoJSON } from 'react-leaflet'
import type { Pand } from '../services/habitat'
import { bouwjaarKlasse } from '../utils/bouwjaar'

/** Gebouwen in het plangebied, gekleurd naar bouwjaar. */
export default function PandenLaag({ panden }: { panden: Pand[] }) {
  return (
    <>
      {panden.map((p) => {
        const klasse = bouwjaarKlasse(p.bouwjaar)
        return (
          <GeoJSON
            key={p.id}
            data={p.vorm}
            style={{ color: klasse.kleur, weight: 2, fillColor: klasse.kleur, fillOpacity: 0.45 }}
            onEachFeature={(_, laag) =>
              laag.bindPopup(
                `<strong>Bouwjaar ${p.bouwjaar ?? 'onbekend'}</strong><br>${p.gebruiksdoel || ''}<br><small>${p.status}</small>`,
              )
            }
          />
        )
      })}
    </>
  )
}
