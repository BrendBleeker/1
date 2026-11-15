import type { HabitatStatus } from '../hooks/useHabitat'
import { BOUWJAARKLASSEN, bouwjaarKlasse } from '../utils/bouwjaar'
import { formatTijdstip } from '../utils/datum'

interface Props {
  status: HabitatStatus
  onOpnieuw: () => void
  toonPanden: boolean
  onToonPanden: (aan: boolean) => void
}

/** Habitatcheck: landgebruik, water, gebouwen, bomen en potentie per soortgroep. */
export default function HabitatPaneel({ status, onOpnieuw, toonPanden, onToonPanden }: Props) {
  return (
    <section>
      <h2>Habitat en potentie</h2>
      {status.soort === 'laden' && (
        <p className="melding melding-info" role="status">
          <span className="spinner" aria-hidden /> Landgebruik, water, gebouwen en bomen ophalen…
        </p>
      )}
      {status.soort === 'fout' && (
        <div className="melding melding-fout" role="alert">
          <strong>Habitatcheck mislukt.</strong> {status.melding}
          <br />
          <button type="button" onClick={onOpnieuw}>
            Opnieuw proberen
          </button>
        </div>
      )}
      {status.soort === 'klaar' && (
        <Resultaat {...status.resultaat} {...{ toonPanden, onToonPanden }} />
      )}
    </section>
  )
}

function Resultaat(
  r: Extract<HabitatStatus, { soort: 'klaar' }>['resultaat'] & {
    toonPanden: boolean
    onToonPanden: (aan: boolean) => void
  },
) {
  const totaal = r.landgebruik.reduce((s, l) => s + l.m2, 0)
  const perKlasse = [...BOUWJAARKLASSEN, { label: 'onbekend', tot: 0, kleur: '#bdbdbd' }].map(
    (k) => ({
      ...k,
      aantal: r.panden.filter((p) => bouwjaarKlasse(p.bouwjaar).label === k.label).length,
    }),
  )
  const jaren = r.panden.map((p) => p.bouwjaar).filter((j): j is number => !!j)

  return (
    <>
      <h3>Potentie per soortgroep</h3>
      {r.potentie.length === 0 ? (
        <p>Geen duidelijke aanwijzingen uit de kaartgegevens. Het veldbezoek is leidend.</p>
      ) : (
        <ul className="potentie-lijst">
          {r.potentie.map((p) => (
            <li key={p.soortgroep}>
              <span className={`label ${p.niveau === 'hoog' ? 'label-rood' : 'label-oranje'}`}>
                {p.niveau === 'hoog' ? 'aannemelijk' : 'mogelijk'}
              </span>{' '}
              <strong>{p.soortgroep}</strong>
              <br />
              <small>{p.reden}</small>
            </li>
          ))}
        </ul>
      )}
      <p className="voetnoot">
        Vuistregels op basis van kaartgegevens; geen vervanging van de potentiebepaling in het veld.
      </p>

      <h3>Landgebruik (Top10NL)</h3>
      {r.landgebruik.length === 0 ? (
        <p className="voetnoot">Geen landgebruik gevonden.</p>
      ) : (
        <ul className="balk-lijst">
          {r.landgebruik.slice(0, 8).map((l) => {
            const pct = (l.m2 / totaal) * 100
            return (
              <li key={l.type}>
                <span className="balk-label">{l.type}</span>
                <span className="balk">
                  <span style={{ width: `${pct}%` }} />
                </span>
                <span className="balk-waarde">{Math.round(pct)}%</span>
              </li>
            )
          })}
        </ul>
      )}

      <h3>Water</h3>
      <p>
        {r.water.vlakkenInGebied > 0 || r.water.slotenMeterInGebied > 0
          ? `In het gebied: ${r.water.vlakkenInGebied} watervlak(ken)${r.water.slotenMeterInGebied ? `, ${r.water.slotenMeterInGebied.toLocaleString('nl-NL')} m sloot/waterloop` : ''}.`
          : 'Geen water in het gebied.'}{' '}
        {r.water.vlakkenNabij + r.water.slotenNabij > 0
          ? `Binnen 100 m: ${r.water.vlakkenNabij} watervlak(ken) en ${r.water.slotenNabij} sloot/waterloop(en).`
          : 'Geen water binnen 100 m.'}
      </p>

      <h3>Gebouwen (BAG)</h3>
      {r.panden.length === 0 ? (
        <p>Geen gebouwen in het gebied.</p>
      ) : (
        <>
          <p>
            {r.panden.length} gebouw(en)
            {jaren.length > 0 && `, bouwjaar ${Math.min(...jaren)}–${Math.max(...jaren)}`}.
          </p>
          <ul className="bouwjaar-lijst">
            {perKlasse
              .filter((k) => k.aantal > 0)
              .map((k) => (
                <li key={k.label}>
                  <span className="legenda-vak" style={{ background: k.kleur }} /> {k.label}:{' '}
                  {k.aantal}
                </li>
              ))}
          </ul>
          <label>
            <input
              type="checkbox"
              checked={r.toonPanden}
              onChange={(e) => r.onToonPanden(e.target.checked)}
            />{' '}
            Gebouwen op de kaart kleuren naar bouwjaar
          </label>
        </>
      )}

      <h3>Bomen (BGT)</h3>
      <p>
        {r.bomen > 0 ? `${r.bomen} geregistreerde boom/bomen.` : 'Geen geregistreerde bomen.'}{' '}
        <small className="voetnoot">
          Niet alle gemeenten registreren bomen in de BGT; controleer op de luchtfoto.
        </small>
      </p>
      <p className="voetnoot">
        Bron: PDOK (Top10NL, BAG, BGT), opgehaald {formatTijdstip(r.opgehaaldOp)}.
      </p>
    </>
  )
}
