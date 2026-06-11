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
        acc.fallos += partidoFinalizado(partido) && puntos === 0 ? 1 : 0;

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
        ...getResumenUsuario(u.id)
    })).sort((a, b) => b.puntos - a.puntos);
}

function getClasePuntos(puntos){
    if(puntos === 3) return "pts-exacto";
    if(puntos === 2) return "pts-diferencia";
    if(puntos === 1) return "pts-ganador";
    return "pts-fallo";
}
