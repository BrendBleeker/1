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
import { bufferGebied, formatAfstand, formatGetal, formatOppervlakte } from '../utils/geometrie'
import { formatDatum, formatTijdstip } from '../utils/datum'
import { GROEP_VOLGORDE, SOORTGROEPEN } from '../utils/soortgroepen'
import { LIJST_VERSIE, sorteerBeschermdEerst } from '../utils/bescherming'
import type { HabitatStatus } from '../hooks/useHabitat'
import { CHECKLIST, type VeldGegevens } from '../data/veldchecklist'
import type { ProfielReden } from '../utils/relevanteProfielen'
import WerkKalender from './WerkKalender'
import { HABITAT_BRONNEN, KADASTER_PERCELEN, UNIELIJST } from '../config/bronnen'

interface Props {
  gebied: Feature<Polygon>
  herkomst: string | null
  projectnaam: string
  onProjectnaam: (naam: string) => void
  bufferM: number
  zoekgebied: Feature<Polygon | MultiPolygon> | null
  natura2000: Natura2000Status
  waarnemingen: WaarnemingenStatus
  soorten: Soort[]
  habitat: HabitatStatus
  veld: VeldGegevens
  /** Conceptconclusie (door de gebruiker aangepast of automatisch) */
  conclusie: string
  profielen: ProfielReden[]
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
  const [gemaaktOp] = useState(() => new Date()) // tijdstip waarop het rapport is geopend
  // Kaartafbeelding passend maken op smalle schermen (telefoon)
  const [kaartBreedte] = useState(() => Math.min(720, window.innerWidth - 40))

