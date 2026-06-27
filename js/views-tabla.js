let tipoTablaActual = "principal";

let cacheRankingGeneralCompleto = null;
let cacheRankingClasificados = null;

function invalidarCacheRankings(){
    cacheRankingGeneralCompleto = null;
    cacheRankingClasificados = null;
}

function precalcularRankings(){
    invalidarCacheRankings();
    if(typeof getRankingGeneralCompleto === "function"){
        getRankingGeneralCompleto(true);
    }
    if(typeof getRankingClasificados === "function"){
        getRankingClasificados(true);
    }
}

function getRankingStorageKey(tipo){
    return `quinielaRanking_${tipo}`;
}

function getFirmaRanking(lista){
    return JSON.stringify(lista.map(u => ({
        id: u.id,
        puntos: u.puntos,
        exactos: u.exactos,
        diferencias: u.diferencias,
        ganadores: u.ganadores,
        fallos: u.fallos
    })));
}

function getPosicionesRanking(lista){
    return lista.reduce((acc, u, index) => {
        acc[u.id] = index + 1;
        return acc;
    }, {});
}

function prepararHistorialRanking(tipo, lista){

    const key = getRankingStorageKey(tipo);
    const firmaActual = getFirmaRanking(lista);
    const posicionesActuales = getPosicionesRanking(lista);

    let cache = null;

    try{
        cache = JSON.parse(localStorage.getItem(key));
    }
    catch(e){
        cache = null;
    }

    if(!cache || !cache.actual){
        cache = {
            firma: firmaActual,
            anterior: null,
            actual: posicionesActuales
        };
    }
    else if(cache.firma !== firmaActual){
        cache = {
            firma: firmaActual,
            anterior: cache.actual,
            actual: posicionesActuales
        };
    }

    try{
        localStorage.setItem(key, JSON.stringify(cache));
    }
    catch(e){
        // Si localStorage falla, simplemente mostramos posiciones sin movimiento.
    }

    return cache.anterior || {};
}

function getMovimientoRanking(posAnterior, posActual){

    if(!posAnterior){
        return {
            icono: "·",
            clase: "mov-neutral",
            titulo: "Sin historial previo"
        };
    }

    if(posActual < posAnterior){
        return {
            icono: "↑",
            clase: "mov-up",
            titulo: `Subió de ${posAnterior}° a ${posActual}°`
        };
    }

    if(posActual > posAnterior){
        return {
            icono: "↓",
            clase: "mov-down",
            titulo: `Bajó de ${posAnterior}° a ${posActual}°`
        };
    }

    return {
        icono: "·",
        clase: "mov-neutral",
        titulo: "Se mantuvo"
    };
}

function crearHTMLRanking(lista, tipo = "principal"){

    if(lista.length === 0){
        return `<p class="subtexto">No hay usuarios en esta tabla.</p>`;
    }

    const posicionesAnteriores = prepararHistorialRanking(tipo, lista);

    return lista.map((u, index) => {

        let medalla = "";
        if(index === 0) medalla = "🥇";
        if(index === 1) medalla = "🥈";
        if(index === 2) medalla = "🥉";

        const posicionActual = index + 1;
        const movimiento = getMovimientoRanking(posicionesAnteriores[u.id], posicionActual);

        const maximo = Number(u.puntosMaximos) || (Number(u.jugados) * 3);
        const porcentaje = maximo > 0
            ? Math.min(100, Math.round((Number(u.puntos) / maximo) * 100))
            : 0;

        return `
            <div class="ranking-card ranking-card-detallado" onclick="verDetalleUsuario(${u.id})">
                <div class="ranking-pos">${medalla || posicionActual}</div>

                <div class="ranking-user">
                    ${u.nombre}
                    <span>${porcentaje}% efectividad</span>
                </div>

                <div class="ranking-mov ${movimiento.clase}" title="${movimiento.titulo}">
                    ${movimiento.icono}
                </div>

                <div class="ranking-puntos">${u.puntos} pts</div>
            </div>
        `;
    }).join("");
}


function getPartidoMayorEfectividad(){

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

    const partidoId = Object.entries(efectividadPorPartido)
        .sort((a,b) => b[1].efectividad - a[1].efectividad)[0]?.[0];

    if(!partidoId){
        return null;
    }

    const partido = partidos.find(p => p.id === Number(partidoId));
    const item = efectividadPorPartido[partidoId];

    if(!partido){
        return null;
    }

    return {
        partido,
        porcentaje: Math.round(item.efectividad * 100),
        puntosGanados: item.puntosGanados,
        puntosDisponibles: item.picks * 3
    };
}

function crearHTMLRecordCard(icono, titulo, valor, detalle = "", tipoDetalle = ""){
    const accion = tipoDetalle ? ` onclick="mostrarDetalleRecord('${tipoDetalle}')"` : "";
    const claseExtra = tipoDetalle ? " record-card-clickable" : "";

    return `
        <div class="record-card${claseExtra}"${accion}>
            <div class="record-icono">${icono}</div>

            <div class="record-info">
                <span>${titulo}</span>
                <strong>${valor}</strong>
                ${detalle ? `<small>${detalle}</small>` : ""}
            </div>
        </div>
    `;
}


function getDatosDestacados(){

    const totalPicks = picks.length;

    const exactos = picks.filter(p => {
        const partido = partidos.find(x => x.id === p.partidoId);
        return partido && getPuntos(partido, p) === 3;
    }).length;

    const diferencias = picks.filter(p => {
        const partido = partidos.find(x => x.id === p.partidoId);
        return partido && getPuntos(partido, p) === 2;
    }).length;

    const ganadores = picks.filter(p => {
        const partido = partidos.find(x => x.id === p.partidoId);
        return partido && getPuntos(partido, p) === 1;
    }).length;

    const fallos = picks.filter(p => {
        const partido = partidos.find(x => x.id === p.partidoId);
        return partidoFinalizado(partido) && getPuntos(partido, p) === 0;
    }).length;

    const golesMarcados = partidos.reduce((total, partido) => {
        if(!partidoFinalizado(partido)){
            return total;
        }

        return total + Number(partido.golesLoc) + Number(partido.golesVis);
    }, 0);

    const porteriasCero = partidos.reduce((total, partido) => {
        if(!partidoFinalizado(partido)){
            return total;
        }

        const gl = Number(partido.golesLoc);
        const gv = Number(partido.golesVis);
        return total + (gv === 0 ? 1 : 0) + (gl === 0 ? 1 : 0);
    }, 0);

    const puntosGanados = picks.reduce((total, pick) => {
        const partido = partidos.find(p => p.id === pick.partidoId);
        return total + (partidoFinalizado(partido) ? getPuntos(partido, pick) : 0);
    }, 0);

    const picksJugados = picks.filter(pick => {
        const partido = partidos.find(p => p.id === pick.partidoId);
        return partidoFinalizado(partido);
    }).length;

    const efectividadGlobal = picksJugados > 0
        ? Math.round((puntosGanados / (picksJugados * 3)) * 100)
        : 0;

    return {
        totalPicks,
        exactos,
        diferencias,
        ganadores,
        fallos,
        golesMarcados,
        efectividadGlobal,
        porteriasCero
    };
}

