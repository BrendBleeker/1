import { useRef, useState } from 'react'
import type { Feature, Polygon } from 'geojson'
import type { Soort } from '../types'
import {
  downloadBestand,
  leesPlangebied,
  naarGeoJSON,
  naarKML,
  soortenNaarCSV,
  veiligeNaam,
} from '../utils/bestanden'
import { maakDeellink } from '../utils/deellink'

interface Props {
  gebied: Feature<Polygon> | null
  projectnaam: string
  bufferM: number
  soorten: Soort[]
  perceelModus: boolean
  onPerceelModus: (aan: boolean) => void
  onGeimporteerd: (gebied: Feature<Polygon>, herkomst: string) => void
  /** Melding van het kiezen van een perceel (bijv. 'geen perceel gevonden') */
  perceelMelding: string | null
}

/** Knoppen om een plangebied te kiezen, in te laden, op te slaan en te delen. */
export default function GebiedGereedschap(props: Props) {
  const { gebied, projectnaam, soorten } = props
  const bestandInvoer = useRef<HTMLInputElement>(null)
  const [melding, setMelding] = useState<{ soort: 'ok' | 'fout'; tekst: string } | null>(null)
  const naam = veiligeNaam(projectnaam)

  const importeer = async (bestand: File | undefined) => {
    if (!bestand) return
    try {
      const { gebied: nieuw, melding: extra } = await leesPlangebied(bestand)
      props.onGeimporteerd(nieuw, `Ingeladen uit bestand ${bestand.name}`)
      setMelding({ soort: 'ok', tekst: `Plangebied ingeladen uit ${bestand.name}. ${extra ?? ''}` })
    } catch (e) {
      setMelding({ soort: 'fout', tekst: e instanceof Error ? e.message : 'Inladen mislukt.' })
    }
    if (bestandInvoer.current) bestandInvoer.current.value = ''
  }

  const deel = async () => {
    if (!gebied) return
    const link = maakDeellink(gebied, props.bufferM)
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Quickscan Kaart – plangebied', url: link })
        return
      }
      await navigator.clipboard.writeText(link)
      setMelding({ soort: 'ok', tekst: 'Link gekopieerd. Plak hem in een mail of chat.' })
    } catch {
      // Delen geannuleerd of klembord geblokkeerd: link tonen om zelf te kopiëren
      setMelding({ soort: 'ok', tekst: `Kopieer deze link: ${link}` })
    }
  }

  return (
    <div className="gebied-gereedschap">
      <div className="knoppenrij">
        <button
          type="button"
          className={props.perceelModus ? 'knop actief' : 'knop'}
          onClick={() => props.onPerceelModus(!props.perceelModus)}
          aria-pressed={props.perceelModus}
        >
          🧩 {props.perceelModus ? 'Klik op een perceel…' : 'Perceel kiezen'}
        </button>
        <button type="button" className="knop" onClick={() => bestandInvoer.current?.click()}>
          📂 Bestand inladen
        </button>
        <input
          ref={bestandInvoer}
          type="file"
          accept=".geojson,.json,.kml,application/geo+json,application/vnd.google-earth.kml+xml"
          hidden
          onChange={(e) => importeer(e.target.files?.[0])}
        />
      </div>
      {props.perceelModus && (
        <p className="voetnoot">
          Klik of tik op de kaart op het perceel dat je wilt onderzoeken. Zoom ver genoeg in.
        </p>
      )}
      {props.perceelMelding && <p className="melding melding-info">{props.perceelMelding}</p>}

      {gebied && (
        <div className="knoppenrij">
          <button
            type="button"
            className="knop"
            onClick={() =>
              downloadBestand(`${naam}.geojson`, naarGeoJSON(gebied, projectnaam), 'application/geo+json')
            }
            title="Voor QGIS of QField"
          >
            ⬇ GeoJSON
          </button>
          <button
            type="button"
            className="knop"
            onClick={() =>
              downloadBestand(
                `${naam}.kml`,
                naarKML(gebied, projectnaam || 'Plangebied'),
                'application/vnd.google-earth.kml+xml',
              )
            }
            title="Voor Google Earth of Avenza Maps"
          >
            ⬇ KML
          </button>
          <button
            type="button"
            className="knop"
            disabled={soorten.length === 0}
            onClick={() => downloadBestand(`${naam}_soorten.csv`, soortenNaarCSV(soorten), 'text/csv')}
            title="Soortenlijst voor Excel"
          >
            ⬇ Soorten (CSV)
          </button>
          <button type="button" className="knop" onClick={deel}>
            🔗 Delen
          </button>
        </div>
      )}
      {melding && (
        <p className={`melding ${melding.soort === 'ok' ? 'melding-ok' : 'melding-fout'} breek`}>
          {melding.tekst}
        </p>
      )}
    </div>
  )
}
