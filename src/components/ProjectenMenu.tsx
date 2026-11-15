import { useEffect, useMemo, useState } from 'react'
import { leesProjecten, verwijderProject, type Project } from '../utils/projecten'

interface Props {
  actiefId: string | null
  /** Verandert na elke automatische opslag, zodat de lijst ververst */
  opslagVersie: number
  opslagFout: string | null
  onOpen: (project: Project) => void
  onNieuw: () => void
}

interface InstallPrompt extends Event {
  prompt: () => Promise<void>
}

/** Projecten kiezen, nieuw beginnen en de app installeren. */
export default function ProjectenMenu({
  actiefId,
  opslagVersie,
  opslagFout,
  onOpen,
  onNieuw,
}: Props) {
  // Lijst opnieuw inlezen na elke opslag of projectwissel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const projecten = useMemo<Project[]>(() => leesProjecten(), [opslagVersie, actiefId])
  const [installatie, setInstallatie] = useState<InstallPrompt | null>(null)
  const [toonIosTip, setToonIosTip] = useState(false)


  // Chrome/Android/Edge: de browser biedt installeren aan via dit event
  useEffect(() => {
    const bij = (e: Event) => {
      e.preventDefault()
      setInstallatie(e as InstallPrompt)
    }
    window.addEventListener('beforeinstallprompt', bij)
    return () => window.removeEventListener('beforeinstallprompt', bij)
  }, [])
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const alGeinstalleerd = window.matchMedia?.('(display-mode: standalone)').matches

  return (
    <div className="projecten-menu">
      <div className="knoppenrij">
        <select
          value={actiefId ?? ''}
          onChange={(e) => {
            const p = projecten.find((x) => x.id === e.target.value)
            if (p) onOpen(p)
          }}
          aria-label="Opgeslagen projecten"
        >
          {!actiefId && <option value="">Nieuw project (nog niet opgeslagen)</option>}
          {projecten.map((p) => (
            <option key={p.id} value={p.id}>
              {p.naam || 'Naamloos project'} · {new Date(p.bijgewerkt).toLocaleDateString('nl-NL')}
            </option>
          ))}
        </select>
        <button type="button" className="knop" onClick={onNieuw}>
          ＋ Nieuw
        </button>
        {actiefId && (
          <button
            type="button"
            className="knop"
            onClick={() => {
              if (window.confirm('Dit project van dit toestel verwijderen?')) {
                verwijderProject(actiefId)
                onNieuw()
              }
            }}
            title="Project verwijderen"
          >
            🗑
          </button>
        )}
        {!alGeinstalleerd && (installatie || isIos) && (
          <button
            type="button"
            className="knop"
            onClick={async () => {
              if (installatie) {
                await installatie.prompt()
                setInstallatie(null)
              } else setToonIosTip((t) => !t)
            }}
          >
            📲 Installeren
          </button>
        )}
      </div>
      {toonIosTip && (
        <p className="voetnoot">
          Op iPhone/iPad: tik in Safari op <strong>Delen</strong> en kies{' '}
          <strong>Zet op beginscherm</strong>.
        </p>
      )}
      {actiefId && !opslagFout && (
        <p className="voetnoot opgeslagen">✓ Automatisch opgeslagen op dit toestel</p>
      )}
      {opslagFout && <p className="melding melding-fout">{opslagFout}</p>}
    </div>
  )
}
