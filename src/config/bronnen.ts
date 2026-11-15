// Centrale lijst met alle externe databronnen.
// Elke URL hieronder is gecontroleerd tegen de GetCapabilities van de dienst
// voordat hij in de app is gebruikt.

/**
 * PDOK BRT-Achtergrondkaart (Kadaster), WMTS.
 * Capabilities: https://service.pdok.nl/kadaster/brt-achtergrondkaart/wmts/v2_0?request=GetCapabilities&service=WMTS
 * Tegelset EPSG:3857 (de standaard van Leaflet), zoomniveau 0 t/m 19.
 */
export const BRT_ACHTERGRONDKAART = {
  naam: 'BRT-Achtergrondkaart (PDOK / Kadaster)',
  url: 'https://service.pdok.nl/kadaster/brt-achtergrondkaart/wmts/v2_0/standaard/EPSG:3857/{z}/{x}/{y}.png',
  attributie:
    'Kaartgegevens &copy; <a href="https://www.kadaster.nl">Kadaster</a> / <a href="https://www.pdok.nl">PDOK</a>',
  maxZoom: 19,
}

/**
 * PDOK Luchtfoto RGB (Beeldmateriaal Nederland), WMTS, laag Actueel_orthoHR (hoge resolutie).
 * Capabilities: https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0?request=GetCapabilities&service=WMTS
 * Tegelset EPSG:3857, zoomniveau 0 t/m 21.
 */
export const LUCHTFOTO = {
  naam: 'Luchtfoto actueel (PDOK / Beeldmateriaal Nederland)',
  url: 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.jpeg',
  attributie:
    'Luchtfoto &copy; <a href="https://www.beeldmateriaal.nl">Beeldmateriaal Nederland</a> / PDOK',
  maxZoom: 21,
}

/**
 * Natura 2000-gebieden (RVO / ministerie van LVVN) via PDOK.
 * - WMS voor weergave: laag "natura2000"
 *   Capabilities: https://service.pdok.nl/rvo/natura2000/wms/v1_0?request=GetCapabilities&service=WMS
 * - OGC API Features voor de afstandscontrole (GeoJSON, CORS toegestaan)
 *   https://api.pdok.nl/rvo/natura2000/ogc/v1/collections/natura2000/items
 */
export const NATURA2000 = {
  naam: 'Natura 2000 (RVO via PDOK)',
  wmsUrl: 'https://service.pdok.nl/rvo/natura2000/wms/v1_0',
  wmsLaag: 'natura2000',
  apiItemsUrl: 'https://api.pdok.nl/rvo/natura2000/ogc/v1/collections/natura2000/items',
  attributie: 'Natura 2000 &copy; RVO / PDOK',
}

/**
 * Natuurnetwerk Nederland – Provincies (INSPIRE geharmoniseerd) via PDOK, licentie CC0.
 * Alleen een WMS beschikbaar (geen WFS/OGC API), dus alleen weergave, geen automatische check.
 * Capabilities: https://service.pdok.nl/provincies/natuurnetwerk-nederland/wms/v1_0?request=GetCapabilities&service=WMS
 */
export const NATUURNETWERK = {
  naam: 'Natuurnetwerk Nederland (provincies via PDOK)',
  wmsUrl: 'https://service.pdok.nl/provincies/natuurnetwerk-nederland/wms/v1_0',
  wmsLaag: 'PS.ProtectedSite',
  // Deze stijl tekent groene vlakken; in de app kleuren we ze om naar paars (zie index.css)
  wmsStijl: 'PS.ProtectedSitesSpecialAreaOfConservation',
  attributie: 'NNN &copy; Provincies / PDOK',
}

/** Afstand (in meters) waarbinnen we Natura 2000-gebieden melden. */
export const NATURA2000_ZOEKAFSTAND_M = 1000

/** Startweergave: heel Nederland. */
export const NEDERLAND_MIDDEN: [number, number] = [52.15, 5.3]
export const NEDERLAND_ZOOM = 8
