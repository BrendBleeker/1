import type { Feature, Polygon } from 'geojson'
import type { VeldGegevens } from '../data/veldchecklist'

/** Een opgeslagen project (alles wat je zelf invoert; opgehaalde gegevens worden opnieuw opgehaald). */
export interface Project {
  id: string
  naam: string
  gebied: Feature<Polygon>
  herkomst: string | null
  bufferM: number
  veld: VeldGegevens
  bijgewerkt: string
}

const SLEUTEL = 'quickscan-projecten-v1'
const ACTIEF = 'quickscan-actief-project-v1'

export function leesProjecten(): Project[] {
  try {
    const lijst = JSON.parse(localStorage.getItem(SLEUTEL) ?? '[]') as Project[]
    return lijst.sort((a, b) => b.bijgewerkt.localeCompare(a.bijgewerkt))
  } catch {
    return []
  }
}

/** Bewaart (of vervangt) een project. Gooit een fout als de browseropslag vol is. */
export function bewaarProject(project: Project): void {
  const lijst = leesProjecten().filter((p) => p.id !== project.id)
  lijst.push(project)
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(lijst))
    localStorage.setItem(ACTIEF, project.id)
  } catch {
    throw new Error(
      "De opslag van je browser is vol (vaak door foto's). Verwijder foto's of oude projecten.",
    )
  }
}

export function verwijderProject(id: string): void {
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(leesProjecten().filter((p) => p.id !== id)))
    if (localStorage.getItem(ACTIEF) === id) localStorage.removeItem(ACTIEF)
  } catch {
    // niets aan te doen
  }
}

/** Het project waar je het laatst aan werkte. */
export function leesActiefProject(): Project | null {
  try {
    const id = localStorage.getItem(ACTIEF)
    return leesProjecten().find((p) => p.id === id) ?? null
  } catch {
    return null
  }
}

export function nieuwProjectId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/** Bij 'Nieuw project': niet meer automatisch het vorige project openen. */
export function wisActiefProject(): void {
  try {
    localStorage.removeItem(ACTIEF)
  } catch {
    // niets aan te doen
  }
}
