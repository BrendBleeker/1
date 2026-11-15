import { PROFIELEN } from './profielen'
import type { ProfielReden } from './relevanteProfielen'

export type Advies =
  | 'nader onderzoek aanbevolen'
  | 'nader onderzoek mogelijk nodig'
  | 'geen aanwijzingen'

/** Advies per soortgroep: gevonden soorten of veldsporen wegen zwaarder dan alleen kaartpotentie. */
export function adviesVoor(p: ProfielReden): Advies {
  if (p.soorten.length > 0 || p.veld.length > 0) return 'nader onderzoek aanbevolen'
  if (p.potentie.length > 0) return 'nader onderzoek mogelijk nodig'
  return 'geen aanwijzingen'
}

/** Genereert een conceptconclusie als platte tekst, die de gebruiker kan aanpassen. */
export function genereerConclusie(
  profielen: ProfielReden[],
  natura2000Tekst: string,
  exoten: string[],
): string {
  const regels: string[] = []
  regels.push('CONCEPTCONCLUSIE (automatisch opgesteld; controleren en aanvullen)')
  regels.push('')
  regels.push(`Gebiedsbescherming: ${natura2000Tekst}`)
  regels.push('')
  regels.push('Soortbescherming per soortgroep:')
  for (const p of profielen) {
    const redenen = [
      p.soorten.length ? `waargenomen: ${[...new Set(p.soorten)].join(', ')}` : '',
      p.veld.length ? `veldbezoek: ${p.veld.join('; ').toLowerCase()}` : '',
      p.potentie.length
        ? `kaartgegevens: ${[...new Set(p.potentie)].join(', ').toLowerCase()}`
        : '',
    ].filter(Boolean)
    regels.push(
      `- ${PROFIELEN[p.profiel].naam}: ${adviesVoor(p)}${redenen.length ? ` (${redenen.join('; ')})` : ''}.`,
    )
  }
  if (profielen.length === 0)
    regels.push('- Geen aanwijzingen gevonden in de beschikbare gegevens.')
  if (exoten.length) {
    regels.push('')
    regels.push(
      `Invasieve exoten (Unielijst) in de omgeving: ${exoten.join(', ')}. Let op de zorgplicht en verspreiding bij grondverzet.`,
    )
  }
  regels.push('')
  regels.push(
    'Vervolg: voer nader onderzoek uit volgens de geldende protocollen in de daarvoor geschikte periode (zie soortenkalender), en plan werkzaamheden met de werkkalender. Bij aantasting van verblijfplaatsen is mogelijk een omgevingsvergunning voor een flora- en fauna-activiteit nodig.',
  )
  return regels.join('\n')
}
