import { useState } from 'react'
import { centroid } from '@turf/turf'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { Natura2000Status } from '../hooks/useNatura2000'
import type { WaarnemingenStatus } from '../hooks/useWaarnemingen'
import type { Soort } from '../types'
import StatischeKaart from './StatischeKaart'
import Soortenkalender from './Soortenkalender'
import {
  BRT_ACHTERGRONDKAART,
  LUCHTFOTO,
  NATURA2000,
  NATURA2000_ZOEKAFSTAND_M,
  NATUURNETWERK,
} from '../config/bronnen'
import { bufferGebied, formatAfstand, formatGetal, oppervlakteHectare } from '../utils/geometrie'
import { formatDatum, formatTijdstip } from '../utils/datum'
import { GROEP_VOLGORDE, SOORTGROEPEN } from '../utils/soortgroepen'
import { LIJST_VERSIE, sorteerBeschermdEerst } from '../utils/bescherming'

interface Props {
  gebied: Feature<Polygon>
  bufferM: number
  zoekgebied: Feature<Polygon | MultiPolygon> | null
  natura2000: Natura2000Status
  waarnemingen: WaarnemingenStatus
  soorten: Soort[]
  onSluiten: () => void
}

const BESCHERMING_UITLEG: Record<string, string> = {
  VR: 'Vogelrichtlijn',
  HR: 'Habitatrichtlijn',
  'VR+HR': 'Vogel- en Habitatrichtlijn',
}

