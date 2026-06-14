let tipoTablaActual = "principal";

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
            icono: "—",
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
        icono: "—",
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

        const porcentaje = u.jugados > 0
            ? Math.round((u.puntos / (u.jugados * 3)) * 100)
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

function crearHTMLRecordCard(icono, titulo, valor, detalle = ""){
    return `
        <div class="record-card">
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

    return {
        totalPicks,
        exactos,
        diferencias,
        ganadores,
        fallos
    };
}

function crearHTMLDatosDestacados(){

    const datos = getDatosDestacados();

    return `
        <h2>DATOS <span class="titulo-acento">DESTACADOS</span></h2>

        <div class="stats-grid datos-destacados-records">
            <div class="stat-card"><h2>${datos.totalPicks}</h2><p>Picks</p></div>
            <div class="stat-card"><h2>${datos.exactos}</h2><p>Exactos</p></div>
            <div class="stat-card"><h2>${datos.diferencias}</h2><p>Diferencia + ganador</p></div>
            <div class="stat-card"><h2>${datos.ganadores}</h2><p>Ganadores</p></div>
            <div class="stat-card"><h2>${datos.fallos}</h2><p>Fallos</p></div>
        </div>
    `;
}

function crearHTMLRecordsTabla(){

    const ranking = getRanking();

    const liderGeneral = [...ranking].sort((a,b) => b.puntos - a.puntos)[0];
    const mejorExactos = [...ranking].sort((a,b) => b.exactos - a.exactos)[0];
    const mejorGanadores = [...ranking].sort((a,b) => b.ganadores - a.ganadores)[0];
    const mejorDiferencias = [...ranking].sort((a,b) => b.diferencias - a.diferencias)[0];
    const partidoMayorEfectividad = getPartidoMayorEfectividad();

    return `
        <h1>RÉCORDS <span class="titulo-acento">ACTUALES</span></h1>
        <p class="subtexto">Líderes y marcas destacadas de la quiniela.</p>

        <div class="tabs-tabla">
            <button onclick="mostrarTabla('principal')">🏆 Principal</button>
            <button onclick="mostrarTabla('recreativa')">🎮 Recreativa</button>
            <button class="tab-activa" onclick="mostrarTabla('records')">📈 Récords</button>
        </div>

        ${crearHTMLDatosDestacados()}

        <h2>RÉCORDS <span class="titulo-acento">ACTUALES</span></h2>

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
                "Marcadores de 3 puntos"
            )}

            ${crearHTMLRecordCard(
                "✅",
                "Más ganadores",
                mejorGanadores ? `${mejorGanadores.nombre} · ${mejorGanadores.ganadores}` : "-",
                "Aciertos de ganador"
            )}

            ${crearHTMLRecordCard(
                "📐",
                "Más diferencia + ganador",
                mejorDiferencias ? `${mejorDiferencias.nombre} · ${mejorDiferencias.diferencias}` : "-",
                "Aciertos de 2 puntos"
            )}

            ${crearHTMLRecordCard(
                "🔥",
                "Partido con mayor efectividad",
                partidoMayorEfectividad
                    ? `${partidoMayorEfectividad.partido.local} vs ${partidoMayorEfectividad.partido.visita} · ${partidoMayorEfectividad.porcentaje}%`
                    : "-",
                partidoMayorEfectividad
                    ? `${partidoMayorEfectividad.puntosGanados}/${partidoMayorEfectividad.puntosDisponibles} pts posibles`
                    : "Solo partidos finalizados"
            )}
        </div>

        ${getFooterCopyright()}
    `;
}

function mostrarTabla(tipo = "principal"){

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    tipoTablaActual = tipo;

    if(tipo === "records"){
        contenido.innerHTML = crearHTMLRecordsTabla();
        return;
    }

    const ranking = getRanking();
    const rankingPagados = ranking.filter(u => u.paga === true);
    const rankingTodos = ranking;

    const listaActual = tipo === "principal" ? rankingPagados : rankingTodos;

    const titulo = tipo === "principal"
        ? `TABLA <span class="titulo-acento">PRINCIPAL</span>`
        : `TABLA <span class="titulo-acento">RECREATIVA</span>`;

    const descripcion = tipo === "principal"
        ? "Solo usuarios con pago registrado."
        : "Incluye a todos los usuarios.";

    contenido.innerHTML = `
        <h1>${titulo}</h1>
        <p class="subtexto">${descripcion}</p>

        <div class="tabs-tabla">
            <button 
                class="${tipo === "principal" ? "tab-activa" : ""}" 
                onclick="mostrarTabla('principal')"
            >
                🏆 Principal
            </button>

            <button 
                class="${tipo === "recreativa" ? "tab-activa" : ""}" 
                onclick="mostrarTabla('recreativa')"
            >
                🎮 Recreativa
            </button>

            <button 
                class="${tipo === "records" ? "tab-activa" : ""}" 
                onclick="mostrarTabla('records')"
            >
                📈 Récords
            </button>
        </div>

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

            <div class="pick-especial-usuario-card pick-especial-largo">
                <strong>⚽ Goleador</strong>
                <span>${getTextoEspecial(usuario?.goleador)}</span>
            </div>

            <div class="pick-especial-usuario-card pick-especial-largo">
                <strong>🌟 Sorpresa</strong>
                <span>${getTextoEspecial(usuario?.sorpresa)}</span>
            </div>
        </div>
    `;
}

function crearHTMLClasificadosUsuario(idUser){

    const lista = lugaresPro.filter(x => x.idUsuario === idUser);

    if(lista.length === 0){
        return `<p class="subtexto">Este usuario todavía no tiene picks de clasificados.</p>`;
    }

    const grupos = "ABCDEFGHIJKL".split("");

    return `
        <div class="clasificados-grid">
            ${grupos.map(g => {

                const primero = lista.find(x => x.lug === `${g}1`)?.lugares || "-";
                const segundo = lista.find(x => x.lug === `${g}2`)?.lugares || "-";

                return `
                    <div class="clasificado-card">
                        <h3>Grupo ${g}</h3>
                        <p><strong>1°</strong> ${crearHTMLPaisConBandera(primero)}</p>
                        <p><strong>2°</strong> ${crearHTMLPaisConBandera(segundo)}</p>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function crearHTMLTabsDetalleUsuario(idUser, vista){

    return `
        <div class="tabs-detalle-usuario">
            <button 
                class="${vista === "partidos" ? "tab-activa" : ""}"
                onclick="verDetalleUsuario(${idUser}, 1, false, 'partidos')"
            >
                🎯 Partidos
            </button>

            <button 
                class="${vista === "clasificados" ? "tab-activa" : ""}"
                onclick="verDetalleUsuario(${idUser}, 1, false, 'clasificados')"
            >
                🏆 Clasificados
            </button>

            <button 
                class="${vista === "especiales" ? "tab-activa" : ""}"
                onclick="verDetalleUsuario(${idUser}, 1, false, 'especiales')"
            >
                ⭐ Especiales
            </button>
        </div>
    `;
}

function verDetalleUsuario(idUser, pagina = 1, scrollPronosticos = false, vista = "partidos"){

    const usuarioActual = usuarios.find(u => u.id === idUser);
    const nombre = usuarioActual ? usuarioActual.nombre : `Usuario ${idUser}`;

    const lista = picks.filter(p => p.idUser === idUser);

    paginaDetalleUsuario = pagina;

    const totalPaginas = Math.max(1, Math.ceil(lista.length / picksPorPagina));
    const paginaSegura = Math.min(Math.max(pagina, 1), totalPaginas);
    const inicio = (paginaSegura - 1) * picksPorPagina;
    const fin = inicio + picksPorPagina;
    const listaPagina = lista.slice(inicio, fin);

    const resumen = getResumenUsuario(idUser);

    let html = `
        <button onclick="mostrarTabla(tipoTablaActual)" class="btnVolver">⬅ Volver</button>

        <h1>👤 ${nombre}</h1>

        <div class="resumen-usuario">
            <div><strong>${resumen.puntos}</strong><span>Puntos</span></div>
            <div><strong>${resumen.exactos}</strong><span>Exactos</span></div>
            <div><strong>${resumen.diferencias}</strong><span>Diferencia</span></div>
            <div><strong>${resumen.ganadores}</strong><span>Ganador</span></div>
            <div><strong>${resumen.fallos}</strong><span>Fallos</span></div>
        </div>

        ${crearHTMLTabsDetalleUsuario(idUser, vista)}
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

            ${crearHTMLClasificadosUsuario(idUser)}
        `;
    }
    else{

        html += `
            <h2 id="tituloPronosticos">
                DESGLOSE <span class="titulo-acento">DE PRONÓSTICOS</span>
            </h2>
        `;

        if(lista.length === 0){
            html += `<p>Este usuario todavía no tiene pronósticos.</p>`;
        }

        listaPagina.forEach(r => {

            const partido = partidos.find(p => p.id === r.partidoId);
            if(!partido) return;

            const jugado = partidoFinalizado(partido);
            const puntos = jugado ? getPuntos(partido, r) : 0;

            let textoPuntos = "-";
            let tipo = "Por jugar";
            let clasePuntos = "pts-pendiente";

            if(jugado){
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

            html += `
                <div class="usuario-pronostico">
                    <div>
                        <strong>${partido.local} vs ${partido.visita}</strong>
                        <p>${partido.fecha} · ${partido.hora}</p>
                        <p>Real: ${partido.golesLoc !== "" && partido.golesVis !== "" ? `${partido.golesLoc}-${partido.golesVis}` : "Pendiente"} · Pick: ${r.golLoc}-${r.golVis}</p>
                    </div>

                    <div class="usuario-score ${clasePuntos}">
                        ${textoPuntos}
                        <span>${tipo}</span>
                    </div>
                </div>
            `;
        });

        html += `
            <div class="paginacion">
                <button 
                    onclick="verDetalleUsuario(${idUser}, ${paginaSegura - 1}, true, 'partidos')" 
                    ${paginaSegura <= 1 ? "disabled" : ""}
                >
                    ⬅ Anterior
                </button>

                <span>Página ${paginaSegura} de ${totalPaginas}</span>

                <button 
                    onclick="verDetalleUsuario(${idUser}, ${paginaSegura + 1}, true, 'partidos')" 
                    ${paginaSegura >= totalPaginas ? "disabled" : ""}
                >
                    Siguiente ➡
                </button>
            </div>
        `;
    }

    html += getFooterCopyright();
    contenido.innerHTML = html;

    if(scrollPronosticos){

        setTimeout(() => {

            const titulo = document.getElementById("tituloPronosticos");

            if(titulo){
                titulo.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }

        }, 50);
    }
}
