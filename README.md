# Quickscan Kaart

Webapp voor ecologen ter voorbereiding van een **quickscan flora en fauna** (Omgevingswet).
Teken een gebied op de kaart en zie welke beschermde natuurgebieden en soorten er in de buurt zijn.

> ⚠️ Deze app levert een *conceptrapport*. Het is geen vervanging voor veldonderzoek
> en de resultaten moeten altijd door een ecoloog worden beoordeeld.

## Status

| Fase | Inhoud | Status |
| ---- | ------ | ------ |
| 1 | Kaart met PDOK-achtergrond, gebied tekenen, oppervlakte in ha | ✅ |
| 2 | Lagenmenu (luchtfoto, Natura 2000) en melding binnen 1 km van Natura 2000 | ⏳ |
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

## Gebruik

1. Zoom in op het plangebied.
2. Kies links op de kaart **Rechthoek tekenen** of **Polygoon tekenen**.
3. Klik de hoekpunten aan; sluit een polygoon af door op het eerste punt te klikken.
4. Het zijpaneel toont de oppervlakte in hectare.
5. Met de overige knoppen kun je het gebied bewerken, verslepen of verwijderen.
   Een nieuw getekend gebied vervangt het vorige.

## Projectstructuur

```
src/
├── main.tsx                     startpunt van de app
├── App.tsx                      hoofdcomponent: houdt het getekende gebied bij
├── index.css                    opmaak
├── config/
│   └── bronnen.ts               alle URL's van externe databronnen op één plek
├── utils/
│   └── geometrie.ts             oppervlakte berekenen (Turf.js), getallen opmaken
└── components/
    ├── Kaart.tsx                Leaflet-kaart met PDOK-achtergrond
    ├── TekenGereedschap.tsx     tekenknoppen (Geoman)
    └── Zijpaneel.tsx            informatiepaneel naast de kaart
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

## Mogelijke uitbreidingen

- **Waarneming.nl** en de **Nationale Databank Flora en Fauna (NDFF)** bevatten veel meer
  Nederlandse waarnemingen dan GBIF, maar vereisen een account of betaald abonnement.
  Daarom worden ze nu niet gebruikt.