/** Printbaar conceptrapport (afdrukken of opslaan als PDF via de browser). */
export default function Rapport(props: Props) {
  const { gebied, bufferM, zoekgebied, natura2000, waarnemingen, soorten } = props
  const [projectnaam, setProjectnaam] = useState('')
  const [gemaaktOp] = useState(() => new Date()) // tijdstip waarop het rapport is geopend
  // Kaartafbeelding passend maken op smalle schermen (telefoon)
  const [kaartBreedte] = useState(() => Math.min(720, window.innerWidth - 40))

  const zone1km = bufferGebied(gebied, NATURA2000_ZOEKAFSTAND_M)
  const [lng, lat] = centroid(gebied).geometry.coordinates
  const resultaat = waarnemingen.soort === 'klaar' ? waarnemingen.resultaat : null
  const beschermd = soorten.filter((s) => s.bescherming).sort((a, b) => b.aantal - a.aantal)
  const vogelsGezien = soorten.some((s) => s.groep === 'vogels')
  const soortenMap = new Map(soorten.map((s) => [s.key, s]))

  return (
    <div className="rapport-pagina">
      <div className="rapport-balk">
        <button type="button" onClick={props.onSluiten}>
          ← Terug naar de kaart
        </button>
        <button type="button" className="knop-primair" onClick={() => window.print()}>
          Afdrukken / opslaan als PDF
        </button>
        <span className="voetnoot">
          Tip: kies bij afdrukken &lsquo;Opslaan als PDF&rsquo; en zet &lsquo;Achtergronden
          afdrukken&rsquo; aan.
        </span>
      </div>

      <article className="rapport">
        <header>
          <p className="rapport-concept">CONCEPT – niet voor besluitvorming</p>
          <h1>Voorbereiding quickscan flora en fauna</h1>
          <label className="projectnaam">
            <span className="alleen-scherm">Projectnaam / locatie (optioneel): </span>
            <input
              value={projectnaam}
              onChange={(e) => setProjectnaam(e.target.value)}
              placeholder="Typ hier een projectnaam of locatie"
            />
          </label>
          <p>Opgesteld met Quickscan Kaart op {formatTijdstip(gemaaktOp)}.</p>
        </header>

        <section>
          <h2>1. Onderzoeksgebied</h2>
          <StatischeKaart
            gebied={gebied}
            inBeeld={[zone1km, ...(zoekgebied ? [zoekgebied] : [])]}
            contouren={[
              { vorm: zone1km, kleur: '#d35400', streep: '6 6' },
              ...(zoekgebied ? [{ vorm: zoekgebied, kleur: '#2f80c1', streep: '2 5' }] : []),
            ]}
            waarnemingen={resultaat?.waarnemingen ?? []}
            soorten={soortenMap}
            breedte={kaartBreedte}
            hoogte={Math.round(kaartBreedte * 0.64)}
          />
          <dl className="kerngegevens">
            <dt>Oppervlakte</dt>
            <dd>{formatGetal(oppervlakteHectare(gebied))} ha</dd>
            <dt>Middelpunt (WGS84)</dt>
            <dd>
              {formatGetal(lat, 5)}° N, {formatGetal(lng, 5)}° O
            </dd>
            <dt>Zoekgebied waarnemingen</dt>
            <dd>gebied {bufferM > 0 ? `+ ${formatAfstand(bufferM)} buffer` : '(geen buffer)'}</dd>
          </dl>
        </section>

        <section>
          <h2>2. Beschermde natuurgebieden</h2>
          <h3>Natura 2000 (in of binnen {formatAfstand(NATURA2000_ZOEKAFSTAND_M)})</h3>
          {natura2000.soort === 'klaar' && natura2000.gebieden.length === 0 && (
            <p>Geen Natura 2000-gebied in of binnen {formatAfstand(NATURA2000_ZOEKAFSTAND_M)}.</p>
          )}
          {natura2000.soort === 'klaar' && natura2000.gebieden.length > 0 && (
            <table className="rapport-tabel">
              <thead>
                <tr>
                  <th>Gebied</th>
                  <th>Nr.</th>
                  <th>Richtlijn</th>
                  <th>Ligging</th>
                </tr>
              </thead>
              <tbody>
                {natura2000.gebieden.map((g) => (
                  <tr key={g.nummer + g.naam}>
                    <td>{g.naam}</td>
                    <td>{g.nummer}</td>
                    <td>{BESCHERMING_UITLEG[g.bescherming] ?? g.bescherming}</td>
                    <td>
                      {g.overlapt ? 'Overlapt met het gebied' : `op ± ${formatAfstand(g.afstandM)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {natura2000.soort !== 'klaar' && (
            <p className="rapport-waarschuwing">
              Natura 2000 kon niet worden gecontroleerd
              {natura2000.soort === 'fout' ? `: ${natura2000.melding}` : ' (nog bezig met laden)'}.
            </p>
          )}
          <p className="voetnoot">
            Let op: effecten zoals stikstofdepositie kunnen ook op grotere afstand optreden en
            vragen om een aparte beoordeling (bijv. een AERIUS-berekening).
          </p>
          <h3>Natuurnetwerk Nederland (NNN)</h3>
          <p>
            Niet automatisch gecontroleerd: er is wel een landelijke kaartlaag (WMS), maar geen
            openbare dienst om de ligging te bevragen. Beoordeel de ligging ten opzichte van het NNN
            op de kaart of in het provinciale omgevingsbeleid.
          </p>
        </section>

        <section>
          <h2>3. Waargenomen soorten (GBIF)</h2>
          {!resultaat && (
            <p className="rapport-waarschuwing">
              Waarnemingen niet beschikbaar
              {waarnemingen.soort === 'fout'
                ? `: ${waarnemingen.melding}`
                : ' (nog bezig met laden)'}
              .
            </p>
          )}
          {resultaat && (
            <>
              <p>
                In het zoekgebied staan in GBIF{' '}
                <strong>{resultaat.totaal.toLocaleString('nl-NL')}</strong> waarnemingen van{' '}
                <strong>{soorten.length}</strong> soorten uit de periode{' '}
                {formatDatum(resultaat.vanaf)} – {formatDatum(resultaat.tot)}.
                {resultaat.afgekapt &&
                  ` De laatste-datumkolom is gebaseerd op ${resultaat.waarnemingen.length.toLocaleString('nl-NL')} geladen waarnemingen.`}
              </p>
              <table className="rapport-tabel rapport-tabel-smal">
                <thead>
                  <tr>
                    <th>Soortgroep</th>
                    <th className="getal">Soorten</th>
                    <th className="getal">Waarnemingen</th>
                  </tr>
                </thead>
                <tbody>
                  {GROEP_VOLGORDE.map((g) => {
                    const inGroep = soorten.filter((s) => s.groep === g)
                    if (inGroep.length === 0) return null
                    return (
                      <tr key={g}>
                        <td>{SOORTGROEPEN[g].naam}</td>
                        <td className="getal">{inGroep.length}</td>
                        <td className="getal">
                          {inGroep.reduce((som, s) => som + s.aantal, 0).toLocaleString('nl-NL')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p>De volledige soortenlijst staat in de bijlage.</p>
            </>
          )}
        </section>

        <section>
          <h2>4. Beschermde soorten (indicatief)</h2>
          <p className="rapport-waarschuwing">
            De markering &lsquo;beschermd&rsquo; is gebaseerd op een kleine, indicatieve startlijst
            (versie {LIJST_VERSIE}). Deze lijst is niet volledig en moet door een ecoloog worden
            gecontroleerd. Alle inheemse vogels zijn beschermd.
          </p>
          {beschermd.length > 0 ? (
            <table className="rapport-tabel">
              <thead>
                <tr>
                  <th>Soort</th>
                  <th>Beschermingsregime</th>
                  <th className="getal">Aantal</th>
                  <th>Laatst</th>
                </tr>
              </thead>
              <tbody>
                {beschermd.map((s) => (
                  <tr key={s.key}>
                    <td>
                      {s.nederlandseNaam ?? s.bescherming!.nederlandseNaam}{' '}
                      <em>({s.wetenschappelijkeNaam})</em>
                    </td>
                    <td>{s.bescherming!.regime}</td>
                    <td className="getal">{s.aantal}</td>
                    <td>{formatDatum(s.laatsteDatum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Geen soorten van de startlijst waargenomen in het zoekgebied.</p>
          )}

          <h3>Soortenkalender</h3>
          <p className="voetnoot">
            Gekleurde maanden: periode waarin onderzoek naar de soort geschikt is (indicatief).
          </p>
          <Soortenkalender
            beschermdeSoorten={beschermd}
            toonBroedvogels={vogelsGezien}
            compact={kaartBreedte < 600}
          />
        </section>

        <section>
          <h2>5. Bronnen</h2>
          <ul className="bronnen">
            <li>
              {BRT_ACHTERGRONDKAART.naam}, WMTS. Geraadpleegd {formatDatum(gemaaktOp.toISOString().slice(0, 10))}
              .
            </li>
            <li>{LUCHTFOTO.naam}, WMTS (beschikbaar als kaartlaag in de app).</li>
            <li>
              {NATURA2000.naam}, WMS en OGC API Features ({NATURA2000.apiItemsUrl}).{' '}
              {natura2000.soort === 'klaar'
                ? `Opgehaald ${formatTijdstip(natura2000.opgehaaldOp)}.`
                : 'Niet opgehaald.'}
            </li>
            <li>{NATUURNETWERK.naam}, WMS (alleen kaartweergave).</li>
            <li>
              GBIF.org (Global Biodiversity Information Facility), Occurrence Search API.{' '}
              {resultaat ? (
                <>
                  Opgehaald {formatTijdstip(resultaat.opgehaaldOp)}; zoekopdracht:{' '}
                  <a href={resultaat.gbifLink}>gbif.org/occurrence/search</a>. De gegevens zijn
                  afkomstig van de datasets die in GBIF zijn opgenomen (o.a. iNaturalist en
                  Observation.org) en kunnen onvolledig zijn.
                </>
              ) : (
                'Niet opgehaald.'
              )}
            </li>
            <li>
              Nederlandse soortnamen: GBIF Species API (bij voorkeur Nederlands Soortenregister).
            </li>
            <li>Indicatieve lijst beschermde soorten, Quickscan Kaart, versie {LIJST_VERSIE}.</li>
          </ul>
        </section>

        <section className="disclaimer">
          <h2>Disclaimer</h2>
          <p>
            Dit is een automatisch gegenereerd <strong>conceptrapport</strong> ter voorbereiding van
            een quickscan flora en fauna in het kader van de Omgevingswet. Het is{' '}
            <strong>geen vervanging voor veldonderzoek</strong> of voor de beoordeling door een
            deskundige ecoloog. Het ontbreken van waarnemingen betekent niet dat soorten afwezig
            zijn: veel waarnemingen staan niet in GBIF (bijvoorbeeld in de NDFF). De lijst met
            beschermde soorten en de onderzoeksperiodes zijn indicatief.
          </p>
        </section>

        {resultaat && soorten.length > 0 && (
          <section className="bijlage">
            <h2>Bijlage: alle waargenomen soorten</h2>
            {GROEP_VOLGORDE.map((g) => {
              const inGroep = soorten.filter((s) => s.groep === g).sort(sorteerBeschermdEerst)
              if (inGroep.length === 0) return null
              return (
                <div key={g}>
                  <h3>
                    {SOORTGROEPEN[g].naam} ({inGroep.length})
                  </h3>
                  <table className="rapport-tabel bijlage-tabel">
                    <thead>
                      <tr>
                        <th>Nederlandse naam</th>
                        <th>Wetenschappelijke naam</th>
                        <th className="getal">Aantal</th>
                        <th>Laatst</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inGroep.map((s) => (
                        <tr key={s.key} className={s.bescherming ? 'beschermd' : ''}>
                          <td>
                            {s.nederlandseNaam ?? '–'}
                            {s.bescherming && ' ●'}
                          </td>
                          <td>
                            <em>{s.wetenschappelijkeNaam}</em>
                          </td>
                          <td className="getal">{s.aantal}</td>
                          <td>{formatDatum(s.laatsteDatum)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
            <p className="voetnoot">● = op de indicatieve lijst beschermde soorten.</p>
          </section>
        )}
      </article>
    </div>
  )
}
