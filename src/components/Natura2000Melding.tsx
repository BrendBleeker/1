import type { Natura2000Status } from '../hooks/useNatura2000'
import { NATURA2000_ZOEKAFSTAND_M } from '../config/bronnen'
import { formatAfstand } from '../utils/geometrie'

interface Props {
  status: Natura2000Status
  onOpnieuw: () => void
}

const BESCHERMING_UITLEG: Record<string, string> = {
  VR: 'Vogelrichtlijn',
  HR: 'Habitatrichtlijn',
  'VR+HR': 'Vogel- en Habitatrichtlijn',
}

/** Toont of het gebied in of binnen 1 km van een Natura 2000-gebied ligt. */
export default function Natura2000Melding({ status, onOpnieuw }: Props) {
  const afstand = formatAfstand(NATURA2000_ZOEKAFSTAND_M)

  return (
    <section>
      <h2>Natura 2000</h2>

      {status.soort === 'laden' && (
        <p className="melding melding-info" role="status">
          <span className="spinner" aria-hidden /> Natura 2000-gebieden binnen {afstand} zoeken…
        </p>
      )}

      {status.soort === 'fout' && (
        <div className="melding melding-fout" role="alert">
          <strong>Controle mislukt.</strong> {status.melding}
          <br />
          <button type="button" onClick={onOpnieuw}>
            Opnieuw proberen
          </button>
        </div>
      )}

      {status.soort === 'klaar' && status.gebieden.length === 0 && (
        <p className="melding melding-ok">
          Geen Natura 2000-gebied in of binnen {afstand} van het onderzoeksgebied.
          <br />
          <small>
            Let op: stikstofdepositie kan ook op grotere afstand effect hebben (AERIUS-berekening).
          </small>
        </p>
      )}

      {status.soort === 'klaar' && status.gebieden.length > 0 && (
        <div className="melding melding-waarschuwing" role="alert">
          <strong>
            Het gebied ligt in of binnen {afstand} van{' '}
            {status.gebieden.length === 1
              ? 'een Natura 2000-gebied'
              : `${status.gebieden.length} Natura 2000-gebieden`}
            :
          </strong>
          <ul className="n2k-lijst">
            {status.gebieden.map((g) => (
              <li key={g.nummer + g.naam}>
                <strong>{g.naam}</strong> (nr. {g.nummer})
                <br />
                {g.overlapt ? (
                  <span className="label label-rood">Overlapt met het gebied</span>
                ) : (
                  <span className="label label-oranje">op ± {formatAfstand(g.afstandM)}</span>
                )}{' '}
                <small>{BESCHERMING_UITLEG[g.bescherming] ?? g.bescherming}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="voetnoot">
        Natuurnetwerk Nederland (NNN) is alleen als kaartlaag beschikbaar (zet hem aan via het
        lagenmenu rechtsboven). Er bestaat geen openbare landelijke dienst om NNN automatisch te
        controleren; beoordeel dit visueel.
      </p>
    </section>
  )
}