function crearHTMLDatosDestacados(){

    const datos = getDatosDestacados();

    return `
        <h2>DATOS <span class="titulo-acento">DESTACADOS</span></h2>

        <div class="stats-grid datos-destacados-records datos-destacados-compactos">
            <div class="stat-card"><h2>${datos.totalPicks}</h2><p>Picks</p></div>
            <div class="stat-card"><h2>${datos.exactos}</h2><p>Exactos</p></div>
            <div class="stat-card"><h2>${datos.diferencias}</h2><p>Diferencia + ganador</p></div>
            <div class="stat-card"><h2>${datos.ganadores}</h2><p>Ganadores</p></div>
            <div class="stat-card"><h2>${datos.fallos}</h2><p>Fallos</p></div>
            <div class="stat-card"><h2>${datos.golesMarcados}</h2><p>Goles marcados</p></div>
            <div class="stat-card"><h2>${datos.efectividadGlobal}%</h2><p>Efectividad global</p></div>
            <div class="stat-card"><h2>${datos.porteriasCero}</h2><p>Porterías en cero</p></div>
        </div>
    `;
}

function crearHTMLTabsTabla(tipo, grupo = "A"){
    const esDetalle = ["fase_grupos", "clasificados", "knockout", "especiales", "exactos", "records"].includes(tipo);

    return `
        <div class="tabs-tabla tabs-tabla-principal">
            <button class="${tipo === "principal" ? "tab-activa" : ""}" onclick="mostrarTabla('principal')">🏆 General</button>
            <button class="${tipo === "recreativa" ? "tab-activa" : ""}" onclick="mostrarTabla('recreativa')">🎮 Recreativa</button>
            <button class="${tipo === "grupos" ? "tab-activa" : ""}" onclick="mostrarTabla('grupos', '${grupo}')">🌐 Grupos</button>
            <button class="${esDetalle ? "tab-activa" : ""}" onclick="mostrarTabla('fase_grupos')">📊 Detalle</button>
        </div>

        ${esDetalle ? `
            <div class="tabs-tabla tabs-tabla-secundaria">
                <button class="${tipo === "fase_grupos" ? "tab-activa" : ""}" onclick="mostrarTabla('fase_grupos')">⚽ Fase de Grupos</button>
                <button class="${tipo === "clasificados" ? "tab-activa" : ""}" onclick="mostrarTabla('clasificados')">🏆 Clasificados</button>
                <button class="${tipo === "knockout" ? "tab-activa" : ""}" onclick="mostrarTabla('knockout')">⚔️ Knockout</button>
                <button class="${tipo === "especiales" ? "tab-activa" : ""}" onclick="mostrarTabla('especiales')">⭐ Especiales</button>
                <button class="${tipo === "exactos" ? "tab-activa" : ""}" onclick="mostrarTabla('exactos')">🎯 Exactos</button>
            </div>
        ` : ""}
    `;
}

function crearHTMLBotonesGruposTabla(grupoActivo){
    const grupos = "ABCDEFGHIJKL".split("");

    return `
        <div class="grupos-standings-tabs">
            ${grupos.map(g => `
                <button
                    class="${grupoActivo === g ? "filtro-activo" : ""}"
                    onclick="mostrarTabla('grupos', '${g}')"
                >
                    ${g}
                </button>
            `).join("")}
        </div>
    `;
}

function crearEquipoGrupo(nombre){
    return {
        nombre,
        pj: 0,
        pg: 0,
        pe: 0,
        pp: 0,
        gf: 0,
        gc: 0,
        pts: 0
    };
}

function getGrupoDesdeCodigo(codigo){
    const texto = (codigo || "").trim();
    const grupo = texto.charAt(0);
    return /^[A-L]$/.test(grupo) ? grupo : null;
}

function getTablaGrupo(grupo){
    const equipos = {};

    partidos.forEach(partido => {
        const grupoLoc = getGrupoDesdeCodigo(partido.loc);
        const grupoVis = getGrupoDesdeCodigo(partido.vis);

        if(grupoLoc !== grupo && grupoVis !== grupo){
            return;
        }

        if(grupoLoc === grupo && partido.local){
            equipos[partido.local] = equipos[partido.local] || crearEquipoGrupo(partido.local);
        }

        if(grupoVis === grupo && partido.visita){
            equipos[partido.visita] = equipos[partido.visita] || crearEquipoGrupo(partido.visita);
        }

        if(!partidoFinalizado(partido)){
            return;
        }

        const gl = Number(partido.golesLoc);
        const gv = Number(partido.golesVis);

        if(grupoLoc === grupo && equipos[partido.local]){
            const local = equipos[partido.local];
            local.pj += 1;
            local.gf += gl;
            local.gc += gv;

            if(gl > gv){ local.pg += 1; local.pts += 3; }
            else if(gl === gv){ local.pe += 1; local.pts += 1; }
            else{ local.pp += 1; }
        }

        if(grupoVis === grupo && equipos[partido.visita]){
            const visita = equipos[partido.visita];
            visita.pj += 1;
            visita.gf += gv;
            visita.gc += gl;

            if(gv > gl){ visita.pg += 1; visita.pts += 3; }
            else if(gv === gl){ visita.pe += 1; visita.pts += 1; }
            else{ visita.pp += 1; }
        }
    });

    return Object.values(equipos)
        .map(e => ({...e, dg: e.gf - e.gc}))
        .sort((a,b) => compararEquiposGrupo(a, b, grupo));
}

function getFormaCronologicaGrupo(equipo){
    const nombre = normalizarNombreEquipo(equipo?.nombre || equipo);
    if(!nombre) return [];

    return (Array.isArray(partidos) ? partidos : [])
        .filter(p => !p.esKO && partidoFinalizado(p))
        .filter(p =>
            normalizarNombreEquipo(p.local) === nombre ||
            normalizarNombreEquipo(p.visita) === nombre
        )
        .sort((a,b) => Number(a.id || 0) - Number(b.id || 0))
        .map(p => {
            const esLocal = normalizarNombreEquipo(p.local) === nombre;
            const gf = Number(esLocal ? p.golesLoc : p.golesVis);
            const gc = Number(esLocal ? p.golesVis : p.golesLoc);

            if(gf > gc) return "win";
            if(gf < gc) return "loss";
            return "draw";
        });
}

function crearHTMLFormaGrupo(e){
    const resultados = getFormaCronologicaGrupo(e);
    const jugados = Math.max(0, Number(e.pj || 0));
    const porJugar = Math.max(0, 3 - Math.max(jugados, resultados.length));

    const clases = {
        win: '<span class="forma-dot forma-win" title="Victoria"></span>',
        draw: '<span class="forma-dot forma-draw" title="Empate"></span>',
        loss: '<span class="forma-dot forma-loss" title="Derrota"></span>'
    };

    const puntos = [
        ...resultados.map(r => clases[r] || ""),
        ...Array(porJugar).fill('<span class="forma-pending" title="Por jugar">·</span>')
    ];

    return `<div class="equipo-forma" aria-label="Forma del equipo">${puntos.join("")}</div>`;
}

