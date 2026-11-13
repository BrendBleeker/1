import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import type { Feature, Polygon } from 'geojson'

interface Props {
  /** Wordt aangeroepen als het gebied getekend, bewerkt of verwijderd is (null). */
  onGebiedGewijzigd: (gebied: Feature<Polygon> | null) => void
}

/**
 * Voegt de Geoman-tekenknoppen toe aan de kaart.
 * Er is steeds maar één onderzoeksgebied: tekenen van een nieuw gebied
 * vervangt het vorige.
 */
export default function TekenGereedschap({ onGebiedGewijzigd }: Props) {
  const map = useMap()

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
    map.pm.setPathOptions({ color: '#d35400', weight: 3, fillOpacity: 0.15 })
    // Polygonen mogen zichzelf niet kruisen (dan klopt de oppervlakte niet)
    map.pm.setGlobalOptions({ allowSelfIntersection: false })

    let huidigeLaag: L.Polygon | null = null

    const meldGebied = () => {
      if (!huidigeLaag) {
        onGebiedGewijzigd(null)
        return
      }
      onGebiedGewijzigd(huidigeLaag.toGeoJSON() as Feature<Polygon>)
    }

    const bijTekenen = (e: { layer: L.Layer }) => {
      // Oude tekening weghalen: er is maar één onderzoeksgebied
      if (huidigeLaag) map.removeLayer(huidigeLaag)
      huidigeLaag = e.layer as L.Polygon
      huidigeLaag.on('pm:edit', meldGebied)
      huidigeLaag.on('pm:dragend', meldGebied)
      meldGebied()
    }

    const bijVerwijderen = (e: { layer: L.Layer }) => {
      if (e.layer === huidigeLaag) {
        huidigeLaag = null
        meldGebied()
      }
    }

    map.on('pm:create', bijTekenen)
    map.on('pm:remove', bijVerwijderen)

    return () => {
      map.off('pm:create', bijTekenen)
      map.off('pm:remove', bijVerwijderen)
      map.pm.removeControls()
      if (huidigeLaag) map.removeLayer(huidigeLaag)
    }
  }, [map, onGebiedGewijzigd])

  return null
}
