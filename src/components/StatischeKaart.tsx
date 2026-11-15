import { bbox } from '@turf/turf'
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson'
import { BRT_ACHTERGRONDKAART, NATURA2000 } from '../config/bronnen'
import type { Soort, Waarneming } from '../types'

interface Props {
  gebied: Feature<Polygon>
  /** Deze vormen moeten allemaal in beeld passen (bijv. de 1 km-zone) */
  inBeeld: Feature<Polygon | MultiPolygon>[]
  /** Gestippelde extra contouren (zoekgebied, 1 km-zone) */
  contouren: { vorm: Feature<Polygon | MultiPolygon>; kleur: string; streep: string }[]
  waarnemingen: Waarneming[]
  soorten: Map<number, Soort>
  breedte?: number
  hoogte?: number
}

const TEGEL = 256
const AARDE_STRAAL = 6378137
const HALVE_OMTREK = Math.PI * AARDE_STRAAL

/** Lengte-/breedtegraad → pixel op wereldniveau bij zoomniveau z (Web Mercator, zoals Leaflet). */
function naarPixel([lng, lat]: Position, z: number): [number, number] {
  const schaal = TEGEL * 2 ** z
  const sin = Math.sin((lat * Math.PI) / 180)
  return [
    ((lng + 180) / 360) * schaal,
    (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * schaal,
  ]
}

/** Wereldpixel → EPSG:3857-meters (nodig voor het WMS-verzoek). */
function naarMeters(px: number, py: number, z: number): [number, number] {
  const mPerPx = (2 * HALVE_OMTREK) / (TEGEL * 2 ** z)
  return [px * mPerPx - HALVE_OMTREK, HALVE_OMTREK - py * mPerPx]
}

/**
 * Een vaste (niet-interactieve) kaartafbeelding voor het rapport.
 * Opgebouwd uit dezelfde PDOK-kaarttegels als de app, met daarover een Natura 2000-afbeelding
 * (WMS) en een SVG-laag met het gebied, de zones en de waarnemingen. Werkt ook bij afdrukken.
 */
export default function StatischeKaart({
  gebied,
  inBeeld,
  contouren,
  waarnemingen,
  soorten,
  breedte = 720,
  hoogte = 460,
}: Props) {
  // 1. Omhullende rechthoek van alles wat in beeld moet
  const vakken = inBeeld.map((f) => bbox(f))
  const west = Math.min(...vakken.map((b) => b[0]))
  const zuid = Math.min(...vakken.map((b) => b[1]))
  const oost = Math.max(...vakken.map((b) => b[2]))
  const noord = Math.max(...vakken.map((b) => b[3]))

  // 2. Hoogste zoomniveau waarbij alles past (met 5% marge)
  let z = 18
  while (z > 6) {
    const [x1, y1] = naarPixel([west, noord], z)
    const [x2, y2] = naarPixel([oost, zuid], z)
    if (x2 - x1 <= breedte * 0.95 && y2 - y1 <= hoogte * 0.95) break
    z--
  }

  // 3. Linkerbovenhoek van het beeld in wereldpixels
  const [mx, my] = naarPixel([(west + oost) / 2, (zuid + noord) / 2], z)
  const links = mx - breedte / 2
  const boven = my - hoogte / 2

  // 4. Benodigde tegels
  const tegels: { x: number; y: number; url: string }[] = []
  for (let tx = Math.floor(links / TEGEL); tx <= Math.floor((links + breedte) / TEGEL); tx++) {
    for (let ty = Math.floor(boven / TEGEL); ty <= Math.floor((boven + hoogte) / TEGEL); ty++) {
      tegels.push({
        x: tx * TEGEL - links,
        y: ty * TEGEL - boven,
        url: BRT_ACHTERGRONDKAART.url
          .replace('{z}', String(z))
          .replace('{x}', String(tx))
          .replace('{y}', String(ty)),
      })
    }
  }

  // 5. Natura 2000 als één WMS-afbeelding voor precies dit beeld
  const [minX, maxY] = naarMeters(links, boven, z)
  const [maxX, minY] = naarMeters(links + breedte, boven + hoogte, z)
  const n2kUrl =
    `${NATURA2000.wmsUrl}?service=WMS&version=1.3.0&request=GetMap&layers=${NATURA2000.wmsLaag}` +
    `&styles=&crs=EPSG:3857&bbox=${minX},${minY},${maxX},${maxY}` +
    `&width=${breedte}&height=${hoogte}&format=image/png&transparent=true`

  // Hulpfuncties voor de SVG-laag
  const punt = (c: Position) => {
    const [px, py] = naarPixel(c, z)
    return [px - links, py - boven]
  }
  const pad = (f: Feature<Polygon | MultiPolygon>) => {
    const polygonen =
      f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    return polygonen
      .flat()
      .map((ring) => 'M' + ring.map((c) => punt(c).join(',')).join('L') + 'Z')
      .join(' ')
  }

  // Beschermde soorten als laatste (bovenop) tekenen
  const gesorteerd = [...waarnemingen].sort(
    (a, b) =>
      Number(!!soorten.get(a.soortKey)?.bescherming) -
      Number(!!soorten.get(b.soortKey)?.bescherming),
  )

  return (
    <figure className="statische-kaart" style={{ width: breedte }}>
      <div className="statische-kaart-beeld" style={{ width: breedte, height: hoogte }}>
        {tegels.map((t) => (
          <img key={t.url} src={t.url} alt="" style={{ left: t.x, top: t.y }} />
        ))}
        <img src={n2kUrl} alt="" className="n2k-afbeelding" style={{ left: 0, top: 0 }} />
        <svg width={breedte} height={hoogte}>
          {contouren.map((c, i) => (
            <path
              key={i}
              d={pad(c.vorm)}
              fill="none"
              stroke={c.kleur}
              strokeWidth={1.5}
              strokeDasharray={c.streep}
            />
          ))}
          {gesorteerd.map((w) => {
            const [x, y] = punt([w.lng, w.lat])
            const beschermd = !!soorten.get(w.soortKey)?.bescherming
            return (
              <circle
                key={w.key}
                cx={x}
                cy={y}
                r={beschermd ? 5 : 2.5}
                fill={beschermd ? '#c0392b' : '#555'}
                fillOpacity={beschermd ? 0.95 : 0.5}
                stroke={beschermd ? '#fff' : 'none'}
                strokeWidth={1.5}
              />
            )
          })}
          <path d={pad(gebied)} fill="rgba(211,84,0,0.15)" stroke="#d35400" strokeWidth={2.5} />
        </svg>
      </div>
      <figcaption>
        Oranje: onderzoeksgebied. Oranje stippellijn: 1 km-zone. Blauwe stippellijn: zoekgebied
        waarnemingen. Groen/blauw vlak: Natura 2000. Rode stippen: beschermde soorten (startlijst);
        grijze stippen: overige waarnemingen. Kaart: &copy; Kadaster / PDOK; Natura 2000: RVO /
        PDOK.
      </figcaption>
    </figure>
  )
}
