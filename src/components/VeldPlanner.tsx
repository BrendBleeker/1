import { useEffect, useMemo, useState } from 'react'
import { centroid } from '@turf/turf'
import type { Feature, Polygon } from 'geojson'
import type { Soort } from '../types'
import { formatTijd, plusMinuten, zonTijden } from '../utils/zon'
import { geschiktVoorVleermuizen, haalWeerOp, type WeerUur } from '../services/weer'
import { OPEN_METEO } from '../config/bronnen'
import { MAANDEN_KORT } from '../utils/datum'

interface Props {
  gebied: Feature<Polygon>
  soorten: Soort[]
}

/** Onderzoeksvensters rond zonsopkomst/-ondergang (indicatief, controleer het protocol). */
const VENSTERS = [
  {
    naam: 'Vleermuizen – avondbezoek',
    basis: 'onder',
    van: 0,
    tot: 180,
    uitleg: 'vanaf zonsondergang, ca. 2–3 uur',
  },
  {
    naam: 'Vleermuizen – ochtendbezoek (zwermen)',
    basis: 'op',
    van: -180,
    tot: 0,
    uitleg: 'ca. 2–3 uur vóór zonsopkomst tot zonsopkomst',
  },
  {
    naam: 'Gierzwaluw',
    basis: 'onder',
    van: -60,
    tot: 30,
    uitleg: 'ca. 1 uur vóór tot 30 min na zonsondergang',
  },
  {
    naam: 'Huismus en broedvogels',
    basis: 'op',
    van: 30,
    tot: 240,
    uitleg: 'ochtend, vanaf kort na zonsopkomst',
  },
  {
    naam: 'Uilen en amfibieën (roep)',
    basis: 'onder',
    van: 30,
    tot: 180,
    uitleg: 'na zonsondergang, bij voorkeur windstil',
  },
] as const

function vandaag(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Plan een veldbezoek: zonstijden, onderzoeksvensters, weer en welke soorten nu passen. */
export default function VeldPlanner({ gebied, soorten }: Props) {
  const [datum, setDatum] = useState(vandaag)
  const [weer, setWeer] = useState<{ datum: string; uren?: WeerUur[]; fout?: string } | null>(null)
  const [lng, lat] = centroid(gebied).geometry.coordinates
  const zon = useMemo(() => zonTijden(new Date(`${datum}T12:00:00`), lat, lng), [datum, lat, lng])
  const maand = Number(datum.slice(5, 7))

  const dagenVooruit = (Date.parse(datum) - Date.parse(vandaag())) / 86_400_000
  const weerMogelijk = dagenVooruit >= 0 && dagenVooruit < OPEN_METEO.maxDagen

  useEffect(() => {
    if (!weerMogelijk) return
    let actueel = true
    haalWeerOp(lat, lng, datum)
      .then((uren) => actueel && setWeer({ datum, uren }))
      .catch(
        (e: unknown) =>
          actueel &&
          setWeer({ datum, fout: e instanceof Error ? e.message : 'Weer ophalen mislukt.' }),
      )
    return () => {
      actueel = false
    }
  }, [datum, lat, lng, weerMogelijk])

  const nuGeschikt = soorten.filter((s) => s.bescherming?.onderzoeksmaanden.includes(maand))
  const avondUren =
    weer?.datum === datum && weer.uren
      ? weer.uren.filter((u) => {
          const uur = Number(u.tijd.slice(11, 13))
          const onderUur = Number(formatTijd(zon.ondergang).slice(0, 2))
          return uur >= onderUur && uur <= onderUur + 3
        })
      : []

  return (
    <section>
      <h2>Veldbezoek plannen</h2>
      <label className="buffer-keuze">
        Datum:{' '}
        <input
          type="date"
          value={datum}
          onChange={(e) => e.target.value && setDatum(e.target.value)}
        />
      </label>
      <dl className="kerngegevens">
        <dt>Zonsopkomst</dt>
        <dd>{formatTijd(zon.opkomst)}</dd>
        <dt>Zonsondergang</dt>
        <dd>{formatTijd(zon.ondergang)}</dd>
      </dl>

      <h3>Onderzoeksvensters (indicatief)</h3>
      <table className="soorten-tabel vensters">
        <tbody>
          {VENSTERS.map((v) => {
            const basis = v.basis === 'op' ? zon.opkomst : zon.ondergang
            return (
              <tr key={v.naam}>
                <td>
                  {v.naam}
                  <br />
                  <small className="voetnoot">{v.uitleg}</small>
                </td>
                <td className="datum">
                  {formatTijd(plusMinuten(basis, v.van))}–{formatTijd(plusMinuten(basis, v.tot))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <h3>Weer rond zonsondergang</h3>
      {!weerMogelijk && (
        <p className="voetnoot">
          Een weersverwachting is alleen beschikbaar voor de komende {OPEN_METEO.maxDagen} dagen.
        </p>
      )}
      {weerMogelijk && weer?.datum !== datum && (
        <p className="melding melding-info">
          <span className="spinner" aria-hidden /> Weersverwachting ophalen…
        </p>
      )}
      {weerMogelijk && weer?.datum === datum && weer.fout && (
        <p className="melding melding-fout">{weer.fout}</p>
      )}
      {avondUren.length > 0 && (
        <table className="soorten-tabel vensters">
          <thead>
            <tr>
              <th>Uur</th>
              <th>°C</th>
              <th>mm</th>
              <th>km/h</th>
              <th>Vleermuizen</th>
            </tr>
          </thead>
          <tbody>
            {avondUren.map((u) => {
              const g = geschiktVoorVleermuizen(u)
              return (
                <tr key={u.tijd}>
                  <td>{u.tijd.slice(11, 16)}</td>
                  <td>{Math.round(u.temperatuur)}</td>
                  <td>{u.neerslagMm.toFixed(1)}</td>
                  <td>{Math.round(u.windKmh)}</td>
                  <td>
                    <span className={`label ${g.ok ? 'label-groen' : 'label-rood'}`}>
                      {g.reden}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      <p className="voetnoot">
        Vuistregel vleermuisonderzoek: droog, ± 10 °C of warmer, niet meer dan ± 4 Beaufort. Bron:
        Open-Meteo.
      </p>

      <h3>Passend onderzoek in {MAANDEN_KORT[maand - 1]}</h3>
      {nuGeschikt.length > 0 ? (
        <ul className="beschermd-lijst">
          {nuGeschikt.map((s) => (
            <li key={s.key}>
              <strong>{s.nederlandseNaam ?? s.bescherming!.nederlandseNaam}</strong>
              <br />
              <small>{s.bescherming!.toelichting}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>Geen van de gevonden beschermde soorten heeft deze maand een onderzoeksperiode.</p>
      )}
    </section>
  )
}
