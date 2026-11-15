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
| 3 | GBIF-waarnemingen in gebied + buffer, soortenlijst per soortgroep | ✅ |
| 4 | Lijst beschermde soorten en soortenkalender | ✅ |
| 5 | Printbaar conceptrapport | ✅ |
| + | Uitbreidingen na onderzoek (zie [docs/onderzoek-behoeften-ecologen.md](docs/onderzoek-behoeften-ecologen.md)) | ✅ |

**Uitbreidingen:** adres zoeken, kadastraal perceel kiezen, GeoJSON/KML in- en exporteren,
soortenlijst als CSV, deellink, historische luchtfoto's, habitat- en potentiecheck (landgebruik,
water, gebouwen met bouwjaar, bomen), invasieve exoten (Unielijst), veldplanner met zonstijden
en weer, ecologische werkkalender, veldchecklist met foto's, conceptconclusie, projecten
opslaan en de app installeren op je telefoon.

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

**Gebied bepalen**
1. Zoek een adres of plaats in de zoekbalk, of zoom in op de kaart.
2. Teken het plangebied met **Rechthoek tekenen** of **Polygoon tekenen** (links op de kaart),
   kies **🧩 Perceel kiezen** en tik op een kadastraal perceel, of **📂 Bestand inladen**
   (GeoJSON of KML in WGS84).
3. Met de knoppen op de kaart kun je het gebied bewerken, verslepen of verwijderen.

**Tabbladen** (verschijnen zodra er een gebied is)
- **Overzicht**: oppervlakte, herkomst van de begrenzing, export (GeoJSON, KML, CSV), deellink,
  Natura 2000 binnen 1 km, en de **habitat- en potentiecheck**: landgebruik, water, gebouwen met
  bouwjaar (optioneel gekleurd op de kaart), bomen en de soortgroepen met potentie.
- **Soorten**: beschermde soorten met soortenkalender, **invasieve exoten** (Unielijst) en de
  volledige soortenlijst uit GBIF (laatste 10 jaar, gebied plus instelbare buffer), met een
  zoekveld op Nederlandse of Latijnse naam.
- **Planning**: kies een datum en zie zonsopkomst/-ondergang, de onderzoeksvensters per
  soortgroep, de weersverwachting rond zonsondergang (komende 16 dagen) en welk onderzoek die
  maand past. Plus de **werkkalender**: wanneer werkzaamheden het minste risico geven.
- **Veld**: checklist voor het veldbezoek (gebouwen, bomen, water, terrein) met notities en
  foto's, en een **conceptconclusie** per soortgroep die je kunt aanpassen.

**Rapport**: **📄 Conceptrapport maken** → **Afdrukken / opslaan als PDF**.
Op een telefoon: Delen → Afdrukken → Opslaan als PDF.

**Projecten**: alles wat je invoert wordt automatisch in je browser opgeslagen. Bij het openen
ga je verder waar je was; met het menu bovenaan wissel je van project of begin je een nieuw
project. Gegevens blijven op je eigen toestel (niet in de cloud).

**Installeren**: tik op **📲 Installeren** (Chrome/Android) of in Safari op Delen → Zet op
beginscherm (iPhone). De app opent dan als losse app.

**Lagenmenu** (rechtsboven op de kaart): kaart, actuele en historische luchtfoto's
(2016–2024), Natura 2000 en het Natuurnetwerk Nederland.

**Telefoon**: de kaart staat bovenaan; met **▲ Kaart verbergen** klap je hem in.

## Projectstructuur

