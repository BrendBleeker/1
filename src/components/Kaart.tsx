import { useMemo } from 'react'
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  LayersControl,
  ScaleControl,
  GeoJSON,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Feature, Polygon } from 'geojson'
import TekenGereedschap from './TekenGereedschap'
import {
  BRT_ACHTERGRONDKAART,
  LUCHTFOTO,
  NATURA2000,
  NATUURNETWERK,
  NATURA2000_ZOEKAFSTAND_M,
  NEDERLAND_MIDDEN,
  NEDERLAND_ZOOM,
} from '../config/bronnen'
import { bufferGebied } from '../utils/geometrie'

interface Props {
  gebied: Feature<Polygon> | null
  onGebiedGewijzigd: (gebied: Feature<Polygon> | null) => void
}

/** De kaart van Nederland met lagenmenu en tekengereedschap. */
export default function Kaart({ gebied, onGebiedGewijzigd }: Props) {
  // De 1 km-zone rond het getekende gebied (alleen ter informatie op de kaart)
  const zone = useMemo(
    () => (gebied ? bufferGebied(gebied, NATURA2000_ZOEKAFSTAND_M) : null),
    [gebied],
  )

  return (
    <MapContainer
      center={NEDERLAND_MIDDEN}
      zoom={NEDERLAND_ZOOM}
      minZoom={6}
      maxZoom={LUCHTFOTO.maxZoom}
      className="kaart"
      // Alleen tijdens ontwikkelen: kaart bereikbaar maken voor tests in de browser
      ref={(kaart) => {
        if (import.meta.env.DEV && kaart) Object.assign(window, { __kaart: kaart })
      }}
    >
      <LayersControl position="topright">
        {/* Achtergronden: er staat er altijd precies één aan */}
        <LayersControl.BaseLayer checked name="Kaart (BRT)">
          <TileLayer
            url={BRT_ACHTERGRONDKAART.url}
            attribution={BRT_ACHTERGRONDKAART.attributie}
            maxNativeZoom={BRT_ACHTERGRONDKAART.maxZoom}
            maxZoom={LUCHTFOTO.maxZoom}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Luchtfoto">
          <TileLayer
            url={LUCHTFOTO.url}
            attribution={LUCHTFOTO.attributie}
            maxZoom={LUCHTFOTO.maxZoom}
          />
        </LayersControl.BaseLayer>

        {/* Extra lagen: los aan en uit te zetten */}
        <LayersControl.Overlay checked name="Natura 2000">
          <WMSTileLayer
            url={NATURA2000.wmsUrl}
            layers={NATURA2000.wmsLaag}
            format="image/png"
            transparent
            opacity={0.6}
            zIndex={20} // boven de NNN-laag
            attribution={NATURA2000.attributie}
          />
        </LayersControl.Overlay>
        <LayersControl.Overlay name="Natuurnetwerk Nederland (NNN)">
          <WMSTileLayer
            url={NATUURNETWERK.wmsUrl}
            layers={NATUURNETWERK.wmsLaag}
            styles={NATUURNETWERK.wmsStijl}
            format="image/png"
            transparent
            opacity={0.45}
            zIndex={10}
            className="laag-nnn"
            attribution={NATUURNETWERK.attributie}
          />
        </LayersControl.Overlay>
      </LayersControl>

      {zone && (
        // key zorgt dat de laag ververst als het gebied verandert
        <GeoJSON
          key={JSON.stringify(gebied?.geometry.coordinates)}
          data={zone}
          interactive={false}
          style={{ color: '#d35400', weight: 1.5, dashArray: '6 6', fill: false }}
        />
      )}

      <ScaleControl imperial={false} position="bottomright" />
      <TekenGereedschap onGebiedGewijzigd={onGebiedGewijzigd} />
    </MapContainer>
  )
}
