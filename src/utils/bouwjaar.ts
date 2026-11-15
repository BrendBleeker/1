/** Bouwjaarklassen met kleur, voor de kaart en de habitatcheck. */
export const BOUWJAARKLASSEN = [
  { label: 'vóór 1945', tot: 1945, kleur: '#7b1fa2' },
  { label: '1945–1974', tot: 1975, kleur: '#c2185b' },
  { label: '1975–1991', tot: 1992, kleur: '#f57c00' },
  { label: '1992 of later', tot: 10000, kleur: '#9e9e9e' },
]

export function bouwjaarKlasse(bouwjaar: number | null) {
  if (!bouwjaar) return { label: 'onbekend', tot: 0, kleur: '#bdbdbd' }
  return BOUWJAARKLASSEN.find((k) => bouwjaar < k.tot)!
}
