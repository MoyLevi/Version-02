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
    return `<div class="dev-footer">© Moy · 2026 (v.2.7.0 DEV)</div>`;
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

    return {
        ...base,
        local: esPorDefinir(base.local) ? resolverClaveGlobal(base.loc) : base.local,
        visita: esPorDefinir(base.visita) ? resolverClaveGlobal(base.vis) : base.visita,
        esKO: true
    };
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

    return {
        ...base,
        local: esPorDefinir(base.local) ? resolverClaveUsuario(idUser, base.loc) : base.local,
        visita: esPorDefinir(base.visita) ? resolverClaveUsuario(idUser, base.vis) : base.visita,
        esKO: true
    };
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

function crearCirculosPenales(valor){
    const n = Number(valor);
    if(!Number.isFinite(n) || n <= 0) return "";
    return `<span class="penales-circulos" aria-label="${n} penales anotados">${"●".repeat(n)}</span>`;
}

function formatearMarcadorConPenales(golLoc, golVis, penLoc = "", penVis = ""){
    const tieneGoles = golLoc !== "" && golVis !== "" && golLoc != null && golVis != null;
    if(!tieneGoles) return "VS";

    const penalesLoc = crearCirculosPenales(penLoc);
    const penalesVis = crearCirculosPenales(penVis);
    const marcador = `${golLoc} - ${golVis}`;

    if(penalesLoc || penalesVis){
        return `<span class="marcador-penales">${penalesLoc ? `(${penalesLoc})` : ""} ${marcador} ${penalesVis ? `(${penalesVis})` : ""}</span>`;
    }

    return marcador;
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
