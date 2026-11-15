/** Legenda van de kaart. */
export default function Legenda() {
  return (
    <section>
      <h2>Legenda</h2>
      <ul className="legenda">
        <li>
          <span className="legenda-vak legenda-gebied" /> Onderzoeksgebied
        </li>
        <li>
          <span className="legenda-vak legenda-zone" /> Zone van 1 km
        </li>
        <li>
          <span className="legenda-vak legenda-zoek" /> Zoekgebied waarnemingen
        </li>
        <li>
          <span className="legenda-vak legenda-n2k" /> Natura 2000
        </li>
        <li>
          <span className="legenda-vak legenda-nnn" /> Natuurnetwerk Nederland (NNN)
        </li>
        <li>
          <span className="legenda-stip" style={{ background: '#c0392b' }} /> Beschermde soort
        </li>
        <li>
          <span className="legenda-stip" style={{ background: '#8e44ad' }} /> Invasieve exoot
        </li>
        <li>
          <span className="legenda-stip" style={{ background: '#2f80c1' }} /> Overige waarneming
          (kleur per soortgroep)
        </li>
      </ul>
      <p className="voetnoot">
        Lagenmenu rechtsboven op de kaart: kaart, actuele en historische luchtfoto&rsquo;s,
        Natura 2000 en NNN.
      </p>
    </section>
  )
}