```
src/
├── main.tsx                     startpunt van de app
├── App.tsx                      hoofdcomponent: houdt het getekende gebied bij
├── index.css                    opmaak
├── config/
│   └── bronnen.ts               alle URL's van externe databronnen op één plek
├── utils/
│   ├── geometrie.ts             oppervlakte, buffers (Turf.js), getallen en afstanden opmaken
│   ├── soortgroepen.ts          soortgroep bepalen uit de GBIF-taxonomie
│   ├── bescherming.ts           soorten koppelen aan de lijst beschermde soorten
│   ├── datum.ts                 datums in het Nederlands
│   ├── fetchMetHerhaling.ts     opnieuw proberen bij 'te veel verzoeken' (429)
│   ├── profielen.ts             kwetsbaarheidsprofielen per soortgroep (werkkalender)
│   ├── relevanteProfielen.ts    welke soortgroepen spelen hier, en waarom
│   ├── conclusie.ts             conceptconclusie opstellen
│   ├── zon.ts                   zonsopkomst/-ondergang berekenen
│   ├── bestanden.ts             GeoJSON/KML/CSV in- en exporteren
│   ├── deellink.ts              plangebied in een link
│   ├── projecten.ts             projecten bewaren in de browser
│   ├── foto.ts                  foto's verkleinen
│   └── bouwjaar.ts              bouwjaarklassen en kleuren
├── data/
│   ├── beschermde-soorten.json  INDICATIEVE startlijst beschermde soorten + onderzoeksmaanden
│   └── veldchecklist.ts         vragen van de veldchecklist
├── types.ts                     gedeelde datatypes (Soort, Waarneming, …)
├── services/
│   ├── locatieserver.ts         adres zoeken (PDOK Locatieserver)
│   ├── kadaster.ts              perceel op een punt (BRK)
│   ├── habitat.ts               habitatcheck (Top10NL, BAG, BGT) en potentieregels
│   ├── exoten.ts                EU-Unielijst invasieve exoten (GBIF)
│   ├── weer.ts                  weersverwachting (Open-Meteo)
│   ├── natura2000.ts            Natura 2000-gebieden ophalen (OGC API) en afstand berekenen
│   ├── gbif.ts                  GBIF-waarnemingen ophalen (paginering, telling per soort)
│   └── nederlandseNamen.ts      Nederlandse soortnamen via GBIF (met cache in de browser)
├── hooks/
│   ├── useNatura2000.ts         zoekt automatisch opnieuw als het gebied verandert
│   ├── useWaarnemingen.ts       idem voor GBIF-waarnemingen
│   └── useHabitat.ts            idem voor de habitatcheck
└── components/
    ├── Kaart.tsx                Leaflet-kaart met lagenmenu en 1 km-zone
    ├── KaartGrootteBijwerken.tsx  kaart opnieuw laten meten na in-/uitklappen (mobiel)
    ├── TekenGereedschap.tsx     tekenknoppen (Geoman)
    ├── Zijpaneel.tsx            informatiepaneel naast de kaart, met legenda
    ├── Natura2000Melding.tsx    melding Natura 2000 (laden / fout / resultaat)
    ├── WaarnemingenPaneel.tsx   bufferkeuze, laadindicator, foutmelding, samenvatting
    ├── Soortenlijst.tsx         soortenlijst, groeperen en filteren
    ├── WaarnemingenLaag.tsx     waarnemingen als punten op de kaart
    ├── BeschermdeSoortenPaneel.tsx  gevonden beschermde soorten
    ├── Soortenkalender.tsx      tabel met onderzoeksmaanden
    ├── Rapport.tsx              printbaar conceptrapport
    ├── StatischeKaart.tsx       kaartafbeelding voor het rapport (PDOK-tegels + SVG)
    ├── ZoekBalk.tsx, GebiedGereedschap.tsx, KaartActies.tsx   zoeken, perceel, import/export
    ├── HabitatPaneel.tsx, PandenLaag.tsx, ExotenPaneel.tsx     habitatcheck en exoten
    ├── VeldPlanner.tsx, WerkKalender.tsx                         planning
    ├── VeldChecklist.tsx, ConclusiePaneel.tsx                    veldbezoek en conclusie
    └── ProjectenMenu.tsx, Legenda.tsx                            projecten, installeren, legenda
public/
├── manifest.webmanifest, icon-*.png   installeerbare app (PWA)
└── sw.js                        service worker: bewaart de app (niet de gegevens)
```

