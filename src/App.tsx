import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Feature, Polygon } from 'geojson'
import Kaart from './components/Kaart'
import Zijpaneel from './components/Zijpaneel'
import Rapport from './components/Rapport'
import type { ExternGebied, GebiedBron } from './components/TekenGereedschap'
import type { VliegNaar } from './components/KaartActies'
import { useNatura2000 } from './hooks/useNatura2000'
import { useWaarnemingen } from './hooks/useWaarnemingen'
import { STANDAARD_WAARNEMING_BUFFER_M } from './config/bronnen'
import type { Soort } from './types'
import { zoekBescherming } from './utils/bescherming'
import { leesDeellink } from './utils/deellink'
import { zoekPerceelOpPunt } from './services/kadaster'
import { haalUnielijstOp } from './services/exoten'
import { useHabitat } from './hooks/useHabitat'
import HabitatPaneel from './components/HabitatPaneel'
import ExotenPaneel from './components/ExotenPaneel'
import VeldPlanner from './components/VeldPlanner'
import WerkKalender from './components/WerkKalender'
import VeldChecklist from './components/VeldChecklist'
import ConclusiePaneel from './components/ConclusiePaneel'
import { LEGE_VELDGEGEVENS, type VeldGegevens } from './data/veldchecklist'
import { relevanteProfielen } from './utils/relevanteProfielen'
import { genereerConclusie } from './utils/conclusie'
import { formatAfstand } from './utils/geometrie'
import ProjectenMenu from './components/ProjectenMenu'
import {
  bewaarProject,
  leesActiefProject,
  nieuwProjectId,
  wisActiefProject,
  type Project,
} from './utils/projecten'

// Een plangebied uit een gedeelde link (eenmalig bij het openen van de app)
const uitLink = leesDeellink()
// Anders: verder met het project waar je het laatst aan werkte
const startProject = uitLink ? null : leesActiefProject()

