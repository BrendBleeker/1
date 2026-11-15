/**
 * Kwetsbaarheidsprofielen per soortgroep: in welke maanden geven werkzaamheden (sloop, kap,
 * grondwerk, dempen) het meeste risico op het overtreden van verboden?
 *
 * INDICATIEF. Per maand: 2 = kwetsbaar, 1 = let op, 0 = relatief gunstig.
 * Gebaseerd op algemene kennis van levenscycli (kraamperiode, winterslaap, broedseizoen,
 * voortplanting). Altijd toetsen aan actuele protocollen en de situatie ter plaatse.
 */
export type ProfielId =
  | 'vleermuizen-gebouw'
  | 'vleermuizen-boom'
  | 'jaarrond-nesten'
  | 'broedvogels'
  | 'zoogdieren'
  | 'amfibieen'
  | 'reptielen'
  | 'vissen'
  | 'planten'

export interface Profiel {
  id: ProfielId
  naam: string
  /** 12 waarden, januari t/m december */
  maanden: (0 | 1 | 2)[]
  toelichting: string
}

export const PROFIELEN: Record<ProfielId, Profiel> = {
  'vleermuizen-gebouw': {
    id: 'vleermuizen-gebouw',
    naam: 'Vleermuizen in gebouwen',
    maanden: [2, 2, 1, 0, 1, 2, 2, 2, 1, 0, 1, 2],
    toelichting:
      'Kwetsbaar in de winterslaap (dec–feb) en de kraamperiode (half mei–half juli) en paarperiode (aug–sep). Relatief gunstig: april en oktober, na onderzoek en met vergunning.',
  },
  'vleermuizen-boom': {
    id: 'vleermuizen-boom',
    naam: 'Vleermuizen in bomen',
    maanden: [2, 2, 1, 0, 1, 2, 2, 2, 1, 0, 1, 2],
    toelichting:
      'Bomen met holtes kunnen jaarrond in gebruik zijn. Kap het liefst in april of oktober, na controle op bewoning.',
  },
  'jaarrond-nesten': {
    id: 'jaarrond-nesten',
    naam: 'Vogels met jaarrond beschermde nesten',
    maanden: [1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1],
    toelichting:
      'Nestplaatsen (huismus, gierzwaluw, uilen, roofvogels) zijn het hele jaar beschermd. Buiten het broedseizoen is verstoring kleiner, maar ingrijpen vraagt altijd onderzoek en meestal een vergunning.',
  },
  broedvogels: {
    id: 'broedvogels',
    naam: 'Broedvogels (algemeen)',
    maanden: [0, 0, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0],
    toelichting:
      'Nesten in gebruik zijn beschermd; het broedseizoen is globaal half maart–half juli. Werk buiten deze periode, of laat vooraf controleren op nesten.',
  },
  zoogdieren: {
    id: 'zoogdieren',
    naam: 'Grondgebonden zoogdieren (das, steenmarter, eekhoorn)',
    maanden: [1, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 1],
    toelichting:
      'Voortplantingsperiode globaal februari–juni (jongen in burcht, nest of kobel). Najaar is meestal het gunstigst.',
  },
  amfibieen: {
    id: 'amfibieen',
    naam: 'Amfibieën',
    maanden: [2, 2, 2, 2, 2, 1, 1, 0, 0, 1, 2, 2],
    toelichting:
      'Voortplanting in het water (maart–juni) en winterrust op het land (november–februari). Werk aan water bij voorkeur augustus–september.',
  },
  reptielen: {
    id: 'reptielen',
    naam: 'Reptielen',
    maanden: [2, 2, 2, 0, 1, 1, 1, 0, 0, 1, 2, 2],
    toelichting:
      'Winterrust (november–maart) is kwetsbaar omdat dieren niet kunnen vluchten. Werk bij voorkeur in april of augustus–september, bij warm weer.',
  },
  vissen: {
    id: 'vissen',
    naam: 'Vissen (bijv. grote modderkruiper)',
    maanden: [1, 1, 1, 2, 2, 2, 1, 0, 0, 0, 1, 1],
    toelichting:
      'Paaitijd globaal april–juni. Baggeren of dempen bij voorkeur in augustus–oktober, met afvissen volgens gedragscode.',
  },
  planten: {
    id: 'planten',
    naam: 'Beschermde planten',
    maanden: [0, 0, 1, 1, 2, 2, 2, 1, 0, 0, 0, 0],
    toelichting:
      'Inventariseren in de bloeitijd; werkzaamheden bij voorkeur na zaadzetting (najaar/winter), eventueel na verplanten.',
  },
}
