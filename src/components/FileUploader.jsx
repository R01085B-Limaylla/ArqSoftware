import React from 'react'

export default function FileUploader({ onAdd, weeks=16 }){
  function handleSubmit(e){
    e.preventDefault()
    const f = e.target.file.files[0]
    const url = e.target.url.value.trim()
    const title = e.target.title.value.trim()
    const week = parseInt(e.target.week.value,10)
    const kind = e.target.kind.value
    const toRepo = e.target.toRepo.checked
    if(!title) return alert('Título requerido')
    if(!f && !url) return alert('Agrega archivo o URL')
    onAdd({ file:f, url, title, week, kind, toRepo })
    e.target.reset()
  }
  return (
    <details className="uploader">
      <summary>➕ Agregar al portafolio (admins)</summary>
      <form onSubmit={handleSubmit} id="uploadForm">
        <div className="form-row">
          <label>Título
            <input name="title" placeholder="Ej. Caso de uso — Sistema académico" required />
          </label>
          <label>Semana
            <select name="week">
              {Array.from({length:weeks},(_,i)=>(<option key={i+1} value={i+1}>Semana {i+1}</option>))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>Archivo (PDF o imagen)
            <input name="file" type="file" accept=".pdf,image/*" />
          </label>
          <span className="or">o</span>
          <label>URL (persistente)
            <input name="url" type="url" placeholder="https://drive.google.com/..." />
          </label>
        </div>
        <div className="form-row">
          <label>Tipo (forzar detección)
            <select name="kind">
              <option value="auto" defaultChecked>Auto</option>
              <option value="image">Imagen</option>
              <option value="pdf">PDF</option>
              <option value="other">Otro</option>
            </select>
          </label>
          <label>
            <input type="checkbox" name="toRepo" />
            Guardar en repositorio (permanente)
          </label>
        </div>
        <p className="help">Marcando “Guardar en repositorio” el archivo se sube a tu rama de GitHub Pages y queda público.</p>
        <div className="form-actions">
          <button className="btn primary" type="submit">Agregar</button>
          <button className="btn ghost" type="reset">Limpiar</button>
        </div>
      </form>
    </details>
  )
}