  const zone1km = bufferGebied(gebied, NATURA2000_ZOEKAFSTAND_M)
  const [lng, lat] = centroid(gebied).geometry.coordinates
  const resultaat = waarnemingen.soort === 'klaar' ? waarnemingen.resultaat : null
  const beschermd = soorten.filter((s) => s.bescherming).sort((a, b) => b.aantal - a.aantal)
  const vogelsGezien = soorten.some((s) => s.groep === 'vogels')
  const soortenMap = new Map(soorten.map((s) => [s.key, s]))
  const landgebruikTotaal =
    props.habitat.soort === 'klaar'
      ? props.habitat.resultaat.landgebruik.reduce((s, x) => s + x.m2, 0)
      : 1

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
              value={props.projectnaam}
              onChange={(e) => props.onProjectnaam(e.target.value)}
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
            <dd>{formatOppervlakte(gebied)}</dd>
            {props.herkomst && (
              <>
                <dt>Begrenzing</dt>
                <dd>{props.herkomst}</dd>
              </>
            )}
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
          <h2>3. Habitat en potentie</h2>
          {props.habitat.soort !== 'klaar' ? (
            <p className="rapport-waarschuwing">
              Habitatcheck niet beschikbaar
              {props.habitat.soort === 'fout'
                ? `: ${props.habitat.melding}`
                : ' (nog bezig met laden)'}
              .
            </p>
          ) : (
            <>
              <table className="rapport-tabel">
                <thead>
                  <tr>
                    <th>Soortgroep</th>
                    <th>Potentie</th>
                    <th>Aanwijzing (kaartgegevens)</th>
                  </tr>
                </thead>
                <tbody>
                  {props.habitat.resultaat.potentie.map((p) => (
                    <tr key={p.soortgroep}>
                      <td>{p.soortgroep}</td>
                      <td>{p.niveau === 'hoog' ? 'aannemelijk' : 'mogelijk'}</td>
                      <td>{p.reden}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                <strong>Landgebruik:</strong>{' '}
                {props.habitat.resultaat.landgebruik
                  .slice(0, 6)
                  .map((l) => `${l.type} ${Math.round((l.m2 / landgebruikTotaal) * 100)}%`)
                  .join(', ') || 'onbekend'}
                .<br />
                <strong>Gebouwen:</strong> {props.habitat.resultaat.panden.length}
                {props.habitat.resultaat.panden.some((p) => p.bouwjaar) &&
                  ` (bouwjaar ${Math.min(...props.habitat.resultaat.panden.filter((p) => p.bouwjaar).map((p) => p.bouwjaar!))}–${Math.max(...props.habitat.resultaat.panden.filter((p) => p.bouwjaar).map((p) => p.bouwjaar!))})`}
                . <strong>Geregistreerde bomen:</strong> {props.habitat.resultaat.bomen}.{' '}
                <strong>Water:</strong>{' '}
                {props.habitat.resultaat.water.vlakkenInGebied > 0 ||
                props.habitat.resultaat.water.slotenMeterInGebied > 0
                  ? 'aanwezig in het gebied'
                  : props.habitat.resultaat.water.vlakkenNabij +
                        props.habitat.resultaat.water.slotenNabij >
                      0
                    ? 'binnen 100 m'
                    : 'niet binnen 100 m'}
                .
              </p>
              <p className="voetnoot">
                Vuistregels op basis van Top10NL, BAG en BGT; geen vervanging van de
                potentiebepaling in het veld.
              </p>
            </>
          )}
        </section>

        <section>
          <h2>4. Waargenomen soorten (GBIF)</h2>
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
              <h3>Invasieve exoten (EU-Unielijst)</h3>
              {soorten.some((s) => s.exoot) ? (
                <p>
                  {soorten
                    .filter((s) => s.exoot)
                    .map((s) => `${s.nederlandseNaam ?? s.wetenschappelijkeNaam} (${s.aantal}×)`)
                    .join(', ')}
                  . Voor deze soorten gelden verboden op o.a. bezit, vervoer en verspreiding; de
                  grondeigenaar heeft een zorgplicht. Let op bij grondverzet.
                </p>
              ) : (
                <p>Geen soorten van de Unielijst waargenomen.</p>
              )}
              <p>De volledige soortenlijst staat in de bijlage.</p>
            </>
          )}
        </section>

        <section>
          <h2>5. Beschermde soorten (indicatief)</h2>
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
          <h2>6. Veldbezoek</h2>
          {!props.veld.datum && Object.keys(props.veld.antwoorden).length === 0 ? (
            <p className="rapport-waarschuwing">
              Nog geen veldbezoek vastgelegd. Een veldbezoek door een ecoloog is nodig om de
              potentie te beoordelen.
            </p>
          ) : (
            <>
              <dl className="kerngegevens">
                <dt>Datum</dt>
                <dd>{props.veld.datum ? formatDatum(props.veld.datum) : '–'}</dd>
                <dt>Ecoloog</dt>
                <dd>{props.veld.ecoloog || '–'}</dd>
                <dt>Weer</dt>
                <dd>{props.veld.weer || '–'}</dd>
              </dl>
              {CHECKLIST.map((groep) => {
                const items = groep.items.filter((i) => props.veld.antwoorden[i.id])
                const notitie = props.veld.notities[groep.id]
                if (items.length === 0 && !notitie) return null
                return (
                  <div key={groep.id}>
                    <h3>{groep.naam}</h3>
                    {items.length > 0 && (
                      <table className="rapport-tabel">
                        <tbody>
                          {items.map((i) => (
                            <tr key={i.id}>
                              <td>{i.tekst}</td>
                              <td>{props.veld.antwoorden[i.id]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {notitie && <p className="notitie">{notitie}</p>}
                  </div>
                )
              })}
              {props.veld.fotos.length > 0 && (
                <div className="rapport-fotos">
                  {props.veld.fotos.map((f, i) => (
                    <figure key={f.id}>
                      <img src={f.data} alt={f.bijschrift || `Foto ${i + 1}`} />
                      <figcaption>
                        Foto {i + 1}
                        {f.bijschrift && `: ${f.bijschrift}`}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section>
          <h2>7. Conclusie en planning</h2>
          <p className="conclusie-tekst">{props.conclusie}</p>
          <h3>Werkkalender</h3>
          <p className="voetnoot">
            Wanneer geven werkzaamheden (sloop, kap, grondwerk) het minste risico voor de
            soortgroepen die hier spelen? (indicatief)
          </p>
          <WerkKalender profielen={props.profielen} compact={kaartBreedte < 600} />
        </section>

        <section>
          <h2>8. Bronnen</h2>
          <ul className="bronnen">
            <li>
              {BRT_ACHTERGRONDKAART.naam}, WMTS. Geraadpleegd{' '}
              {formatDatum(gemaaktOp.toISOString().slice(0, 10))}.
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
            <li>
              Habitatcheck: TOP10NL en BAG (Kadaster) en BGT, via PDOK OGC API (
              {HABITAT_BRONNEN.bagPand.replace('https://', '').split('/collections')[0]} e.a.).
              {props.habitat.soort === 'klaar' &&
                ` Opgehaald ${formatTijdstip(props.habitat.resultaat.opgehaaldOp)}.`}
            </li>
            {props.herkomst?.startsWith('Kadastraal perceel') && <li>{KADASTER_PERCELEN.naam}.</li>}
            <li>Invasieve exoten: {UNIELIJST.naam}.</li>
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
