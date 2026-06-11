const categoriasEspeciales = {
    campeon: {
        titulo: "Campeón",
        icono: "🏆",
        campo: "campeon"
    },
    segundo: {
        titulo: "Segundo",
        icono: "🥈",
        campo: "segundo"
    },
    tercero: {
        titulo: "Tercero",
        icono: "🥉",
        campo: "tercero"
    },
    goleador: {
        titulo: "Goleador",
        icono: "⚽",
        campo: "goleador"
    },
    sorpresa: {
        titulo: "Sorpresa",
        icono: "🌟",
        campo: "sorpresa"
    }
};

let categoriaEspecialActual = "campeon";

function normalizarPickEspecial(valor){
    return valor && valor.trim() !== "" ? valor.trim() : "Sin pick";
}

function getResumenEspecial(categoria){
    const config = categoriasEspeciales[categoria];
    const conteo = {};

    usuarios.forEach(u => {
        const pick = normalizarPickEspecial(u[config.campo]);
        conteo[pick] = (conteo[pick] || 0) + 1;
    });

    const ordenados = Object.entries(conteo)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));

    const total = usuarios.length;
    const favorito = ordenados[0] || ["Sin pick", 0];

    return {
        config,
        total,
        favorito: favorito[0],
        favoritoCantidad: favorito[1],
        opcionesDistintas: ordenados.length,
        ordenados
    };
}

function crearHTMLBotonesEspeciales(categoriaActiva){
    return `
        <div class="tabs-especiales">
            ${Object.entries(categoriasEspeciales).map(([key, cat]) => `
                <button 
                    class="${categoriaActiva === key ? "tab-activa" : ""}"
                    onclick="mostrarEstadisticas('${key}')"
                >
                    ${cat.icono} ${cat.titulo}
                </button>
            `).join("")}
        </div>
    `;
}

function crearHTMLEspecial(categoria){
    const resumen = getResumenEspecial(categoria);
    const porcentajeFavorito = resumen.total > 0
        ? Math.round((resumen.favoritoCantidad / resumen.total) * 100)
        : 0;

    const listaUsuarios = [...usuarios]
        .sort((a,b) => a.nombre.localeCompare(b.nombre, "es"))
        .map(u => `
            <div class="especial-row">
                <span>${u.nombre}</span>
                <strong>${normalizarPickEspecial(u[resumen.config.campo])}</strong>
            </div>
        `).join("");

    const conteoHTML = resumen.ordenados.map(([pick, cantidad]) => {
        const porcentaje = resumen.total > 0
            ? Math.round((cantidad / resumen.total) * 100)
            : 0;

        return `
            <div class="especial-row especial-row-conteo">
                <span>${pick}</span>
                <strong>${cantidad} · ${porcentaje}%</strong>
            </div>
        `;
    }).join("");

    return `
        <h2>PRONÓSTICOS <span class="titulo-acento">ESPECIALES</span></h2>

        ${crearHTMLBotonesEspeciales(categoria)}

        <div class="stats-grid especiales-resumen-grid">
            <div class="stat-card">
                <h2>${resumen.config.icono}</h2>
                <p>${resumen.config.titulo}</p>
            </div>

            <div class="stat-card">
                <h2>${resumen.favorito}</h2>
                <p>Favorito de la comunidad · ${resumen.favoritoCantidad} picks · ${porcentajeFavorito}%</p>
            </div>

            <div class="stat-card">
                <h2>${resumen.opcionesDistintas}</h2>
                <p>Opciones distintas</p>
            </div>
        </div>

        <div class="especiales-layout">
            <div class="especial-panel">
                <h3>Conteo general</h3>
                ${conteoHTML}
            </div>

            <div class="especial-panel">
                <h3>Picks por usuario</h3>
                ${listaUsuarios}
            </div>
        </div>
    `;
}