function crearHTMLTablaGrupos(grupo = "A"){
    const grupoSeguro = /^[A-L]$/.test(grupo) ? grupo : "A";
    const tabla = getTablaGrupo(grupoSeguro);

    return `
        <h1>TABLA <span class="titulo-acento">DE GRUPOS</span></h1>
        <p class="subtexto">Puntos Reales del Mundial.</p>

        ${crearHTMLTabsTabla("grupos", grupoSeguro)}
        ${crearHTMLBotonesGruposTabla(grupoSeguro)}

        <div class="grupo-standings-card">
            <h2>Grupo <span class="titulo-acento">${grupoSeguro}</span></h2>

            <div class="tabla-grupo-real">
                <div class="tabla-grupo-header">
                    <span>#</span>
                    <span>Equipo</span>
                    <span>Pts</span>
                    <span>+/-</span>
                    <span>GF</span>
                </div>

                ${tabla.length === 0 ? `<p class="subtexto">No hay equipos detectados para este grupo.</p>` : tabla.map((e, index) => `
                    <div class="tabla-grupo-row ${equipoClasificadoReal(e.nombre, grupoSeguro) ? 'equipo-clasificado-row' : ''}">
                        <span class="tabla-posicion">${index + 1}</span>
                        <span class="equipo-grupo-nombre">
                            <span class="equipo-grupo-linea">${crearHTMLPaisConBandera(e.nombre)}</span>
                            ${crearHTMLFormaGrupo(e)}
                        </span>
                        <strong>${e.pts}</strong>
                        <span>${e.dg}</span>
                        <span>${e.gf}</span>
                    </div>
                `).join("")}
            </div>
        </div>

        ${getFooterCopyright()}
    `;
}

