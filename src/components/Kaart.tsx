import { MapContainer, TileLayer, ScaleControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Feature, Polygon } from 'geojson'
import TekenGereedschap from './TekenGereedschap'
import { BRT_ACHTERGRONDKAART, NEDERLAND_MIDDEN, NEDERLAND_ZOOM } from '../config/bronnen'

interface Props {
  onGebiedGewijzigd: (gebied: Feature<Polygon> | null) => void
}

/** De kaart van Nederland met PDOK-achtergrond en tekengereedschap. */
export default function Kaart({ onGebiedGewijzigd }: Props) {
  return (
    <MapContainer
      center={NEDERLAND_MIDDEN}
      zoom={NEDERLAND_ZOOM}
      minZoom={6}
      maxZoom={BRT_ACHTERGRONDKAART.maxZoom}
      className="kaart"
    >
      <TileLayer
        url={BRT_ACHTERGRONDKAART.url}
        attribution={BRT_ACHTERGRONDKAART.attributie}
        maxZoom={BRT_ACHTERGRONDKAART.maxZoom}
      />
      <ScaleControl imperial={false} position="bottomright" />
      <TekenGereedschap onGebiedGewijzigd={onGebiedGewijzigd} />
    </MapContainer>
  )
}
