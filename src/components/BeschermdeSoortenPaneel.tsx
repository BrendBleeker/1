import type { Soort } from '../types'
import Soortenkalender from './Soortenkalender'
import { formatDatum } from '../utils/datum'
import { LIJST_VERSIE } from '../utils/bescherming'

interface Props {
  soorten: Soort[]
}

/** Overzicht van de gevonden beschermde soorten met de soortenkalender. */
export default function BeschermdeSoortenPaneel({ soorten }: Props) {
  const beschermd = soorten.filter((s) => s.bescherming).sort((a, b) => b.aantal - a.aantal)
  const vogelsGezien = soorten.some((s) => s.groep === 'vogels')

  return (
    <section>
      <h2>Beschermde soorten</h2>
      <p className="melding melding-indicatief">
        <strong>Indicatief.</strong> De markering &lsquo;beschermd&rsquo; en de
        onderzoeksperiodes komen uit een kleine startlijst (versie {LIJST_VERSIE}). Deze lijst is
        niet volledig en moet door een ecoloog gecontroleerd worden.
      </p>

      {beschermd.length > 0 ? (
        <ul className="beschermd-lijst">
          {beschermd.map((s) => (
            <li key={s.key}>
              <span className="label label-beschermd">{s.bescherming!.regime}</span>{' '}
              <strong>{s.nederlandseNaam ?? s.bescherming!.nederlandseNaam}</strong>{' '}
              <em className="wetenschappelijk">{s.wetenschappelijkeNaam}</em>
              <br />
              <small>
                {s.aantal}× waargenomen, laatst {formatDatum(s.laatsteDatum)}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p>Geen soorten van de startlijst waargenomen in het zoekgebied.</p>
      )}

      <h3>Soortenkalender</h3>
      <p className="voetnoot">
        Gekleurde maanden: periode waarin onderzoek naar de soort geschikt is (indicatief). Ga
        met de muis op een rij staan voor een toelichting; het rapport bevat alle toelichtingen.
      </p>
      <Soortenkalender
        beschermdeSoorten={beschermd}
        toonBroedvogels={vogelsGezien}
        compact
        metToelichting={false}
      />
    </section>
  )
}
