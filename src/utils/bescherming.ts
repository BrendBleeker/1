import lijst from '../data/beschermde-soorten.json'
import type { BeschermdeSoort, Soort } from '../types'

/** De indicatieve lijst met beschermde soorten (zie src/data/beschermde-soorten.json). */
export const BESCHERMDE_SOORTEN = lijst.soorten as BeschermdeSoort[]
export const LIJST_VERSIE = lijst.versie

/** Opzoektabel: wetenschappelijke naam (en synoniemen) → beschermde soort. */
const opWetenschappelijkeNaam = new Map<string, BeschermdeSoort>()
for (const s of BESCHERMDE_SOORTEN) {
  opWetenschappelijkeNaam.set(s.wetenschappelijkeNaam.toLowerCase(), s)
  for (const syn of s.synoniemen ?? []) opWetenschappelijkeNaam.set(syn.toLowerCase(), s)
}

/** Geeft de beschermingsinformatie terug als de soort op de lijst staat. */
export function zoekBescherming(wetenschappelijkeNaam: string): BeschermdeSoort | undefined {
  return opWetenschappelijkeNaam.get(wetenschappelijkeNaam.toLowerCase())
}

/**
 * Algemene regel voor alle broedvogels (Vogelrichtlijn): nesten in gebruik zijn beschermd.
 * Het broedseizoen is niet wettelijk vastgelegd; globaal half maart – half juli.
 */
export const BROEDVOGELS_ALGEMEEN = {
  naam: 'Alle broedvogels (algemeen)',
  regime: 'Vogelrichtlijn',
  onderzoeksmaanden: [3, 4, 5, 6, 7],
  toelichting:
    'Alle inheemse vogels zijn beschermd. Nesten in gebruik mogen niet verstoord worden; het broedseizoen is globaal half maart – half juli (niet wettelijk vastgelegd).',
}

/** Beschermde soorten bovenaan, daarna op aantal waarnemingen. */
export function sorteerBeschermdEerst(a: Soort, b: Soort): number {
  return Number(!!b.bescherming) - Number(!!a.bescherming) || b.aantal - a.aantal
}
