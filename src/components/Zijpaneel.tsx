import type { Feature, Polygon } from 'geojson'
import { oppervlakteHectare, formatGetal } from '../utils/geometrie'

interface Props {
  gebied: Feature<Polygon> | null
}

/** Paneel naast de kaart met informatie over het getekende gebied. */
export default function Zijpaneel({ gebied }: Props) {
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
        </section>
      ) : (
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
      )}
    </aside>
  )
}
