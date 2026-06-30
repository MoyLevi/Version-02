const categoriasEspeciales = {
    campeon: {
        titulo: "Primero",
        icono: "🥇",
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
        icono: '<img class="icono-trionda-mini" src="img/trionda.png" alt="Balón">',
        campo: "goleador"
    },
    sorpresa: {
        titulo: "Sorpresa",
        icono: "🌟",
        campo: "sorpresa"
    },
    podio: {
        titulo: "Podio",
        icono: "🏆",
        campo: null
    },
    clasificados: {
        titulo: "Clasificados",
        icono: "🏆",
        campo: null
    },
    records: {
        titulo: "Récords",
        icono: "🏆",
        campo: null
    },
    bracket: {
        titulo: "Bracket",
        icono: "🏟️",
        campo: null
    }
};

const categoriasStatsPrincipales = ["bracket", "clasificados", "records", "sorpresa", "podio"];
const categoriasPodio = ["campeon", "segundo", "tercero", "goleador"];

let categoriaEspecialActual = "bracket";
let categoriaPodioActual = "campeon";
let vistaEspecialActual = "conteo";
let grupoClasificadosActual = "A";
let cacheBracketVisualStats = null;
let paginaGoleadoresActual = 1;

function invalidarCacheBracketStats(){
    cacheBracketVisualStats = null;
}

function precalcularBracketStats(){
    cacheBracketVisualStats = crearHTMLBracketVisualBase();
    return cacheBracketVisualStats;
}


