import { useState } from 'react'
import type { Soort, Soortgroep } from '../types'
import { GROEP_VOLGORDE, SOORTGROEPEN } from '../utils/soortgroepen'
import { formatDatum } from '../utils/datum'
import { sorteerBeschermdEerst } from '../utils/bescherming'

interface Props {
  soorten: Soort[]
  geselecteerdeSoort: number | null
  onSelecteer: (key: number | null) => void
}

/** Tekst vergelijkbaar maken: kleine letters, zonder accenten (ë → e). */
function normaliseer(tekst: string): string {
  return tekst
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/** Past de soort bij de zoekterm? Alle woorden moeten voorkomen in de Nederlandse of Latijnse naam. */
function pastBijZoekterm(s: Soort, zoekterm: string): boolean {
  const woorden = normaliseer(zoekterm).split(/\s+/).filter(Boolean)
  if (woorden.length === 0) return true
  const namen = normaliseer(`${s.nederlandseNaam ?? ''} ${s.wetenschappelijkeNaam}`)
  return woorden.every((w) => namen.includes(w))
}

/** De lijst met waargenomen soorten, optioneel gegroepeerd per soortgroep. */
export default function Soortenlijst({ soorten, geselecteerdeSoort, onSelecteer }: Props) {
  const [groeperen, setGroeperen] = useState(true)
  const [alleenBeschermd, setAlleenBeschermd] = useState(false)
  const [filterGroep, setFilterGroep] = useState<Soortgroep | 'alle'>('alle')
  const [zoekterm, setZoekterm] = useState('')

  const zichtbaar = soorten
    .filter((s) => !alleenBeschermd || s.bescherming)
    .filter((s) => filterGroep === 'alle' || s.groep === filterGroep)
    .filter((s) => pastBijZoekterm(s, zoekterm))
    .sort(sorteerBeschermdEerst) // beschermde soorten bovenaan

  const aantalPerGroep = (g: Soortgroep) => soorten.filter((s) => s.groep === g).length

  return (
    <div className="soortenlijst">
      <input
        type="search"
        className="soorten-zoek"
        value={zoekterm}
        onChange={(e) => setZoekterm(e.target.value)}
        placeholder="🔍 Zoek soort (Nederlandse of Latijnse naam)"
        aria-label="Zoek een soort op Nederlandse of Latijnse naam"
      />
      {zoekterm.trim() && (
        <p className="voetnoot zoek-resultaat">
          {`${zichtbaar.length} van ${soorten.length} soorten gevonden.`}{' '}
          <button type="button" className="link-knop" onClick={() => setZoekterm('')}>
            wissen
          </button>
        </p>
      )}
      <div className="lijst-opties">
        <label>
          <input
            type="checkbox"
            checked={groeperen}
            onChange={(e) => setGroeperen(e.target.checked)}
          />{' '}
          Groeperen per soortgroep
        </label>
        <label>
          <input
            type="checkbox"
            checked={alleenBeschermd}
            onChange={(e) => setAlleenBeschermd(e.target.checked)}
          />{' '}
          Alleen beschermde soorten
        </label>
        <label>
          Soortgroep:{' '}
          <select
            value={filterGroep}
            onChange={(e) => setFilterGroep(e.target.value as Soortgroep | 'alle')}
          >
            <option value="alle">Alle ({soorten.length})</option>
            {GROEP_VOLGORDE.filter(aantalPerGroep).map((g) => (
              <option key={g} value={g}>
                {SOORTGROEPEN[g].naam} ({aantalPerGroep(g)})
              </option>
            ))}
          </select>
        </label>
      </div>

      {geselecteerdeSoort && (
        <p className="selectie-melding">
          Alleen de geselecteerde soort staat op de kaart.{' '}
          <button type="button" className="link-knop" onClick={() => onSelecteer(null)}>
            Alle soorten tonen
          </button>
        </p>
      )}

      {zichtbaar.length === 0 && (
        <p className="voetnoot">
          {zoekterm.trim()
            ? `Geen soort gevonden voor "${zoekterm.trim()}". Let op: Nederlandse namen verschijnen pas als ze geladen zijn.`
            : 'Geen soorten met deze filters.'}
        </p>
      )}

      {groeperen ? (
        GROEP_VOLGORDE.map((g) => {
          const inGroep = zichtbaar.filter((s) => s.groep === g)
          if (inGroep.length === 0) return null
          return (
            <details key={g} open className="soortgroep">
              <summary>
                <span className="groep-stip" style={{ background: SOORTGROEPEN[g].kleur }} />
                {SOORTGROEPEN[g].naam} <small>({inGroep.length})</small>
              </summary>
              <Tabel
                soorten={inGroep}
                geselecteerd={geselecteerdeSoort}
                onSelecteer={onSelecteer}
              />
            </details>
          )
        })
      ) : (
        <Tabel soorten={zichtbaar} geselecteerd={geselecteerdeSoort} onSelecteer={onSelecteer} />
      )}
    </div>
  )
}

function Tabel({
  soorten,
  geselecteerd,
  onSelecteer,
}: {
  soorten: Soort[]
  geselecteerd: number | null
  onSelecteer: (key: number | null) => void
}) {
  return (
    <table className="soorten-tabel">
      <thead>
        <tr>
          <th>Soort</th>
          <th className="getal">Aantal</th>
          <th>Laatst</th>
        </tr>
      </thead>
      <tbody>
        {soorten.map((s) => (
          <tr
            key={s.key}
            className={
              (s.bescherming ? 'beschermd ' : '') +
              (s.exoot ? 'exoot ' : '') +
              (geselecteerd === s.key ? 'geselecteerd' : '')
            }
            onClick={() => onSelecteer(geselecteerd === s.key ? null : s.key)}
            title="Klik om alleen deze soort op de kaart te tonen"
          >
            <td>
              {s.nederlandseNaam ?? <span className="voetnoot">(geen Nederlandse naam)</span>}
              <br />
              <em className="wetenschappelijk">{s.wetenschappelijkeNaam}</em>
              {s.bescherming && (
                <>
                  <br />
                  <span className="label label-beschermd">{s.bescherming.regime}</span>
                </>
              )}
              {s.exoot && (
                <>
                  <br />
                  <span className="label label-exoot">Invasieve exoot</span>
                </>
              )}
            </td>
            <td className="getal">{s.aantal}</td>
            <td className="datum">{formatDatum(s.laatsteDatum)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