function getRankingRecord(tipo){
    const ranking = getRanking();

    if(tipo === "exactos"){
        return ranking.sort((a,b) => b.exactos - a.exactos || b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"));
    }

    if(tipo === "ganadores"){
        return ranking.sort((a,b) => b.ganadores - a.ganadores || b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"));
    }

    if(tipo === "diferencias"){
        return ranking.sort((a,b) => b.diferencias - a.diferencias || b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"));
    }

    return ranking.sort((a,b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"));
}

function crearHTMLDetalleRecordUsuarios(tipo){
    const config = {
        exactos: { titulo: "Más marcadores exactos", campo: "exactos", icono: "🎯", ayuda: "Marcadores que valen 3 puntos." },
        ganadores: { titulo: "Más ganadores", campo: "ganadores", icono: "✅", ayuda: "Aciertos de ganador." },
        diferencias: { titulo: "Más diferencia + ganador", campo: "diferencias", icono: "📐", ayuda: "Aciertos que valen 2 puntos." },
        exactosKO: { titulo: "Más exactos en Knockout", campo: "marcador", icono: "⚔️", ayuda: "Marcadores exactos en partidos KO." }
    }[tipo];

    const lista = tipo === "exactosKO"
        ? (typeof getRankingKO === "function" ? [...getRankingKO()].sort((a,b) => (b.marcador || 0) - (a.marcador || 0) || (b.puntos || 0) - (a.puntos || 0) || a.nombre.localeCompare(b.nombre, "es", {numeric:true})) : [])
        : getRankingRecord(tipo);

    return `
        <button onclick="volverARecordsMarcas()" class="btnVolver">⬅ Volver</button>
        <h1>${config.icono} ${config.titulo}</h1>
        <p class="subtexto">${config.ayuda}</p>

        <div class="tabla-ranking">
            ${lista.map((u, index) => `
                <div class="ranking-card ranking-card-detallado" onclick="verDetalleUsuario(${u.id})">
                    <div class="ranking-pos">${index + 1}</div>
                    <div class="ranking-user">
                        ${u.nombre}
                        <span>${u.puntos} pts totales · ${u.jugados} partidos</span>
                    </div>
                    <div class="ranking-puntos">${u[config.campo]}</div>
                </div>
            `).join("")}
        </div>

        ${getFooterCopyright()}
    `;
}

function getEfectividadPartidosOrdenada(){
    const mapa = {};

    picks.forEach(p => {
        const partido = partidos.find(x => x.id === p.partidoId);

        if(!partido || !partidoFinalizado(partido)){
            return;
        }

        if(!mapa[p.partidoId]){
            mapa[p.partidoId] = {
                partido,
                puntosGanados: 0,
                picks: 0
            };
        }

        mapa[p.partidoId].puntosGanados += getPuntos(partido, p);
        mapa[p.partidoId].picks += 1;
    });

    return Object.values(mapa)
        .map(item => ({
            ...item,
            puntosDisponibles: item.picks * 3,
            porcentaje: item.picks > 0 ? Math.round((item.puntosGanados / (item.picks * 3)) * 100) : 0
        }))
        .sort((a,b) => b.porcentaje - a.porcentaje || b.puntosGanados - a.puntosGanados || a.partido.id - b.partido.id);
}

function crearHTMLPaginacionRecordEfectividad(paginaSegura, totalPaginas, totalItems, inicio, fin){
    return `
        <div class="paginacion paginacion-detalle">
            <button 
                onclick="mostrarDetalleRecord('efectividad', ${paginaSegura - 1}, true)" 
                ${paginaSegura <= 1 ? "disabled" : ""}
            >
                ⬅ Anterior
            </button>

            <span>Página ${paginaSegura} de ${totalPaginas}</span>

            <button 
                onclick="mostrarDetalleRecord('efectividad', ${paginaSegura + 1}, true)" 
                ${paginaSegura >= totalPaginas ? "disabled" : ""}
            >
                Siguiente ➡
            </button>
        </div>
    `;
}

function crearHTMLDetalleRecordEfectividad(pagina = 1){
    const lista = getEfectividadPartidosOrdenada();
    const itemsPorPagina = 10;
    const totalPaginas = Math.max(1, Math.ceil(lista.length / itemsPorPagina));
    const paginaSegura = Math.min(Math.max(Number(pagina) || 1, 1), totalPaginas);
    const inicio = (paginaSegura - 1) * itemsPorPagina;
    const fin = Math.min(inicio + itemsPorPagina, lista.length);
    const listaPagina = ordenarPronosticosPorIDPartido(lista.slice(inicio, fin));
    const paginacionHTML = lista.length > 0
        ? crearHTMLPaginacionRecordEfectividad(paginaSegura, totalPaginas, lista.length, inicio, fin)
        : "";

    return `
        <button onclick="volverARecordsMarcas()" class="btnVolver">⬅ Volver</button>
        <h1 id="tituloRecordEfectividad">🔥 MAYOR <span class="titulo-acento">EFECTIVIDAD</span></h1>
        <p class="subtexto">Partidos ordenados por puntos ganados / puntos disponibles.</p>

        ${paginacionHTML}

        <div class="tabla-ranking">
            ${lista.length === 0 ? `<p class="subtexto">Aún no hay partidos finalizados con picks.</p>` : listaPagina.map((item, index) => `
                <div class="ranking-card ranking-card-detallado" onclick="verPartido(${item.partido.id})">
                    <div class="ranking-pos">${inicio + index + 1}</div>
                    <div class="ranking-user">
                        ${item.partido.local} vs ${item.partido.visita}
                        <span>${item.puntosGanados}/${item.puntosDisponibles} pts posibles</span>
                    </div>
                    <div class="ranking-puntos">${item.porcentaje}%</div>
                </div>
            `).join("")}
        </div>

        ${paginacionHTML}

        ${getFooterCopyright()}
    `;
}

function volverARecordsMarcas(){
    mostrarTabla("records", "A", false);

    setTimeout(() => {
        const titulo = document.getElementById("marcasDestacadas");

        if(titulo){
            const y = titulo.getBoundingClientRect().top + window.scrollY - 85;
            window.scrollTo({
                top: Math.max(0, y),
                behavior: "smooth"
            });
        }
    }, 60);
}

function mostrarDetalleRecord(tipo, pagina = 1, scrollTitulo = false){
    if(!scrollTitulo){
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if(tipo === "efectividad"){
        contenido.innerHTML = crearHTMLDetalleRecordEfectividad(pagina);

        if(scrollTitulo){
            setTimeout(() => {
                const titulo = document.getElementById("tituloRecordEfectividad");

                if(titulo){
                    const y = titulo.getBoundingClientRect().top + window.scrollY - 85;
                    window.scrollTo({
                        top: Math.max(0, y),
                        behavior: "smooth"
                    });
                }
            }, 50);
        }

        return;
    }

    if(["exactos", "ganadores", "diferencias", "exactosKO"].includes(tipo)){
        contenido.innerHTML = crearHTMLDetalleRecordUsuarios(tipo);
        return;
    }

    mostrarTabla("records");
}


function getMejorExactosKnockout(){
    const lista = typeof getRankingKO === "function" ? getRankingKO() : [];
    return [...lista].sort((a,b) =>
        (b.marcador || 0) - (a.marcador || 0) ||
        (b.puntos || 0) - (a.puntos || 0) ||
        (a.nombre || "").localeCompare(b.nombre || "", "es")
    )[0] || null;
}

function crearHTMLRecordsTabla(){

    const ranking = getRanking();

    const liderGeneral = [...ranking].sort((a,b) => b.puntos - a.puntos)[0];
    const mejorExactos = [...ranking].sort((a,b) => b.exactos - a.exactos)[0];
    const mejorGanadores = [...ranking].sort((a,b) => b.ganadores - a.ganadores)[0];
    const mejorDiferencias = [...ranking].sort((a,b) => b.diferencias - a.diferencias)[0];
    const mejorExactosKO = getMejorExactosKnockout();
    const partidoMayorEfectividad = getPartidoMayorEfectividad();

    return `
        <h1>RÉCORDS <span class="titulo-acento">ACTUALES</span></h1>
        <p class="subtexto">Marcas destacadas de la quiniela.</p>

        ${crearHTMLTabsTabla("records")}

        ${crearHTMLDatosDestacados()}

        <h2 id="marcasDestacadas">MARCAS <span class="titulo-acento">DESTACADAS</span></h2>
        <p class="subtexto">Toca una tarjeta para ver el detalle completo.</p>

        <div class="records-grid">
            ${crearHTMLRecordCard(
                "👑",
                "Líder general",
                liderGeneral ? `${liderGeneral.nombre} · ${liderGeneral.puntos} pts` : "-",
                "Mayor puntaje acumulado"
            )}

            ${crearHTMLRecordCard(
                "🎯",
                "Más marcadores exactos",
                mejorExactos ? `${mejorExactos.nombre} · ${mejorExactos.exactos}` : "-",
                "Toca para ver la tabla completa",
                "exactos"
            )}

            ${crearHTMLRecordCard(
                "📐",
                "Más diferencia + ganador",
                mejorDiferencias ? `${mejorDiferencias.nombre} · ${mejorDiferencias.diferencias}` : "-",
                "Toca para ver la tabla completa",
                "diferencias"
            )}

            ${crearHTMLRecordCard(
                "⚔️",
                "Más exactos en Knockout",
                mejorExactosKO ? `${mejorExactosKO.nombre} · ${mejorExactosKO.marcador || 0}` : "-",
                "Toca para ver la tabla completa",
                "exactosKO"
            )}

            ${crearHTMLRecordCard(
                "✅",
                "Más ganadores",
                mejorGanadores ? `${mejorGanadores.nombre} · ${mejorGanadores.ganadores}` : "-",
                "Toca para ver la tabla completa",
                "ganadores"
            )}

            ${crearHTMLRecordCard(
                "🔥",
                "Partido con mayor efectividad",
                partidoMayorEfectividad
                    ? `${partidoMayorEfectividad.partido.local} vs ${partidoMayorEfectividad.partido.visita} · ${partidoMayorEfectividad.porcentaje}%`
                    : "-",
                partidoMayorEfectividad
                    ? `${partidoMayorEfectividad.puntosGanados}/${partidoMayorEfectividad.puntosDisponibles} pts posibles · toca para detalle`
                    : "Solo partidos finalizados",
                "efectividad"
            )}
        </div>

        ${getFooterCopyright()}
    `;
}


function getClasePuntosSemaforo(puntos){
    const n = Math.max(0, Math.min(8, Number(puntos) || 0));
    return `pts-semaforo-${n}`;
}

function getEtiquetaPuntosKO(puntos){
    const n = Number(puntos) || 0;

    if(n >= 8) return "Win + Exacto + Pen";
    if(n === 7) return "Win + Exacto";
    if(n === 6) return "Win + Pen";
    if(n === 5) return "Avanza";

    return "Fallo";
}

function crearHTMLRankingKO(lista){

    if(lista.length === 0){
        return `<p class="subtexto">No hay picks KO todavía.</p>`;
    }

    return lista.map((u, index) => {
        let medalla = "";
        if(index === 0) medalla = "🥇";
        if(index === 1) medalla = "🥈";
        if(index === 2) medalla = "🥉";

        return `
            <div class="ranking-card ranking-card-detallado ranking-ko-card" onclick="verDetalleUsuario(${u.id}, 1, false, 'partidos', 'ko')">
                <div class="ranking-pos">${medalla || index + 1}</div>

                <div class="ranking-user">
                    ${u.nombre}
                    <span>${u.jugados}/${u.pronosticos} partidos</span>
                </div>

                <div class="ranking-ko-breakdown">
                    <span>A: ${u.avanza}</span>
                    <span>E: ${u.marcador}</span>
                    <span>P: ${u.penales}</span>
                </div>

                <div class="ranking-puntos">${u.puntos} pts</div>
            </div>
        `;
    }).join("");
}


function getCampeonRealKO(){
    const final = getPartidoGlobalKO(104) || getPartidoKOBase(104);
    if(!final || !partidoFinalizado(final)){
        return "";
    }

    const campeon = getEquipoPasaPartido(final);
    return esPorDefinir(campeon) ? "" : campeon;
}

function partido104FinalizadoPorStatus(){
    const final = getPartidoGlobalKO(104) || getPartidoKOBase(104);
    const status = (final?.status || "").toString().trim().toLowerCase();
    return status.includes("finalizado") || status.includes("finalizada") || status === "final";
}

function getResumenEspecialesUsuario(idUser, opciones = {}){
    const usuario = usuarios.find(u => Number(u.id) === Number(idUser));
    const campeonReal = getCampeonRealKO();

    let puntos = 0;
    let aciertos = 0;
    let puntosMaximos = 0;

    // Campeón correcto vale 10 pts cuando la Final ya tiene campeón real.
    if(campeonReal){
        puntosMaximos += 10;
        if(usuario && normalizarNombreEquipo(usuario.campeon) === normalizarNombreEquipo(campeonReal)){
            puntos += 10;
            aciertos += 1;
        }
    }

    // Goleador: en General/Recreativa solo suma cuando el partido 104 tiene Status Finalizado.
    // En Standing Especiales sí se muestra desde antes para consulta independiente.
    const goleadorActivo = opciones.incluirGoleadorPendiente === true || partido104FinalizadoPorStatus();
    const hayPrimerLugarGoleador = goleadorActivo && typeof getGoleadoresTopPrimerLugar === "function" && getGoleadoresTopPrimerLugar().length > 0;
    if(hayPrimerLugarGoleador){
        puntosMaximos += 10;
        if(usuario && typeof pickGoleadorEsPrimerLugar === "function" && pickGoleadorEsPrimerLugar(usuario.goleador)){
            puntos += 10;
            aciertos += 1;
        }
    }

    return { puntos, aciertos, puntosMaximos, campeonReal };
}

function faseGruposCerrada(){
    const partido70 = partidos.find(p => Number(p.id) === 70);
    const status = (partido70?.status || "").toString().trim().toLowerCase();
    return status === "finalizado";
}

function combinarResumenUsuario(idUser){
    const fase = getResumenUsuario(idUser);
    const clasificados = getResumenClasificadosUsuario(idUser);
    const ko = getResumenUsuarioKO(idUser);
    const especiales = getResumenEspecialesUsuario(idUser);
    const activarStage2 = faseGruposCerrada();

    const puntosExtra = activarStage2
        ? clasificados.puntos + ko.puntos + especiales.puntos
        : 0;
    const puntosCompetencia = fase.puntos + puntosExtra;
    const jugadosCompetencia = activarStage2 ? fase.jugados + ko.jugados : fase.jugados;
    const pronosticosCompetencia = activarStage2 ? fase.pronosticos + ko.pronosticos : fase.pronosticos;
    const puntosMaximos = activarStage2
        ? (fase.jugados * 3) + (ko.jugados * 8) + (clasificados.grupos * 8) + (especiales.puntosMaximos || 0)
        : (fase.jugados * 3);

    return {
        ...fase,
        puntosFaseGrupos: fase.puntos,
        puntosClasificados: clasificados.puntos,
        puntosKO: ko.puntos,
        puntosEspeciales: especiales.puntos,
        puntos: puntosCompetencia,
        pronosticos: pronosticosCompetencia,
        jugados: jugadosCompetencia,
        aciertos: activarStage2 ? fase.aciertos + ko.aciertos : fase.aciertos,
        exactos: activarStage2 ? fase.exactos + ko.exactos : fase.exactos,
        diferencias: fase.diferencias,
        ganadores: activarStage2 ? fase.ganadores + ko.ganadores : fase.ganadores,
        fallos: activarStage2 ? fase.fallos + ko.fallos : fase.fallos,
        puntosMaximos,
        totalKnockout: ko.puntos,
        totalClasificados: clasificados.puntos,
        totalEspeciales: especiales.puntos,
        stage2Activo: activarStage2
    };
}

function getRankingGeneralCompleto(forzar = false){
    if(cacheRankingGeneralCompleto && !forzar){
        return cacheRankingGeneralCompleto;
    }

    cacheRankingGeneralCompleto = usuarios.map(u => ({
        id: u.id,
        nombre: u.nombre,
        paga: u.paga,
        campeon: u.campeon,
        segundo: u.segundo,
        tercero: u.tercero,
        goleador: u.goleador,
        sorpresa: u.sorpresa,
        ...combinarResumenUsuario(u.id)
    })).sort((a,b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es", {numeric:true}));

    return cacheRankingGeneralCompleto;
}

function getRankingEspeciales(){
    return usuarios.map(u => ({
        id: u.id,
        nombre: u.nombre,
        paga: u.paga,
        campeon: u.campeon,
        segundo: u.segundo,
        tercero: u.tercero,
        goleador: u.goleador,
        sorpresa: u.sorpresa,
        ...getResumenEspecialesUsuario(u.id, { incluirGoleadorPendiente: true })
    })).sort((a,b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es", {numeric:true}));
}

function crearHTMLRankingEspeciales(lista){
    if(lista.length === 0){
        return `<p class="subtexto">No hay picks especiales todavía.</p>`;
    }

    const leyendaEspeciales = `
        <div class="standing-especiales-leyenda" aria-label="Leyenda de especiales">
            <span class="especial-leyenda-item"><span class="especial-icono-trofeo" aria-label="Campeón" title="Campeón">🏆</span> Campeón</span>
            <span class="especial-leyenda-separador">·</span>
            <span class="especial-leyenda-item"><img src="img/trionda.png" alt="Goleador" title="Goleador" class="especial-icono-goleador"> Goleador</span>
        </div>
    `;

    return leyendaEspeciales + lista.map((u, index) => `
        <div class="ranking-card ranking-card-detallado" onclick="verDetalleUsuario(${u.id}, 1, false, 'especiales')">
            <div class="ranking-pos">${index + 1}</div>
            <div class="ranking-user ranking-user-especiales">
                ${u.nombre}
                <span class="especial-linea especial-linea-campeon"><span class="especial-icono-trofeo" aria-label="Campeón" title="Campeón">🏆</span>${crearHTMLPaisEspecialSeguro(u.campeon)}</span>
                <span class="especial-linea especial-linea-goleador"><img src="img/trionda.png" alt="Goleador" title="Goleador" class="especial-icono-goleador">${crearHTMLGoleadorEspecial(u.goleador, { simboloPuntos:true })}</span>
            </div>
            <div class="ranking-puntos">${u.puntos} pts</div>
        </div>
    `).join("");
}

function crearHTMLRankingExactos(lista){
    if(lista.length === 0){
        return `<p class="subtexto">No hay usuarios en esta tabla.</p>`;
    }

    return lista.map((u, index) => `
        <div class="ranking-card ranking-card-detallado" onclick="verDetalleUsuario(${u.id})">
            <div class="ranking-pos">${index + 1}</div>
            <div class="ranking-user">
                ${u.nombre}
                <span>${u.puntos} pts totales · ${u.jugados} partidos</span>
            </div>
            <div class="ranking-puntos ranking-puntos-inline">${u.exactos} <span>aciertos</span></div>
        </div>
    `).join("");
}

function getRankingClasificados(forzar = false){
    if(cacheRankingClasificados && !forzar){
        return cacheRankingClasificados;
    }

    cacheRankingClasificados = usuarios
        .map(u => ({
            id: u.id,
            nombre: u.nombre,
            paga: u.paga,
            ...getResumenClasificadosUsuario(u.id)
        }))
        .sort((a,b) =>
            b.puntos - a.puntos ||
            b.gruposPerfectos - a.gruposPerfectos ||
            b.dosClasificados - a.dosClasificados ||
            b.unClasificado - a.unClasificado ||
            a.nombre.localeCompare(b.nombre, "es", {numeric:true})
        );

    return cacheRankingClasificados;
}

function crearHTMLRankingClasificados(lista){

    if(lista.length === 0){
        return `<p class="subtexto">No hay picks de clasificados todavía.</p>`;
    }

    return lista.map((u, index) => {
        let medalla = "";
        if(index === 0) medalla = "🥇";
        if(index === 1) medalla = "🥈";
        if(index === 2) medalla = "🥉";

        return `
            <div class="ranking-card ranking-card-detallado ranking-clasificados-card" onclick="verDetalleUsuario(${u.id}, 1, false, 'clasificados', 'grupos', 'A')">
                <div class="ranking-pos">${medalla || index + 1}</div>

                <div class="ranking-user">
                    ${u.nombre}
                    <span>${u.grupos}/12 grupos</span>
                </div>

                <div class="ranking-ko-breakdown">
                    <span>8P: ${u.ochoP || 0}</span>
                    <span>5P: ${u.cincoP || 0}</span>
                    <span>4P: ${u.cuatroP || 0}</span>
                    <span>1P: ${u.unP || 0}</span>
                </div>

                <div class="ranking-puntos ranking-puntos-clasificados">${u.puntos} pts</div>
            </div>
        `;
    }).join("");
}

function mostrarTabla(tipo = "principal", grupo = "A", hacerScroll = true){

    if(hacerScroll){
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    tipoTablaActual = tipo;

    if(tipo === "records"){
        contenido.innerHTML = crearHTMLRecordsTabla();
        return;
    }

    if(tipo === "grupos"){
        contenido.innerHTML = crearHTMLTablaGrupos(grupo);
        return;
    }

    if(tipo === "clasificados"){
        const rankingClasificados = getRankingClasificados();

        contenido.innerHTML = `
            <h1>STANDINGS <span class="titulo-acento">CLASIFICADOS</span></h1>
            <p class="subtexto">Tabla de picks de clasificados: 8 pts dos equipos y orden (8P), 5 pts dos equipos (5P), 4 pts un equipo con orden (4P), 1 pt un equipo (1P).</p>

            ${crearHTMLTabsTabla(tipo)}

            <div class="tabla-ranking">
                ${crearHTMLRankingClasificados(rankingClasificados)}
            </div>

            ${getFooterCopyright()}
        `;
        return;
    }

    if(tipo === "knockout"){
        const rankingKO = getRankingKO();

        contenido.innerHTML = `
            <h1>STANDINGS <span class="titulo-acento">KO</span></h1>
            <p class="subtexto">Tabla KO: 5 pts avanza (A), +2 marcador exacto (E), +1 penales (P).</p>

            ${crearHTMLTabsTabla(tipo)}

            <div class="tabla-ranking">
                ${crearHTMLRankingKO(rankingKO)}
            </div>

            ${getFooterCopyright()}
        `;
        return;
    }

    if(tipo === "fase_grupos"){
        const rankingFase = getRanking();

        contenido.innerHTML = `
            <h1>STANDINGS <span class="titulo-acento">FASE DE GRUPOS</span></h1>
            <p class="subtexto">Ranking durante la Fase de Grupos</p>

            ${crearHTMLTabsTabla(tipo)}

            <div class="tabla-ranking">
                ${crearHTMLRanking(rankingFase, 'fase_grupos')}
            </div>

            ${getFooterCopyright()}
        `;
        return;
    }

    if(tipo === "especiales"){
        const rankingEspeciales = getRankingEspeciales();

        contenido.innerHTML = `
            <h1>STANDINGS <span class="titulo-acento">ESPECIALES</span></h1>
            <p class="subtexto">Ranking de puntos especiales finales</p>

            ${crearHTMLTabsTabla(tipo)}

            <div class="tabla-ranking">
                ${crearHTMLRankingEspeciales(rankingEspeciales)}
            </div>

            ${getFooterCopyright()}
        `;
        return;
    }

    if(tipo === "exactos"){
        const rankingExactos = getRankingRecord("exactos");

        contenido.innerHTML = `
            <h1>STANDINGS <span class="titulo-acento">EXACTOS</span></h1>
            <p class="subtexto">Ranking de marcadores exactos</p>

            ${crearHTMLTabsTabla(tipo)}

            <div class="tabla-ranking">
                ${crearHTMLRankingExactos(rankingExactos)}
            </div>

            ${getFooterCopyright()}
        `;
        return;
    }

    const rankingCompleto = getRankingGeneralCompleto();
    const rankingPagados = rankingCompleto.filter(u => u.paga === true);
    const rankingTodos = rankingCompleto;

    const listaActual = tipo === "principal" ? rankingPagados : rankingTodos;

    const titulo = tipo === "principal"
        ? `STANDINGS <span class="titulo-acento">GENERAL</span>`
        : `STANDINGS <span class="titulo-acento">RECREATIVA</span>`;

    const descripcion = tipo === "principal"
        ? "Solo usuarios con pago registrado."
        : "Incluye a todos los usuarios.";

    contenido.innerHTML = `
        <h1>${titulo}</h1>
        <p class="subtexto">${descripcion}</p>

        ${crearHTMLTabsTabla(tipo)}

        <p class="subtexto">Toca un usuario para ver cómo se formaron sus puntos.</p>

        <div class="tabla-ranking">
            ${crearHTMLRanking(listaActual, tipo)}
        </div>

        ${getFooterCopyright()}
    `;
}

function getTextoEspecial(valor){
    return valor && valor.trim() !== "" ? valor : "Sin pick";
}

function crearHTMLPaisConBandera(nombre){

    const pais = (nombre || "").trim();

    if(!pais || pais === "-"){
        return `<span>-</span>`;
    }

    return `
        <span class="pais-con-bandera">
            <img src="${getFlag(pais)}" alt="${pais}" class="flag-mini">
            <span>${pais}</span>
        </span>
    `;
}


function crearHTMLPaisEspecialSeguro(nombre){
    const texto = getTextoEspecial(nombre);
    return texto === "Sin pick" ? texto : crearHTMLPaisConBandera(texto);
}

function crearHTMLBanderaSolo(nombre){

    const pais = (nombre || "").trim();

    if(!pais || pais === "-" || pais === "(Por Definir)"){
        return `<span class="bandera-solo bandera-placeholder">-</span>`;
    }

    return `<img src="${getFlag(pais)}" alt="${pais}" class="bandera-solo" title="${pais}">`;
}

function crearHTMLPicksEspecialesUsuario(usuario){

    return `
        <div class="picks-especiales-usuario picks-especiales-grid-compacto">
            <div class="pick-especial-usuario-card">
                <strong>🏆 Campeón</strong>
                <span>${getTextoEspecial(usuario?.campeon)}</span>
            </div>

            <div class="pick-especial-usuario-card">
                <strong>🥈 Segundo</strong>
                <span>${getTextoEspecial(usuario?.segundo)}</span>
            </div>

            <div class="pick-especial-usuario-card">
                <strong>🥉 Tercero</strong>
                <span>${getTextoEspecial(usuario?.tercero)}</span>
            </div>

            <div class="pick-especial-usuario-card pick-especial-largo pick-especial-goleador-una-linea">
                <strong>⚽ Goleador</strong>
                <span>${crearHTMLGoleadorEspecial(usuario?.goleador, { simboloPuntos:true, golesEnLineaNueva:true })}</span>
            </div>

            <div class="pick-especial-usuario-card pick-especial-largo">
                <strong>🌟 Sorpresa</strong>
                <span>${getTextoEspecial(usuario?.sorpresa)}</span>
            </div>
        </div>
    `;
}

function crearHTMLBotonesGruposClasificadosUsuario(idUser, grupoActivo){
    const grupos = "ABCDEFGHIJKL".split("");

    return `
        <div class="grupos-ko-grid grupos-clasificados-usuario">
            ${grupos.map(g => `
                <button
                    class="${grupoActivo === g ? "filtro-activo" : ""}"
                    onclick="verDetalleUsuario(${idUser}, 1, true, 'clasificados', 'grupos', '${g}')"
                >
                    ${g}
                </button>
            `).join("")}
        </div>
    `;
}

function crearHTMLClasificadosUsuario(idUser, grupoActivo = "A"){

    const grupoSeguro = /^[A-L]$/.test((grupoActivo || "").toString().toUpperCase())
        ? grupoActivo.toString().toUpperCase()
        : "A";
    const infoGrupo = getComparacionClasificadosUsuarioGrupo(idUser, grupoSeguro);
    const resumen = getResumenClasificadosUsuario(idUser);

    if(!infoGrupo || infoGrupo.filas.length === 0){
        return `<p class="subtexto">Este usuario todavía no tiene picks de clasificados.</p>`;
    }

    return `
        <div class="clasificados-resumen-usuario">
            <strong>${resumen.puntos} pts</strong>
            <span>${resumen.gruposPerfectos} grupos perfectos · ${resumen.dosClasificados} con 2 clasificados · ${resumen.unClasificado} con 1 clasificado</span>
        </div>

        <p class="subtexto">Puntuación por grupo: 8 pts si acierta los 2 y el orden, 5 pts si acierta los 2, 4 pts si acierta 1 y el orden, 1 pt si acierta 1.</p>

        ${crearHTMLBotonesGruposClasificadosUsuario(idUser, grupoSeguro)}

        <div class="clasificados-resumen-usuario clasificados-resumen-grupo">
            <strong><span class="texto-grupo-clasificados texto-grupo-clasificados-blanco">Grupo ${grupoSeguro}:</span> <span class="texto-puntos-clasificados ${getClasePuntosSemaforo(infoGrupo.puntos)}">${infoGrupo.puntos} pts</span></strong>
            <span>${infoGrupo.etiqueta}</span>
        </div>

        <div class="clasificados-comparacion-grid">
            ${infoGrupo.filas.map(item => `
                <div class="clasificado-card ${getClasePuntosSemaforo(infoGrupo.puntos)} ${item.aciertoOrden ? "clasificado-ok" : "clasificado-error"}">
                    <h3>${item.clave}</h3>
                    <p><strong>Pick:</strong> ${crearHTMLPaisConBandera(item.pronostico)}</p>
                    <p><strong>Real:</strong> ${crearHTMLPaisConBandera(item.real)}</p>
                    <p class="clasificado-resultado">${item.aciertoOrden ? "✅ Orden exacto" : ""}</p>
                </div>
            `).join("")}
        </div>
    `;
}

function crearHTMLTabsDetalleUsuario(idUser, vista, detalleTipo = "grupos", grupoClasificados = "A"){

    return `
        <div class="tabs-detalle-usuario">
            <button 
                class="${vista === "partidos" ? "tab-activa" : ""}"
                onclick="verDetalleUsuario(${idUser}, 1, false, 'partidos', '${detalleTipo}', '${grupoClasificados}')"
            >
                🎯 Partidos
            </button>

            <button 
                class="${vista === "clasificados" ? "tab-activa" : ""}"
                onclick="verDetalleUsuario(${idUser}, 1, false, 'clasificados', '${detalleTipo}', '${grupoClasificados}')"
            >
                🏆 Clasificados
            </button>

            <button 
                class="${vista === "especiales" ? "tab-activa" : ""}"
                onclick="verDetalleUsuario(${idUser}, 1, false, 'especiales', '${detalleTipo}', '${grupoClasificados}')"
            >
                ⭐ Especiales
            </button>
        </div>
    `;
}

function getNumeroIDPartidoPick(pick){
    const directo = Number(pick?.partidoId);
    if(Number.isFinite(directo)) return directo;

    const alterno = Number(pick?.IDPartido || pick?.idPartido || pick?.partido || 9999);
    return Number.isFinite(alterno) ? alterno : 9999;
}

function getPartidoParaOrdenPick(pick){
    const id = getNumeroIDPartidoPick(pick);
    if(pick?.esKO){
        return getPartidoGlobalKO(id) || getPartidoKOBase(id);
    }
    return partidos.find(p => Number(p.id) === Number(id));
}

function getMesNumeroDesdeTexto(texto){
    const t = (texto || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const meses = {
        enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6,
        julio:7, agosto:8, septiembre:9, setiembre:9, octubre:10, noviembre:11, diciembre:12
    };
    for(const [mes, num] of Object.entries(meses)){
        if(t.includes(mes)) return num;
    }
    return 0;
}

function getFechaKeyPartido(partido){
    const fecha = (partido?.fecha || "").toString().trim();
    if(!fecha) return 99999999;

    const slash = fecha.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if(slash){
        const d = Number(slash[1]);
        const m = Number(slash[2]);
        const y = Number(slash[3] || 2026);
        return y * 10000 + m * 100 + d;
    }

    const dia = Number((fecha.match(/\b(\d{1,2})\b/) || [])[1] || 0);
    const mes = getMesNumeroDesdeTexto(fecha) || 1;
    return 2026 * 10000 + mes * 100 + dia;
}

function getHoraMinutosPartido(partido){
    const hora = (partido?.hora || "").toString().toLowerCase();
    const m = hora.match(/(\d{1,2})\s*:\s*(\d{2})/);
    if(!m) return 9999;

    let h = Number(m[1]);
    const min = Number(m[2]);
    const esPM = hora.includes("p") || hora.includes("pm");
    const esAM = hora.includes("a") || hora.includes("am");

    if(esPM && h < 12) h += 12;
    if(esAM && h === 12) h = 0;

    return h * 60 + min;
}

function ordenarPronosticosPorCalendario(lista){
    return [...lista].sort((a,b) => {
        const pa = getPartidoParaOrdenPick(a);
        const pb = getPartidoParaOrdenPick(b);
        return getFechaKeyPartido(pa) - getFechaKeyPartido(pb) ||
            getHoraMinutosPartido(pa) - getHoraMinutosPartido(pb) ||
            getNumeroIDPartidoPick(a) - getNumeroIDPartidoPick(b) ||
            Number(a.idPick || 0) - Number(b.idPick || 0);
    });
}

function ordenarPronosticosPorIDPartido(lista){
    return ordenarPronosticosPorCalendario(lista);
}

function crearHTMLSubtabsDesgloseUsuario(idUser, detalleTipo){
    return `
        <div class="tabs-detalle-usuario subtabs-desglose">
            <button
                class="${detalleTipo === "grupos" ? "tab-activa" : ""}"
                onclick="verDetalleUsuario(${idUser}, 1, true, 'partidos', 'grupos')"
            >
                🏆 Grupos
            </button>

            <button
                class="${detalleTipo === "ko" ? "tab-activa" : ""}"
                onclick="verDetalleUsuario(${idUser}, 1, true, 'partidos', 'ko')"
            >
                ⚔️ KO
            </button>
        </div>
    `;
}

function crearHTMLPaginacionUsuario(idUser, paginaSegura, totalPaginas, detalleTipo = "grupos"){
    return `
        <div class="paginacion paginacion-detalle">
            <button 
                onclick="verDetalleUsuario(${idUser}, ${paginaSegura - 1}, true, 'partidos', '${detalleTipo}')" 
                ${paginaSegura <= 1 ? "disabled" : ""}
            >
                ⬅ Anterior
            </button>

            <span>Página ${paginaSegura} de ${totalPaginas}</span>

            <button 
                onclick="verDetalleUsuario(${idUser}, ${paginaSegura + 1}, true, 'partidos', '${detalleTipo}')" 
                ${paginaSegura >= totalPaginas ? "disabled" : ""}
            >
                Siguiente ➡
            </button>
        </div>
    `;
}

function verDetalleUsuario(idUser, pagina = 1, scrollPronosticos = false, vista = "partidos", detalleTipo = "grupos", grupoClasificados = "A"){

    const usuarioActual = usuarios.find(u => u.id === idUser);
    const nombre = usuarioActual ? usuarioActual.nombre : `Usuario ${idUser}`;

    const detalleSeguro = detalleTipo === "ko" ? "ko" : "grupos";
    const listaGrupos = picks.filter(p => Number(p.idUser) === Number(idUser)).map(p => ({...p, esKO:false}));
    const listaKO = picksKO.filter(p => Number(p.idUser) === Number(idUser)).map(p => ({...p, esKO:true}));
    const lista = ordenarPronosticosPorIDPartido(detalleSeguro === "ko" ? listaKO : listaGrupos);

    paginaDetalleUsuario = pagina;

    const totalPaginas = Math.max(1, Math.ceil(lista.length / picksPorPagina));
    const paginaSegura = Math.min(Math.max(Number(pagina) || 1, 1), totalPaginas);
    const inicio = (paginaSegura - 1) * picksPorPagina;
    const fin = inicio + picksPorPagina;
    const listaPagina = ordenarPronosticosPorIDPartido(lista.slice(inicio, fin));

    const resumen = getResumenUsuario(idUser);
    const resumenKO = getResumenUsuarioKO(idUser);
    const resumenClasificados = getResumenClasificadosUsuario(idUser);
    const resumenEspeciales = getResumenEspecialesUsuario(idUser);
    const activarStage2 = faseGruposCerrada();
    const puntosTotales = activarStage2
        ? resumen.puntos + resumenKO.puntos + resumenClasificados.puntos + resumenEspeciales.puntos
        : resumen.puntos;
    const golesPronosticados = getGolesPronosticadosUsuario(idUser, true);

    let html = `
        <button onclick="mostrarTabla(tipoTablaActual)" class="btnVolver">⬅ Volver</button>

        <h1>👤 ${nombre}</h1>

        <div class="resumen-usuario resumen-usuario-stage2">
            <div class="resumen-card-principal"><strong>${puntosTotales}</strong><span>Puntos</span></div>
            <div class="resumen-card-principal"><strong>${resumenKO.puntos}</strong><span>Knockout</span></div>
            <div class="resumen-card-principal"><strong>${resumen.puntos}</strong><span>Fase de Grupos</span></div>
            <div class="resumen-card-principal"><strong>${resumenClasificados.puntos}</strong><span>Clasificados</span></div>
            <div class="resumen-card-principal"><strong>${resumen.exactos}</strong><span>Exactos</span></div>
            <div class="resumen-card-principal"><strong>${resumenEspeciales.puntos}</strong><span>Especiales</span></div>
            <div class="resumen-card-secundario"><strong>${resumen.diferencias}</strong><span>Diferencia</span></div>
            <div class="resumen-card-secundario"><strong>${resumen.ganadores}</strong><span>Ganador</span></div>
            <div class="resumen-card-secundario"><strong>${resumen.fallos}</strong><span>Fallos</span></div>
            <div class="resumen-card-secundario resumen-card-goles"><strong>${golesPronosticados}</strong><span>Goles Pronosticados</span></div>
        </div>

        ${crearHTMLTabsDetalleUsuario(idUser, vista, detalleSeguro, grupoClasificados)}
    `;

    if(vista === "especiales"){

        html += `
            <h2 id="tituloPronosticos">
                PICKS <span class="titulo-acento">ESPECIALES</span>
            </h2>

            ${crearHTMLPicksEspecialesUsuario(usuarioActual)}
        `;
    }
    else if(vista === "clasificados"){

        html += `
            <h2 id="tituloPronosticos">
                PICKS <span class="titulo-acento">DE CLASIFICADOS</span>
            </h2>

            ${crearHTMLClasificadosUsuario(idUser, grupoClasificados)}
        `;
    }
    else{

        html += `
            <h2 id="tituloPronosticos">
                DESGLOSE <span class="titulo-acento">DE PRONÓSTICOS</span>
            </h2>

            ${crearHTMLSubtabsDesgloseUsuario(idUser, detalleSeguro)}
        `;

        if(lista.length === 0){
            html += `<p>Este usuario todavía no tiene pronósticos.</p>`;
        }
        else{
            html += crearHTMLPaginacionUsuario(idUser, paginaSegura, totalPaginas, detalleSeguro);
        }

        listaPagina.forEach(r => {

            const partido = r.esKO ? getPartidoUsuarioKO(idUser, r.partidoId) : partidos.find(p => p.id === r.partidoId);
            if(!partido) return;

            const jugado = partidoFinalizado(partido);
            const puntos = jugado ? (r.esKO ? getPuntosKO(partido, r) : getPuntos(partido, r)) : 0;

            let textoPuntos = r.esKO ? "KO" : "-";
            let tipo = r.esKO ? "Pick Knockout" : "Por jugar";
            let clasePuntos = r.esKO ? "pts-ko" : "pts-pendiente";

            if(jugado && r.esKO){
                const pasaReal = getEquipoPasaPartido(partido);
                const pasaPick = getEquipoPasaPick(partido, r);
                textoPuntos = `${puntos} pts`;
                tipo = puntos > 0 ? "KO" : "Fallo";
                clasePuntos = getClasePuntosSemaforo(puntos);
            }
            else if(jugado){
                textoPuntos = `${puntos} pts`;

                if(puntos === 3){
                    tipo = "Marcador exacto";
                    clasePuntos = "pts-exacto";
                }
                else if(puntos === 2){
                    tipo = "Diferencia + ganador";
                    clasePuntos = "pts-diferencia";
                }
                else if(puntos === 1){
                    tipo = "Ganador";
                    clasePuntos = "pts-ganador";
                }
                else{
                    tipo = "Fallo";
                    clasePuntos = "pts-fallo";
                }
            }

            const realTexto = r.esKO
                ? formatearMarcadorConPenales(partido.golesLoc, partido.golesVis, partido.penLoc, partido.penVis)
                : (partido.golesLoc !== "" && partido.golesVis !== "" ? `${partido.golesLoc}-${partido.golesVis}` : "Pendiente");

            const pickTexto = r.esKO ? formatearPickKO(r) : `${r.golLoc}-${r.golVis}`;
            const banderaRealKO = r.esKO ? crearHTMLBanderaSolo(getEquipoPasaPartido(partido)) : "";
            const banderaPickKO = r.esKO ? crearHTMLBanderaSolo(getEquipoPasaPick(partido, r)) : "";
            const lineaMarcador = r.esKO
                ? `<p class="linea-ko-compacta"><strong>Real:</strong> ${banderaRealKO} ${realTexto} · <strong>Pick:</strong> ${banderaPickKO} ${pickTexto}</p>`
                : `<p>Real: ${realTexto} · Pick: ${pickTexto}</p>`;

            if(jugado && r.esKO){
                tipo = getEtiquetaPuntosKO(puntos);
            }

            html += `
                <div class="usuario-pronostico ${r.esKO ? "usuario-pronostico-ko" : ""}">
                    <div>
                        <strong>${partido.local} vs ${partido.visita}</strong>
                        <p>${partido.stage ? partido.stage + " · " : ""}${partido.fecha} · ${partido.hora}</p>
                        ${lineaMarcador}
                    </div>

                    <div class="usuario-score ${clasePuntos}">
                        ${textoPuntos}
                        <span>${tipo}</span>
                    </div>
                </div>
            `;
        });

        if(lista.length > 0){
            html += crearHTMLPaginacionUsuario(idUser, paginaSegura, totalPaginas, detalleSeguro);
        }
    }

    html += getFooterCopyright();
    contenido.innerHTML = html;

    if(scrollPronosticos){

        setTimeout(() => {

            const titulo = document.getElementById("tituloPronosticos");

            if(titulo){
                const y = titulo.getBoundingClientRect().top + window.scrollY - 85;
                window.scrollTo({
                    top: Math.max(0, y),
                    behavior: "smooth"
                });
            }

        }, 50);
    }
}
