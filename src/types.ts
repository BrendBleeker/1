// Gedeelde datatypes voor de hele app.

/** De soortgroepen waarop de soortenlijst gegroepeerd kan worden. */
export type Soortgroep =
  | 'vogels'
  | 'zoogdieren'
  | 'amfibieen'
  | 'reptielen'
  | 'planten'
  | 'insecten'
  | 'overig'

/** Eén waarneming uit GBIF (alleen de velden die we gebruiken). */
export interface Waarneming {
  key: number
  soortKey: number
  wetenschappelijkeNaam: string
  /** Datum als tekst (JJJJ-MM-DD), soms alleen JJJJ-MM of JJJJ */
  datum: string
  lat: number
  lng: number
  bron: string
}

/** Beschermingsregime volgens de Omgevingswet (indicatief). */
export type Beschermingsregime = 'Vogelrichtlijn' | 'Habitatrichtlijn bijlage IV' | 'Nationaal'

/** Een soort uit src/data/beschermde-soorten.json */
export interface BeschermdeSoort {
  wetenschappelijkeNaam: string
  /** Andere wetenschappelijke namen waaronder de soort in GBIF kan staan */
  synoniemen?: string[]
  nederlandseNaam: string
  regime: Beschermingsregime
  /** Maanden (1 = januari … 12 = december) waarin onderzoek geschikt is */
  onderzoeksmaanden: number[]
  toelichting: string
}

/** Een soort in de soortenlijst: samenvatting van alle waarnemingen. */
export interface Soort {
  key: number
  wetenschappelijkeNaam: string
  nederlandseNaam?: string
  groep: Soortgroep
  /** Aantal waarnemingen (volledig, uit de GBIF-telling) */
  aantal: number
  /** Laatste waarnemingsdatum binnen de geladen waarnemingen */
  laatsteDatum?: string
  /** Ingevuld als de soort op de (indicatieve) lijst van beschermde soorten staat */
  bescherming?: BeschermdeSoort
  /** true als de soort op de EU-Unielijst van invasieve exoten staat */
  exoot?: boolean
}