function normalizarPickEspecial(valor){
    return valor && valor.trim() !== "" ? valor.trim() : "Sin pick";
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

function esCategoriaPaisEspecial(categoria){
    return ["campeon", "segundo", "tercero", "sorpresa"].includes(categoria);
}

function crearHTMLPickEspecialConBandera(categoria, valor){
    const pick = normalizarPickEspecial(valor);

    if(categoria === "goleador"){
        return crearHTMLGoleadorEspecial(pick, { incluirGoles:true });
    }

    if(!esCategoriaPaisEspecial(categoria) || pick === "Sin pick"){
        return pick;
    }

    return crearHTMLPaisConBandera(pick);
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
        <div class="tabs-especiales tabs-stats-principales">
            ${categoriasStatsPrincipales.map(key => {
                const cat = categoriasEspeciales[key];
                return `
                    <button 
                        class="${categoriaActiva === key ? "tab-activa" : ""}"
                        onclick="mostrarEstadisticas('${key}', 'conteo', grupoClasificadosActual, true)"
                    >
                        ${cat.icono} ${cat.titulo}
                    </button>
                `;
            }).join("")}
        </div>
    `;
}

function crearHTMLBotonesPodio(categoriaActiva){
    return `
        <div class="tabs-mini-estadisticas tabs-podio">
            ${categoriasPodio.map(key => {
                const cat = categoriasEspeciales[key];
                return `
                    <button
                        class="${categoriaActiva === key ? "tab-activa" : ""}"
                        onclick="mostrarEstadisticas('podio', vistaEspecialActual, grupoClasificadosActual, true, '${key}')"
                    >
                        ${cat.icono} ${cat.titulo}
                    </button>
                `;
            }).join("")}
        </div>
    `;
}

function crearHTMLBotonesVistaEspecial(categoria, vistaActiva){
    const destino = categoriasPodio.includes(categoria) ? "podio" : categoria;
    return `
        <div class="tabs-mini-estadisticas">
            <button
                class="${vistaActiva === "conteo" ? "tab-activa" : ""}"
                onclick="mostrarEstadisticas('${destino}', 'conteo', grupoClasificadosActual, true, '${categoria}')"
            >
                📊 Conteo General
            </button>

            <button
                class="${vistaActiva === "usuarios" ? "tab-activa" : ""}"
                onclick="mostrarEstadisticas('${destino}', 'usuarios', grupoClasificadosActual, true, '${categoria}')"
            >
                👥 Picks por Usuario
            </button>

            ${categoria === "goleador" ? `
                <button
                    class="tab-standing-goleador ${vistaActiva === "standing" ? "tab-activa" : ""}"
                    onclick="mostrarStandingGoleadoresDesdeInicio()"
                >
                    🏅 Standing
                </button>
            ` : ""}
        </div>
    `;
}


function ordenarUsuariosPorGoleadorRanking(lista, campo){
    return [...lista].sort((a,b) => {
        const ga = buscarGoleadorEnRanking(a[campo]);
        const gb = buscarGoleadorEnRanking(b[campo]);
        const golesA = ga ? Number(ga.goles) : -1;
        const golesB = gb ? Number(gb.goles) : -1;
        if(golesB !== golesA) return golesB - golesA;
        const nombreA = (ga?.nombreCorto || a[campo] || "").toString();
        const nombreB = (gb?.nombreCorto || b[campo] || "").toString();
        return nombreA.localeCompare(nombreB, "es", {numeric:true}) || a.nombre.localeCompare(b.nombre, "es", {numeric:true});
    });
}

function cambiarPaginaGoleadores(delta){
    const total = Math.max(1, Math.ceil(((Array.isArray(goleadores) && goleadores.length) ? goleadores.length : 0) / 10));
    paginaGoleadoresActual = Math.min(total, Math.max(1, paginaGoleadoresActual + delta));
    mostrarEstadisticas('podio', 'standing', grupoClasificadosActual, true, 'goleador');
}

function mostrarStandingGoleadoresDesdeInicio(){
    paginaGoleadoresActual = 1;
    mostrarEstadisticas('podio', 'standing', grupoClasificadosActual, true, 'goleador');
}

function crearHTMLStandingGoleador(){
    const listaBase = Array.isArray(goleadores) && goleadores.length
        ? goleadores.slice(0, 50)
        : [];

    if(!listaBase.length){
        return `
            <div class="especial-panel goleadores-panel">
                <h3>Standing Goleadores</h3>
                <div class="especial-row especial-row-conteo goleador-row">
                    <span>Sin datos de goleadores por ahora</span>
                </div>
            </div>
        `;
    }

    const totalPaginas = Math.max(1, Math.ceil(listaBase.length / 10));
    paginaGoleadoresActual = Math.min(totalPaginas, Math.max(1, paginaGoleadoresActual || 1));
    const inicio = (paginaGoleadoresActual - 1) * 10;
    const lista = listaBase.slice(inicio, inicio + 10);

    const paginacion = `
        <div class="goleadores-paginacion">
            <button onclick="cambiarPaginaGoleadores(-1)" ${paginaGoleadoresActual <= 1 ? "disabled" : ""}>◀</button>
            <span>Página ${paginaGoleadoresActual} de ${totalPaginas}</span>
            <button onclick="cambiarPaginaGoleadores(1)" ${paginaGoleadoresActual >= totalPaginas ? "disabled" : ""}>▶</button>
        </div>
    `;

    return `
        <div class="especial-panel goleadores-panel">
            <h3>Standing Goleadores</h3>
            <p class="subtexto goleadores-fuente">Goleadores reales (ESPN)</p>
            ${paginacion}
            ${lista.map(g => {
                const pais = g.pais || "";
                const bandera = pais ? `<img src="${getFlag(pais)}" alt="${pais}" class="flag-mini">` : "";
                const abbr = g.abbr ? ` (${g.abbr})` : "";
                const nombre = g.nombreCorto || g.nombre || "";
                const golesTexto = `${g.goles} ${Number(g.goles) === 1 ? "gol" : "goles"}`;

                return `
                    <div class="especial-row especial-row-conteo goleador-row">
                        <span><strong>${g.pos}</strong> ${nombre} ${bandera}${abbr}</span>
                        <strong class="goleador-goles-real">${golesTexto}</strong>
                    </div>
                `;
            }).join("")}
            ${paginacion}
        </div>
    `;
}



function getLugaresProGrupos(){
    return getLugaresProComparables();
}

function contarValores(lista, selector){
    const conteo = {};

    lista.forEach(item => {
        const valor = normalizarPickEspecial(selector(item));
        conteo[valor] = (conteo[valor] || 0) + 1;
    });

    return Object.entries(conteo)
        .sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
}

function crearHTMLTopConteo(ordenados, total, limite = 5){
    if(ordenados.length === 0){
        return `<p class="subtexto">Sin picks capturados.</p>`;
    }

    return ordenados.slice(0, limite).map(([equipo, cantidad]) => {
        const porcentaje = total > 0
            ? Math.round((cantidad / total) * 100)
            : 0;

        return `
            <div class="clasificado-comunidad-row">
                <span>${crearHTMLPaisConBandera(equipo)}</span>
                <strong>${cantidad} · ${porcentaje}%</strong>
            </div>
        `;
    }).join("");
}

function crearHTMLBotonesGruposClasificados(grupoActivo){
    const grupos = "ABCDEFGHIJKL".split("");

    return `
        <div class="grupos-clasificados-stats">
            ${grupos.map(g => `
                <button
                    class="${grupoActivo === g ? "filtro-activo" : ""}"
                    onclick="mostrarEstadisticas('clasificados', 'conteo', '${g}', true)"
                >
                    ${g}
                </button>
            `).join("")}
        </div>
    `;
}

function crearHTMLClasificadosRealesGrupo(grupo){
    const reales = getClasificadosReales().filter(x => x.grupo === grupo);

    return `
        <div class="clasificado-comunidad-card clasificados-reales-card">
            <h3 class="stats-clasificados-titulo-blanco">Clasificados</h3>
            <p class="subtexto">Equipos Clasificados Reales</p>
            ${reales.map(r => `
                <div class="clasificado-comunidad-row">
                    <span><strong class="clave-clasificado-real">${r.clave}</strong> ${crearHTMLPaisConBandera(r.equipo)}</span>
                    <strong>${r.lugar}°</strong>
                </div>
            `).join("")}
        </div>
    `;
}

function getResumenComparacionClasificados(){
    const picksComparables = getLugaresProComparables();
    const porUsuario = {};

    picksComparables.forEach(pick => {
        const real = getClasificadoRealPorClave(pick.claveNormal);
        const acierto = real && normalizarNombreEquipo(real.equipo) === normalizarNombreEquipo(pick.lugares);

        if(!porUsuario[pick.idUsuario]){
            porUsuario[pick.idUsuario] = {
                id: pick.idUsuario,
                total: 0,
                aciertos: 0
            };
        }

        porUsuario[pick.idUsuario].total += 1;
        porUsuario[pick.idUsuario].aciertos += acierto ? 1 : 0;
    });

    return Object.values(porUsuario).sort((a,b) =>
        b.aciertos - a.aciertos ||
        a.id - b.id
    );
}

function crearHTMLResumenComparacionClasificados(){
    const resumen = getResumenComparacionClasificados();

    if(resumen.length === 0){
        return `<p class="subtexto">Todavía no hay LugaresPro comparables.</p>`;
    }

    return `
        <div class="clasificado-comunidad-card clasificados-reales-card">
            <h3>Comparación vs LugaresPro</h3>
            <p class="subtexto">Solo posiciones 1 y 2 de cada grupo. Terceros fuera por ahora.</p>
            ${resumen.map(r => {
                const usuario = usuarios.find(u => Number(u.id) === Number(r.id));
                return `
                    <div class="clasificado-comunidad-row">
                        <span>${usuario?.nombre || "Usuario " + r.id}</span>
                        <strong>${r.aciertos}/${r.total}</strong>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function crearHTMLClasificadosComunidad(grupoActivo = grupoClasificadosActual){
    const lugaresGrupo = getLugaresProGrupos();
    const totalUsuarios = new Set(lugaresGrupo.map(x => x.idUsuario)).size;
    const conteoGeneral = contarValores(lugaresGrupo, x => x.lugares);
    const favorito = conteoGeneral[0] || ["Sin pick", 0];

    const grupoSeguro = /^[A-L]$/.test(grupoActivo) ? grupoActivo : "A";
    grupoClasificadosActual = grupoSeguro;

    const picksPrimero = lugaresGrupo.filter(x => x.claveNormal === `1${grupoSeguro}`);
    const picksSegundo = lugaresGrupo.filter(x => x.claveNormal === `2${grupoSeguro}`);
    const topPrimero = contarValores(picksPrimero, x => x.lugares);
    const topSegundo = contarValores(picksSegundo, x => x.lugares);

    return `
        <h1>PICKS <span class="titulo-acento">ESPECIALES</span></h1>

        ${crearHTMLBotonesEspeciales("clasificados")}

        <div class="stats-grid especiales-resumen-grid">
            <div class="stat-card">
                <h2>🏆</h2>
                <p>Clasificados</p>
            </div>

            <div class="stat-card">
                <h2 class="stat-pais-favorito">${crearHTMLPaisConBandera(favorito[0])}</h2>
                <p>Equipo más elegido · ${favorito[1]} picks</p>
            </div>

            <div class="stat-card">
                <h2>${totalUsuarios}</h2>
                <p>Usuarios con picks de clasificados</p>
            </div>
        </div>

        ${crearHTMLBotonesGruposClasificados(grupoSeguro)}

        <div class="clasificados-comunidad-grid clasificados-comunidad-grid-unico">
            ${crearHTMLClasificadosRealesGrupo(grupoSeguro)}

            <div class="clasificado-comunidad-card">
                <h3>Grupo ${grupoSeguro}</h3>

                <div class="clasificado-comunidad-bloque">
                    <h4>1° lugar más elegido</h4>
                    ${crearHTMLTopConteo(topPrimero, picksPrimero.length)}
                </div>

                <div class="clasificado-comunidad-bloque">
                    <h4>2° lugar más elegido</h4>
                    ${crearHTMLTopConteo(topSegundo, picksSegundo.length)}
                </div>
            </div>
        </div>
    `;
}


function crearHTMLRecordCardStats(icono, titulo, valor, detalle = "", tipoDetalle = ""){
    const accion = tipoDetalle ? ` onclick="mostrarDetalleRecordStats('${tipoDetalle}')"` : "";
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


function getMejorExactosKnockout(){
    const lista = typeof getRankingKO === "function" ? getRankingKO() : [];
    return [...lista].sort((a,b) =>
        (b.marcador || 0) - (a.marcador || 0) ||
        (b.puntos || 0) - (a.puntos || 0) ||
        (a.nombre || "").localeCompare(b.nombre || "", "es")
    )[0] || null;
}

function crearHTMLRecordsStats(){

    const ranking = getRanking();

    const liderFaseGrupos = [...ranking].sort((a,b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"))[0];
    const liderGeneral = (typeof getRankingGeneralCompleto === "function" ? getRankingGeneralCompleto() : ranking)[0];
    const mejorExactos = [...ranking].sort((a,b) => b.exactos - a.exactos || b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"))[0];
    const mejorGanadores = [...ranking].sort((a,b) => b.ganadores - a.ganadores || b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"))[0];
    const mejorDiferencias = [...ranking].sort((a,b) => b.diferencias - a.diferencias || b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"))[0];
    const mejorExactosKO = getMejorExactosKnockout();
    const partidoMayorEfectividad = getPartidoMayorEfectividad();

    return `
        <h1>RÉCORDS <span class="titulo-acento">ACTUALES</span></h1>
        <p class="subtexto">Datos destacados y marcas vivas de la quiniela.</p>

        ${crearHTMLBotonesEspeciales("records")}

        ${crearHTMLDatosDestacados()}

        <h2 id="marcasDestacadasStats">MARCAS <span class="titulo-acento">DESTACADAS</span></h2>
        <p class="subtexto">Toca una tarjeta para ver el detalle completo.</p>

        <div class="records-grid">
            ${crearHTMLRecordCardStats(
                "🔑",
                "Rey de Fase de Grupos",
                liderFaseGrupos ? `${liderFaseGrupos.nombre} · ${liderFaseGrupos.puntos} pts` : "-",
                "Toca para ir al standing de Fase de Grupos",
                "faseGrupos"
            )}

            ${crearHTMLRecordCardStats(
                "👑",
                "Líder general",
                liderGeneral ? `${liderGeneral.nombre} · ${liderGeneral.puntos} pts` : "-",
                "Mayor puntaje acumulado"
            )}

            ${crearHTMLRecordCardStats(
                "🎯",
                "Más marcadores exactos",
                mejorExactos ? `${mejorExactos.nombre} · ${mejorExactos.exactos}` : "-",
                "Toca para ver la tabla completa",
                "exactos"
            )}

            ${crearHTMLRecordCardStats(
                "📐",
                "Más diferencia + ganador",
                mejorDiferencias ? `${mejorDiferencias.nombre} · ${mejorDiferencias.diferencias}` : "-",
                "Toca para ver la tabla completa",
                "diferencias"
            )}

            ${crearHTMLRecordCardStats(
                "⚔️",
                "Más exactos en Knockout",
                mejorExactosKO ? `${mejorExactosKO.nombre} · ${mejorExactosKO.marcador || 0}` : "-",
                "Toca para ver la tabla completa",
                "exactosKO"
            )}

            ${crearHTMLRecordCardStats(
                "✅",
                "Más ganadores",
                mejorGanadores ? `${mejorGanadores.nombre} · ${mejorGanadores.ganadores}` : "-",
                "Toca para ver la tabla completa",
                "ganadores"
            )}

            ${crearHTMLRecordCardStats(
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
    `;
}

function volverARecordsStats(){
    mostrarEstadisticas("records", "conteo", grupoClasificadosActual, false);

    setTimeout(() => {
        const titulo = document.getElementById("marcasDestacadasStats");

        if(titulo){
            const y = titulo.getBoundingClientRect().top + window.scrollY - 85;
            window.scrollTo({
                top: Math.max(0, y),
                behavior: "smooth"
            });
        }
    }, 60);
}

function crearHTMLDetalleRecordUsuariosStats(tipo){
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
        <button onclick="volverARecordsStats()" class="btnVolver">⬅ Volver</button>
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
    `;
}

function crearHTMLPaginacionRecordEfectividadStats(paginaSegura, totalPaginas){
    return `
        <div class="paginacion paginacion-detalle">
            <button 
                onclick="mostrarDetalleRecordStats('efectividad', ${paginaSegura - 1}, true)" 
                ${paginaSegura <= 1 ? "disabled" : ""}
            >
                ⬅ Anterior
            </button>

            <span>Página ${paginaSegura} de ${totalPaginas}</span>

            <button 
                onclick="mostrarDetalleRecordStats('efectividad', ${paginaSegura + 1}, true)" 
                ${paginaSegura >= totalPaginas ? "disabled" : ""}
            >
                Siguiente ➡
            </button>
        </div>
    `;
}

function crearHTMLDetalleRecordEfectividadStats(pagina = 1){
    const lista = getEfectividadPartidosOrdenada();
    const itemsPorPagina = 10;
    const totalPaginas = Math.max(1, Math.ceil(lista.length / itemsPorPagina));
    const paginaSegura = Math.min(Math.max(Number(pagina) || 1, 1), totalPaginas);
    const inicio = (paginaSegura - 1) * itemsPorPagina;
    const fin = Math.min(inicio + itemsPorPagina, lista.length);
    const listaPagina = lista.slice(inicio, fin);
    const paginacionHTML = lista.length > 0
        ? crearHTMLPaginacionRecordEfectividadStats(paginaSegura, totalPaginas)
        : "";

    return `
        <button onclick="volverARecordsStats()" class="btnVolver">⬅ Volver</button>
        <h1 id="tituloRecordEfectividadStats">🔥 MAYOR <span class="titulo-acento">EFECTIVIDAD</span></h1>
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
    `;
}

function mostrarDetalleRecordStats(tipo, pagina = 1, scrollTitulo = false){
    if(tipo === "faseGrupos"){
        mostrarTabla("fase_grupos");
        return;
    }

    if(!scrollTitulo){
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if(tipo === "efectividad"){
        contenido.innerHTML = `
            ${crearHTMLDetalleRecordEfectividadStats(pagina)}
            ${getFooterCopyright()}
        `;

        if(scrollTitulo){
            setTimeout(() => {
                const titulo = document.getElementById("tituloRecordEfectividadStats");

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
        contenido.innerHTML = `
            ${crearHTMLDetalleRecordUsuariosStats(tipo)}
            ${getFooterCopyright()}
        `;
        return;
    }

    mostrarEstadisticas("records");
}


/* =========================================================
   BRACKET VISUAL DINÁMICO · v3.0.2
   Usa Knockout + RankKO y se actualiza con los resultados.
   ========================================================= */

const bracketVisualConfig = [
    {
        lado:"izq",
        grupos:[
            { ronda32:[73,75], octavos:90, cuartos:97, semi:101 },
            { ronda32:[74,77], octavos:89, cuartos:97, semi:101 },
            { ronda32:[83,84], octavos:93, cuartos:98, semi:101 },
            { ronda32:[81,82], octavos:94, cuartos:98, semi:101 }
        ]
    },
    {
        lado:"der",
        grupos:[
            { ronda32:[76,78], octavos:91, cuartos:99, semi:102 },
            { ronda32:[79,80], octavos:92, cuartos:99, semi:102 },
            { ronda32:[86,88], octavos:95, cuartos:100, semi:102 },
            { ronda32:[85,87], octavos:96, cuartos:100, semi:102 }
        ]
    }
];

function getNombreEquipoBracket(nombre){
    const texto = (nombre || "").toString().trim();
    if(!texto || esPorDefinir(texto)) return "Por definir";
    return texto;
}

function getClaseEquipoBracket(partido, equipo){
    if(!partido || !equipo || esPorDefinir(equipo)) return "";
    const pasa = getNombreEquipoBracket(partido.pasa);
    return normalizarNombreEquipo(pasa) === normalizarNombreEquipo(equipo)
        ? " bracket-team-winner"
        : "";
}

function crearEquipoBracketHTML(partido, equipo, lado){
    const nombre = getNombreEquipoBracket(equipo);
    const sinDefinir = nombre === "Por definir";
    const claseWinner = getClaseEquipoBracket(partido, nombre);
    const inicial = sinDefinir ? "PD" : nombre.slice(0, 3).toUpperCase();

    return `
        <div class="bracket-team${claseWinner}${sinDefinir ? " bracket-team-pd" : ""}">
            ${sinDefinir ? `
                <div class="bracket-flag-placeholder">${inicial}</div>
            ` : `
                <img src="${getFlag(nombre)}" alt="${nombre}" loading="lazy">
            `}
            <span>${nombre}</span>
        </div>
    `;
}

function crearScoreBracketHTML(partido){
    if(!partido || partido.golesLoc === "" || partido.golesVis === ""){
        return `<div class="bracket-score">VS</div>`;
    }

    return `
        <div class="bracket-score">
            ${formatearMarcadorConPenales(partido.golesLoc, partido.golesVis, partido.penLoc, partido.penVis, !partido.esKO || partidoTienePenalesKO(partido))}
        </div>
    `;
}

function crearPartidoBracketHTML(id, extraClass = ""){
    const partido = getPartidoGlobalKO(Number(id));

    if(!partido){
        return `<div class="bracket-match bracket-empty ${extraClass}">Partido ${id}</div>`;
    }

    const gana = getNombreEquipoBracket(partido.pasa);
    const finalizado = partidoFinalizado(partido);

    return `
        <div class="bracket-match ${finalizado ? "bracket-finalizado" : ""} ${extraClass}" data-bracket-id="${partido.id}" title="${partido.stage} · ${partido.lugar}">
            <div class="bracket-meta">
                <span>${partido.id}</span>
                <strong>${partido.fecha || ""}</strong>
                <em>${partido.lugar || ""}</em>
            </div>
            <div class="bracket-teams">
                ${crearEquipoBracketHTML(partido, partido.local, "loc")}
                ${crearScoreBracketHTML(partido)}
                ${crearEquipoBracketHTML(partido, partido.visita, "vis")}
            </div>
            <div class="bracket-winner">${finalizado && gana !== "Por definir" ? `Gana: ${gana}` : "Pendiente"}</div>
        </div>
    `;
}

function crearConectorBracketHTML(tipo){
    return `
        <div class="bracket-connector bracket-connector-${tipo}">
            <span class="connector-line connector-vertical"></span>
            <span class="connector-line connector-top"></span>
            <span class="connector-line connector-bottom"></span>
            <span class="connector-line connector-middle"></span>
        </div>
    `;
}

function crearColumnaBracketHTML(ladoConfig){
    const ladoClase = ladoConfig.lado === "izq" ? "bracket-left" : "bracket-right";

    return `
        <div class="bracket-side ${ladoClase}">
            <div class="bracket-phase-label bracket-label-r32">Fase 32</div>
            <div class="bracket-phase-label bracket-label-r16">OCTAVOS</div>
            <div class="bracket-phase-label bracket-label-qf">CUARTOS</div>
            ${ladoConfig.grupos.map((grupo, index) => `
                <div class="bracket-cluster ${index % 2 === 0 ? "bracket-cluster-pair-start" : "bracket-cluster-pair-end"}">
                    <div class="bracket-round bracket-r32">
                        ${grupo.ronda32.map(id => crearPartidoBracketHTML(id, "bracket-r32-match")).join("")}
                    </div>

                    ${crearConectorBracketHTML("a")}

                    <div class="bracket-round bracket-r16">
                        ${crearPartidoBracketHTML(grupo.octavos, "bracket-r16-match")}
                    </div>

                    ${index % 2 === 0 ? crearConectorBracketHTML("b") : ""}

                    <div class="bracket-round bracket-qf">
                        ${index % 2 === 0 ? crearPartidoBracketHTML(grupo.cuartos, "bracket-qf-match") : ""}
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function crearCentroBracketHTML(){
    const semi1 = getPartidoGlobalKO(101);
    const semi2 = getPartidoGlobalKO(102);
    const tercero = getPartidoGlobalKO(103);
    const final = getPartidoGlobalKO(104);
    const campeon = getNombreEquipoBracket(final?.pasa);

    return `
        <div class="bracket-center">
            <div class="bracket-title-card">
                <h1>BRACKET <span class="titulo-acento">AL MOMENTO</span></h1>
                <p>Se actualiza automáticamente con Knockout y Rank.</p>
            </div>

            <div class="bracket-trophy" aria-hidden="true">
                <img src="img/copa-fifa.png" alt="" class="bracket-trophy-img">
            </div>

            <div class="bracket-phase-label bracket-label-semis">SEMIFINALES</div>
            <div class="bracket-semis">
                ${crearPartidoBracketHTML(101, "bracket-semi-match")}
                ${crearPartidoBracketHTML(102, "bracket-semi-match")}
            </div>

            <div class="bracket-final-card">
                <div class="bracket-final-label">FINAL · 19/JUL · NY</div>
                ${crearPartidoBracketHTML(104, "bracket-final-match")}
                <div class="bracket-champion">
                    <span>Campeón</span>
                    <strong>${campeon === "Por definir" ? "Por definir" : crearHTMLPaisConBandera(campeon)}</strong>
                </div>
            </div>

            <div class="bracket-third-card">
                <span>3er Lugar</span>
                ${crearPartidoBracketHTML(103, "bracket-third-match")}
            </div>
        </div>
    `;
}



function equipoSigueVivoBracket(nombre, grupo = ""){
    const equipo = (nombre || "").toString().trim();
    if(!equipo || esPorDefinir(equipo)) return false;
    const normal = normalizarNombreEquipo(equipo);

    if(!faseGruposCerradaPorJuego70()){
        return equipoClasificadoReal(equipo, grupo);
    }

    const partidosKO = getKnockoutResueltoGlobal();
    const participantes = new Set();
    const eliminados = new Set();

    partidosKO.forEach(p => {
        const loc = normalizarNombreEquipo(p.local);
        const vis = normalizarNombreEquipo(p.visita);
        if(loc && !esPorDefinir(p.local)) participantes.add(loc);
        if(vis && !esPorDefinir(p.visita)) participantes.add(vis);

        if(partidoFinalizado(p)){
            const pasa = normalizarNombreEquipo(p.pasa);
            if(loc && loc !== pasa) eliminados.add(loc);
            if(vis && vis !== pasa) eliminados.add(vis);
        }
    });

    return participantes.has(normal) && !eliminados.has(normal);
}

function crearEstadoVidaBracketHTML(equipo, grupo){
    const inTorneo = equipoSigueVivoBracket(equipo, grupo);
    return `<span class="bracket-life ${inTorneo ? "bracket-life-in" : "bracket-life-out"}">${inTorneo ? "IN" : "OUT"}</span>`;
}

function crearHTMLGruposBracket(){
    const grupos = "ABCDEFGHIJKL".split("");

    return `
        <div class="bracket-groups-strip">
            <h2>Grupos</h2>
            <div class="bracket-groups-grid">
                ${grupos.map(grupo => {
                    const equipos = completarTablaGrupoProvisional(grupo).map(e => e.nombre);
                    return `
                        <div class="bracket-group-col">
                            <strong class="bracket-group-letter">${grupo}</strong>
                            ${equipos.map(equipo => `
                                <div class="bracket-group-team" title="${equipo}">
                                    <img src="${getFlag(equipo)}" alt="${equipo}" loading="lazy" crossorigin="anonymous">
                                    ${crearEstadoVidaBracketHTML(equipo, grupo)}
                                </div>
                            `).join("")}
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `;
}


async function asegurarHtml2CanvasBracket(){
    if(window.html2canvas) return window.html2canvas;

    await new Promise((resolve, reject) => {
        const existente = document.querySelector('script[data-bracket-html2canvas="1"]');
        if(existente){
            existente.addEventListener("load", resolve, { once:true });
            existente.addEventListener("error", reject, { once:true });
            return;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
        script.async = true;
        script.dataset.bracketHtml2canvas = "1";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });

    if(!window.html2canvas) throw new Error("html2canvas no disponible");
    return window.html2canvas;
}

function descargarCanvasBracket(canvas, formatoSeguro){
    const fecha = new Date().toISOString().slice(0,10);
    const mime = formatoSeguro === "jpg" ? "image/jpeg" : "image/png";
    const extension = formatoSeguro === "jpg" ? "jpg" : "png";
    const calidad = formatoSeguro === "jpg" ? 0.84 : 0.92;
    const nombre = `bracket-mundial-2026-${fecha}.${extension}`;

    const descargarURL = url => {
        const link = document.createElement("a");
        link.download = nombre;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    if(canvas.toBlob){
        canvas.toBlob(blob => {
            if(blob){
                const url = URL.createObjectURL(blob);
                descargarURL(url);
                setTimeout(() => URL.revokeObjectURL(url), 1200);
                return;
            }
            descargarURL(canvas.toDataURL(mime, calidad));
        }, mime, calidad);
    }else{
        descargarURL(canvas.toDataURL(mime, calidad));
    }
}

async function exportarBracketImagen(formato = "png"){
    const board = document.getElementById("bracketBoardExport");
    if(!board){
        alert("No se encontró el bracket para exportar.");
        return;
    }

    let sandbox = null;

    try{
        const html2canvasBracket = await asegurarHtml2CanvasBracket();

        sandbox = document.createElement("div");
        sandbox.className = "bracket-export-sandbox";

        const clone = board.cloneNode(true);
        clone.id = "bracketBoardExportCanvas";
        clone.classList.add("bracket-board-export-canvas");
        clone.style.width = `${Math.ceil(board.scrollWidth)}px`;
        clone.style.minWidth = `${Math.ceil(board.scrollWidth)}px`;
        clone.style.maxWidth = "none";
        clone.style.transform = "none";

        clone.querySelectorAll("img").forEach(img => {
            img.setAttribute("crossorigin", "anonymous");
            img.loading = "eager";
        });

        sandbox.appendChild(clone);
        document.body.appendChild(sandbox);

        actualizarLineasBracket(clone);

        await Promise.all(Array.from(clone.querySelectorAll("img")).map(img => {
            if(img.complete && img.naturalWidth !== 0) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        }));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        actualizarLineasBracket(clone);

        const exportWidth = Math.ceil(Math.max(clone.scrollWidth, clone.offsetWidth));
        const exportHeight = Math.ceil(Math.max(clone.scrollHeight, clone.offsetHeight));

        const formatoSeguro = formato === "jpg" || formato === "jpeg" ? "jpg" : "png";
        const canvas = await html2canvasBracket(clone, {
            backgroundColor: "#0f172a",
            scale: formatoSeguro === "jpg" ? 1.1 : 1.2,
            useCORS: true,
            allowTaint: false,
            logging: false,
            width: exportWidth,
            height: exportHeight,
            windowWidth: exportWidth,
            windowHeight: exportHeight,
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0
        });

        descargarCanvasBracket(canvas, formatoSeguro);
    }
    catch(error){
        console.error(error);
        alert("No se pudo exportar el bracket como imagen. Revisa tu conexión e intenta de nuevo.");
    }
    finally{
        if(sandbox){
            sandbox.remove();
        }
    }
}

function crearHTMLBracketVisualBase(){
    return `
        <h1>BRACKET <span class="titulo-acento">MUNDIAL</span></h1>
        ${crearHTMLBotonesEspeciales("bracket")}
        <p class="subtexto">Bracket dinámico de Knockout. Los equipos avanzan automáticamente conforme se capturan resultados.</p>

        <div class="bracket-export-actions">
            <button onclick="exportarBracketImagen('jpg')">Exportar Imagen</button>
        </div>

        <div class="bracket-scroll-hint">Desliza horizontalmente para ver todo el bracket ↔</div>

        <div class="bracket-scroll">
            <div class="bracket-board" id="bracketBoardExport">
                <img src="img/copa-fifa.png" alt="" class="bracket-trophy-bg" loading="eager" crossorigin="anonymous">
                <svg class="bracket-dynamic-lines" aria-hidden="true"></svg>
                ${crearColumnaBracketHTML(bracketVisualConfig[0])}
                ${crearCentroBracketHTML()}
                ${crearColumnaBracketHTML(bracketVisualConfig[1])}
                ${crearHTMLGruposBracket()}
            </div>
        </div>
    `;
}


function crearHTMLBracketVisual(){
    if(!cacheBracketVisualStats){
        return precalcularBracketStats();
    }

    return cacheBracketVisualStats;
}


function crearHTMLPodioEspecial(){
    const categoria = categoriasPodio.includes(categoriaPodioActual) ? categoriaPodioActual : "campeon";
    const resumen = getResumenEspecial(categoria);
    const porcentajeFavorito = resumen.total > 0
        ? Math.round((resumen.favoritoCantidad / resumen.total) * 100)
        : 0;

    const listaUsuariosBase = categoria === "goleador"
        ? ordenarUsuariosPorGoleadorRanking(usuarios, resumen.config.campo)
        : [...usuarios].sort((a,b) => a.nombre.localeCompare(b.nombre, "es"));

    const listaUsuarios = listaUsuariosBase
        .map(u => `
            <div class="especial-row">
                <span>${u.nombre}</span>
                <strong>${crearHTMLPickEspecialConBandera(categoria, u[resumen.config.campo])}</strong>
            </div>
        `).join("");

    const conteoHTML = resumen.ordenados.map(([pick, cantidad]) => {
        const porcentaje = resumen.total > 0
            ? Math.round((cantidad / resumen.total) * 100)
            : 0;

        return `
            <div class="especial-row especial-row-conteo">
                <span>${crearHTMLPickEspecialConBandera(categoria, pick)}</span>
                <strong>${cantidad} · ${porcentaje}%</strong>
            </div>
        `;
    }).join("");

    const panelActual = categoria === "goleador" && vistaEspecialActual === "standing"
        ? "standing"
        : (vistaEspecialActual === "usuarios" ? "usuarios" : "conteo");

    return `
        <h1>PICKS <span class="titulo-acento">ESPECIALES</span></h1>

        ${crearHTMLBotonesEspeciales("podio")}

        <div class="podio-wrapper">
            <h2>🏆 Podio</h2>
            <p class="subtexto">Filtro por Categorías</p>
            ${crearHTMLBotonesPodio(categoria)}
        </div>

        <div class="stats-grid especiales-resumen-grid">
            <div class="stat-card">
                <h2>${resumen.config.icono}</h2>
                <p>${resumen.config.titulo}</p>
            </div>

            <div class="stat-card">
                <h2 class="stat-pais-favorito">${crearHTMLPickEspecialConBandera(categoria, resumen.favorito)}</h2>
                <p>Favorito de la comunidad · ${resumen.favoritoCantidad} picks · ${porcentajeFavorito}%</p>
            </div>

            <div class="stat-card">
                <h2>${resumen.opcionesDistintas}</h2>
                <p>Opciones distintas</p>
            </div>
        </div>

        ${crearHTMLBotonesVistaEspecial(categoria, panelActual)}

        <div class="especiales-layout especiales-layout-unico">
            ${panelActual === "standing" ? crearHTMLStandingGoleador() : (panelActual === "conteo" ? `
                <div class="especial-panel">
                    <h3>Conteo general</h3>
                    ${conteoHTML}
                </div>
            ` : `
                <div class="especial-panel">
                    <h3>Picks por usuario</h3>
                    ${listaUsuarios}
                </div>
            `)}
        </div>
    `;
}

function crearHTMLEspecial(categoria){

    if(categoria === "podio"){
        return crearHTMLPodioEspecial();
    }

    if(categoria === "records"){
        return crearHTMLRecordsStats();
    }

    if(categoria === "bracket"){
        return crearHTMLBracketVisual();
    }

    if(categoria === "clasificados"){
        return crearHTMLClasificadosComunidad(grupoClasificadosActual);
    }

    const resumen = getResumenEspecial(categoria);
    const porcentajeFavorito = resumen.total > 0
        ? Math.round((resumen.favoritoCantidad / resumen.total) * 100)
        : 0;

    const listaUsuariosBase = categoria === "goleador"
        ? ordenarUsuariosPorGoleadorRanking(usuarios, resumen.config.campo)
        : [...usuarios].sort((a,b) => a.nombre.localeCompare(b.nombre, "es"));

    const listaUsuarios = listaUsuariosBase
        .map(u => `
            <div class="especial-row">
                <span>${u.nombre}</span>
                <strong>${crearHTMLPickEspecialConBandera(categoria, u[resumen.config.campo])}</strong>
            </div>
        `).join("");

    const conteoHTML = resumen.ordenados.map(([pick, cantidad]) => {
        const porcentaje = resumen.total > 0
            ? Math.round((cantidad / resumen.total) * 100)
            : 0;

        return `
            <div class="especial-row especial-row-conteo">
                <span>${crearHTMLPickEspecialConBandera(categoria, pick)}</span>
                <strong>${cantidad} · ${porcentaje}%</strong>
            </div>
        `;
    }).join("");

    const panelActual = categoria === "goleador" && vistaEspecialActual === "standing"
        ? "standing"
        : (vistaEspecialActual === "usuarios" ? "usuarios" : "conteo");

    return `
        <h1>PICKS <span class="titulo-acento">ESPECIALES</span></h1>

        ${crearHTMLBotonesEspeciales(categoria)}

        <div class="stats-grid especiales-resumen-grid">
            <div class="stat-card">
                <h2>${resumen.config.icono}</h2>
                <p>${resumen.config.titulo}</p>
            </div>

            <div class="stat-card">
                <h2 class="stat-pais-favorito">${crearHTMLPickEspecialConBandera(categoria, resumen.favorito)}</h2>
                <p>Favorito de la comunidad · ${resumen.favoritoCantidad} picks · ${porcentajeFavorito}%</p>
            </div>

            <div class="stat-card">
                <h2>${resumen.opcionesDistintas}</h2>
                <p>Opciones distintas</p>
            </div>
        </div>

        ${crearHTMLBotonesVistaEspecial(categoria, panelActual)}

        <div class="especiales-layout especiales-layout-unico">
            ${panelActual === "standing" ? crearHTMLStandingGoleador() : (panelActual === "conteo" ? `
                <div class="especial-panel">
                    <h3>Conteo general</h3>
                    ${conteoHTML}
                </div>
            ` : `
                <div class="especial-panel">
                    <h3>Picks por usuario</h3>
                    ${listaUsuarios}
                </div>
            `)}
        </div>
    `;
}



function actualizarLineasBracket(boardParam = null){
    const board = boardParam || document.getElementById("bracketBoardExport");
    if(!board) return;

    const svg = board.querySelector(".bracket-dynamic-lines");
    if(!svg) return;

    const boardRect = board.getBoundingClientRect();
    const getMatch = id => board.querySelector(`[data-bracket-id="${id}"]`);
    const pos = (id, side = "right") => {
        const el = getMatch(id);
        if(!el) return null;
        const r = el.getBoundingClientRect();
        const y = r.top - boardRect.top + (r.height / 2);
        if(side === "left") return { x:r.left - boardRect.left, y };
        if(side === "top") return { x:r.left - boardRect.left + (r.width / 2), y:r.top - boardRect.top };
        if(side === "bottom") return { x:r.left - boardRect.left + (r.width / 2), y:r.bottom - boardRect.top };
        return { x:r.right - boardRect.left, y };
    };

    const w = Math.max(board.scrollWidth, board.offsetWidth, Math.ceil(boardRect.width));
    const h = Math.max(board.scrollHeight, board.offsetHeight, Math.ceil(boardRect.height));
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.innerHTML = "";

    const mkPath = d => {
        const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("d", d);
        p.setAttribute("class", "bracket-dynamic-path");
        svg.appendChild(p);
    };

    const sideToSide = (from, to, lado) => {
        const a = pos(from, lado === "left" ? "right" : "left");
        const b = pos(to, lado === "left" ? "left" : "right");
        if(!a || !b) return;
        const dir = lado === "left" ? 1 : -1;
        const midX = a.x + dir * Math.max(24, Math.abs(b.x - a.x) * .52);
        mkPath(`M ${a.x} ${a.y} H ${midX} V ${b.y} H ${b.x}`);
    };

    const joinTwo = (fromA, fromB, to, lado, opciones = {}) => {
        const sideFrom = lado === "left" ? "right" : "left";
        const sideTo = lado === "left" ? "left" : "right";
        const a = pos(fromA, sideFrom);
        const b = pos(fromB, sideFrom);
        const c = pos(to, sideTo);
        if(!a || !b || !c) return;
        const dir = lado === "left" ? 1 : -1;
        const distancia = Math.abs(c.x - a.x);
        const factor = opciones.factorTronco ?? .48;
        const minTronco = opciones.minTronco ?? 24;
        const trunkX = a.x + dir * Math.max(minTronco, distancia * factor);
        const salidaY = opciones.usarYDestino ? c.y : (a.y + b.y) / 2;

        mkPath(`M ${a.x} ${a.y} H ${trunkX} V ${b.y} H ${b.x}`);
        mkPath(`M ${trunkX} ${salidaY} H ${c.x}`);
    };

    // Octavos -> Cuartos
    joinTwo(90, 89, 97, "left");
    joinTwo(93, 94, 98, "left");
    joinTwo(91, 92, 99, "right");
    joinTwo(95, 96, 100, "right");

    // Cuartos -> Semifinales
    // v3.3.5.1: ajuste específico para la imagen exportada.
    // Las rutas 32 -> Octavos y Octavos -> Cuartos quedan intactas.
    const conectarCuartosASemi = (fromA, fromB, to, lado) => {
        const sideFrom = lado === "left" ? "right" : "left";
        const sideTo = lado === "left" ? "left" : "right";
        const a = pos(fromA, sideFrom);
        const b = pos(fromB, sideFrom);
        const c = pos(to, sideTo);
        if(!a || !b || !c) return;

        const dir = lado === "left" ? 1 : -1;
        const esExportacion = board.classList.contains("bracket-board-export-canvas");

        /*
         * v3.3.5.6
         * Exportación: NO se usan offsets artificiales para QF -> SF.
         * La línea se calcula con el centro real de cada cuadro y termina
         * exactamente en el borde del cuadro de semifinal. Así no queda
         * flotando ni desfasada al capturar con html2canvas.
         */
        const distancia = Math.abs(c.x - a.x);
        /*
         * v3.3.5.7
         * En la exportación, el tronco QF -> SF debe quedar pegado a
         * los CUARTOS, no flotando junto a SEMIFINALES. Así imita el
         * conector de las rondas anteriores: dos salidas cortas desde
         * cuartos, un tronco vertical limpio, y una sola entrada directa
         * al centro del cuadro semifinal.
         */
        const trunkX = esExportacion
            ? a.x + dir * 28
            : a.x + dir * Math.max(26, distancia * .46);

        /*
         * v3.3.5.8
         * Ajuste SOLO para exportación: las 4 salidas desde los cuadros
         * de cuartos hacia el tronco se bajan ligeramente para que entren
         * visualmente al centro real del cuadro en la imagen generada.
         * La llegada del tronco a semifinales queda intacta.
         */
        const salidaQfOffsetY = esExportacion ? 38 : 0;
        const ay = a.y + salidaQfOffsetY;
        const by = b.y + salidaQfOffsetY;
        const yMin = Math.min(ay, by, c.y);
        const yMax = Math.max(ay, by, c.y);

        mkPath(`M ${a.x} ${ay} H ${trunkX}`);
        mkPath(`M ${b.x} ${by} H ${trunkX}`);
        mkPath(`M ${trunkX} ${yMin} V ${yMax}`);
        mkPath(`M ${trunkX} ${c.y} H ${c.x}`);
    };

    conectarCuartosASemi(97, 98, 101, "left");
    conectarCuartosASemi(99, 100, 102, "right");

    // Semifinales -> Final
    const s1 = pos(101, "bottom");
    const s2 = pos(102, "bottom");
    const f = pos(104, "top");
    if(s1 && s2 && f){
        const y = Math.min(f.y - 18, Math.max(s1.y, s2.y) + 42);
        mkPath(`M ${s1.x} ${s1.y} V ${y} H ${f.x} V ${f.y}`);
        mkPath(`M ${s2.x} ${s2.y} V ${y} H ${f.x}`);
    }
}

function centrarBracketVerticalStats(){
    const scroller = document.querySelector(".bracket-scroll");
    if(!scroller) return;
    requestAnimationFrame(() => {
        const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        if(maxTop > 0){
            scroller.scrollTop = Math.round(maxTop / 2);
        }
        // No tocamos scrollLeft: el usuario conserva el inicio horizontal del bracket.
    });
}

function mostrarEstadisticas(categoriaEspecial = categoriaEspecialActual, vistaEspecial = "conteo", grupoClasificados = grupoClasificadosActual, conservarScroll = false, categoriaPodio = categoriaPodioActual){

    const scrollActual = window.scrollY || document.documentElement.scrollTop || 0;

    if(!conservarScroll){
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    categoriaEspecialActual = categoriasStatsPrincipales.includes(categoriaEspecial)
        ? categoriaEspecial
        : "bracket";

    if(categoriaEspecialActual === "podio" && categoriasPodio.includes(categoriaPodio)){
        categoriaPodioActual = categoriaPodio;
    }

    vistaEspecialActual = ["usuarios", "standing"].includes(vistaEspecial) ? vistaEspecial : "conteo";

    if(/^[A-L]$/.test(grupoClasificados)){
        grupoClasificadosActual = grupoClasificados;
    }

    contenido.innerHTML = `
        ${crearHTMLEspecial(categoriaEspecialActual)}

        ${getFooterCopyright()}
    `;


    if(categoriaEspecialActual === "bracket"){
        centrarBracketVerticalStats();
        actualizarLineasBracket();
    }

    if(conservarScroll){
        requestAnimationFrame(() => {
            window.scrollTo({
                top: scrollActual,
                behavior: "auto"
            });
            if(categoriaEspecialActual === "bracket"){
                centrarBracketVerticalStats();
                actualizarLineasBracket();
            }
        });
    }
}


window.addEventListener("resize", () => {
    if(categoriaEspecialActual === "bracket") actualizarLineasBracket();
});
