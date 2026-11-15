import type { Soort } from '../types'
import { formatDatum } from '../utils/datum'

/** Gevonden invasieve exoten van de EU-Unielijst. */
export default function ExotenPaneel({ soorten, fout }: { soorten: Soort[]; fout: string | null }) {
  const exoten = soorten.filter((s) => s.exoot).sort((a, b) => b.aantal - a.aantal)
  return (
    <section>
      <h2>Invasieve exoten</h2>
      {fout && <p className="melding melding-fout">Unielijst niet geladen: {fout}</p>}
      {exoten.length === 0 ? (
        <p>Geen soorten van de EU-Unielijst waargenomen in het zoekgebied.</p>
      ) : (
        <>
          <ul className="beschermd-lijst">
            {exoten.map((s) => (
              <li key={s.key}>
                <span className="label label-exoot">Unielijst</span>{' '}
                <strong>{s.nederlandseNaam ?? s.wetenschappelijkeNaam}</strong>{' '}
                <em className="wetenschappelijk">{s.wetenschappelijkeNaam}</em>
                <br />
                <small>
                  {s.aantal}× waargenomen, laatst {formatDatum(s.laatsteDatum)}
                </small>
              </li>
            ))}
          </ul>
          <p className="melding melding-indicatief">
            Voor soorten van de Unielijst gelden verboden op o.a. bezit, vervoer, kweek en
            verspreiding; de grondeigenaar heeft een zorgplicht. Let op bij grondverzet en afvoer
            van grond of maaisel (verspreidingsrisico, bijv. bij duizendknopen).
          </p>
        </>
      )}
    </section>
  )
}
