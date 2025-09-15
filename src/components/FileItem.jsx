import React, { useEffect, useState } from 'react'
import { generatePdfThumbnail } from '../lib/pdfThumbnail'

export default function FileItem({ item, isAdmin, onDelete, onOpenImage }){
  const [thumb, setThumb] = useState(null)

  useEffect(()=>{
    let cancelled = false
    async function loadThumb(){
      if (item.kind === 'image' || (item.url && /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(item.url))) {
        const img = new Image()
        img.onload = () => { if(!cancelled) setThumb(item.url) }
        img.onerror = async () => {
          if (item.kind === 'pdf' || /\.pdf(\?.*)?$/i.test(item.url)) {
            const dataUrl = await generatePdfThumbnail(item.url, 120)
            if(!cancelled) setThumb(dataUrl)
          } else {
            if(!cancelled) setThumb(null)
          }
        }
        img.src = item.url
      } else if (item.kind === 'pdf' || /\.pdf(\?.*)?$/i.test(item.url)) {
        const dataUrl = await generatePdfThumbnail(item.url, 120)
        if(!cancelled) setThumb(dataUrl)
      } else {
        setThumb(null)
      }
    }
    loadThumb()
    return ()=>{ cancelled = true }
  }, [item.url, item.kind])

  const showImg = Boolean(thumb)
  const isPdf = item.kind === 'pdf' || /\.pdf(\?.*)?$/i.test(item.url)

  return (
    <div className="file">
      <div className={"thumb " + (!showImg ? "thumb--icon" : "")} onClick={()=> showImg && onOpenImage(thumb, item.title)}>
        {showImg ? <img src={thumb} alt={item.title} /> : <span>{isPdf ? 'PDF' : 'FILE'}</span>}
      </div>
      <div className="meta">
        <strong>{item.title}</strong>
        <small>{item.mime || 'URL externa'} • {new Date(item.addedAt).toLocaleString()}</small>
      </div>
      <div className="file-actions">
        <a className="btn" href={item.url} target="_blank" rel="noreferrer">Ver</a>
        {isAdmin && <button className="btn ghost" onClick={onDelete}>Eliminar</button>}
      </div>
    </div>
  )
}
