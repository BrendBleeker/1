import { PROFIELEN } from '../utils/profielen'
import type { ProfielReden } from '../utils/relevanteProfielen'
import { adviesVoor } from '../utils/conclusie'

interface Props {
  profielen: ProfielReden[]
  conclusie: string
  automatisch: string
  onWijzig: (tekst: string) => void
}

const KLEUR: Record<string, string> = {
  'nader onderzoek aanbevolen': 'label-rood',
  'nader onderzoek mogelijk nodig': 'label-oranje',
  'geen aanwijzingen': 'label-groen',
}

/** Conceptconclusie: advies per soortgroep plus een bewerkbare tekst voor het rapport. */
export default function ConclusiePaneel({ profielen, conclusie, automatisch, onWijzig }: Props) {
  return (
    <section>
      <h2>Conceptconclusie</h2>
      <ul className="potentie-lijst">
        {profielen.map((p) => {
          const advies = adviesVoor(p)
          return (
            <li key={p.profiel}>
              <span className={`label ${KLEUR[advies]}`}>{advies}</span>{' '}
              <strong>{PROFIELEN[p.profiel].naam}</strong>
            </li>
          )
        })}
      </ul>
      <label className="conclusie-veld">
        Tekst voor het rapport (pas gerust aan)
        <textarea
          rows={12}
          value={conclusie || automatisch}
          onChange={(e) => onWijzig(e.target.value)}
        />
      </label>
      {conclusie && (
        <button type="button" className="link-knop" onClick={() => onWijzig('')}>
          Opnieuw automatisch laten opstellen
        </button>
      )}
      <p className="voetnoot">
        Advies op basis van waarnemingen (GBIF), kaartgegevens en je veldchecklist. Een ecoloog
        blijft verantwoordelijk voor de conclusie.
      </p>
    </section>
  )
}
