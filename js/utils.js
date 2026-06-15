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
        "brasil": "br",
        "cabo verde": "cv",
        "canada": "ca",
        "colombia": "co",
        "congo": "cd",
        "corea del sur": "kr",
        "costa de marfil": "ci",
        "croacia": "hr",
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
        "inglaterra": "gb",
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
    return `<div class="dev-footer">© Moy · 2026 (v.2.8.3 KO)</div>`;
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

    const partido = {
        ...base,
        local: esPorDefinir(base.local) ? resolverClaveGlobal(base.loc) : base.local,
        visita: esPorDefinir(base.visita) ? resolverClaveGlobal(base.vis) : base.visita,
        esKO: true
    };

    partido.pasa = getEquipoPasaPartido(partido);
    return partido;
}

function resolverClaveGlobal(clave){
    const texto = (clave || "").trim();
    if(!texto) return "(Por Definir)";

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

    if(pick.penLoc !== "" && pick.penVis !== ""){
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

function formatearMarcadorConPenales(golLoc, golVis, penLoc = "", penVis = ""){
    const tieneGoles = golLoc !== "" && golVis !== "" && golLoc != null && golVis != null;
    if(!tieneGoles) return "VS";

    const penalesLoc = crearNumeroPenal(penLoc);
    const penalesVis = crearNumeroPenal(penVis);
    const marcador = `<span class="marcador-goles">${golLoc} - ${golVis}</span>`;

    if(penalesLoc || penalesVis){
        return `<span class="marcador-penales">${penalesLoc} ${marcador} ${penalesVis}</span>`;
    }

    return `${golLoc} - ${golVis}`;
}

function formatearPickKO(pick){
    if(!pick) return "-";
    return formatearMarcadorConPenales(pick.golLoc, pick.golVis, pick.penLoc, pick.penVis);
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

function pickTienePenalesKO(pick){
    return pick && pick.penLoc !== "" && pick.penLoc != null && pick.penVis !== "" && pick.penVis != null;
}

function partidoTienePenalesKO(partido){
    return partido && partido.penLoc !== "" && partido.penLoc != null && partido.penVis !== "" && partido.penVis != null;
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

function getClasificadosReales(){
    const grupos = "ABCDEFGHIJKL".split("");
    const salida = [];

    grupos.forEach(grupo => {
        const tabla = getTablaGrupo(grupo);
        const equiposBase = getEquiposPorGrupo(grupo);
        const usados = new Set(tabla.map(e => e.nombre));
        const tablaCompleta = [
            ...tabla,
            ...equiposBase
                .filter(nombre => !usados.has(nombre))
                .map(nombre => ({...crearEquipoGrupo(nombre), dg:0}))
        ].sort((a,b) =>
            b.pts - a.pts ||
            b.dg - a.dg ||
            b.gf - a.gf ||
            a.nombre.localeCompare(b.nombre, "es")
        );

        [1,2].forEach(pos => {
            salida.push({
                grupo,
                lugar: pos,
                clave: `${pos}${grupo}`,
                claveLegacy: `${grupo}${pos}`,
                equipo: tablaCompleta[pos - 1]?.nombre || "(Por Definir)"
            });
        });
    });

    return salida;
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
    let etiqueta = "Sin aciertos";

    if(aciertosEquipos === 2){
        puntos = 5;
        etiqueta = "Acertó los 2 clasificados";

        if(aciertosOrden === 2){
            puntos += 3;
            etiqueta = "Acertó los 2 y el orden";
        }
    }
    else if(aciertosEquipos === 1){
        puntos = 1;
        etiqueta = "Acertó 1 clasificado";
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
        acc.gruposPerfectos += r.puntos === 8 ? 1 : 0;
        acc.dosClasificados += r.aciertosEquipos === 2 ? 1 : 0;
        acc.unClasificado += r.aciertosEquipos === 1 ? 1 : 0;
        return acc;
    }, {
        puntos:0,
        grupos:0,
        gruposPerfectos:0,
        dosClasificados:0,
        unClasificado:0
    });
}
