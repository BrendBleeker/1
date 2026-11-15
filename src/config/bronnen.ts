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

/**
 * GBIF Occurrence Search API (open data, CORS toegestaan).
 * Documentatie: https://techdocs.gbif.org/en/openapi/v1/occurrence
 * - maximaal 300 resultaten per verzoek (limit)
 * - geometry als WKT-polygoon, tegen de klok in
 */
export const GBIF = {
  naam: 'GBIF – Global Biodiversity Information Facility',
  zoekUrl: 'https://api.gbif.org/v1/occurrence/search',
  soortUrl: 'https://api.gbif.org/v1/species',
  websiteZoekUrl: 'https://www.gbif.org/occurrence/search',
  /** Max. resultaten per verzoek (harde grens van GBIF) */
  paginaGrootte: 300,
  /** Max. aantal waarnemingen dat we als punten ophalen */
  maxWaarnemingen: 5000,
  /** Hoeveel jaar terug we zoeken */
  jarenTerug: 10,
}

/** Keuzes voor de zoekbuffer rond het gebied bij het zoeken naar waarnemingen (meters). */
export const WAARNEMING_BUFFERS_M = [0, 100, 250, 500, 1000]
export const STANDAARD_WAARNEMING_BUFFER_M = 250

/**
 * Historische luchtfoto's (PDOK Luchtfoto RGB, zelfde WMTS als LUCHTFOTO, andere laag).
 * Laagnamen gecontroleerd in de GetCapabilities; alle jaargangen werken tot zoom 21.
 */
export const LUCHTFOTO_JAARGANGEN = [
  { jaar: 2024, laag: '2024_orthoHR' },
  { jaar: 2022, laag: '2022_orthoHR' },
  { jaar: 2020, laag: '2020_ortho25' },
  { jaar: 2018, laag: '2018_ortho25' },
  { jaar: 2016, laag: '2016_ortho25' },
].map((j) => ({
  ...j,
  url: `https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/${j.laag}/EPSG:3857/{z}/{x}/{y}.jpeg`,
}))

/**
 * PDOK Locatieserver: zoeken op adres, straat, postcode, plaats (CORS toegestaan).
 * https://api.pdok.nl/bzk/locatieserver/search/v3_1/ui/
 */
export const LOCATIESERVER = {
  suggestUrl: 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest',
  lookupUrl: 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup',
}

/** Kadastrale kaart (BRK) als OGC API: percelen. */
export const KADASTER_PERCELEN = {
  naam: 'Kadastrale kaart (BRK, Kadaster via PDOK)',
  itemsUrl: 'https://api.pdok.nl/kadaster/brk-kadastrale-kaart/ogc/v1/collections/perceel/items',
}
