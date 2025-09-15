import React from 'react'

export default function Header({ onNav, onOpenLogin, isAdmin, onLogout }){
  return (
    <header className="site-header">
      <div className="container nav">
        <div className="brand">
          <div className="logo">SL</div>
          <div>
            <strong>Sebastian Limaylla</strong><br/>
            <small>Arquitectura de Software — UPLA</small>
          </div>
        </div>
        <nav className="actions">
          <button className="btn" type="button" onClick={()=>onNav('perfil')}>Perfil</button>
          <button className="btn" type="button" onClick={()=>onNav('portafolio')}>Portafolio</button>
          {isAdmin ? (
            <button className="btn" type="button" onClick={onLogout}>Cerrar sesión</button>
          ) : (
            <button className="btn" type="button" onClick={onOpenLogin}>Iniciar sesión</button>
          )}
        </nav>
      </div>
    </header>
  )
}
