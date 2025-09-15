// api/upload.js (Vercel Serverless Function)
// npm i octokit busboy

import { Octokit } from 'octokit'
import Busboy from 'busboy'

export const config = { api: { bodyParser: false } }

// ENV obligatorias
const OWNER  = process.env.GH_OWNER         // ej: "TU_USUARIO"
const REPO   = process.env.GH_REPO          // ej: "portafolio"
const BRANCH = process.env.GH_BRANCH || 'gh-pages'
const TOKEN  = process.env.GITHUB_TOKEN     // Fine-grained o PAT con Contents: Read & write

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

async function ensureBranch(octokit, owner, repo, branch) {
  try {
    // ¿existe la rama?
    await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
      owner, repo, ref: `heads/${branch}`
    })
    return
  } catch (e) {
    if (e.status !== 404) throw e
    // tomar ref de la rama por defecto (main/master)
    const repoInfo = await octokit.request('GET /repos/{owner}/{repo}', { owner, repo })
    const defaultBranch = repoInfo.data.default_branch || 'main'
    const baseRef = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
      owner, repo, ref: `heads/${defaultBranch}`
    })
    const sha = baseRef.data.object.sha
    // crear la rama
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
  if (!TOKEN || !OWNER || !REPO) return res.status(500).json({ error: 'Server not configured' })

  // ⚠️ Vercel límite práctico de payload en funciones ~4.5MB.
  // Para archivos grandes, considera otro almacenamiento (S3) o dividir.

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

      const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '_')
      const stamp = Date.now()
      const path = `pdfs/semana-${week}/${stamp}-${safeName}`
      const message = `chore: subir ${title || safeName} (semana ${week})`

      const content = fileBuffer.toString('base64')
      await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner: OWNER, repo: REPO, path,
        message, content, branch: BRANCH
      })

      const url = `https://${OWNER}.github.io/${REPO}/${path}`
      const lower = safeName.toLowerCase()
      const mime = lower.endsWith('.pdf') ? 'application/pdf'
        : (/\.(png|jpe?g|gif|webp|svg)$/.test(lower) ? 'image/*' : 'application/octet-stream')

      return res.status(200).json({ ok: true, url, path, mime })
    } catch (e) {
      return res.status(500).json({ error: e.message || 'Upload failed' })
    }
  })

  req.pipe(bb)
}
