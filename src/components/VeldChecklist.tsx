import { useRef, useState } from 'react'
import { CHECKLIST, type Antwoord, type VeldGegevens } from '../data/veldchecklist'
import { verkleinFoto } from '../utils/foto'

interface Props {
  veld: VeldGegevens
  onWijzig: (veld: VeldGegevens) => void
}

const ANTWOORDEN: { waarde: Antwoord; label: string }[] = [
  { waarde: 'ja', label: 'Ja' },
  { waarde: 'nee', label: 'Nee' },
  { waarde: 'onbekend', label: '?' },
]

/** Checklist voor het veldbezoek, met notities en foto's. Wordt op het toestel bewaard. */
export default function VeldChecklist({ veld, onWijzig }: Props) {
  const fotoInvoer = useRef<HTMLInputElement>(null)
  const [fotoFout, setFotoFout] = useState<string | null>(null)
  const zet = (deel: Partial<VeldGegevens>) => onWijzig({ ...veld, ...deel })

  const voegFotosToe = async (bestanden: FileList | null) => {
    if (!bestanden) return
    setFotoFout(null)
    try {
      const nieuw = await Promise.all(
        [...bestanden].slice(0, 10).map(async (b) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          data: await verkleinFoto(b),
          bijschrift: '',
        })),
      )
      zet({ fotos: [...veld.fotos, ...nieuw].slice(0, 12) })
    } catch (e) {
      setFotoFout(e instanceof Error ? e.message : 'Foto toevoegen mislukt.')
    }
    if (fotoInvoer.current) fotoInvoer.current.value = ''
  }

  const beantwoord = Object.keys(veld.antwoorden).length
  const totaal = CHECKLIST.reduce((s, g) => s + g.items.length, 0)

  return (
    <section>
      <h2>Veldbezoek</h2>
      <p className="voetnoot">
        Wordt automatisch op dit toestel bewaard. {beantwoord} van {totaal} punten ingevuld.
      </p>
      <div className="veld-meta">
        <label>
          Datum bezoek
          <input type="date" value={veld.datum} onChange={(e) => zet({ datum: e.target.value })} />
        </label>
        <label>
          Ecoloog
          <input
            value={veld.ecoloog}
            onChange={(e) => zet({ ecoloog: e.target.value })}
            placeholder="Naam"
          />
        </label>
        <label>
          Weer
          <input
            value={veld.weer}
            onChange={(e) => zet({ weer: e.target.value })}
            placeholder="bijv. 14 °C, droog, 2 Bft"
          />
        </label>
      </div>

      {CHECKLIST.map((groep) => (
        <details key={groep.id} open className="checklist-groep">
          <summary>{groep.naam}</summary>
          {groep.items.map((item) => (
            <div key={item.id} className="checklist-item">
              <span>{item.tekst}</span>
              <span className="tri-keuze" role="radiogroup" aria-label={item.tekst}>
                {ANTWOORDEN.map((a) => (
                  <button
                    key={a.waarde}
                    type="button"
                    role="radio"
                    aria-checked={veld.antwoorden[item.id] === a.waarde}
                    className={veld.antwoorden[item.id] === a.waarde ? `actief ${a.waarde}` : ''}
                    onClick={() => {
                      const antwoorden = { ...veld.antwoorden }
                      if (antwoorden[item.id] === a.waarde) delete antwoorden[item.id]
                      else antwoorden[item.id] = a.waarde
                      zet({ antwoorden })
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </span>
            </div>
          ))}
          <textarea
            rows={2}
            placeholder={`Notities ${groep.naam.toLowerCase()}`}
            value={veld.notities[groep.id] ?? ''}
            onChange={(e) => zet({ notities: { ...veld.notities, [groep.id]: e.target.value } })}
          />
        </details>
      ))}

      <h3>Foto&rsquo;s</h3>
      <button type="button" className="knop" onClick={() => fotoInvoer.current?.click()}>
        📷 Foto toevoegen
      </button>
      <input
        ref={fotoInvoer}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={(e) => voegFotosToe(e.target.files)}
      />
      {fotoFout && <p className="melding melding-fout">{fotoFout}</p>}
      <div className="foto-raster">
        {veld.fotos.map((f) => (
          <figure key={f.id}>
            <img src={f.data} alt={f.bijschrift || 'Veldfoto'} />
            <input
              value={f.bijschrift}
              placeholder="Bijschrift"
              onChange={(e) =>
                zet({
                  fotos: veld.fotos.map((x) =>
                    x.id === f.id ? { ...x, bijschrift: e.target.value } : x,
                  ),
                })
              }
            />
            <button
              type="button"
              className="link-knop"
              onClick={() => zet({ fotos: veld.fotos.filter((x) => x.id !== f.id) })}
            >
              verwijderen
            </button>
          </figure>
        ))}
      </div>
    </section>
  )
}
