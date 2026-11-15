import type { WaarnemingenStatus } from '../hooks/useWaarnemingen'
import type { Soort } from '../types'
import { GBIF, WAARNEMING_BUFFERS_M } from '../config/bronnen'
import { formatAfstand } from '../utils/geometrie'
import { formatDatum, formatTijdstip } from '../utils/datum'
import Soortenlijst from './Soortenlijst'

interface Props {
  status: WaarnemingenStatus
  soorten: Soort[]
  bufferM: number
  onBufferWijzig: (m: number) => void
  onOpnieuw: () => void
  geselecteerdeSoort: number | null
  onSelecteerSoort: (key: number | null) => void
}

/** Sectie in het zijpaneel met de GBIF-waarnemingen. */
export default function WaarnemingenPaneel(props: Props) {
  const { status, soorten, bufferM, onBufferWijzig, onOpnieuw } = props

  return (
    <section>
      <h2>Waargenomen soorten</h2>
      <label className="buffer-keuze">
        Zoek in het gebied plus{' '}
        <select value={bufferM} onChange={(e) => onBufferWijzig(Number(e.target.value))}>
          {WAARNEMING_BUFFERS_M.map((m) => (
            <option key={m} value={m}>
              {m === 0 ? 'geen buffer' : formatAfstand(m)}
            </option>
          ))}
        </select>
      </label>

      {status.soort === 'laden' && (
        <div className="melding melding-info" role="status">
          <span className="spinner" aria-hidden /> Waarnemingen ophalen bij GBIF…
          {status.totaal > 0 && (
            <>
              <br />
              <progress value={status.geladen} max={status.totaal} />{' '}
              <small>
                {status.geladen} van {status.totaal}
              </small>
            </>
          )}
        </div>
      )}

      {status.soort === 'fout' && (
        <div className="melding melding-fout" role="alert">
          <strong>Ophalen mislukt.</strong> {status.melding}
          <br />
          <button type="button" onClick={onOpnieuw}>
            Opnieuw proberen
          </button>
        </div>
      )}

      {status.soort === 'klaar' && status.resultaat.totaal === 0 && (
        <p className="melding melding-info">
          GBIF heeft geen waarnemingen in dit gebied tussen{' '}
          {formatDatum(status.resultaat.vanaf)} en {formatDatum(status.resultaat.tot)}. Dat
          betekent niet dat er geen soorten voorkomen: er is misschien nooit gekeken, of de
          gegevens staan in een bron die niet in GBIF zit (zoals de NDFF). Probeer eventueel een
          grotere buffer.
        </p>
      )}

      {status.soort === 'klaar' && status.resultaat.totaal > 0 && (
        <>
          <p className="samenvatting">
            <strong>{status.resultaat.totaal.toLocaleString('nl-NL')}</strong> waarnemingen van{' '}
            <strong>{soorten.length}</strong> soorten ({formatDatum(status.resultaat.vanaf)} –{' '}
            {formatDatum(status.resultaat.tot)}).
          </p>
          {status.resultaat.afgekapt && (
            <p className="melding melding-waarschuwing">
              Er zijn meer dan {GBIF.maxWaarnemingen.toLocaleString('nl-NL')} waarnemingen. Op de
              kaart staan er {status.resultaat.waarnemingen.length.toLocaleString('nl-NL')}. De
              soortenlijst en de aantallen zijn wel volledig; de datum &lsquo;laatst&rsquo; is
              gebaseerd op de geladen waarnemingen.
            </p>
          )}
          <Soortenlijst
            soorten={soorten}
            geselecteerdeSoort={props.geselecteerdeSoort}
            onSelecteer={props.onSelecteerSoort}
          />
          <p className="voetnoot">
            Bron: GBIF.org, opgehaald {formatTijdstip(status.resultaat.opgehaaldOp)}.{' '}
            <a href={status.resultaat.gbifLink} target="_blank" rel="noreferrer">
              Bekijk deze zoekopdracht op gbif.org
            </a>
            . Alleen waarnemingen op soortniveau zijn meegeteld.
          </p>
        </>
      )}
    </section>
  )
}
