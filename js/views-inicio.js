function mostrarInicio(){

    const ranking = getRanking();
    const lider = ranking[0];

    const proximos = partidos
        .filter(p => p.status === "Pendiente" || p.status === "En vivo")
        .slice(0, 3);

    contenido.innerHTML = `
        <div class="hero-logo">
            <img 
                src="https://assets.football-logos.cc/logos/tournaments/700x700/fifa-world-cup-2026--white.9ba8a004.png" 
                alt="FIFA World Cup 2026"
            >
        </div>

        <h1>QUINIELA <span class="titulo-acento">MUNDIAL 2026</span></h1>

        <div class="acciones-app">
            <button onclick="compartirApp()">📤 Compartir quiniela</button>
        </div>

        <div class="refresh-container">
            <p class="ultima-actualizacion">
                Última actualización: ${formatearFechaHora(ultimaActualizacion)}
            </p>

            <button class="btn-refresh" onclick="actualizarDatos()">
                <span id="balonRefresh">⚽</span>
                Actualizar datos
            </button>
        </div>

        <div class="inicio-grid">
            <div class="inicio-card">
                <h2>${usuarios.length}</h2>
                <p>Total de jugadores</p>
            </div>

            <div class="inicio-card">
                <h2>${lider ? lider.puntos : 0}</h2>
                <p>Puntos del líder</p>
            </div>

            <div class="inicio-card">
                <h2>${picks.length}</h2>
                <p>Picks capturados</p>
            </div>
        </div>

        <h2>PRÓXIMOS <span class="titulo-acento">PARTIDOS</span></h2>

        ${proximos.map(p => `
            <div class="partido ${getClaseStatus(p.status)}" onclick="verPartido(${p.id})">
                <div class="equipo">
                    <img src="${getFlag(p.local)}">
                    <p>${p.local}</p>
                </div>

                <div class="marcador-box">
                    <div class="marcador">
                        ${p.status === "En vivo" && p.golesLoc !== "" && p.golesVis !== "" 
                            ? `${p.golesLoc}-${p.golesVis}` 
                            : "VS"}
                    </div>
                    ${p.status === "En vivo" ? `<div class="status-mini status-vivo">En vivo</div>` : ""}
                </div>

                <div class="equipo">
                    <img src="${getFlag(p.visita)}">
                    <p>${p.visita}</p>
                </div>
            </div>
        `).join("")}

        ${getFooterCopyright()}
    `;
}
