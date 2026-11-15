import type { Soort } from '../types'
import { BROEDVOGELS_ALGEMEEN } from '../utils/bescherming'
import { MAANDEN_KORT } from '../utils/datum'

interface Props {
  /** Alleen de gevonden beschermde soorten */
  beschermdeSoorten: Soort[]
  /** true als er vogels zijn waargenomen (dan tonen we ook de algemene broedvogelregel) */
  toonBroedvogels: boolean
  /** Smalle weergave (zijpaneel): maanden als één letter, zonder toelichting eronder */
  compact?: boolean
}

/** Tabel met per beschermde soort de maanden waarin onderzoek geschikt is. */
export default function Soortenkalender({ beschermdeSoorten, toonBroedvogels, compact }: Props) {
  const rijen = beschermdeSoorten
    .filter((s) => s.bescherming)
    .map((s) => ({
      key: String(s.key),
      naam: s.nederlandseNaam ?? s.bescherming!.nederlandseNaam,
      wetenschappelijk: s.wetenschappelijkeNaam,
      regime: s.bescherming!.regime,
      maanden: s.bescherming!.onderzoeksmaanden,
      toelichting: s.bescherming!.toelichting,
    }))
  if (toonBroedvogels) {
    rijen.push({
      key: 'broedvogels',
      naam: BROEDVOGELS_ALGEMEEN.naam,
      wetenschappelijk: '',
      regime: 'Vogelrichtlijn',
      maanden: BROEDVOGELS_ALGEMEEN.onderzoeksmaanden,
      toelichting: BROEDVOGELS_ALGEMEEN.toelichting,
    })
  }

  if (rijen.length === 0) {
    return <p className="voetnoot">Geen beschermde soorten van de startlijst gevonden.</p>
  }

  return (
    <div className="kalender-wrapper">
      <table className={compact ? 'kalender kalender-compact' : 'kalender'}>
        <thead>
          <tr>
            <th className="kalender-soort">Soort</th>
            {MAANDEN_KORT.map((m) => (
              <th key={m} title={m}>
                {compact ? m.charAt(0).toUpperCase() : m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rijen.map((r) => (
            <tr key={r.key} title={r.toelichting}>
              <td className="kalender-soort">
                {r.naam}
                <br />
                <small>{r.regime}</small>
              </td>
              {MAANDEN_KORT.map((m, i) => (
                <td
                  key={m}
                  className={r.maanden.includes(i + 1) ? 'kalender-aan' : ''}
                  aria-label={r.maanden.includes(i + 1) ? `${m}: onderzoek geschikt` : undefined}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="kalender-toelichting" hidden={compact}>
        {rijen.map((r) => (
          <li key={r.key}>
            <strong>{r.naam}</strong>
            {r.wetenschappelijk && (
              <>
                {' '}
                (<em>{r.wetenschappelijk}</em>)
              </>
            )}
            : {r.toelichting}
          </li>
        ))}
      </ul>
    </div>
  )
}
