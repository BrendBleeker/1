import type { Feature, Polygon } from 'geojson'
import { oppervlakteHectare, formatGetal } from '../utils/geometrie'
import type { Natura2000Status } from '../hooks/useNatura2000'
import Natura2000Melding from './Natura2000Melding'
import WaarnemingenPaneel from './WaarnemingenPaneel'
import BeschermdeSoortenPaneel from './BeschermdeSoortenPaneel'
import type { WaarnemingenStatus } from '../hooks/useWaarnemingen'
import type { Soort } from '../types'

interface Props {
  gebied: Feature<Polygon> | null
  natura2000: Natura2000Status
  onNatura2000Opnieuw: () => void
  waarnemingen: WaarnemingenStatus
  soorten: Soort[]
  bufferM: number
  onBufferWijzig: (m: number) => void
  onWaarnemingenOpnieuw: () => void
  geselecteerdeSoort: number | null
  onSelecteerSoort: (key: number | null) => void
}

/** Paneel naast de kaart met informatie over het getekende gebied. */
export default function Zijpaneel(props: Props) {
  const { gebied, natura2000, onNatura2000Opnieuw } = props
  return (
    <aside className="zijpaneel">
      <h1>Quickscan Kaart</h1>
      <p className="ondertitel">Voorbereiding quickscan flora en fauna</p>

      {!gebied ? (
        <section className="uitleg">
          <h2>Begin hier</h2>
          <ol>
            <li>Zoom in op je plangebied.</li>
            <li>
              Klik op de kaart links op <strong>Rechthoek tekenen</strong> of{' '}
              <strong>Polygoon tekenen</strong> (de naam verschijnt als je met de muis op een knop
              staat).
            </li>
            <li>Klik de hoekpunten aan en sluit af door op het eerste punt te klikken.</li>
          </ol>
          <p>Met de andere knoppen kun je het gebied bewerken, verslepen of verwijderen.</p>
          <p>
            Rechtsboven op de kaart zit het <strong>lagenmenu</strong>: kies tussen kaart en
            luchtfoto, en zet Natura 2000 of het Natuurnetwerk Nederland aan of uit.
          </p>
        </section>
      ) : (
        <>
          <section>
            <h2>Onderzoeksgebied</h2>
            <dl className="kerngegevens">
              <dt>Oppervlakte</dt>
              <dd>
                <strong>{formatGetal(oppervlakteHectare(gebied))} ha</strong>
              </dd>
              <dt>Aantal hoekpunten</dt>
              <dd>{gebied.geometry.coordinates[0].length - 1}</dd>
            </dl>
          </section>
          <Natura2000Melding status={natura2000} onOpnieuw={onNatura2000Opnieuw} />
          {props.waarnemingen.soort === 'klaar' && props.waarnemingen.resultaat.totaal > 0 && (
            <BeschermdeSoortenPaneel soorten={props.soorten} />
          )}
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

      <section>
        <h2>Legenda</h2>
        <ul className="legenda">
          <li>
            <span className="legenda-vak legenda-gebied" /> Onderzoeksgebied
          </li>
          <li>
            <span className="legenda-vak legenda-zone" /> Zone van 1 km
          </li>
          <li>
            <span className="legenda-vak legenda-zoek" /> Zoekgebied waarnemingen
          </li>
          <li>
            <span className="legenda-vak legenda-n2k" /> Natura 2000
          </li>
          <li>
            <span className="legenda-vak legenda-nnn" /> Natuurnetwerk Nederland (NNN)
          </li>
          <li>
            <span className="legenda-stip" style={{ background: '#c0392b' }} /> Beschermde soort
          </li>
          <li>
            <span className="legenda-stip" style={{ background: '#2f80c1' }} /> Overige waarneming
            (kleur per soortgroep)
          </li>
        </ul>
      </section>
    </aside>
  )
}
