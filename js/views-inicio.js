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

        <div class="reglas-card">
            <h2>🏆 REGLAS Y PREMIOS</h2>
            <p>Consulta el sistema de puntuación completo de la quiniela.</p>
            <button onclick="mostrarReglasPremios()">Ver infografía</button>
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

function mostrarReglasPremios(){

    contenido.innerHTML = `
        <button onclick="mostrarInicio()" class="btnVolver">⬅ Regresar</button>

        <h1>REGLAS <span class="titulo-acento">Y PREMIOS</span></h1>

        <p class="subtexto">Puedes hacer zoom con dos dedos en el celular.</p>

        <div class="visor-reglas" id="visorReglas">
            <img 
                src="img/reglas-premios.png" 
                alt="Sistema de puntuación y premios"
                class="img-reglas"
                id="imgReglas"
            >
        </div>

        <a class="btn-descargar-reglas" href="img/reglas-premios.png" download>
            📥 Descargar imagen
        </a>

        ${getFooterCopyright()}
    `;

    setTimeout(() => {
        const imagen = document.getElementById("imgReglas");
        const visor = document.getElementById("visorReglas");

        if(imagen && visor && window.Panzoom){
            const panzoom = Panzoom(imagen, {
                maxScale: 5,
                minScale: 1,
                contain: "outside"
            });

            visor.addEventListener("wheel", panzoom.zoomWithWheel);

            visor.addEventListener("pointerdown", () => {
                visor.style.touchAction = "none";
            });
        }
    }, 100);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}
