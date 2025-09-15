import React from 'react'
export default function Weeks({ current, onSelect, total=16 }){
  return (
    <div className="weeks" role="tablist" aria-label="Semanas del portafolio">
      {Array.from({length:total},(_,i)=>{
        const n=i+1
        return <button key={n} className="tab" aria-selected={current===n} onClick={()=>onSelect(n)}>Semana {n}</button>
      })}
    </div>
  )
}
