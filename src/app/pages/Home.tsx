/* filepath: c:\Users\Victor Almeida\alisson\src\app\pages\Home.tsx */
import React, { useEffect, useState } from "react";
import "../../app/styles/brand.css";
import logo from "../../assets/Ambi.png";

export default function Home(){
  const [phone, setPhone] = useState<string>("+55 83 9114-4456");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/config");
        if (!r.ok) return;
        const j = await r.json();
        if (mounted && j?.config) {
          setPhone(j.config.supportPhone || j.config.commercialPhone || phone);
        }
      } catch (e) { }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <main>
      <section className="hero container">
        <div className="hero-left">
          <h1>AMBISAFE — Inventário florestal mais rápido e preciso</h1>
          <p>Processamento automático de planilhas, cálculo estatístico, geração de tabelas e pré‑relatórios técnicos prontos para exportação (PDF/DOCX/Excel).</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => window.location.href = "/projetos/novo"}>Iniciar novo inventário</button>
            <a className="muted-link" href="#features">Ver funcionalidades →</a>
          </div>

          <div className="feature-cards">
            <div className="card"><strong>Upload automatizado</strong><div className="muted">Detecta colunas e associa automaticamente.</div></div>
            <div className="card"><strong>Cálculos técnicos</strong><div className="muted">DAP, área basal, volume, estatísticas amostrais.</div></div>
            <div className="card"><strong>Relatórios prontos</strong><div className="muted">Exportação em PDF e DOCX com layout técnico.</div></div>
          </div>
        </div>

        <div className="hero-right">
          <img src={logo} alt="Logo Ambisafe" className="hero-image"/>
        </div>
      </section>

      <section id="features" className="container">
        <h2>O que o AMBISAFE oferece</h2>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginTop:12}}>
          <div className="card">Entrada de dados via Excel/CSV</div>
          <div className="card">Banco de espécies com IA</div>
          <div className="card">Exportação: PDF / DOCX / Excel / CSV</div>
        </div>
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} AMBISAFE — Software de cálculo de inventário florestal
        <div style={{marginTop:8}}>Comercial / Suporte: <a href={"tel:" + phone.replace(/\s+/g,"")}>{phone}</a></div>
      </footer>
    </main>
  );
}
