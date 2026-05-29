function mostrarEstadisticas(){

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
    const masFallos = [...ranking].sort((a,b) => b.fallos - a.fallos)[0];

    let aciertosPorPartido = {};

    picks.forEach(p => {

        const puntos = getPuntos(
            partidos.find(x => x.id === p.partidoId) || {},
            p
        );

        if(puntos > 0){
            aciertosPorPartido[p.partidoId] = (aciertosPorPartido[p.partidoId] || 0) + 1;
        }

    });

    const partidoMasAciertosId = Object.entries(aciertosPorPartido)
        .sort((a,b) => b[1] - a[1])[0]?.[0];

    const partidoMasAciertos = partidos.find(p => p.id === Number(partidoMasAciertosId));

    const totalAciertosPartido = partidoMasAciertosId
        ? aciertosPorPartido[partidoMasAciertosId]
        : 0;

    contenido.innerHTML = `
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