export default function App() {
  // Het onderzoeksgebied (GeoJSON), of null als er nog niets getekend is
  const [gebied, setGebied] = useState<Feature<Polygon> | null>(null)
  // Waar het gebied vandaan komt (perceel, bestand, link …), voor in het rapport
  const [herkomst, setHerkomst] = useState<string | null>(
    uitLink ? 'Gedeelde link' : (startProject?.herkomst ?? null),
  )
  const [projectnaam, setProjectnaam] = useState(startProject?.naam ?? '')
  // Opgeslagen project waar je nu in werkt (null = nog niet opgeslagen)
  const [actiefId, setActiefId] = useState<string | null>(startProject?.id ?? null)
  const [opslagVersie, setOpslagVersie] = useState(0)
  const [opslagFout, setOpslagFout] = useState<string | null>(null)
  // Gebied dat van buitenaf op de kaart gezet moet worden
  const [extern, setExtern] = useState<ExternGebied | null>(() => {
    const start = uitLink?.gebied ?? startProject?.gebied
    return start ? { gebied: start, versie: 1 } : null
  })
  const [vliegNaar, setVliegNaar] = useState<VliegNaar | null>(null)
  // Buffer rond het gebied voor het zoeken naar waarnemingen
  const [bufferM, setBufferM] = useState(
    uitLink?.bufferM ?? startProject?.bufferM ?? STANDAARD_WAARNEMING_BUFFER_M,
  )
  // Soort die in de lijst is aangeklikt (alleen die staat dan op de kaart)
  const [geselecteerdeSoort, setGeselecteerdeSoort] = useState<number | null>(null)
  const [toonRapport, setToonRapport] = useState(false)
  // Alleen op de telefoon: kaart ingeklapt, zodat er meer ruimte is voor de gegevens
  const [kaartIngeklapt, setKaartIngeklapt] = useState(false)
  // Perceel kiezen door op de kaart te klikken
  const [perceelModus, setPerceelModus] = useState(false)
  const [perceelMelding, setPerceelMelding] = useState<string | null>(null)
  // Gebouwen op de kaart kleuren naar bouwjaar
  const [toonPanden, setToonPanden] = useState(false)
  // EU-Unielijst invasieve exoten (GBIF-soortsleutels)
  const [unielijst, setUnielijst] = useState<Map<number, string>>(new Map())
  const [unielijstFout, setUnielijstFout] = useState<string | null>(null)

  useEffect(() => {
    haalUnielijstOp()
      .then(setUnielijst)
      .catch((e: unknown) => setUnielijstFout(e instanceof Error ? e.message : 'onbekende fout'))
  }, [])

  const bijGebiedGewijzigd = useCallback((nieuw: Feature<Polygon> | null, bron: GebiedBron) => {
    setGebied(nieuw)
    setGeselecteerdeSoort(null)
    if (bron === 'getekend' || bron === 'verwijderd') setHerkomst(null)
    if (bron === 'bewerkt')
      setHerkomst((h) => (h && !h.endsWith('(aangepast)') ? `${h} (aangepast)` : h))
  }, [])

  /** Een gebied van buitenaf op de kaart zetten. */
  const plaatsGebied = useCallback((nieuw: Feature<Polygon>, nieuweHerkomst: string | null) => {
    setExtern((e) => ({ gebied: nieuw, versie: (e?.versie ?? 0) + 1 }))
    setHerkomst(nieuweHerkomst)
  }, [])

  // Klik op de kaart in perceelmodus: perceel opzoeken en als gebied gebruiken
  const bijKaartKlik = useCallback(
    async (lat: number, lng: number) => {
      setPerceelMelding('Perceel zoeken…')
      try {
        const resultaat = await zoekPerceelOpPunt(lat, lng)
        if (!resultaat) {
          setPerceelMelding(
            'Geen perceel gevonden op deze plek. Zoom verder in en probeer opnieuw.',
          )
          return
        }
        plaatsGebied(resultaat.gebied, `Kadastraal perceel ${resultaat.info.aanduiding}`)
        setPerceelMelding(null)
        setPerceelModus(false)
      } catch (e) {
        setPerceelMelding(e instanceof Error ? e.message : 'Perceel ophalen mislukt.')
      }
    },
    [plaatsGebied],
  )

  // Zoekt automatisch Natura 2000-gebieden binnen 1 km zodra het gebied verandert
  const natura2000 = useNatura2000(gebied)
  // Haalt automatisch GBIF-waarnemingen op voor gebied + buffer
  const waarnemingen = useWaarnemingen(gebied, bufferM)
  // Landgebruik, water, gebouwen en bomen in het gebied
  const habitat = useHabitat(gebied)

  // Soortenlijst aangevuld met Nederlandse namen en bescherming (indicatieve startlijst)
  const soorten = useMemo<Soort[]>(() => {
    if (waarnemingen.status.soort !== 'klaar') return []
    return waarnemingen.status.resultaat.soorten.map((s) => {
      const bescherming = zoekBescherming(s.wetenschappelijkeNaam)
      return {
        ...s,
        nederlandseNaam: waarnemingen.namen.get(s.key) ?? bescherming?.nederlandseNaam,
        bescherming,
        exoot: unielijst.has(s.key),
      }
    })
  }, [waarnemingen.status, waarnemingen.namen, unielijst])

  const soortenPerKey = useMemo(() => new Map(soorten.map((s) => [s.key, s])), [soorten])

  // Veldbezoek: checklist, notities, foto's en conclusie
  const [veld, setVeld] = useState<VeldGegevens>(startProject?.veld ?? LEGE_VELDGEGEVENS)

  // Automatisch opslaan in de browser, kort nadat je iets wijzigt
  useEffect(() => {
    if (!gebied) return
    const timer = setTimeout(() => {
      const id = actiefId ?? nieuwProjectId()
      try {
        bewaarProject({
          id,
          naam: projectnaam,
          gebied,
          herkomst,
          bufferM,
          veld,
          bijgewerkt: new Date().toISOString(),
        })
        setOpslagFout(null)
        if (!actiefId) setActiefId(id)
        setOpslagVersie((v) => v + 1)
      } catch (e) {
        setOpslagFout(e instanceof Error ? e.message : 'Opslaan mislukt.')
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [gebied, projectnaam, herkomst, bufferM, veld, actiefId])

  const openProject = (p: Project) => {
    setActiefId(p.id)
    setProjectnaam(p.naam)
    setBufferM(p.bufferM)
    setVeld(p.veld)
    setExtern((e) => ({ gebied: p.gebied, versie: (e?.versie ?? 0) + 1 }))
    setHerkomst(p.herkomst)
  }
  const nieuwProject = () => {
    wisActiefProject()
    setActiefId(null)
    setProjectnaam('')
    setVeld(LEGE_VELDGEGEVENS)
    setExtern((e) => ({ gebied: null, versie: (e?.versie ?? 0) + 1 }))
    setHerkomst(null)
    setOpslagFout(null)
  }

  // Welke soortgroepen spelen hier, en waarom (soorten, habitat, veld)
  const profielen = useMemo(
    () =>
      relevanteProfielen(
        soorten,
        habitat.status.soort === 'klaar' ? habitat.status.resultaat.potentie : [],
        veld,
      ),
    [soorten, habitat.status, veld],
  )
  const natura2000Tekst =
    natura2000.status.soort !== 'klaar'
      ? 'Natura 2000 nog niet gecontroleerd.'
      : natura2000.status.gebieden.length === 0
        ? 'geen Natura 2000-gebied in of binnen 1 km; beoordeel externe effecten zoals stikstof apart.'
        : `${natura2000.status.gebieden
            .map(
              (g) => `${g.naam} (${g.overlapt ? 'overlapt' : `op ± ${formatAfstand(g.afstandM)}`})`,
            )
            .join(
              ', ',
            )}; toets effecten (o.a. stikstof, verstoring). Ligging t.o.v. NNN visueel beoordelen.`
  const automatischeConclusie = useMemo(
    () =>
      genereerConclusie(
        profielen,
        natura2000Tekst,
        soorten.filter((s) => s.exoot).map((s) => s.nederlandseNaam ?? s.wetenschappelijkeNaam),
      ),
    [profielen, natura2000Tekst, soorten],
  )

  return (
    <>
      <div
        className={
          'app' +
          (gebied ? ' met-gebied' : ' zonder-gebied') +
          (kaartIngeklapt ? ' kaart-ingeklapt' : '')
        }
      >
        <Zijpaneel
          gebied={gebied}
          herkomst={herkomst}
          projectnaam={projectnaam}
          onProjectnaam={setProjectnaam}
          natura2000={natura2000.status}
          onNatura2000Opnieuw={natura2000.opnieuw}
          waarnemingen={waarnemingen.status}
          soorten={soorten}
          bufferM={bufferM}
          onBufferWijzig={setBufferM}
          onWaarnemingenOpnieuw={waarnemingen.opnieuw}
          geselecteerdeSoort={geselecteerdeSoort}
          onSelecteerSoort={setGeselecteerdeSoort}
          onRapport={() => setToonRapport(true)}
          onZoekGevonden={(lat, lng, zoom) => {
            setVliegNaar((v) => ({ lat, lng, zoom, versie: (v?.versie ?? 0) + 1 }))
            setKaartIngeklapt(false)
          }}
          perceelModus={perceelModus}
          onPerceelModus={(aan) => {
            setPerceelModus(aan)
            setPerceelMelding(null)
            if (aan) setKaartIngeklapt(false)
          }}
          perceelMelding={perceelMelding}
          onGeimporteerd={plaatsGebied}
          boven={
            <ProjectenMenu
              actiefId={actiefId}
              opslagVersie={opslagVersie}
              opslagFout={opslagFout}
              onOpen={openProject}
              onNieuw={nieuwProject}
            />
          }
          extra={{
            overzicht: (
              <HabitatPaneel
                status={habitat.status}
                onOpnieuw={habitat.opnieuw}
                toonPanden={toonPanden}
                onToonPanden={setToonPanden}
              />
            ),
            soorten: <ExotenPaneel soorten={soorten} fout={unielijstFout} />,
            planning: gebied && (
              <>
                <VeldPlanner gebied={gebied} soorten={soorten} />
                <section>
                  <h2>Werkkalender</h2>
                  <p className="voetnoot">
                    Wanneer geven werkzaamheden (sloop, kap, grondwerk) het minste risico voor de
                    soortgroepen die hier spelen?
                  </p>
                  <WerkKalender profielen={profielen} compact />
                </section>
              </>
            ),
            veld: (
              <>
                <VeldChecklist veld={veld} onWijzig={setVeld} />
                <ConclusiePaneel
                  profielen={profielen}
                  conclusie={veld.conclusie}
                  automatisch={automatischeConclusie}
                  onWijzig={(conclusie) => setVeld((v) => ({ ...v, conclusie }))}
                />
              </>
            ),
          }}
        />
        <main className="kaart-container">
          <Kaart
            gebied={gebied}
            onGebiedGewijzigd={bijGebiedGewijzigd}
            zoekgebied={bufferM > 0 ? waarnemingen.zoekgebied : null}
            waarnemingen={
              waarnemingen.status.soort === 'klaar'
                ? waarnemingen.status.resultaat.waarnemingen
                : []
            }
            soorten={soortenPerKey}
            geselecteerdeSoort={geselecteerdeSoort}
            grootteSleutel={`${!!gebied}-${kaartIngeklapt}`}
            extern={extern}
            vliegNaar={vliegNaar}
            onKaartKlik={perceelModus ? bijKaartKlik : null}
            panden={
              toonPanden && habitat.status.soort === 'klaar' ? habitat.status.resultaat.panden : []
            }
          />
        </main>
        {/* Alleen zichtbaar op de telefoon (zie index.css) */}
        <button
          type="button"
          className="kaart-schakelaar"
          onClick={() => setKaartIngeklapt((k) => !k)}
          aria-expanded={!kaartIngeklapt}
        >
          {kaartIngeklapt ? '▼ Kaart tonen' : '▲ Kaart verbergen'}
        </button>
      </div>

      {/* Het rapport ligt als laag over de app, zodat de kaart (met tekening) blijft bestaan */}
      {toonRapport && gebied && (
        <Rapport
          gebied={gebied}
          herkomst={herkomst}
          projectnaam={projectnaam}
          onProjectnaam={setProjectnaam}
          bufferM={bufferM}
          zoekgebied={bufferM > 0 ? waarnemingen.zoekgebied : null}
          natura2000={natura2000.status}
          waarnemingen={waarnemingen.status}
          soorten={soorten}
          habitat={habitat.status}
          veld={veld}
          conclusie={veld.conclusie || automatischeConclusie}
          profielen={profielen}
          onSluiten={() => setToonRapport(false)}
        />
      )}
    </>
  )
}
