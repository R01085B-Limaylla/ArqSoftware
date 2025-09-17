import React, { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import LoginModal from './components/LoginModal'
import Weeks from './components/Weeks'
import FileUploader from './components/FileUploader'
import FileItem from './components/FileItem'

const ADMIN_USER = 'admin'
const ADMIN_PASS = 'admin123'
const TOTAL_WEEKS = 16
const STORAGE_KEY = 'portfolio_items_v2'

// Cambia por tu endpoint de Vercel
const UPLOAD_ENDPOINT = 'https://arquisoftware2.vercel.app/api/upload'

function uid(){ return Math.random().toString(36).slice(2,9) + Date.now().toString(36) }

export default function App(){
  const [view, setView] = useState('perfil')
  const [isAdmin, setIsAdmin] = useState(false)
  const [items, setItems] = useState([])
  const [week, setWeek] = useState(1)
  const [loginOpen, setLoginOpen] = useState(false)
  const [lightbox, setLightbox] = useState({ open:false, src:'', caption:'' })

// 1) Cargar índice remoto al iniciar (con fallback a localStorage)
useEffect(() => {
  (async () => {
    try {
      // Lee el índice compartido desde gh-pages
      const r = await fetch('https://r01085b-limaylla.github.io/ArqSoftware/portfolio.json', {
        cache: 'no-store'
      })
      if (r.ok) {
        const remote = await r.json()
        setItems(Array.isArray(remote) ? remote : [])
      } else {
        // si aún no existe el JSON, usa lo que haya en localStorage (vacío la primera vez)
        const raw = localStorage.getItem(STORAGE_KEY)
        setItems(raw ? JSON.parse(raw) : [])
      }
    } catch {
      // sin conexión → fallback a local
      const raw = localStorage.getItem(STORAGE_KEY)
      setItems(raw ? JSON.parse(raw) : [])
    }
    setIsAdmin(sessionStorage.getItem('isAdmin') === '1')
  })()
}, [])


// 2) Seguir guardando en localStorage como caché local (opcional)
useEffect(() => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}, [items])

// 3) (sin cambios) agrupar por semana
const itemsByWeek = useMemo(() => {
  const map = new Map()
  for (let i = 1; i <= TOTAL_WEEKS; i++) map.set(i, [])
  for (const it of items) {
    if (map.has(it.week)) map.get(it.week).push(it)
  }
  return map
}, [items])


  function handleLogin(user, pass){
    if(user===ADMIN_USER && pass===ADMIN_PASS){
      setIsAdmin(true); sessionStorage.setItem('isAdmin','1'); setLoginOpen(false)
      setView('portafolio'); alert('Sesión iniciada como administrador.')
    } else alert('Credenciales incorrectas')
  }

  function handleLogout(){
    setIsAdmin(false); sessionStorage.removeItem('isAdmin'); alert('Sesión cerrada.')
  }

  async function uploadToRepo(file, { week, title }){
  const fd = new FormData()
  fd.append('file', file)
  fd.append('week', String(week))
  fd.append('title', title || file.name)

  let r
  try {
    r = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: fd })
  } catch (e) {
    throw new Error('No se pudo conectar con el servidor (fetch). Revisa la URL del endpoint.')
  }

  let data = null
  try { data = await r.json() } catch { /* ignora */ }

  if (!r.ok) {
    const msg = data?.error || `HTTP ${r.status} ${r.statusText}`
    throw new Error(`Subida falló: ${msg}`)
  }
  return data
}


  async function addItem({ file, url, title, week, kind, toRepo }){
    try{
      if(toRepo && file){
        const { url: repoUrl, mime } = await uploadToRepo(file, { week, title })
        const resolvedKind = (kind!=='auto') ? kind : (mime?.startsWith('image/') ? 'image' : (mime==='application/pdf' ? 'pdf' : 'other'))
        const item = { id: uid(), title, week, url: repoUrl, mime: mime || 'application/octet-stream', addedAt: Date.now(), sessionOnly: false, kind: resolvedKind }
        setItems(prev => [...prev, item])
      } else if (file){
        const mime = file.type || ''
        const objectUrl = URL.createObjectURL(file)
        const resolvedKind = (kind!=='auto') ? kind : (mime.startsWith('image/') ? 'image' : (mime==='application/pdf' ? 'pdf' : 'other'))
        const item = { id: uid(), title, week, url: objectUrl, mime, addedAt: Date.now(), sessionOnly: true, kind: resolvedKind }
        setItems(prev => [...prev, item])
      } else if (url){
        const lower = url.toLowerCase()
        let resolvedKind = (kind!=='auto') ? kind : (/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/.test(lower) ? 'image' : (/\.pdf(\?.*)?$/.test(lower) ? 'pdf' : 'other'))
        const mime = resolvedKind === 'pdf' ? 'application/pdf' : 'URL externa'
        const item = { id: uid(), title, week, url, mime, addedAt: Date.now(), sessionOnly: false, kind: resolvedKind }
        setItems(prev => [...prev, item])
      }
    } catch (e){
      alert(e.message || 'Error agregando el archivo')
    }
  }

  function removeItem(id){ setItems(prev => prev.filter(x=>x.id!==id)) }

  return (
    <>
      <Header onNav={setView} onOpenLogin={()=>setLoginOpen(true)} isAdmin={isAdmin} onLogout={handleLogout} />

      <main className="container">
        <aside className="notice"><strong>Nota:</strong> Marca “Guardar en repositorio” para subir el archivo a GitHub Pages (permanente). Si el PDF queda same-origin con tu sitio, <b>tendrá miniatura</b>.</aside>

        {view==='perfil' && (
          <section className="view active">
            <h1>Perfil</h1>
            <div className="card profile">
              <div className="avatar">SL</div>
              <div>
                <h2>Sebastian Limaylla</h2>
                <p><strong>Curso:</strong> Arquitectura de Software</p>
                <p><strong>Universidad:</strong> Universidad Peruana Los Andes (UPLA)</p>
                <div className="tags">
                  <span className="tag">Diseño de Software</span>
                  <span className="tag">Modelado</span>
                  <span className="tag">Portafolio Académico</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {view==='portafolio' && (
          <section className="view active">
            <div className="title-row">
              <h1>Portafolio por semanas</h1>
              {isAdmin && <FileUploader onAdd={addItem} weeks={TOTAL_WEEKS} />}
            </div>

            <Weeks current={week} onSelect={setWeek} total={TOTAL_WEEKS} />

            <div className="panels">
              {Array.from({length:TOTAL_WEEKS},(_,i)=>{
                const n=i+1
                const isActive = n===week
                const list = (items.filter(it=>it.week===n))
                return (
                  <div key={n} className={'panel' + (isActive ? ' active' : '')}>
                    <div className="files">
                      {list.length===0 && <p className="muted">Sin elementos aún.</p>}
                      {list.map(it => (
                        <FileItem key={it.id}
                          item={it}
                          isAdmin={isAdmin}
                          onDelete={()=>removeItem(it.id)}
                          onOpenImage={(src,cap)=>setLightbox({open:true, src, caption:cap})}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {lightbox.open && (
        <div className="lightbox open" onClick={(e)=>{ if(e.target.classList.contains('lightbox__backdrop') || e.target === e.currentTarget) setLightbox({open:false, src:'', caption:''}) }}>
          <div className="lightbox__backdrop" />
          <figure className="lightbox__content">
            <img src={lightbox.src} alt={lightbox.caption} />
            <figcaption>{lightbox.caption}</figcaption>
            <button className="btn" onClick={()=>setLightbox({open:false, src:'', caption:''})}>Cerrar</button>
          </figure>
        </div>
      )}

      <LoginModal open={loginOpen} onClose={()=>setLoginOpen(false)} onLogin={(u,p)=>{
        handleLogin(u,p)
      }} />
      <footer className="site-footer"><div className="container"><small>© {new Date().getFullYear()} Sebastian Limaylla — Portafolio</small></div></footer>
    </>
  )
}
