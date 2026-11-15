import { CircleMarker, LayerGroup, Popup } from 'react-leaflet'
import type { Soort, Waarneming } from '../types'
import { SOORTGROEPEN } from '../utils/soortgroepen'
import { formatDatum } from '../utils/datum'

interface Props {
  waarnemingen: Waarneming[]
  /** Soortinformatie per GBIF-soortsleutel (voor kleur, naam en bescherming) */
  soorten: Map<number, Soort>
  /** Als ingevuld: alleen waarnemingen van deze soort tonen */
  geselecteerdeSoort: number | null
}

/** De GBIF-waarnemingen als stippen op de kaart. Beschermde soorten zijn rood en groter. */
export default function WaarnemingenLaag({ waarnemingen, soorten, geselecteerdeSoort }: Props) {
  const zichtbaar = geselecteerdeSoort
    ? waarnemingen.filter((w) => w.soortKey === geselecteerdeSoort)
    : waarnemingen

  // Beschermde soorten als laatste tekenen, zodat ze bovenop liggen
  const gesorteerd = [...zichtbaar].sort(
    (a, b) =>
      Number(!!soorten.get(a.soortKey)?.bescherming) -
      Number(!!soorten.get(b.soortKey)?.bescherming),
  )

  return (
    <LayerGroup>
      {gesorteerd.map((w) => {
        const soort = soorten.get(w.soortKey)
        const beschermd = !!soort?.bescherming
        const exoot = !!soort?.exoot
        const kleur = beschermd
          ? '#c0392b'
          : exoot
            ? '#8e44ad'
            : SOORTGROEPEN[soort?.groep ?? 'overig'].kleur
        return (
          <CircleMarker
            key={w.key}
            center={[w.lat, w.lng]}
            radius={beschermd || exoot ? 7 : 4}
            pathOptions={{
              color: beschermd || exoot ? '#ffffff' : kleur,
              weight: beschermd || exoot ? 2 : 1,
              fillColor: kleur,
              fillOpacity: beschermd || exoot ? 0.95 : 0.7,
            }}
          >
            <Popup>
              <strong>{soort?.nederlandseNaam ?? w.wetenschappelijkeNaam}</strong>
              <br />
              <em>{w.wetenschappelijkeNaam}</em>
              <br />
              {formatDatum(w.datum)}
              {beschermd && (
                <>
                  <br />
                  <span className="label label-beschermd">{soort?.bescherming?.regime}</span>
                </>
              )}
              {exoot && (
                <>
                  <br />
                  <span className="label label-exoot">Invasieve exoot (Unielijst)</span>
                </>
              )}
              <br />
              <small>Bron: {w.bron}</small>
            </Popup>
          </CircleMarker>
        )
      })}
    </LayerGroup>
  )
}
