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

/** Startweergave: heel Nederland. */
export const NEDERLAND_MIDDEN: [number, number] = [52.15, 5.3]
export const NEDERLAND_ZOOM = 8