## Techniek

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [Leaflet](https://leafletjs.com/) via [react-leaflet](https://react-leaflet.js.org/)
- [Leaflet-Geoman](https://geoman.io/) voor het tekenen van polygonen
- [Turf.js](https://turfjs.org/) voor oppervlakte, buffers, doorsnijdingen en afstanden
- Geen backend: alles draait in de browser.

## Databronnen

| Bron | Dienst | Gebruikt voor |
| ---- | ------ | ------------- |
| PDOK BRT-Achtergrondkaart (Kadaster) | WMTS, `https://service.pdok.nl/kadaster/brt-achtergrondkaart/wmts/v2_0` | Achtergrondkaart |
| PDOK Luchtfoto RGB (Beeldmateriaal Nederland) | WMTS, `https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0`, laag `Actueel_orthoHR` | Luchtfoto |
| Natura 2000 (RVO) | WMS, `https://service.pdok.nl/rvo/natura2000/wms/v1_0`, laag `natura2000` | Weergave op de kaart |
| Natura 2000 (RVO) | OGC API Features, `https://api.pdok.nl/rvo/natura2000/ogc/v1/collections/natura2000/items` | Controle: in of binnen 1 km? |
| GBIF Occurrence Search | `https://api.gbif.org/v1/occurrence/search` | Waarnemingen (laatste 10 jaar) |
| GBIF Species | `https://api.gbif.org/v1/species/{key}/vernacularNames` | Nederlandse namen (voorkeur: Nederlands Soortenregister) |
| PDOK Luchtfoto RGB, jaargangen | WMTS, lagen `2016_ortho25` … `2024_orthoHR` | Historische luchtfoto's |
| PDOK Locatieserver | `https://api.pdok.nl/bzk/locatieserver/search/v3_1` | Adres zoeken |
| Kadastrale kaart (BRK) | OGC API `https://api.pdok.nl/kadaster/brk-kadastrale-kaart/ogc/v1`, `perceel` | Perceel als plangebied |
| TOP10NL (Kadaster) | OGC API `https://api.pdok.nl/kadaster/brt-top10nl/ogc/v1`, `terrein_vlak`, `waterdeel_*` | Landgebruik en water |
| BAG (Kadaster) | OGC API `https://api.pdok.nl/kadaster/bag/ogc/v2`, `pand` | Gebouwen met bouwjaar |
| BGT | OGC API `https://api.pdok.nl/lv/bgt/ogc/v1`, `vegetatieobject_punt` | Bomen (waar geregistreerd) |
| GBIF Unielijst (INBO, CC0) | `api.gbif.org/v1/species?datasetKey=79d65658-…` | Invasieve exoten |
| Open-Meteo | `https://api.open-meteo.com/v1/forecast` | Weersverwachting veldbezoek |
| Natuurnetwerk Nederland (provincies, CC0) | WMS, `https://service.pdok.nl/provincies/natuurnetwerk-nederland/wms/v1_0`, laag `PS.ProtectedSite` | Alleen weergave |

**Over het Natuurnetwerk Nederland (NNN):** er is een landelijke WMS (kaartbeelden) via PDOK,
maar geen WFS of OGC API. De app kan NNN daarom wel tonen, maar niet automatisch controleren
of het gebied erin ligt. Beoordeel dit op de kaart. BIJ12 publiceert ook een landelijke
NNN-dataset; die kan een toekomstige uitbreiding zijn.

### Over de GBIF-limieten

- GBIF geeft maximaal 300 waarnemingen per verzoek; de app haalt pagina's op tot maximaal
  5.000 waarnemingen (voor de punten op de kaart en de laatste datum per soort).
- De **soortenlijst en aantallen** komen uit een aparte telling per soort (facet) en zijn
  altijd volledig, ook bij meer dan 5.000 waarnemingen.
- Bij 'te veel verzoeken' (429) wacht de app even en probeert het automatisch opnieuw.
- Alleen waarnemingen op soortniveau, met coördinaten en zonder geografische fouten tellen mee.
- Nederlandse namen worden per soort opgehaald en in de browser bewaard (localStorage).

## Lijst beschermde soorten (indicatief!)

`src/data/beschermde-soorten.json` bevat een **kleine, indicatieve startlijst** van 25 bekende
beschermde soorten met beschermingsregime (Vogelrichtlijn / Habitatrichtlijn bijlage IV /
nationaal) en geschikte onderzoeksmaanden. De lijst is vereenvoudigd, niet volledig, en moet
door een ecoloog gecontroleerd worden (Omgevingswet, provinciale vrijstellingen,
Vleermuisprotocol, kennisdocumenten BIJ12). Let op: álle inheemse vogels zijn beschermd; de
app toont daarom ook een algemene regel voor broedvogels als er vogels zijn waargenomen.

Een soort toevoegen: voeg een blok toe aan `soorten` met de wetenschappelijke naam zoals GBIF
die gebruikt (controleer via <https://www.gbif.org/species/search>), eventuele `synoniemen`,
`nederlandseNaam`, `regime`, `onderzoeksmaanden` (1 = januari … 12 = december) en `toelichting`.

## Het conceptrapport

Het rapport is een gewone webpagina met print-opmaak (CSS `@media print`); de browser maakt
er een PDF van. Inhoud: kaartafbeelding, oppervlakte en middelpunt, Natura 2000 binnen 1 km,
opmerking over NNN, overzicht waargenomen soorten per groep, beschermde soorten (indicatief),
soortenkalender, bronnen met datum en tijd van ophalen, disclaimer en een bijlage met alle
waargenomen soorten.

De kaartafbeelding wordt opgebouwd uit dezelfde PDOK-kaarttegels als de app (er bestaat geen
WMS-versie van de BRT-Achtergrondkaart), met de Natura 2000-WMS en een SVG-laag erover.

## Mogelijke uitbreidingen

- **Waarneming.nl** en de **Nationale Databank Flora en Fauna (NDFF)** bevatten veel meer
  Nederlandse waarnemingen dan GBIF, maar vereisen een account of betaald abonnement.
  Daarom worden ze nu niet gebruikt.
- **Natuurnetwerk Nederland** automatisch controleren, bijvoorbeeld met de landelijke dataset
  van BIJ12 (als die als WFS/OGC API beschikbaar komt) of de provinciale diensten.
- **Rijksdriehoekscoördinaten (RD)** in het rapport (met bijv. proj4js).
- De **lijst beschermde soorten** uitbreiden en laten controleren door een ecoloog.
- **Provinciale lagen** (beheertypenkaart Natuurbeheerplan, weidevogelgebieden) per provincie.
- **AERIUS**-koppeling voor stikstof (nu alleen een verwijzing in het rapport).
- Projecten delen tussen toestellen (nu alleen lokaal en via deellink/bestand).
