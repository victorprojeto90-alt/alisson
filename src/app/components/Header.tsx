/* filepath: c:\Users\Victor Almeida\alisson\src\app\components\Header.tsx */
import React, { useEffect, useState } from "react";
import "../../app/styles/brand.css";
import logo from "../../assets/Ambi.png";

export default function Header(){
  const [phone, setPhone] = useState<string>("+55 83 9114-4456");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/config");
        if (!r.ok) return;
        const j = await r.json();
        if (mounted && j?.config) {
          setPhone(j.config.commercialPhone || j.config.supportPhone || phone);
        }
      } catch (e) {
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <header className="brand-header">
      <div className="logo">
        <img src={logo} alt="AMBISAFE" className="logo-img" />
        <div>
          <div className="brand-title">AMBISAFE</div>
          <div style={{fontSize:12, color:"rgba(255,255,255,0.9)"}}>Software de cálculo de inventário florestal</div>
        </div>
      </div>

      <nav>
        <a style={{color:"rgba(255,255,255,0.95)", textDecoration:"none", fontWeight:600}} href="/projetos">Projetos</a>
        <a style={{color:"rgba(255,255,255,0.9)", textDecoration:"none"}} href="/relatorios">Relatórios</a>
        <a style={{color:"rgba(255,255,255,0.9)", textDecoration:"none"}} href="/config">Configurações</a>
        <div style={{display:"flex",alignItems:"center",gap:10,marginLeft:12}}>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.9)"}}>Suporte: <a href={"tel:" + phone.replace(/\s+/g,"")} style={{color:"#fff",fontWeight:700}}>{phone}</a></div>
          <button className="btn-primary" onClick={() => window.location.href = "/projetos/novo"}>Iniciar novo inventário</button>
        </div>
      </nav>
    </header>
  );
}
