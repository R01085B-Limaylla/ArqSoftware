import React, { useEffect, useRef } from 'react'

export default function LoginModal({ open, onClose, onLogin }){
  const userRef = useRef(null)
  useEffect(()=>{ if(open && userRef.current) userRef.current.focus() },[open])
  if(!open) return null
  function submit(e){
    e.preventDefault()
    onLogin(e.target.username.value.trim(), e.target.password.value)
  }
  return (
    <div className="modal open" onClick={e=>{ if(e.target.classList.contains('modal__backdrop')) onClose() }}>
      <div className="modal__backdrop" />
      <section className="modal__card" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <header className="modal__head">
          <h2 id="login-title">Acceso administrador</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>
        <form className="modal__body" onSubmit={submit}>
          <label>Usuario
            <input ref={userRef} name="username" placeholder="admin" required />
          </label>
          <label>Contraseña
            <input name="password" type="password" placeholder="••••••••" required />
          </label>
          <p className="muted">Demo: <code>admin</code> / <code>admin123</code></p>
          <div className="form-actions">
            <button className="btn primary" type="submit">Ingresar</button>
          </div>
        </form>
      </section>
    </div>
  )
}