function mostrarEstadisticas(categoriaEspecial = categoriaEspecialActual){

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    categoriaEspecialActual = categoriasEspeciales[categoriaEspecial]
        ? categoriaEspecial
        : "campeon";

    const ranking = getRanking();
    const mejorDiferencias = [...ranking].sort((a,b) => b.diferencias - a.diferencias)[0];

    const totalPicks = picks.length;

    const exactos = picks.filter(p => {
        const partido = partidos.find(x => x.id === p.partidoId);
        return partido && getPuntos(partido, p) === 3;
    }).length;

    const difs = picks.filter(p => {
        const partido = partidos.find(x => x.id === p.partidoId);
        return partido && getPuntos(partido, p) === 2;
    }).length;

    const wins = picks.filter(p => {
        const partido = partidos.find(x => x.id === p.partidoId);
        return partido && getPuntos(partido, p) === 1;
    }).length;

    const fallos = picks.filter(p => {
        const partido = partidos.find(x => x.id === p.partidoId);
        return partidoFinalizado(partido) && getPuntos(partido, p) === 0;
    }).length;

    const mejorExactos = [...ranking].sort((a,b) => b.exactos - a.exactos)[0];
    const mejorGanadores = [...ranking].sort((a,b) => b.ganadores - a.ganadores)[0];

    let efectividadPorPartido = {};

    picks.forEach(p => {

        const partido = partidos.find(x => x.id === p.partidoId);

        if(!partido || !partidoFinalizado(partido)){
            return;
        }

        const puntos = getPuntos(partido, p);

        if(!efectividadPorPartido[p.partidoId]){
            efectividadPorPartido[p.partidoId] = {
                puntosGanados: 0,
                picks: 0,
                efectividad: 0
            };
        }

        efectividadPorPartido[p.partidoId].puntosGanados += puntos;
        efectividadPorPartido[p.partidoId].picks += 1;
    });

    Object.keys(efectividadPorPartido).forEach(idPartido => {
        const item = efectividadPorPartido[idPartido];
        const puntosDisponibles = item.picks * 3;

        item.efectividad = puntosDisponibles > 0
            ? item.puntosGanados / puntosDisponibles
            : 0;
    });

    const partidoMasAciertosId = Object.entries(efectividadPorPartido)
        .sort((a,b) => b[1].efectividad - a[1].efectividad)[0]?.[0];

    const partidoMasAciertos = partidos.find(p => p.id === Number(partidoMasAciertosId));

    const totalAciertosPartido = partidoMasAciertosId
        ? `${Math.round(efectividadPorPartido[partidoMasAciertosId].efectividad * 100)}%`
        : "-";

    contenido.innerHTML = `
        ${crearHTMLEspecial(categoriaEspecialActual)}

        <h1>DATOS <span class="titulo-acento">DESTACADOS</span></h1>

        <div class="stats-grid">
            <div class="stat-card"><h2>${totalPicks}</h2><p>Picks</p></div>
            <div class="stat-card"><h2>${exactos}</h2><p>Exactos</p></div>
            <div class="stat-card"><h2>${difs}</h2><p>Diferencia + ganador</p></div>
            <div class="stat-card"><h2>${wins}</h2><p>Ganadores</p></div>
            <div class="stat-card"><h2>${fallos}</h2><p>Fallos</p></div>
        </div>

        <h2>RÉCORDS <span class="titulo-acento">ACTUALES</span></h2>

        <div class="tabla-ranking">
            <div class="ranking-card">
                <div class="ranking-pos">🎯</div>
                <div class="ranking-user">Mejor en exactos</div>
                <div class="ranking-puntos">${mejorExactos ? `${mejorExactos.nombre} · ${mejorExactos.exactos}` : "-"}</div>
            </div>

            <div class="ranking-card">
                <div class="ranking-pos">✅</div>
                <div class="ranking-user">Mejor en ganadores</div>
                <div class="ranking-puntos">${mejorGanadores ? `${mejorGanadores.nombre} · ${mejorGanadores.ganadores}` : "-"}</div>
            </div>

            <div class="ranking-card">
                <div class="ranking-pos">📐</div>
                <div class="ranking-user">Mejor en diferencia</div>
                <div class="ranking-puntos">
                    ${mejorDiferencias ? `${mejorDiferencias.nombre} · ${mejorDiferencias.diferencias}` : "-"}
                </div>
            </div>

            <div class="ranking-card">
                <div class="ranking-pos">🔥</div>
                <div class="ranking-user">Partido con más aciertos</div>
                <div class="ranking-puntos">
                    ${partidoMasAciertos ? `${partidoMasAciertos.local} vs ${partidoMasAciertos.visita} · ${totalAciertosPartido}` : "-"}
                </div>
            </div>
        </div>

        ${getFooterCopyright()}
    `;
}
