function partidoFinalizado(partido){
    return partido &&
        partido.golesLoc !== "" &&
        partido.golesVis !== "" &&
        partido.golesLoc != null &&
        partido.golesVis != null;
}

function getPuntos(partido, pick){

    if(
        partido.golesLoc === "" ||
        partido.golesVis === "" ||
        partido.golesLoc == null ||
        partido.golesVis == null
    ){
        return 0;
    }

    const realLoc = Number(partido.golesLoc);
    const realVis = Number(partido.golesVis);

    const predLoc = Number(pick.golLoc);
    const predVis = Number(pick.golVis);

    const difPred = predLoc - predVis;
    const difReal = realLoc - realVis;

    const winPred = Math.sign(difPred);
    const winReal = Math.sign(difReal);

    if(predLoc === realLoc && predVis === realVis) return 3;
    if(difPred === difReal && winPred === winReal) return 2;
    if(winPred === winReal) return 1;

    return 0;
}

function getResumenUsuario(idUser){

    const lista = picks.filter(p => p.idUser === idUser);

    return lista.reduce((acc, pick) => {
        const partido = partidos.find(p => p.id === pick.partidoId);
        const puntos = partido ? getPuntos(partido, pick) : 0;
        const jugado = partidoFinalizado(partido);

        acc.jugados += jugado ? 1 : 0;
        acc.puntos += puntos;
        acc.pronosticos += 1;
        acc.aciertos += puntos > 0 ? 1 : 0;
        acc.exactos += puntos === 3 ? 1 : 0;
        acc.diferencias += puntos === 2 ? 1 : 0;
        acc.ganadores += puntos === 1 ? 1 : 0;
        acc.fallos += jugado && puntos === 0 ? 1 : 0;

        return acc;
    }, {
        puntos: 0,
        pronosticos: 0,
        jugados: 0,
        aciertos: 0,
        exactos: 0,
        diferencias: 0,
        ganadores: 0,
        fallos: 0
    });
}

function getRanking(){
    return usuarios.map(u => ({
        id: u.id,
        nombre: u.nombre,
        paga: u.paga,
        campeon: u.campeon,
        segundo: u.segundo,
        tercero: u.tercero,
        goleador: u.goleador,
        sorpresa: u.sorpresa,
        ...getResumenUsuario(u.id)
    })).sort((a, b) => b.puntos - a.puntos);
}

function getClasePuntos(puntos){
    if(puntos === 3) return "pts-exacto";
    if(puntos === 2) return "pts-diferencia";
    if(puntos === 1) return "pts-ganador";
    return "pts-fallo";
}

function getPuntosKO(partido, pick){
    if(!partidoFinalizado(partido) || !pick){
        return 0;
    }

    const realPasa = getEquipoPasaPartido(partido);
    const pickPasa = getEquipoPasaPick(partido, pick);

    let puntos = 0;

    if(
        !esPorDefinir(realPasa) &&
        !esPorDefinir(pickPasa) &&
        normalizarNombreEquipo(realPasa) === normalizarNombreEquipo(pickPasa)
    ){
        puntos += 5;
    }

    if(Number(partido.golesLoc) === Number(pick.golLoc) && Number(partido.golesVis) === Number(pick.golVis)){
        puntos += 2;
    }

    if(penalesCoincidenKO(partido, pick)){
        puntos += 1;
    }

    return puntos;
}

function getResumenUsuarioKO(idUser){
    const lista = picksKO.filter(p => Number(p.idUser) === Number(idUser));

    return lista.reduce((acc, pick) => {
        const partido = getPartidoGlobalKO(pick.partidoId);
        const jugado = partidoFinalizado(partido);
        const puntos = jugado ? getPuntosKO(partido, pick) : 0;
        const realPasa = partido ? getEquipoPasaPartido(partido) : "(Por Definir)";
        const pickPasa = partido ? getEquipoPasaPick(partido, pick) : "(Por Definir)";

        const acertoAvanza = jugado && !esPorDefinir(realPasa) && !esPorDefinir(pickPasa) &&
            normalizarNombreEquipo(realPasa) === normalizarNombreEquipo(pickPasa);
        const acertoMarcador = jugado && Number(partido.golesLoc) === Number(pick.golLoc) && Number(partido.golesVis) === Number(pick.golVis);
        const acertoPenales = jugado && penalesCoincidenKO(partido, pick);

        acc.jugados += jugado ? 1 : 0;
        acc.puntos += puntos;
        acc.pronosticos += 1;
        acc.aciertos += puntos > 0 ? 1 : 0;
        acc.exactos += acertoMarcador ? 1 : 0;
        acc.diferencias += acertoPenales ? 1 : 0;
        acc.ganadores += acertoAvanza ? 1 : 0;
        acc.fallos += jugado && puntos === 0 ? 1 : 0;
        acc.avanza += acertoAvanza ? 1 : 0;
        acc.marcador += acertoMarcador ? 1 : 0;
        acc.penales += acertoPenales ? 1 : 0;

        return acc;
    }, {
        puntos: 0,
        pronosticos: 0,
        jugados: 0,
        aciertos: 0,
        exactos: 0,
        diferencias: 0,
        ganadores: 0,
        fallos: 0,
        avanza: 0,
        marcador: 0,
        penales: 0
    });
}


function sumarGolesPronosticadosPick(pick){
    const golLoc = Number(pick?.golLoc);
    const golVis = Number(pick?.golVis);

    if(!Number.isFinite(golLoc) || !Number.isFinite(golVis)){
        return 0;
    }

    return golLoc + golVis;
}

function getGolesPronosticadosUsuario(idUser, incluirKO = true){
    const golesFaseGrupos = picks
        .filter(p => Number(p.idUser) === Number(idUser))
        .reduce((total, pick) => total + sumarGolesPronosticadosPick(pick), 0);

    const golesKO = incluirKO
        ? picksKO
            .filter(p => Number(p.idUser) === Number(idUser))
            .reduce((total, pick) => total + sumarGolesPronosticadosPick(pick), 0)
        : 0;

    return golesFaseGrupos + golesKO;
}

function getRankingKO(){
    return usuarios.map(u => ({
        id: u.id,
        nombre: u.nombre,
        paga: u.paga,
        ...getResumenUsuarioKO(u.id)
    })).sort((a,b) =>
        b.puntos - a.puntos ||
        b.avanza - a.avanza ||
        b.marcador - a.marcador ||
        b.penales - a.penales ||
        a.nombre.localeCompare(b.nombre, "es")
    );
}
