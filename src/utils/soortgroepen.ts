import type { Soortgroep } from '../types'

/** Nederlandse namen en kleuren per soortgroep. */
export const SOORTGROEPEN: Record<Soortgroep, { naam: string; kleur: string }> = {
  vogels: { naam: 'Vogels', kleur: '#2f80c1' },
  zoogdieren: { naam: 'Zoogdieren', kleur: '#8e5b3c' },
  amfibieen: { naam: 'Amfibieën', kleur: '#2a9d8f' },
  reptielen: { naam: 'Reptielen', kleur: '#7a8b2c' },
  planten: { naam: 'Planten', kleur: '#3d9b4a' },
  insecten: { naam: 'Insecten', kleur: '#d4a017' },
  overig: { naam: 'Overig', kleur: '#8a8f98' },
}

/** Volgorde waarin de groepen in de lijst staan. */
export const GROEP_VOLGORDE: Soortgroep[] = [
  'vogels',
  'zoogdieren',
  'amfibieen',
  'reptielen',
  'insecten',
  'planten',
  'overig',
]

/**
 * Bepaal de soortgroep uit de GBIF-taxonomie (rijk en klasse).
 * In de GBIF-taxonomie zijn reptielen verdeeld over de klassen
 * Squamata (hagedissen, slangen), Testudines (schildpadden) en Crocodylia.
 */
export function bepaalSoortgroep(rijk?: string, klasse?: string): Soortgroep {
  if (rijk === 'Plantae') return 'planten'
  switch (klasse) {
    case 'Aves':
      return 'vogels'
    case 'Mammalia':
      return 'zoogdieren'
    case 'Amphibia':
      return 'amfibieen'
    case 'Reptilia':
    case 'Squamata':
    case 'Testudines':
    case 'Crocodylia':
      return 'reptielen'
    case 'Insecta':
      return 'insecten'
    default:
      return 'overig'
  }
}
