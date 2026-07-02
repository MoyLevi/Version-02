function getFlag(country){

    const clean = (c) => (c || "")
        .toString()
        .trim()
        .toLowerCase();

    const map = {
        "alemania": "de",
        "arabia saudita": "sa",
        "argelia": "dz",
        "argentina": "ar",
        "australia": "au",
        "austria": "at",
        "belgica": "be",
        "bosnia herzegovina": "ba",
        "bos": "ba",
        "bosnia-herzegovina": "ba",
        "brasil": "br",
        "cabo verde": "cv",
        "canada": "ca",
        "colombia": "co",
        "congo": "cd",
        "corea del sur": "kr",
        "costa de marfil": "ci",
        "croacia": "hr",
        "dinamarca": "dk",
        "serbia": "rs",
        "ucrania": "ua",
        "curazao": "cw",
        "ecuador": "ec",
        "egipto": "eg",
        "escocia": "gb-sct",
        "espana": "es",
        "españa": "es",
        "estados unidos": "us",
        "francia": "fr",
        "ghana": "gh",
        "haiti": "ht",
        "holanda": "nl",
        "inglaterra": "gb-eng",
        "iran": "ir",
        "iraq": "iq",
        "japon": "jp",
        "jordania": "jo",
        "marruecos": "ma",
        "mexico": "mx",
        "nueva zelanda": "nz",
        "noruega": "no",
        "panama": "pa",
        "paraguay": "py",
        "portugal": "pt",
        "qatar": "qa",
        "republica checa": "cz",
        "che": "cz",
        "czechia": "cz",
        "senegal": "sn",
        "sudafrica": "za",
        "suecia": "se",
        "suiza": "ch",
        "tunez": "tn",
        "turquia": "tr",
        "uruguay": "uy",
        "uzbekistan": "uz"
    };

    const code = map[clean(country)];

    return code
        ? `https://flagcdn.com/w80/${code}.png`
        : `https://flagcdn.com/w80/un.png`;
}


/* =========================================================
   Helpers Goleador Especial · Ranking HC Goleadores
   ========================================================= */
