/**
 * fetch() met automatisch opnieuw proberen als de server tijdelijk "nee" zegt:
 * 429 (te veel verzoeken), 502, 503 of 504. Tussen pogingen wachten we steeds langer
 * (1, 2, 4 seconden …), of zo lang als de server via de Retry-After-header vraagt.
 */
export async function fetchMetHerhaling(
  url: string,
  signal?: AbortSignal,
  maxPogingen = 4,
): Promise<Response> {
  for (let poging = 1; ; poging++) {
    const antwoord = await fetch(url, { signal })
    const tijdelijk = [429, 502, 503, 504].includes(antwoord.status)
    if (!tijdelijk || poging >= maxPogingen) return antwoord

    const retryAfter = Number(antwoord.headers.get('Retry-After'))
    const wachtMs = retryAfter > 0 ? Math.min(retryAfter, 30) * 1000 : 1000 * 2 ** (poging - 1)
    await wacht(wachtMs, signal)
  }
}

function wacht(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((klaar, mislukt) => {
    const timer = setTimeout(klaar, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      mislukt(signal.reason)
    })
  })
}
