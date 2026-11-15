import type { Feature, Polygon } from 'geojson'

/**
 * Het plangebied in de link (na het #-teken) zetten, zodat je het kunt delen.
 * Coördinaten worden afgerond op 6 decimalen (± 10 cm) en compact opgeslagen.
 */
export function maakDeellink(gebied: Feature<Polygon>, bufferM: number): string {
  const ringen = gebied.geometry.coordinates
    .map((ring) => ring.map(([x, y]) => `${x.toFixed(6)},${y.toFixed(6)}`).join(';'))
    .join('|')
  const url = new URL(window.location.href)
  url.hash = new URLSearchParams({ gebied: ringen, buffer: String(bufferM) }).toString()
  return url.toString()
}

/** Leest een plangebied uit de link, als die er een bevat. */
export function leesDeellink(): { gebied: Feature<Polygon>; bufferM?: number } | null {
  const params = new URLSearchParams(window.location.hash.slice(1))
  const tekst = params.get('gebied')
  if (!tekst) return null
  try {
    const coordinates = tekst
      .split('|')
      .map((ring) => ring.split(';').map((p) => p.split(',').map(Number)))
    if (coordinates[0].length < 4 || coordinates.flat(2).some((n) => !Number.isFinite(n)))
      return null
    const buffer = Number(params.get('buffer'))
    return {
      gebied: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates } },
      bufferM: Number.isFinite(buffer) ? buffer : undefined,
    }
  } catch {
    return null
  }
}
