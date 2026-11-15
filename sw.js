// Service worker van Quickscan Kaart.
// - De app zelf (HTML, JavaScript, CSS, pictogrammen) wordt bewaard, zodat hij snel en ook bij
//   een slechte verbinding opent.
// - Gegevens van PDOK, GBIF enz. worden NIET bewaard: die worden altijd vers opgehaald.
const CACHE = 'quickscan-app-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  // Oude versies van de cache opruimen
  event.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const verzoek = event.request
  const url = new URL(verzoek.url)
  if (verzoek.method !== 'GET' || url.origin !== self.location.origin) return

  if (verzoek.mode === 'navigate') {
    // Pagina: eerst het netwerk (nieuwste versie), anders de bewaarde versie
    event.respondWith(
      fetch(verzoek)
        .then((antwoord) => {
          const kopie = antwoord.clone()
          caches.open(CACHE).then((c) => c.put(verzoek, kopie))
          return antwoord
        })
        .catch(() => caches.match(verzoek).then((a) => a ?? caches.match('./'))),
    )
    return
  }

  // Bestanden (met versienummer in de naam): eerst de cache, anders ophalen en bewaren
  event.respondWith(
    caches.match(verzoek).then(
      (bewaard) =>
        bewaard ??
        fetch(verzoek).then((antwoord) => {
          if (antwoord.ok) {
            const kopie = antwoord.clone()
            caches.open(CACHE).then((c) => c.put(verzoek, kopie))
          }
          return antwoord
        }),
    ),
  )
})
