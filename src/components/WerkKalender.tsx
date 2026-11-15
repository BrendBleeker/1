import { PROFIELEN } from '../utils/profielen'
import type { ProfielReden } from '../utils/relevanteProfielen'
import { MAANDEN_KORT } from '../utils/datum'

const KLASSE = ['werk-gunstig', 'werk-letop', 'werk-kwetsbaar']
const UITLEG = ['relatief gunstig', 'let op', 'kwetsbaar']

/**
 * Ecologische werkkalender: per relevante soortgroep de maanden waarin werkzaamheden
 * (sloop, kap, grondwerk) het meeste of minste risico geven.
 */
export default function WerkKalender({
  profielen,
  compact,
}: {
  profielen: ProfielReden[]
  compact?: boolean
}) {
  if (profielen.length === 0) {
    return (
      <p className="voetnoot">
        Nog geen relevante soortgroepen bekend (wacht op de gegevens of vul de veldchecklist in).
      </p>
    )
  }
  // Totaal: per maand het hoogste risico over alle soortgroepen
  const totaal = MAANDEN_KORT.map((_, i) =>
    Math.max(...profielen.map((p) => PROFIELEN[p.profiel].maanden[i])),
  )
  const gunstig = MAANDEN_KORT.filter((_, i) => totaal[i] === 0)
  const minder = MAANDEN_KORT.filter((_, i) => totaal[i] === 1)

  return (
    <div className="kalender-wrapper">
      <p className={gunstig.length ? 'melding melding-ok' : 'melding melding-waarschuwing'}>
        {gunstig.length ? (
          <>
            Relatief gunstigste maanden voor werkzaamheden: <strong>{gunstig.join(', ')}</strong>.
          </>
        ) : minder.length ? (
          <>
            Geen maand zonder risico. Het minst kwetsbaar: <strong>{minder.join(', ')}</strong>.
          </>
        ) : (
          <>Geen maand zonder risico; werkzaamheden vragen maatwerk en vooronderzoek.</>
        )}
      </p>
      <table className={compact ? 'kalender kalender-compact' : 'kalender'}>
        <thead>
          <tr>
            <th className="kalender-soort">Soortgroep</th>
            {MAANDEN_KORT.map((m) => (
              <th key={m} title={m}>
                {compact ? m.charAt(0).toUpperCase() : m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {profielen.map((p) => {
            const prof = PROFIELEN[p.profiel]
            return (
              <tr key={p.profiel} title={prof.toelichting}>
                <td className="kalender-soort">{prof.naam}</td>
                {prof.maanden.map((w, i) => (
                  <td
                    key={i}
                    className={KLASSE[w]}
                    aria-label={`${MAANDEN_KORT[i]}: ${UITLEG[w]}`}
                  />
                ))}
              </tr>
            )
          })}
          <tr className="kalender-totaal">
            <td className="kalender-soort">
              <strong>Samen</strong>
            </td>
            {totaal.map((w, i) => (
              <td key={i} className={KLASSE[w]} aria-label={`${MAANDEN_KORT[i]}: ${UITLEG[w]}`} />
            ))}
          </tr>
        </tbody>
      </table>
      <p className="voetnoot">
        <span className="legenda-vak werk-kwetsbaar" /> kwetsbaar{' '}
        <span className="legenda-vak werk-letop" /> let op{' '}
        <span className="legenda-vak werk-gunstig" /> relatief gunstig. Indicatief: ook in gunstige
        maanden kan onderzoek of een vergunning nodig zijn.
      </p>
      {!compact && (
        <ul className="kalender-toelichting">
          {profielen.map((p) => (
            <li key={p.profiel}>
              <strong>{PROFIELEN[p.profiel].naam}:</strong> {PROFIELEN[p.profiel].toelichting}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