function normalizarTextoComparacion(valor){
    return (valor || "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function normalizarNombreGoleadorPick(valor){
    return normalizarTextoComparacion(valor)
        .replace(/^\d+\s+/, "")
        .replace(/\b\d+\s*goles?\b/g, "")
        .replace(/\bs\s*n\b/g, "")
        .trim();
}

function buscarGoleadorEnRanking(valor){
    const pick = normalizarNombreGoleadorPick(valor);
    if(!pick || pick === "sin pick" || pick === "por definir") return null;

    const lista = Array.isArray(goleadores) ? goleadores.filter(g => !g.fallback) : [];
    return lista.find(g => {
        const nombre = normalizarNombreGoleadorPick(g.nombre);
        const corto = normalizarNombreGoleadorPick(g.nombreCorto);
        return pick === nombre || pick === corto || nombre.includes(pick) || pick.includes(nombre) || corto.includes(pick) || pick.includes(corto);
    }) || null;
}

function crearHTMLGoleadorEspecial(valor, opciones = {}){
    const pick = (valor || "").toString().trim();
    if(!pick) return "Sin pick";

    const jugador = buscarGoleadorEnRanking(pick);

    /*
       Si el jugador no existe en el standing real, NO abreviar el pick:
       se muestra exactamente como viene desde la HC Usuarios para no comerse apellidos.
    */
    const nombre = jugador?.nombreCorto || pick;
    const pais = jugador?.pais || "";
    const bandera = pais ? `<img src="${getFlag(pais)}" alt="${pais}" class="flag-mini">` : "";
    const abbr = jugador?.abbr ? ` (${jugador.abbr})` : "";
    const goles = jugador ? jugador.goles : null;
    const golesTexto = jugador ? `<span class="goleador-goles-real">${goles} ${Number(goles) === 1 ? "gol" : "goles"}</span>` : "";
    const incluirGoles = opciones.incluirGoles !== false && jugador;

    if(opciones.golesEnLineaNueva && incluirGoles){
        return `<span class="goleador-pick-inline goleador-pick-dos-lineas"><span class="goleador-pick-nombre">${nombre} ${bandera}${abbr}</span><span class="goleador-pick-goles">· ${golesTexto}</span></span>`;
    }

    return `<span class="goleador-pick-inline">${nombre} ${bandera}${abbr}${incluirGoles ? ` · ${golesTexto}` : ""}</span>`;
}

function getGoleadoresTopPrimerLugar(){
    const lista = Array.isArray(goleadores) ? goleadores.filter(g => !g.fallback) : [];
    if(!lista.length) return [];
    const minPos = Math.min(...lista.map(g => Number(g.pos)).filter(Number.isFinite));
    return lista.filter(g => Number(g.pos) === minPos);
}

function pickGoleadorEsPrimerLugar(valor){
    const jugador = buscarGoleadorEnRanking(valor);
    if(!jugador) return false;
    const primeros = getGoleadoresTopPrimerLugar();
    return primeros.some(g => normalizarNombreGoleadorPick(g.nombre) === normalizarNombreGoleadorPick(jugador.nombre));
}

function actualizarTimestamp(){
    ultimaActualizacion = new Date();
}

function formatearFechaHora(fecha){
    if(!fecha) return "Sin actualización";

    return fecha.toLocaleString("es-MX", {
        dateStyle:"medium",
        timeStyle:"short"
    });
}

function compartirApp(){
    if(navigator.share){
        navigator.share({
            title:"Quiniela Mundial 2026",
            text:"Revisa la quiniela del Mundial 2026",
            url:window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copiado al portapapeles");
    }
}

function getClaseTextoStatus(status){
    const s = (status || "").toLowerCase();

    if(s.includes("final")) return "texto-finalizado";
    if(s.includes("vivo") || s.includes("juego")) return "texto-en-vivo";

    return "texto-pendiente";
}

function getClaseStatus(status){
    const s = (status || "").toLowerCase();

    if(s.includes("final")) return "partido-finalizado";
    if(s.includes("vivo") || s.includes("juego")) return "partido-en-vivo";

    return "partido-pendiente";
}

function getFooterCopyright(){
    return `<div class="dev-footer">© Moy · 2026 (v.4.2.8)</div>`;
}

function getPrediccionColectiva(partidoId){
    const lista = picks.filter(p => p.partidoId === partidoId);

    if(lista.length === 0){
        return "Sin picks todavía";
    }

    const conteo = {};

    lista.forEach(p => {
        const key = `${p.golLoc}-${p.golVis}`;
        conteo[key] = (conteo[key] || 0) + 1;
    });

    const ganador = Object.entries(conteo)
        .sort((a,b) => b[1] - a[1])[0];

    return `Pick más común: ${ganador[0]} (${ganador[1]} votos)`;
}

function esPorDefinir(nombre){
    return !nombre || nombre.trim() === "" || nombre.toLowerCase().includes("por definir");
}



/* =========================================================
   BRACKET R32 PROVISIONAL · hasta cierre juego 70
   ---------------------------------------------------------
   Antes de que el partido 70 tenga Status Finalizado, se
   previsualiza R32 con la tabla provisional de grupos:
   1°/2° por grupo + 8 mejores terceros. Después del cierre,
   se respeta únicamente Knockout/Rank oficial.
   ========================================================= */

function faseGruposCerradaPorJuego70(){
    const p70 = partidos.find(p => Number(p.id) === 70);
    const status = (p70?.status || "").toString().trim().toLowerCase();
    return status.includes("finalizado") || status.includes("finalizada") || status.includes("final");
}

function getClaveDirectaProvisional(clave){
    const texto = (clave || "").toString().trim().toUpperCase();
    const m = texto.match(/^([12])([A-L])$/);
    if(!m) return "";

    const lugar = Number(m[1]);
    const grupo = m[2];
    const tabla = completarTablaGrupoProvisional(grupo);
    return tabla[lugar - 1]?.nombre || "(Por Definir)";
}

function getTercerosClasificadosSetProvisional(){
    return new Set(getTercerosClasificadosReales().map(t => `3${(t.grupo || "").toUpperCase()}`));
}

function getEquipoTerceroProvisionalPorClave(claveTercero){
    const texto = (claveTercero || "").toString().trim().toUpperCase();
    const m = texto.match(/^3([A-L])$/);
    if(!m) return "";

    const grupo = m[1];
    const tabla = completarTablaGrupoProvisional(grupo);
    return tabla[2]?.nombre || "(Por Definir)";
}

function getClavesTercerosR32Ordenadas(){
    const ordenBracket = [73,75,90,97,74,77,89,83,84,93,98,81,82,94,76,78,91,99,79,80,92,86,88,95,100,85,87,96];
    const mapaPartidos = new Map(knockout.map(p => [Number(p.id), p]));
    const salida = [];
    const vistas = [
        ...ordenBracket.map(id => mapaPartidos.get(id)).filter(Boolean),
        ...knockout.filter(p => Number(p.idStage) === 2 && !ordenBracket.includes(Number(p.id)))
    ];

    vistas.forEach(partido => {
        [partido.loc, partido.vis].forEach(clave => {
            const texto = (clave || "").toString().trim().toUpperCase();
            if(/^3-[A-L]+$/.test(texto) && !salida.includes(texto)){
                salida.push(texto);
            }
        });
    });

    return salida;
}

function resolverAsignacionTercerosR32Provisional(){
    const terceros = getTercerosClasificadosReales().map(t => `3${(t.grupo || "").toUpperCase()}`);
    const tercerosSet = new Set(terceros);
    const claves = getClavesTercerosR32Ordenadas();

    const candidatosPorClave = new Map(
        claves.map(clave => {
            const prioridades = clave.replace(/^3-/, "").split("").map(g => `3${g}`);
            return [clave, prioridades.filter(op => tercerosSet.has(op))];
        })
    );

    const ordenBusqueda = [...claves].sort((a,b) => {
        const ca = candidatosPorClave.get(a)?.length || 99;
        const cb = candidatosPorClave.get(b)?.length || 99;
        return ca - cb || claves.indexOf(a) - claves.indexOf(b);
    });

    function backtrack(idx, usados, asignado){
        if(idx >= ordenBusqueda.length){
            return asignado;
        }

        const clave = ordenBusqueda[idx];
        const candidatos = candidatosPorClave.get(clave) || [];

        for(const candidato of candidatos){
            if(usados.has(candidato)) continue;
            const nuevoUsados = new Set(usados);
            nuevoUsados.add(candidato);
            const nuevoAsignado = {...asignado, [clave]: candidato};
            const resultado = backtrack(idx + 1, nuevoUsados, nuevoAsignado);
            if(resultado) return resultado;
        }

        return null;
    }

    let asignacion = backtrack(0, new Set(), {});

    // Respaldo: si algún escenario provisional no permite asignación perfecta,
    // asigna lo posible sin repetir, respetando prioridad. Así nunca marca usados antes de tiempo.
    if(!asignacion){
        asignacion = {};
        const usados = new Set();
        claves.forEach(clave => {
            const elegido = (candidatosPorClave.get(clave) || []).find(op => !usados.has(op));
            if(elegido){
                usados.add(elegido);
                asignacion[clave] = elegido;
            }
        });
    }

    return asignacion;
}

function getMapaTercerosR32Provisional(){
    const asignacion = resolverAsignacionTercerosR32Provisional();
    const mapa = {};

    Object.entries(asignacion).forEach(([clave, tercero]) => {
        mapa[clave] = getEquipoTerceroProvisionalPorClave(tercero);
    });

    return mapa;
}

function resolverClaveProvisionalR32(clave){
    const texto = (clave || "").toString().trim().toUpperCase();
    if(!texto) return "(Por Definir)";

    const directo = getClaveDirectaProvisional(texto);
    if(directo && !esPorDefinir(directo)) return directo;

    if(/^3-[A-L]+$/.test(texto)){
        const mapaTerceros = getMapaTercerosR32Provisional();
        return mapaTerceros[texto] || "(Por Definir)";
    }

    return "";
}

function getRankEquipoPorClave(clave){
    const item = rankKO.find(r => r.clave === clave);
    return item ? item.equipo : "";
}

function getPartidoKOBase(id){
    return knockout.find(p => Number(p.id) === Number(id));
}

function getGanadorDesdeMarcador(partido){
    if(!partido || partido.golesLoc === "" || partido.golesVis === "") return null;

    const gl = Number(partido.golesLoc);
    const gv = Number(partido.golesVis);

    if(gl > gv) return "loc";
    if(gv > gl) return "vis";

    if(partido.penLoc !== "" && partido.penVis !== ""){
        const pl = Number(partido.penLoc);
        const pv = Number(partido.penVis);
        if(pl > pv) return "loc";
        if(pv > pl) return "vis";
    }

    return null;
}

function getPerdedorDesdeMarcador(partido){
    const ganador = getGanadorDesdeMarcador(partido);
    if(ganador === "loc") return "vis";
    if(ganador === "vis") return "loc";
    return null;
}

function getPartidoGlobalKO(partidoId){
    const base = getPartidoKOBase(partidoId);
    if(!base) return null;

    const usarProvisionalR32 = !faseGruposCerradaPorJuego70() && Number(base.idStage) === 2;

    const partido = {
        ...base,
        local: usarProvisionalR32 ? resolverClaveGlobal(base.loc) : (esPorDefinir(base.local) ? resolverClaveGlobal(base.loc) : base.local),
        visita: usarProvisionalR32 ? resolverClaveGlobal(base.vis) : (esPorDefinir(base.visita) ? resolverClaveGlobal(base.vis) : base.visita),
        esKO: true
    };

    partido.pasa = getEquipoPasaPartido(partido);
    return partido;
}

function resolverClaveGlobal(clave){
    const texto = (clave || "").trim();
    if(!texto) return "(Por Definir)";

    // Mientras el partido 70 no esté Finalizado, R32 usa acomodo provisional.
    // Al finalizar grupos, se ignora lo provisional y manda Knockout/Rank oficial.
    if(!faseGruposCerradaPorJuego70() && !texto.startsWith("W") && !texto.startsWith("RU")){
        const provisional = resolverClaveProvisionalR32(texto);
        if(provisional) return provisional;
    }

    if(texto.startsWith("W") || texto.startsWith("RU")){
        const esRU = texto.startsWith("RU");
        const id = Number(texto.replace(/\D/g, ""));
        const partido = getPartidoGlobalKO(id);
        const lado = esRU ? getPerdedorDesdeMarcador(partido) : getGanadorDesdeMarcador(partido);

        if(lado === "loc") return partido.local;
        if(lado === "vis") return partido.visita;

        const rank = getRankEquipoPorClave(texto);
        return esPorDefinir(rank) ? "(Por Definir)" : rank;
    }

    const equipo = getRankEquipoPorClave(texto);
    return esPorDefinir(equipo) ? "(Por Definir)" : equipo;
}

function getKnockoutResueltoGlobal(){
    return knockout.map(p => getPartidoGlobalKO(p.id)).filter(Boolean);
}

function getPartidosVista(){
    return [...partidos, ...getKnockoutResueltoGlobal()];
}

function getPartidoVistaPorId(id){
    return getPartidosVista().find(p => Number(p.id) === Number(id));
}

function getPickKOPorUsuarioPartido(idUser, partidoId){
    return picksKO.find(p => Number(p.idUser) === Number(idUser) && Number(p.partidoId) === Number(partidoId));
}

function resolverClaveUsuario(idUser, clave){
    const texto = (clave || "").trim();
    if(!texto) return "(Por Definir)";

    if(texto.startsWith("W") || texto.startsWith("RU")){
        const esRU = texto.startsWith("RU");
        const id = Number(texto.replace(/\D/g, ""));
        const partido = getPartidoUsuarioKO(idUser, id);
        const pick = getPickKOPorUsuarioPartido(idUser, id);

        if(!partido || !pick) return "(Por Definir)";

        const lado = esRU ? getPerdedorDesdePick(pick) : getGanadorDesdePick(pick);
        if(lado === "loc") return partido.local;
        if(lado === "vis") return partido.visita;
        return "(Por Definir)";
    }

    const equipo = getRankEquipoPorClave(texto);
    return esPorDefinir(equipo) ? "(Por Definir)" : equipo;
}

function getPartidoUsuarioKO(idUser, partidoId){
    const base = getPartidoKOBase(partidoId);
    if(!base) return null;

    const partido = {
        ...base,
        local: esPorDefinir(base.local) ? resolverClaveUsuario(idUser, base.loc) : base.local,
        visita: esPorDefinir(base.visita) ? resolverClaveUsuario(idUser, base.vis) : base.visita,
        esKO: true
    };

    const pick = getPickKOPorUsuarioPartido(idUser, partidoId);
    partido.pasaPick = pick ? getEquipoPasaPick(partido, pick) : "(Por Definir)";
    partido.pasa = getEquipoPasaPartido(partido);
    return partido;
}

function getGanadorDesdePick(pick){
    if(!pick) return null;

    const gl = Number(pick.golLoc);
    const gv = Number(pick.golVis);

    if(gl > gv) return "loc";
    if(gv > gl) return "vis";

    if(pickTienePenalesKO(pick)){
        const pl = Number(pick.penLoc);
        const pv = Number(pick.penVis);
        if(pl > pv) return "loc";
        if(pv > pl) return "vis";
    }

    return null;
}

function getPerdedorDesdePick(pick){
    const ganador = getGanadorDesdePick(pick);
    if(ganador === "loc") return "vis";
    if(ganador === "vis") return "loc";
    return null;
}

function crearNumeroPenal(valor){
    const n = Number(valor);
    if(!Number.isFinite(n) || n < 0 || valor === "" || valor == null) return "";
    return `<span class="penales-numero" aria-label="${n} penales anotados">${n}</span>`;
}

function formatearMarcadorConPenales(golLoc, golVis, penLoc = "", penVis = "", mostrarPenales = true){
    const tieneGoles = golLoc !== "" && golVis !== "" && golLoc != null && golVis != null;
    if(!tieneGoles) return "VS";

    const marcador = `<span class="marcador-goles">${golLoc} - ${golVis}</span>`;

    if(mostrarPenales){
        const penalesLoc = crearNumeroPenal(penLoc);
        const penalesVis = crearNumeroPenal(penVis);

        if(penalesLoc || penalesVis){
            return `<span class="marcador-penales">${penalesLoc} ${marcador} ${penalesVis}</span>`;
        }
    }

    return `${golLoc} - ${golVis}`;
}

function formatearPickKO(pick){
    if(!pick) return "-";
    return formatearMarcadorConPenales(
        pick.golLoc,
        pick.golVis,
        pick.penLoc,
        pick.penVis,
        pickTienePenalesKO(pick)
    );
}

function getPrediccionColectivaKO(partidoId){
    const lista = picksKO.filter(p => Number(p.partidoId) === Number(partidoId));

    if(lista.length === 0){
        return "Sin picks KO todavía";
    }

    const conteo = {};

    lista.forEach(p => {
        const key = `${p.golLoc}-${p.golVis}${p.penLoc !== "" || p.penVis !== "" ? ` (${p.penLoc || 0}-${p.penVis || 0} pen.)` : ""}`;
        conteo[key] = (conteo[key] || 0) + 1;
    });

    const ganador = Object.entries(conteo)
        .sort((a,b) => b[1] - a[1])[0];

    return `Pick KO más común: ${ganador[0]} (${ganador[1]} votos)`;
}


function getEquipoPasaPartido(partido){
    const lado = getGanadorDesdeMarcador(partido);
    if(lado === "loc") return partido.local || "(Por Definir)";
    if(lado === "vis") return partido.visita || "(Por Definir)";
    return "(Por Definir)";
}

function getEquipoPasaPick(partido, pick){
    const lado = getGanadorDesdePick(pick);
    if(lado === "loc") return partido.local || "(Por Definir)";
    if(lado === "vis") return partido.visita || "(Por Definir)";
    return "(Por Definir)";
}

function esEnteroNoNegativo_(valor){
    if(valor === "" || valor == null) return false;
    const n = Number(valor);
    return Number.isInteger(n) && n >= 0;
}

function tienePenalesValidosKO_(golesLoc, golesVis, penLoc, penVis){
    if(golesLoc === "" || golesVis === "" || golesLoc == null || golesVis == null) return false;
    if(Number(golesLoc) !== Number(golesVis)) return false;
    if(!esEnteroNoNegativo_(penLoc) || !esEnteroNoNegativo_(penVis)) return false;
    return Number(penLoc) !== Number(penVis);
}

function pickTienePenalesKO(pick){
    return !!pick && tienePenalesValidosKO_(pick.golLoc, pick.golVis, pick.penLoc, pick.penVis);
}

function partidoTienePenalesKO(partido){
    return !!partido && tienePenalesValidosKO_(partido.golesLoc, partido.golesVis, partido.penLoc, partido.penVis);
}

function penalesCoincidenKO(partido, pick){
    return partidoTienePenalesKO(partido) &&
        pickTienePenalesKO(pick) &&
        Number(partido.penLoc) === Number(pick.penLoc) &&
        Number(partido.penVis) === Number(pick.penVis);
}

function normalizarNombreEquipo(nombre){
    return (nombre || "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function normalizarClaveLugar(lug){
    const texto = (lug || "").toString().trim().toUpperCase();
    const m1 = texto.match(/^([A-L])([12])$/);
    if(m1) return `${m1[2]}${m1[1]}`;
    const m2 = texto.match(/^([12])([A-L])$/);
    if(m2) return `${m2[1]}${m2[2]}`;
    return texto;
}

function getEquiposPorGrupo(grupo){
    const equipos = new Set();

    partidos.forEach(partido => {
        if(getGrupoDesdeCodigo(partido.loc) === grupo && partido.local){
            equipos.add(partido.local);
        }
        if(getGrupoDesdeCodigo(partido.vis) === grupo && partido.visita){
            equipos.add(partido.visita);
        }
    });

    return [...equipos].sort((a,b) => a.localeCompare(b, "es"));
}

function getDiferenciaPuntosEnfrentamiento(nombreA, nombreB, grupo){
    const aNorm = normalizarNombreEquipo(nombreA);
    const bNorm = normalizarNombreEquipo(nombreB);
    let puntosA = 0;
    let puntosB = 0;

    partidos.forEach(partido => {
        const esGrupo = getGrupoDesdeCodigo(partido.loc) === grupo || getGrupoDesdeCodigo(partido.vis) === grupo;
        if(!esGrupo || !partidoFinalizado(partido)){
            return;
        }

        const locNorm = normalizarNombreEquipo(partido.local);
        const visNorm = normalizarNombreEquipo(partido.visita);
        const esEnfrentamiento =
            (locNorm === aNorm && visNorm === bNorm) ||
            (locNorm === bNorm && visNorm === aNorm);

        if(!esEnfrentamiento){
            return;
        }

        const gl = Number(partido.golesLoc);
        const gv = Number(partido.golesVis);

        let puntosLoc = 0;
        let puntosVis = 0;

        if(gl > gv){ puntosLoc = 3; }
        else if(gv > gl){ puntosVis = 3; }
        else{ puntosLoc = 1; puntosVis = 1; }

        if(locNorm === aNorm){
            puntosA += puntosLoc;
            puntosB += puntosVis;
        }
        else{
            puntosA += puntosVis;
            puntosB += puntosLoc;
        }
    });

    return puntosA - puntosB;
}

function compararEquiposGrupo(a, b, grupo = ""){
    const base = b.pts - a.pts ||
        b.dg - a.dg ||
        b.gf - a.gf;

    if(base !== 0){
        return base;
    }

    if(grupo){
        const h2h = getDiferenciaPuntosEnfrentamiento(a.nombre, b.nombre, grupo);
        if(h2h !== 0){
            return -h2h;
        }
    }

    return a.nombre.localeCompare(b.nombre, "es");
}

function compararTercerosGrupo(a, b){
    return b.pts - a.pts ||
        b.dg - a.dg ||
        b.gf - a.gf ||
        a.nombre.localeCompare(b.nombre, "es");
}

function completarTablaGrupoProvisional(grupo){
    const tabla = getTablaGrupo(grupo);
    const equiposBase = getEquiposPorGrupo(grupo);
    const usados = new Set(tabla.map(e => e.nombre));

    return [
        ...tabla,
        ...equiposBase
            .filter(nombre => !usados.has(nombre))
            .map(nombre => ({...crearEquipoGrupo(nombre), dg:0}))
    ].sort((a,b) => compararEquiposGrupo(a, b, grupo));
}

function getTercerosClasificadosReales(){
    const grupos = "ABCDEFGHIJKL".split("");

    return grupos
        .map(grupo => {
            const tabla = completarTablaGrupoProvisional(grupo);
            const tercero = tabla[2];
            if(!tercero){
                return null;
            }

            return {
                ...tercero,
                grupo,
                lugar: 3,
                clave: `3${grupo}`,
                claveLegacy: `${grupo}3`,
                equipo: tercero.nombre
            };
        })
        .filter(Boolean)
        .sort(compararTercerosGrupo)
        .slice(0, 8)
        .map(x => ({...x, clasificaTercero:true}));
}

function getClasificadosReales(){
    const grupos = "ABCDEFGHIJKL".split("");
    const salida = [];
    const terceros = getTercerosClasificadosReales();

    grupos.forEach(grupo => {
        const tablaCompleta = completarTablaGrupoProvisional(grupo);

        [1,2].forEach(pos => {
            salida.push({
                grupo,
                lugar: pos,
                clave: `${pos}${grupo}`,
                claveLegacy: `${grupo}${pos}`,
                equipo: tablaCompleta[pos - 1]?.nombre || "(Por Definir)",
                clasifica: true
            });
        });
    });

    terceros.forEach(t => {
        salida.push({
            grupo: t.grupo,
            lugar: 3,
            clave: `3${t.grupo}`,
            claveLegacy: `${t.grupo}3`,
            equipo: t.equipo,
            clasifica: true,
            clasificaTercero: true,
            pts: t.pts,
            dg: t.dg,
            gf: t.gf
        });
    });

    return salida;
}

function equipoClasificadoReal(nombre, grupo = ""){
    const n = normalizarNombreEquipo(nombre);
    const g = (grupo || "").toString().toUpperCase();

    return getClasificadosReales().some(x =>
        normalizarNombreEquipo(x.equipo) === n && (!g || x.grupo === g)
    );
}

function getClasificadoRealPorClave(clave){
    const normal = normalizarClaveLugar(clave);
    return getClasificadosReales().find(x => x.clave === normal);
}

function getLugaresProComparables(){
    return lugaresPro
        .map(x => ({...x, claveNormal: normalizarClaveLugar(x.lug)}))
        .filter(x => /^[12][A-L]$/.test(x.claveNormal));
}

function getComparacionClasificadosUsuario(idUser){
    return getLugaresProComparables()
        .filter(x => Number(x.idUsuario) === Number(idUser))
        .sort((a,b) => a.claveNormal.localeCompare(b.claveNormal, "es", {numeric:true}))
        .map(pick => {
            const real = getClasificadoRealPorClave(pick.claveNormal);
            const acierto = real && normalizarNombreEquipo(real.equipo) === normalizarNombreEquipo(pick.lugares);
            return {
                clave: pick.claveNormal,
                pronostico: pick.lugares || "-",
                real: real?.equipo || "(Por Definir)",
                acierto
            };
        });
}

function getComparacionClasificadosUsuarioGrupo(idUser, grupo){
    const grupoSeguro = /^[A-L]$/.test((grupo || "").toString().toUpperCase())
        ? grupo.toString().toUpperCase()
        : "A";

    const picksUsuario = getLugaresProComparables()
        .filter(x => Number(x.idUsuario) === Number(idUser) && x.claveNormal.endsWith(grupoSeguro));

    const realesGrupo = [1,2].map(pos => getClasificadoRealPorClave(`${pos}${grupoSeguro}`));
    const pickPorClave = Object.fromEntries(picksUsuario.map(x => [x.claveNormal, x]));

    const filas = [1,2].map(pos => {
        const clave = `${pos}${grupoSeguro}`;
        const pick = pickPorClave[clave];
        const real = realesGrupo[pos - 1];
        const pronostico = pick?.lugares || "-";
        const realEquipo = real?.equipo || "(Por Definir)";
        const aciertoOrden = normalizarNombreEquipo(pronostico) === normalizarNombreEquipo(realEquipo);
        return {
            clave,
            pronostico,
            real: realEquipo,
            aciertoOrden
        };
    });

    const realesNorm = new Set(filas.map(x => normalizarNombreEquipo(x.real)).filter(Boolean));
    const pronosticosNorm = filas.map(x => normalizarNombreEquipo(x.pronostico)).filter(Boolean);
    const aciertosEquipos = pronosticosNorm.filter(x => realesNorm.has(x)).length;
    const aciertosOrden = filas.filter(x => x.aciertoOrden).length;

    let puntos = 0;
    let etiqueta = "0 ninguno bien";

    if(aciertosEquipos === 2 && aciertosOrden === 2){
        puntos = 8;
        etiqueta = "2 equipos bien y el orden";
    }
    else if(aciertosEquipos === 2){
        puntos = 5;
        etiqueta = "2 equipos bien";
    }
    else if(aciertosEquipos === 1 && aciertosOrden === 1){
        puntos = 4;
        etiqueta = "1 equipo bien y el orden";
    }
    else if(aciertosEquipos === 1){
        puntos = 1;
        etiqueta = "1 equipo bien";
    }

    return {
        grupo: grupoSeguro,
        filas,
        aciertosEquipos,
        aciertosOrden,
        puntos,
        etiqueta
    };
}

function getResumenClasificadosUsuario(idUser){
    const grupos = "ABCDEFGHIJKL".split("");
    return grupos.reduce((acc, grupo) => {
        const r = getComparacionClasificadosUsuarioGrupo(idUser, grupo);
        acc.puntos += r.puntos;
        acc.grupos += 1;
        acc.ochoP += r.puntos === 8 ? 1 : 0;
        acc.cincoP += r.puntos === 5 ? 1 : 0;
        acc.cuatroP += r.puntos === 4 ? 1 : 0;
        acc.unP += r.puntos === 1 ? 1 : 0;
        acc.gruposPerfectos += r.puntos === 8 ? 1 : 0;
        acc.dosClasificados += r.aciertosEquipos === 2 ? 1 : 0;
        acc.unClasificado += r.aciertosEquipos === 1 ? 1 : 0;
        return acc;
    }, {
        puntos:0,
        grupos:0,
        gruposPerfectos:0,
        dosClasificados:0,
        unClasificado:0,
        ochoP:0,
        cincoP:0,
        cuatroP:0,
        unP:0
    });
}
