// api/upload.js
// npm i octokit busboy

import { Octokit } from 'octokit'
import Busboy from 'busboy'

export const config = { api: { bodyParser: false } }

// Requiere en Vercel → Settings → Environment Variables:
const OWNER  = process.env.GH_OWNER       // ej: "tuusuario"
const REPO   = process.env.GH_REPO        // ej: "portafolio"
const BRANCH = process.env.GH_BRANCH || 'gh-pages'
const TOKEN  = process.env.GITHUB_TOKEN   // Fine-grained PAT: Contents: Read & write

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

async function ensureBranch(octokit, owner, repo, branch) {
  try {
    await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
      owner, repo, ref: `heads/${branch}`
    })
  } catch (e) {
    if (e.status !== 404) throw e
    const repoInfo = await octokit.request('GET /repos/{owner}/{repo}')
    const defaultBranch = repoInfo.data.default_branch || 'main'
    const baseRef = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
      owner, repo, ref: `heads/${defaultBranch}`
    })
    const sha = baseRef.data.object.sha
    await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
      owner, repo,
      ref: `refs/heads/${branch}`,
      sha
    })
  }
}

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!TOKEN || !OWNER || !REPO) return res.status(500).json({ error: 'Server not configured (vars)' })

  // Nota: Vercel funciones ~4.5 MB máximo. Prueba primero con PDFs < 4 MB.
  const bb = Busboy({ headers: req.headers })
  let fileBuffer = null, fileName = '', week = 'misc', title = ''

  bb.on('file', (_name, file, info) => {
    fileName = info?.filename || `file-${Date.now()}`
    const chunks = []
    file.on('data', d => chunks.push(d))
    file.on('end', () => { fileBuffer = Buffer.concat(chunks) })
  })

  bb.on('field', (name, val) => {
    if (name === 'week') week = String(val || 'misc')
    if (name === 'title') title = String(val || '')
  })

  bb.on('finish', async () => {
    try {
      if (!fileBuffer) return res.status(400).json({ error: 'Archivo faltante' })

      const octokit = new Octokit({ auth: TOKEN })
      await ensureBranch(octokit, OWNER, REPO, BRANCH)

      const safe = (fileName || 'archivo').replace(/[^a-zA-Z0-9._-]+/g, '_')
      const uid = Math.random().toString(36).slice(2, 8)
      const path = `pdfs/semana-${week}/${Date.now()}-${uid}-${safe}`
      const message = `chore: subir ${title || safe} (semana ${week})`

      const content = fileBuffer.toString('base64')
      const r = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner: OWNER, repo: REPO, path,
        message, content, branch: BRANCH
      })

      const url = `https://${OWNER}.github.io/${REPO}/${path}`
      const lower = safe.toLowerCase()
      const mime = lower.endsWith('.pdf') ? 'application/pdf'
        : (/\.(png|jpe?g|gif|webp|svg)$/.test(lower) ? 'image/*' : 'application/octet-stream')
// === ACTUALIZAR portfolio.json EN gh-pages ===
let items = []
let indexSha = null

try {
  // Intentar leer portfolio.json existente
  const rIndex = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: OWNER, repo: REPO, path: 'portfolio.json', ref: BRANCH
  })
  items = JSON.parse(Buffer.from(rIndex.data.content, 'base64').toString('utf8'))
  indexSha = rIndex.data.sha
} catch (err) {
  // Si no existe, lo crearemos desde cero
  if (err.status !== 404) throw err
}

// Agregar el nuevo ítem
items.push({
  id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
  title,
  week,
  url,
  mime,
  addedAt: Date.now()
})

// Subir portfolio.json actualizado
await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
  owner: OWNER, repo: REPO, path: 'portfolio.json',
  message: `chore: update index (semana ${week})`,
  content: Buffer.from(JSON.stringify(items, null, 2)).toString('base64'),
  branch: BRANCH,
  sha: indexSha || undefined
})

      return res.status(200).json({ ok: true, url, path, mime, commit: r.data?.commit?.sha })
    } catch (e) {
  // 👇 Esto aparecerá en Runtime Logs de Vercel
  console.error('UPLOAD_ERROR', {
    status: e?.status,
    gh: e?.response?.data,
    msg: e?.message
  })

  const ghMsg = e?.response?.data?.message
  return res.status(500).json({ error: ghMsg || e.message || 'Upload failed' })
}

  })

  req.pipe(bb)
}
