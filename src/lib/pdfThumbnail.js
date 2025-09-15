import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?worker'

const worker = new PdfWorker()
GlobalWorkerOptions.workerPort = worker

export async function generatePdfThumbnail(url, size = 120) {
  try {
    const isBlob = typeof url === 'string' && url.startsWith('blob:')
    const sameOrigin =
      typeof url === 'string' &&
      !isBlob &&
      new URL(url, location.href).origin === location.origin

    if (!isBlob && !sameOrigin) return null

    const loadingTask = getDocument({ url })
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1 })
    const scale = Math.min(size / viewport.width, size / viewport.height)
    const vp = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = Math.max(1, Math.floor(vp.width))
    canvas.height = Math.max(1, Math.floor(vp.height))

    await page.render({ canvasContext: ctx, viewport: vp }).promise
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}
