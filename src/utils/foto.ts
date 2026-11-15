/**
 * Verkleint een foto tot max. 1000 px en zet hem om naar JPEG (± 100–200 kB),
 * zodat hij in de browser bewaard en in het rapport afgedrukt kan worden.
 */
export function verkleinFoto(bestand: File, maxPx = 1000): Promise<string> {
  return new Promise((klaar, mislukt) => {
    const url = URL.createObjectURL(bestand)
    const img = new Image()
    img.onload = () => {
      const schaal = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * schaal)
      canvas.height = Math.round(img.height * schaal)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      klaar(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      mislukt(new Error('Deze foto kon niet gelezen worden.'))
    }
    img.src = url
  })
}
