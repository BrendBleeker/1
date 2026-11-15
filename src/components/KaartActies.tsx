import { useEffect } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'

export interface VliegNaar {
  lat: number
  lng: number
  zoom: number
  /** Verhogen om opnieuw naar dezelfde plek te gaan */
  versie: number
}

interface Props {
  vliegNaar: VliegNaar | null
  /** Als ingevuld: een klik op de kaart wordt doorgegeven (bijv. om een perceel te kiezen) */
  onKlik: ((lat: number, lng: number) => void) | null
}

/** Kleine hulpacties op de kaart: naar een locatie gaan en kliks doorgeven. */
export default function KaartActies({ vliegNaar, onKlik }: Props) {
  const map = useMap()

  useEffect(() => {
    if (vliegNaar) map.setView([vliegNaar.lat, vliegNaar.lng], vliegNaar.zoom)
  }, [map, vliegNaar])

  // Muisaanwijzer als kruisje zolang je een perceel kiest
  useEffect(() => {
    map.getContainer().style.cursor = onKlik ? 'crosshair' : ''
  }, [map, onKlik])

  useMapEvents({
    click(e) {
      onKlik?.(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}
