// api/upload.js (Vercel)
// npm i octokit busboy
import { Octokit } from 'octokit'
import Busboy from 'busboy'

export const config = { api: { bodyParser: false } }

const OWNER  = process.env.GH_OWNER
const REPO   = process.env.GH_REPO
const BRANCH = process.env.GH_BRANCH || 'gh-pages'
const TOKEN  = process.env.GITHUB_TOKEN

function cors(res){
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export default async function handler(req, res){
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!TOKEN || !OWNER || !REPO) return res.status(500).json({ error: 'Server not configured' })

  const bb = Busboy({ headers: req.headers })
  let fileBuffer = null, fileName = '', week = 'misc', title = ''

  bb.on('file', (_name, file, info) => {
    fileName = info.filename || `file-${Date.now()}`
    const chunks = []
    file.on('data', d => chunks.append(d))
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
      const mime = safeName.toLowerCase().endsWith('.pdf') ? 'application/pdf' :
                   (safeName.match(/\.(png|jpe?g|gif|webp|svg)$/i) ? 'image/*' : 'application/octet-stream')

      res.status(200).json({ ok: true, url, path, mime })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })
  req.pipe(bb)
}
