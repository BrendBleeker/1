import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import type { Feature, Polygon } from 'geojson'

/** Een gebied dat van buitenaf op de kaart gezet wordt (perceel, bestand, link, project). */
export interface ExternGebied {
  gebied: Feature<Polygon>
  /** Verhogen om hetzelfde gebied opnieuw te plaatsen */
  versie: number
}

/** Hoe het gebied veranderd is. */
export type GebiedBron = 'getekend' | 'bewerkt' | 'extern' | 'verwijderd'

interface Props {
  /** Wordt aangeroepen als het gebied getekend, bewerkt, ingeladen of verwijderd (null) is. */
  onGebiedGewijzigd: (gebied: Feature<Polygon> | null, bron: GebiedBron) => void
  extern: ExternGebied | null
}

const STIJL = { color: '#d35400', weight: 3, fillOpacity: 0.15 }

/**
 * Voegt de Geoman-tekenknoppen toe aan de kaart.
 * Er is steeds maar één onderzoeksgebied: tekenen (of een gebied inladen)
 * vervangt het vorige.
 */
export default function TekenGereedschap({ onGebiedGewijzigd, extern }: Props) {
  const map = useMap()
  const huidigeLaag = useRef<L.Polygon | null>(null)
  // Altijd de nieuwste callback gebruiken, ook vanuit Leaflet-events
  const melden = useRef(onGebiedGewijzigd)
  useEffect(() => {
    melden.current = onGebiedGewijzigd
  }, [onGebiedGewijzigd])

  /** Maakt een laag het nieuwe onderzoeksgebied. */
  const maakHuidig = (laag: L.Polygon, bron: GebiedBron) => {
    if (huidigeLaag.current && huidigeLaag.current !== laag) map.removeLayer(huidigeLaag.current)
    huidigeLaag.current = laag
    const bewerkt = () => melden.current(laag.toGeoJSON() as Feature<Polygon>, 'bewerkt')
    laag.on('pm:edit', bewerkt)
    laag.on('pm:dragend', bewerkt)
    melden.current(laag.toGeoJSON() as Feature<Polygon>, bron)
  }

  // Tekenknoppen eenmalig toevoegen
  useEffect(() => {
    map.pm.setLang('nl')
    map.pm.addControls({
      position: 'topleft',
      drawPolygon: true,
      drawRectangle: true,
      editMode: true,
      dragMode: true,
      removalMode: true,
      // Uitzetten wat we niet nodig hebben
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawCircle: false,
      drawText: false,
      cutPolygon: false,
      rotateMode: false,
    })
    map.pm.setPathOptions(STIJL)
    // Polygonen mogen zichzelf niet kruisen (dan klopt de oppervlakte niet)
    map.pm.setGlobalOptions({ allowSelfIntersection: false })

    const bijTekenen = (e: { layer: L.Layer }) => maakHuidig(e.layer as L.Polygon, 'getekend')
    const bijVerwijderen = (e: { layer: L.Layer }) => {
      if (e.layer === huidigeLaag.current) {
        huidigeLaag.current = null
        melden.current(null, 'verwijderd')
      }
    }
    map.on('pm:create', bijTekenen)
    map.on('pm:remove', bijVerwijderen)

    return () => {
      map.off('pm:create', bijTekenen)
      map.off('pm:remove', bijVerwijderen)
      map.pm.removeControls()
      if (huidigeLaag.current) map.removeLayer(huidigeLaag.current)
      huidigeLaag.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  // Gebied van buitenaf op de kaart zetten en erop inzoomen
  useEffect(() => {
    if (!extern) return
    const ringen = extern.gebied.geometry.coordinates.map((ring) =>
      ring.map(([lng, lat]) => L.latLng(lat, lng)),
    )
    const laag = L.polygon(ringen, STIJL).addTo(map)
    maakHuidig(laag, 'extern')
    map.fitBounds(laag.getBounds(), { padding: [40, 40], maxZoom: 18 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, extern])

  return null
}
