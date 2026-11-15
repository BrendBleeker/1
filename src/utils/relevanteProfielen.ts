import type { Soort } from '../types'
import type { Potentie } from '../services/habitat'
import type { VeldGegevens } from '../data/veldchecklist'
import { CHECKLIST } from '../data/veldchecklist'
import { PROFIELEN, type ProfielId } from './profielen'

export interface ProfielReden {
  profiel: ProfielId
  /** Gevonden beschermde soorten uit dit profiel */
  soorten: string[]
  /** Aanwijzingen uit de habitatcheck */
  potentie: string[]
  /** Checklistpunten die met 'ja' zijn beantwoord */
  veld: string[]
}

/**
 * Bepaalt welke kwetsbaarheidsprofielen relevant zijn voor dit gebied, en waarom:
 * door gevonden beschermde soorten, de habitatcheck en/of het veldbezoek.
 */
export function relevanteProfielen(
  soorten: Soort[],
  potentie: Potentie[],
  veld: VeldGegevens,
): ProfielReden[] {
  const map = new Map<ProfielId, ProfielReden>()
  const pak = (id: ProfielId) => {
    if (!map.has(id)) map.set(id, { profiel: id, soorten: [], potentie: [], veld: [] })
    return map.get(id)!
  }
  for (const s of soorten) {
    if (s.bescherming)
      pak(s.bescherming.profiel).soorten.push(s.nederlandseNaam ?? s.bescherming.nederlandseNaam)
  }
  if (soorten.some((s) => s.groep === 'vogels')) pak('broedvogels')
  for (const p of potentie) pak(p.profiel).potentie.push(p.soortgroep)
  for (const groep of CHECKLIST) {
    for (const item of groep.items) {
      if (veld.antwoorden[item.id] === 'ja')
        for (const pr of item.profielen) pak(pr).veld.push(item.tekst)
    }
  }
  const volgorde = Object.keys(PROFIELEN) as ProfielId[]
  return [...map.values()].sort((a, b) => volgorde.indexOf(a.profiel) - volgorde.indexOf(b.profiel))
}
