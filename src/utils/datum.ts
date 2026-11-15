/** "2024-05-13" → "13 mei 2024"; werkt ook voor "2024-05" en "2024". */
export function formatDatum(datum?: string): string {
  if (!datum) return '–'
  const [jaar, maand, dag] = datum.split('-').map(Number)
  if (!maand) return String(jaar)
  const d = new Date(jaar, maand - 1, dag || 1)
  return d.toLocaleDateString('nl-NL', {
    day: dag ? 'numeric' : undefined,
    month: 'short',
    year: 'numeric',
  })
}

/** Datum + tijd van ophalen, bijv. "15 november 2026 14:05". */
export function formatTijdstip(d: Date): string {
  return d.toLocaleString('nl-NL', { dateStyle: 'long', timeStyle: 'short' })
}

export const MAANDEN_KORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
