# Wat hebben ecologen nodig bij een quickscan?

*Verkennend onderzoek voor de Quickscan Kaart, november 2026.*
*Methode: analyse van gepubliceerde quickscanrapporten (ruimtelijkeplannen.nl, officiële
overheidspublicaties), overheidsinformatie (IPLO, RVO), en een inventarisatie van open
databronnen (PDOK, GBIF). Geen interviews; de bevindingen zijn dus een eerste verkenning.*

## 1. Hoe ziet een quickscan flora en fauna eruit?

Uit gepubliceerde rapporten blijkt een vrij vaste opbouw:

1. **Aanleiding en doel**: welke activiteiten (sloop, kap, nieuwbouw, grondwerk) worden getoetst.
2. **Bureauonderzoek**: bekende waarnemingen in en rond het plangebied (meestal NDFF, vaak in
   een straal van enkele kilometers), verspreidingsatlassen, gegevens van PGO's.
3. **Veldbezoek**: vooral een **potentiebepaling**: zijn er geschikte plekken voor beschermde
   soorten (gebouwen, bomen, water, groen) en zijn er sporen?
4. **Toetsing gebiedsbescherming**: Natura 2000 (algemene en specifieke zorgplicht) en het
   Natuurnetwerk Nederland.
5. **Toetsing soortbescherming**: per soortgroep (vleermuizen, vogels met jaarrond beschermde
   nesten, grondgebonden zoogdieren, amfibieën, reptielen, planten, overig).
6. **Conclusie en vervolg**: is nader onderzoek nodig, welke maatregelen, en wanneer.

Een quickscan kan afwezigheid niet garanderen: nachtactieve soorten of soorten die een deel van
het jaar elders zijn, worden bij één bezoek vaak gemist. Daarom volgt vaak **nader onderzoek**
volgens protocol (bijv. Vleermuisprotocol NGB 2021, kennisdocumenten BIJ12).

## 2. Waar lopen ecologen tegenaan?

| Knelpunt | Toelichting | Kans voor de app |
| --- | --- | --- |
| Veel losse bronnen | Kaarten, NDFF, BAG, luchtfoto's en provinciale lagen staan op verschillende plekken | Alles op één kaart, automatisch per plangebied |
| Potentie inschatten kost tijd | Bouwjaar, daktype, bomen en water moeten handmatig worden opgezocht | Automatische **habitat- en potentiecheck** met BAG, Top10NL en BGT |
| Timing van vervolgonderzoek | Onderzoek moet in vaste periodes en op vaste tijden rond zonsopkomst/-ondergang | **Veldbezoekplanner** met zonstijden en onderzoeksvensters |
| Planning van werkzaamheden | Opdrachtgevers willen weten wanneer ze mogen slopen/kappen | **Ecologische werkkalender**: wanneer is de kans op verstoring het kleinst |
| Invasieve exoten | Sinds augustus 2025 staan Aziatische duizendknopen op de Unielijst; grondeigenaren hebben een zorgplicht | **Exoten-signalering** in soortenlijst en rapport |
| Veldwerk op locatie | Slecht bereik, notities en foto's op papier, later overtypen | **Veldchecklist** in de app, gegevens bewaard op het toestel |
| Uitwisseling met GIS | Plangebied komt vaak als bestand (KML/GeoJSON) en moet naar QField/Avenza | **Importeren/exporteren** van het plangebied |
| Rapporten schrijven | Steeds dezelfde teksten | **Conceptconclusie** met vervolgstappen per soortgroep |

## 3. Bruikbare open databronnen (gecontroleerd)

| Bron | Dienst | Bruikbaar voor |
| --- | --- | --- |
| PDOK Locatieserver | `api.pdok.nl/bzk/locatieserver/search/v3_1` | Zoeken op adres, plaats, postcode |
| BAG (Kadaster) | OGC API `api.pdok.nl/kadaster/bag/ogc/v2`, collectie `pand` | Gebouwen met **bouwjaar** en gebruiksdoel |
| Kadastrale kaart | OGC API `api.pdok.nl/kadaster/brk-kadastrale-kaart/ogc/v1`, `perceel` | Plangebied = perceel; perceelnummer in rapport |
| TOP10NL | OGC API `api.pdok.nl/kadaster/brt-top10nl/ogc/v1`, `terrein_vlak`, `waterdeel_vlak` | Landgebruik (bos, grasland, …) en water |
| BGT | OGC API `api.pdok.nl/lv/bgt/ogc/v1`, `vegetatieobject_punt` (`plus_type = boom`) | Bomen (alleen waar de gemeente ze registreert) |
| Luchtfoto PDOK | WMTS met jaargangen 2016–2026 | Historische vergelijking |
| GBIF Unielijst | Checklist `79d65658-526c-4c78-9d24-1870d67f8439` (INBO, CC0, bijgewerkt sept. 2025) | Invasieve exoten herkennen |
| GBIF IUCN | `/v1/species/{key}/iucnRedListCategory` | Mondiale Rode Lijst (minder relevant voor NL) |

