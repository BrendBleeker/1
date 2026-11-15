import { useState, type ReactNode } from 'react'
import type { Feature, Polygon } from 'geojson'
import { formatOppervlakte } from '../utils/geometrie'
import type { Natura2000Status } from '../hooks/useNatura2000'
import type { WaarnemingenStatus } from '../hooks/useWaarnemingen'
import type { Soort } from '../types'
import Natura2000Melding from './Natura2000Melding'
import WaarnemingenPaneel from './WaarnemingenPaneel'
import BeschermdeSoortenPaneel from './BeschermdeSoortenPaneel'
import ZoekBalk from './ZoekBalk'
import GebiedGereedschap from './GebiedGereedschap'
import Legenda from './Legenda'

export type Tabblad = 'overzicht' | 'soorten' | 'planning' | 'veld'

export interface ZijpaneelProps {
  gebied: Feature<Polygon> | null
  herkomst: string | null
  projectnaam: string
  onProjectnaam: (naam: string) => void
  natura2000: Natura2000Status
  onNatura2000Opnieuw: () => void
  waarnemingen: WaarnemingenStatus
  soorten: Soort[]
  bufferM: number
  onBufferWijzig: (m: number) => void
  onWaarnemingenOpnieuw: () => void
  geselecteerdeSoort: number | null
  onSelecteerSoort: (key: number | null) => void
  onRapport: () => void
  onZoekGevonden: (lat: number, lng: number, zoom: number) => void
  perceelModus: boolean
  onPerceelModus: (aan: boolean) => void
  perceelMelding: string | null
  onGeimporteerd: (gebied: Feature<Polygon>, herkomst: string) => void
  /** Extra inhoud per tabblad (wordt in latere onderdelen ingevuld) */
  extra?: Partial<Record<Tabblad, ReactNode>>
  /** Inhoud boven de tabbladen (bijv. projecten) */
  boven?: ReactNode
}

const TABBLADEN: { id: Tabblad; label: string }[] = [
  { id: 'overzicht', label: 'Overzicht' },
  { id: 'soorten', label: 'Soorten' },
  { id: 'planning', label: 'Planning' },
  { id: 'veld', label: 'Veld' },
]

/** Paneel naast de kaart, met tabbladen zodra er een gebied is. */
export default function Zijpaneel(props: ZijpaneelProps) {
  const { gebied } = props
  const [tab, setTab] = useState<Tabblad>('overzicht')

  const gereedschap = (
    <GebiedGereedschap
      gebied={gebied}
      projectnaam={props.projectnaam}
      bufferM={props.bufferM}
      soorten={props.soorten}
      perceelModus={props.perceelModus}
      onPerceelModus={props.onPerceelModus}
      perceelMelding={props.perceelMelding}
      onGeimporteerd={props.onGeimporteerd}
    />
  )

  return (
    <aside className="zijpaneel">
      <h1>Quickscan Kaart</h1>
      <p className="ondertitel">Voorbereiding quickscan flora en fauna</p>
      <ZoekBalk onGevonden={props.onZoekGevonden} />
      {props.boven}

      {!gebied ? (
        <>
          <section className="uitleg">
            <h2>Begin hier</h2>
            <ol>
              <li>Zoek een adres of plaats, of zoom in op de kaart.</li>
              <li>
                Bepaal het plangebied: <strong>teken</strong> het met de knoppen links op de kaart
                (rechthoek of polygoon), <strong>kies een kadastraal perceel</strong> of{' '}
                <strong>laad een bestand</strong> (GeoJSON of KML).
              </li>
              <li>De app zoekt daarna automatisch natuurgebieden, soorten en habitat op.</li>
            </ol>
          </section>
          {gereedschap}
          <Legenda />
        </>
      ) : (
        <>
          <nav className="tabbladen" role="tablist">
            {TABBLADEN.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={tab === t.id ? 'tab actief' : 'tab'}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {tab === 'overzicht' && (
            <>
              <section>
                <h2>Onderzoeksgebied</h2>
                <label className="projectnaam-veld">
                  Projectnaam
                  <input
                    value={props.projectnaam}
                    onChange={(e) => props.onProjectnaam(e.target.value)}
                    placeholder="bijv. Nieuwbouw Dorpsstraat 12"
                  />
                </label>
                <dl className="kerngegevens">
                  <dt>Oppervlakte</dt>
                  <dd>
                    <strong>{formatOppervlakte(gebied)}</strong>
                  </dd>
                  {props.herkomst && (
                    <>
                      <dt>Herkomst</dt>
                      <dd>{props.herkomst}</dd>
                    </>
                  )}
                </dl>
                {gereedschap}
              </section>
              <RapportKnop {...props} />
              <Natura2000Melding status={props.natura2000} onOpnieuw={props.onNatura2000Opnieuw} />
              {props.extra?.overzicht}
              <Legenda />
            </>
          )}

          {tab === 'soorten' && (
            <>
              {props.waarnemingen.soort === 'klaar' && props.waarnemingen.resultaat.totaal > 0 && (
                <BeschermdeSoortenPaneel soorten={props.soorten} />
              )}
              {props.extra?.soorten}
              <WaarnemingenPaneel
                status={props.waarnemingen}
                soorten={props.soorten}
                bufferM={props.bufferM}
                onBufferWijzig={props.onBufferWijzig}
                onOpnieuw={props.onWaarnemingenOpnieuw}
                geselecteerdeSoort={props.geselecteerdeSoort}
                onSelecteerSoort={props.onSelecteerSoort}
              />
            </>
          )}

          {tab === 'planning' &&
            (props.extra?.planning ?? <p className="voetnoot">Nog niet beschikbaar.</p>)}
          {tab === 'veld' &&
            (props.extra?.veld ?? <p className="voetnoot">Nog niet beschikbaar.</p>)}
        </>
      )}
    </aside>
  )
}

/** Knop om het conceptrapport te openen; wacht tot alle gegevens binnen zijn. */
function RapportKnop({ natura2000, waarnemingen, onRapport }: ZijpaneelProps) {
  const bezig = natura2000.soort === 'laden' || waarnemingen.soort === 'laden'
  return (
    <div className="rapport-knop-blok">
      <button type="button" className="knop-primair" disabled={bezig} onClick={onRapport}>
        📄 Conceptrapport maken
      </button>
      {bezig && <small> wacht tot alle gegevens geladen zijn…</small>}
    </div>
  )
}
