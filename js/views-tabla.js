let tipoTablaActual = "principal";

function crearHTMLRanking(lista){

    if(lista.length === 0){
        return `<p class="subtexto">No hay usuarios en esta tabla.</p>`;
    }

    return lista.map((u, index) => {

        let medalla = "";
        if(index === 0) medalla = "🥇";
        if(index === 1) medalla = "🥈";
        if(index === 2) medalla = "🥉";

        const porcentaje = u.jugados > 0
            ? Math.round((u.puntos / (u.jugados * 3)) * 100)
            : 0;

        return `
            <div class="ranking-card ranking-card-detallado" onclick="verDetalleUsuario(${u.id})">
                <div class="ranking-pos">${medalla || index + 1}</div>

                <div class="ranking-user">
                    ${u.nombre}
                    <span>${porcentaje}% efectividad</span>
                </div>

                <div class="ranking-puntos">${u.puntos} pts</div>
            </div>
        `;
    }).join("");
}

function mostrarTabla(tipo = "principal"){

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    tipoTablaActual = tipo;

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
        </div>

        <p class="subtexto">Toca un usuario para ver cómo se formaron sus puntos.</p>

        <div class="tabla-ranking">
            ${crearHTMLRanking(listaActual)}
        </div>

        ${getFooterCopyright()}
    `;
}

function getTextoEspecial(valor){
    return valor && valor.trim() !== "" ? valor : "Sin pick";
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
                        <p><strong>1°</strong> ${primero}</p>
                        <p><strong>2°</strong> ${segundo}</p>
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

        ${crearHTMLPicksEspecialesUsuario(usuarioActual)}

        <div class="resumen-usuario">
            <div><strong>${resumen.puntos}</strong><span>Puntos</span></div>
            <div><strong>${resumen.exactos}</strong><span>Exactos</span></div>
            <div><strong>${resumen.diferencias}</strong><span>Diferencia</span></div>
            <div><strong>${resumen.ganadores}</strong><span>Ganador</span></div>
            <div><strong>${resumen.fallos}</strong><span>Fallos</span></div>
        </div>

        ${crearHTMLTabsDetalleUsuario(idUser, vista)}
    `;

    if(vista === "clasificados"){

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