Niet (landelijk) open beschikbaar: NDFF en Waarneming.nl (account/betaald), AERIUS (wel
webapplicatie), beheertypenkaart Natuurbeheerplan (alleen per provincie).

## 4. Ideeën voor de app

1. **Adres zoeken** en **perceel aanklikken** als plangebied.
2. **Importeren/exporteren** (GeoJSON, KML), **soortenlijst als CSV**, **deellink**.
3. **Habitat- en potentiecheck**: landgebruik, water, bomen en gebouwen (bouwjaar), met
   automatische hints welke soortgroepen potentie hebben.
4. **Invasieve exoten (Unielijst)** markeren.
5. **Veldbezoekplanner**: zonsopkomst/-ondergang op locatie en de onderzoeksvensters.
6. **Ecologische werkkalender**: wanneer werkzaamheden het minst verstoren.
7. **Veldchecklist** met notities, bewaard op het toestel en meegenomen in het rapport.
8. **Conceptconclusie** met vervolgstappen in het rapport.
9. **Historische luchtfoto's** (jaar kiezen).
10. **Projecten opslaan** in de browser en de app **installeerbaar** maken op de telefoon.
11. **Links per soort** naar kennisdocument of soortpagina.
12. **Stikstof**: verwijzing naar AERIUS Calculator in het rapport.

## Bronnen

- Voorbeelden van quickscanrapporten: [Staatsbosbeheer, Wilhelminahoeve](https://www.staatsbosbeheer.nl/-/media/12-zakendoen/vastgoed/te-huur-en-te-koop/wilhelminahoeve-waddinxveen/wilhelminahoeve-bijlage-5-quickscan-flora-en-fauna.pdf),
  [Ridderkerk, ecologisch onderzoek](https://openpub.ridderkerk.nl/wp-content/uploads/sites/3/2024/06/4.-Ecologisch-onderzoek.pdf),
  [Quickscan schuur Brouwershaven](https://repository.officiele-overheidspublicaties.nl/Bijlagen/TerInzageLegging/2026/til-2026-17893/1/bijlage/798836-03_Quickscan_schuur_2_Nieuwstad_Brouweshaven.pdf),
  [Ecologisch quickscanrapport 04521699](https://repository.officiele-overheidspublicaties.nl/Bijlagen/TerInzageLegging/2026/til-2026-26147/1/bijlage/Ecologisch_quickscan_rapport_-_nr_04521699_(Geanonimiseerd).pdf)
- Omgevingswet en flora- en fauna-activiteit: [Omgevingsweb, blogreeks soortenbescherming](https://omgevingsweb.nl/nieuws/blogreeks-soortenbescherming-deel-1-de-omgevingsvergunning-voor-een-flora-en-fauna-activiteit/)
- Protocollen en tijdstippen (voorbeelden): [Bijlage 08, onderzoek gebouwbewonende soorten](https://repository.officiele-overheidspublicaties.nl/Bijlagen/TerInzageLegging/2026/til-2026-29904/1/bijlage/Bijlage_08.pdf)
- Invasieve exoten: [RVO, duizendknoop](https://www.rvo.nl/onderwerpen/invasieve-exoten/duizendknoop),
  [IPLO, rijksregels invasieve exoten](https://iplo.nl/regelgeving/regels-voor-activiteiten/activiteiten-natuur/invasieve-uitheemse-soorten-invasieve-exoten/rijksregels-invasieve-uitheemse-soorten-invasieve/)
- Veldwerk-apps: [QField, ecological surveying](https://qfield.org/docs/case-studies/ecological-surveying.html)
- Natuurbeheerplan (provinciaal): [data.overheid.nl, Natuurbeheerplan 2027](https://data.overheid.nl/en/dataset/77588-natuurbeheerplan-2027---beheergebied)
- PDOK: [Location API](https://pdok.nl/documents/d/pdok/handout-location-api-2), [BAG OGC API](https://api.pdok.nl/kadaster/bag/ogc/v2/), [Kadastrale kaart OGC API](https://api.pdok.nl/kadaster/brk-kadastrale-kaart/ogc/v1)
