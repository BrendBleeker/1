# Quickscan Kaart

Webapp voor ecologen ter voorbereiding van een **quickscan flora en fauna** (Omgevingswet).
Teken een gebied op de kaart en zie welke beschermde natuurgebieden en soorten er in de buurt zijn.

> ⚠️ Deze app levert een *conceptrapport*. Het is geen vervanging voor veldonderzoek
> en de resultaten moeten altijd door een ecoloog worden beoordeeld.

## Status

| Fase | Inhoud | Status |
| ---- | ------ | ------ |
| 1 | Kaart met PDOK-achtergrond, gebied tekenen, oppervlakte in ha | ✅ |
| 2 | Lagenmenu (luchtfoto, Natura 2000, NNN) en melding binnen 1 km van Natura 2000 | ✅ |
| 3 | GBIF-waarnemingen in gebied + buffer, soortenlijst per soortgroep | ⏳ |
| 4 | Lijst beschermde soorten en soortenkalender | ⏳ |
| 5 | Printbaar conceptrapport | ⏳ |

## De app starten

Je hebt [Node.js](https://nodejs.org/) nodig (versie 20 of hoger; npm zit erbij).

```bash
npm install      # eenmalig: alle pakketten downloaden
npm run dev      # start de ontwikkelserver
```

Open daarna het adres dat in de terminal verschijnt (meestal <http://localhost:5173>).
Wijzigingen in de code zie je direct in de browser. Stoppen doe je met `Ctrl + C`.

Andere commando's:

| Commando | Wat het doet |
| -------- | ------------ |
| `npm run build` | Controleert de TypeScript-code en maakt een productieversie in `dist/` |
| `npm run preview` | Bekijk de productieversie lokaal |
| `npm run lint` | Controleert de code op veelgemaakte fouten |

## Online bekijken (GitHub Pages)

De app staat online op <https://brendbleeker.github.io/1/>.

De website komt uit de branch `gh-pages`. Die bevat alleen de gebouwde app (de inhoud van
`dist/` na `npm run build`), niet de broncode. Na elke fase wordt deze branch bijgewerkt.
In **Settings → Pages** staat de bron op *Deploy from a branch → gh-pages*.

## Gebruik

1. Zoom in op het plangebied.
2. Kies links op de kaart **Rechthoek tekenen** of **Polygoon tekenen**.
3. Klik de hoekpunten aan; sluit een polygoon af door op het eerste punt te klikken.
4. Het zijpaneel toont de oppervlakte in hectare en meldt of het gebied in of binnen 1 km van
   een Natura 2000-gebied ligt (met naam, nummer, afstand en Vogel-/Habitatrichtlijn).
   De zone van 1 km staat als oranje stippellijn op de kaart.
5. Met de overige knoppen kun je het gebied bewerken, verslepen of verwijderen.
   Een nieuw getekend gebied vervangt het vorige.
6. Via het **lagenmenu** rechtsboven kies je kaart of luchtfoto en zet je Natura 2000 en het
   Natuurnetwerk Nederland aan of uit.

## Projectstructuur

```
src/
├── main.tsx                     startpunt van de app
├── App.tsx                      hoofdcomponent: houdt het getekende gebied bij
├── index.css                    opmaak
├── config/
│   └── bronnen.ts               alle URL's van externe databronnen op één plek
├── utils/
│   └── geometrie.ts             oppervlakte, buffers (Turf.js), getallen en afstanden opmaken
├── services/
│   └── natura2000.ts            Natura 2000-gebieden ophalen (OGC API) en afstand berekenen
├── hooks/
│   └── useNatura2000.ts         zoekt automatisch opnieuw als het gebied verandert
└── components/
    ├── Kaart.tsx                Leaflet-kaart met lagenmenu en 1 km-zone
    ├── TekenGereedschap.tsx     tekenknoppen (Geoman)
    ├── Zijpaneel.tsx            informatiepaneel naast de kaart, met legenda
    └── Natura2000Melding.tsx    melding Natura 2000 (laden / fout / resultaat)
```

## Techniek

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [Leaflet](https://leafletjs.com/) via [react-leaflet](https://react-leaflet.js.org/)
- [Leaflet-Geoman](https://geoman.io/) voor het tekenen van polygonen
- [Turf.js](https://turfjs.org/) voor oppervlakte (en later buffers)
- Geen backend: alles draait in de browser.

## Databronnen

| Bron | Dienst | Gebruikt voor |
| ---- | ------ | ------------- |
| PDOK BRT-Achtergrondkaart (Kadaster) | WMTS, `https://service.pdok.nl/kadaster/brt-achtergrondkaart/wmts/v2_0` | Achtergrondkaart |
| PDOK Luchtfoto RGB (Beeldmateriaal Nederland) | WMTS, `https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0`, laag `Actueel_orthoHR` | Luchtfoto |
| Natura 2000 (RVO) | WMS, `https://service.pdok.nl/rvo/natura2000/wms/v1_0`, laag `natura2000` | Weergave op de kaart |
| Natura 2000 (RVO) | OGC API Features, `https://api.pdok.nl/rvo/natura2000/ogc/v1/collections/natura2000/items` | Controle: in of binnen 1 km? |
| Natuurnetwerk Nederland (provincies, CC0) | WMS, `https://service.pdok.nl/provincies/natuurnetwerk-nederland/wms/v1_0`, laag `PS.ProtectedSite` | Alleen weergave |

**Over het Natuurnetwerk Nederland (NNN):** er is een landelijke WMS (kaartbeelden) via PDOK,
maar geen WFS of OGC API. De app kan NNN daarom wel tonen, maar niet automatisch controleren
of het gebied erin ligt. Beoordeel dit op de kaart. BIJ12 publiceert ook een landelijke
NNN-dataset; die kan een toekomstige uitbreiding zijn.

## Mogelijke uitbreidingen

- **Waarneming.nl** en de **Nationale Databank Flora en Fauna (NDFF)** bevatten veel meer
  Nederlandse waarnemingen dan GBIF, maar vereisen een account of betaald abonnement.
  Daarom worden ze nu niet gebruikt.
