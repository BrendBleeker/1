import type { ProfielId } from '../utils/profielen'

/** Antwoord op een checklistpunt. */
export type Antwoord = 'ja' | 'nee' | 'onbekend'

export interface ChecklistItem {
  id: string
  tekst: string
  /** Welke soortgroepen potentie krijgen als het antwoord 'ja' is */
  profielen: ProfielId[]
}

export interface ChecklistGroep {
  id: string
  naam: string
  items: ChecklistItem[]
}

/** Checklist voor het veldbezoek (potentiebepaling). */
export const CHECKLIST: ChecklistGroep[] = [
  {
    id: 'gebouwen',
    naam: 'Gebouwen',
    items: [
      {
        id: 'g1',
        tekst: 'Open stootvoegen, kieren of gaten in gevels',
        profielen: ['vleermuizen-gebouw', 'jaarrond-nesten'],
      },
      {
        id: 'g2',
        tekst: 'Pannendak met ruimte onder de pannen / losse daklijsten',
        profielen: ['jaarrond-nesten', 'vleermuizen-gebouw'],
      },
      { id: 'g3', tekst: 'Spouwmuur of houten betimmering', profielen: ['vleermuizen-gebouw'] },
      {
        id: 'g4',
        tekst: 'Toegankelijke zolder, kelder of schuur',
        profielen: ['vleermuizen-gebouw', 'zoogdieren'],
      },
      {
        id: 'g5',
        tekst: 'Sporen: uitwerpselen, vraatresten, nestmateriaal',
        profielen: ['vleermuizen-gebouw', 'jaarrond-nesten'],
      },
      {
        id: 'g6',
        tekst: 'Nestkasten of nesten aan het gebouw',
        profielen: ['jaarrond-nesten', 'broedvogels'],
      },
    ],
  },
  {
    id: 'bomen',
    naam: 'Bomen en beplanting',
    items: [
      {
        id: 'b1',
        tekst: 'Bomen met holtes, spleten of loszittende schors',
        profielen: ['vleermuizen-boom'],
      },
      { id: 'b2', tekst: 'Horsten of grote nesten', profielen: ['jaarrond-nesten'] },
      { id: 'b3', tekst: 'Kobels (eekhoornnesten)', profielen: ['zoogdieren'] },
      {
        id: 'b4',
        tekst: 'Struweel, hagen of klimop (nestgelegenheid)',
        profielen: ['broedvogels'],
      },
    ],
  },
  {
    id: 'water',
    naam: 'Water',
    items: [
      {
        id: 'w1',
        tekst: 'Permanent water (sloot, vijver, poel)',
        profielen: ['amfibieen', 'vissen'],
      },
      { id: 'w2', tekst: 'Tijdelijke plassen of natte laagtes', profielen: ['amfibieen'] },
      { id: 'w3', tekst: 'Begroeide oevers of waterplanten', profielen: ['amfibieen', 'vissen'] },
    ],
  },
  {
    id: 'terrein',
    naam: 'Terrein',
    items: [
      {
        id: 't1',
        tekst: 'Ruigte, braak of kale zandige plekken',
        profielen: ['reptielen', 'amfibieen'],
      },
      {
        id: 't2',
        tekst: 'Houtstapels, steenhopen of composthopen',
        profielen: ['reptielen', 'amfibieen', 'zoogdieren'],
      },
      {
        id: 't3',
        tekst: 'Sporen van zoogdieren (burcht, holen, latrines, prenten)',
        profielen: ['zoogdieren'],
      },
      { id: 't4', tekst: 'Bijzondere of beschermde planten gezien', profielen: ['planten'] },
      { id: 't5', tekst: 'Invasieve exoten gezien (bijv. duizendknoop)', profielen: [] },
    ],
  },
]

export interface VeldFoto {
  id: string
  /** Verkleinde foto als data-URL (JPEG) */
  data: string
  bijschrift: string
}

/** Alles wat tijdens het veldbezoek wordt vastgelegd. */
export interface VeldGegevens {
  datum: string
  ecoloog: string
  weer: string
  antwoorden: Record<string, Antwoord>
  notities: Record<string, string>
  fotos: VeldFoto[]
  /** Bewerkbare conceptconclusie (leeg = automatisch) */
  conclusie: string
}

export const LEGE_VELDGEGEVENS: VeldGegevens = {
  datum: '',
  ecoloog: '',
  weer: '',
  antwoorden: {},
  notities: {},
  fotos: [],
  conclusie: '',
}
