import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

interface Props {
  /** Verandert deze waarde, dan is de kaart (mogelijk) van grootte veranderd */
  sleutel: string
}

/**
 * Leaflet merkt niet vanzelf dat de kaart groter of kleiner wordt (bijv. bij in-/uitklappen
 * op de telefoon). Dit onderdeel laat de kaart dan zijn afmetingen opnieuw bepalen.
 */
export default function KaartGrootteBijwerken({ sleutel }: Props) {
  const map = useMap()
  useEffect(() => {
    // Even wachten tot de CSS-overgang klaar is
    const timer = setTimeout(() => map.invalidateSize(), 250)
    return () => clearTimeout(timer)
  }, [map, sleutel])
  return null
}
