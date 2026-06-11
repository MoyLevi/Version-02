function crearHTMLRanking(lista){

    return lista.map((u, index) => {

        let medalla = "";

        if(index === 0) medalla = "🥇";
        if(index === 1) medalla = "🥈";
        if(index === 2) medalla = "🥉";

        const posicionActual = index + 1;
        const posicionAnterior = rankingAnterior[u.nombre];

        let movimiento = "—";
        let movimientoClase = "mov-neutral";

        if(posicionAnterior){
            if(posicionActual < posicionAnterior){
                movimiento = "⬆";
                movimientoClase = "mov-up";
            }
            else if(posicionActual > posicionAnterior){
                movimiento = "⬇";
                movimientoClase = "mov-down";
            }
        }

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

                <div class="ranking-mov ${movimientoClase}">${movimiento}</div>
                <div class="ranking-puntos">${u.puntos} pts</div>
            </div>
        `;
    }).join("");
}


function mostrarTabla(){

    const ranking = getRanking();

    const rankingPagados = ranking.filter(u => u.paga);
    const rankingTodos = ranking;

    let html = `
        <h1>TABLA <span class="titulo-acento">GENERAL</span></h1>
        <p class="subtexto">Toca un usuario para ver cómo se formaron sus puntos.</p>

        <h2>🏆 TABLA <span class="titulo-acento">PRINCIPAL</span></h2>
        <p class="subtexto">Solo participan usuarios con pago registrado.</p>
        <div class="tabla-ranking">
            ${crearHTMLRanking(rankingPagados)}
        </div>

        <h2>🎮 TABLA <span class="titulo-acento">RECREATIVA</span></h2>
        <p class="subtexto">Incluye a todos los usuarios.</p>
        <div class="tabla-ranking">
            ${crearHTMLRanking(rankingTodos)}
        </div>

        ${getFooterCopyright()}
    `;

    ranking.forEach((u, index) => {

        let medalla = "";

        if(index === 0) medalla = "🥇";
        if(index === 1) medalla = "🥈";
        if(index === 2) medalla = "🥉";

        const posicionActual = index + 1;
        const posicionAnterior = rankingAnterior[u.nombre];

let movimiento = "—";
let movimientoClase = "mov-neutral";

if(posicionAnterior){
    if(posicionActual < posicionAnterior){
        movimiento = "⬆";
        movimientoClase = "mov-up";
    }
    else if(posicionActual > posicionAnterior){
        movimiento = "⬇";
        movimientoClase = "mov-down";
    }
}

        const porcentaje = u.jugados > 0
            ? Math.round((u.puntos / (u.jugados * 3)) * 100)
            : 0;

        html += `
            <div class="ranking-card ranking-card-detallado" onclick="verDetalleUsuario(${u.id})">
                <div class="ranking-pos">${medalla || posicionActual}</div>

                <div class="ranking-user">
                    ${u.nombre}
                    <span>${porcentaje}% efectividad</span>
                </div>

                <div class="ranking-mov ${movimientoClase}">${movimiento}</div>
                <div class="ranking-puntos">${u.puntos} pts</div>
            </div>
        `;
    });

    rankingAnterior = {};
    ranking.forEach((u, index) => {
        rankingAnterior[u.nombre] = index + 1;
    });

    html += `</div>`;
    html += getFooterCopyright();

    contenido.innerHTML = html;
}

function verDetalleUsuario(idUser, pagina = 1){

    const usuarioActual = usuarios.find(u => u.id === idUser);
    const nombre = usuarioActual ? usuarioActual.nombre : `Usuario ${idUser}`;

    const lista = picks.filter(p => p.idUser === idUser);

    paginaDetalleUsuario = pagina;

    const totalPaginas = Math.ceil(lista.length / picksPorPagina);
    const inicio = (pagina - 1) * picksPorPagina;
    const fin = inicio + picksPorPagina;
    const listaPagina = lista.slice(inicio, fin);
    
    const resumen = getResumenUsuario(idUser);

    let html = `
        <button onclick="mostrarTabla()" class="btnVolver">⬅ Volver</button>

        <h1>👤 ${nombre}</h1>

        <div class="resumen-usuario">
            <div><strong>${resumen.puntos}</strong><span>Puntos</span></div>
            <div><strong>${resumen.exactos}</strong><span>Exactos</span></div>
            <div><strong>${resumen.diferencias}</strong><span>Diferencia</span></div>
            <div><strong>${resumen.ganadores}</strong><span>Ganador</span></div>
            <div><strong>${resumen.fallos}</strong><span>Fallos</span></div>
        </div>

        <h2>DESGLOSE <span class="titulo-acento">DE PRONÓSTICOS</span></h2>
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
                onclick="verDetalleUsuario(${idUser}, ${pagina - 1})" 
                ${pagina <= 1 ? "disabled" : ""}
            >
                ⬅ Anterior
            </button>

            <span>Página ${pagina} de ${totalPaginas}</span>

            <button 
                onclick="verDetalleUsuario(${idUser}, ${pagina + 1})" 
                ${pagina >= totalPaginas ? "disabled" : ""}
            >
                Siguiente ➡
            </button>
        </div>
    `;

    html += getFooterCopyright();
    contenido.innerHTML = html;
}
