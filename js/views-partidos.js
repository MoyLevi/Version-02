function mostrarPartidos(tipoFiltro = "todos", valorFiltro = "todos"){

    ultimoFiltroPartidos = {
    tipo: tipoFiltro,
    valor: valorFiltro
};

window.scrollTo({ top: 0, behavior: "smooth" });

    const fechas = [...new Set(partidos.map(p => p.fecha))];

    const grupos = [...new Set(partidos.flatMap(p => [
        p.loc?.charAt(0),
        p.vis?.charAt(0)
    ]))].filter(Boolean).sort();

    let html = `
        <h1>PARTIDOS <span class="titulo-acento">FILTRADOS</span></h1>

        <div class="filtros">

            <select onchange="mostrarPartidos('fecha', this.value)">
                <option value="todos">Filtrar por fecha</option>
                ${fechas.map(f => `
                    <option value="${f}" ${tipoFiltro === "fecha" && valorFiltro === f ? "selected" : ""}>
                        ${f}
                    </option>
                `).join("")}
            </select>

            <select onchange="mostrarPartidos('grupo', this.value)">
                <option value="todos">Filtrar por grupo</option>
                ${grupos.map(g => `
                    <option value="${g}" ${tipoFiltro === "grupo" && valorFiltro === g ? "selected" : ""}>
                        Grupo ${g}
                    </option>
                `).join("")}
            </select>

        </div>
    `;

    let partidosFiltrados = partidos;

    if(tipoFiltro === "fecha" && valorFiltro !== "todos"){
        partidosFiltrados = partidos.filter(p => p.fecha === valorFiltro);
    }

    if(tipoFiltro === "grupo" && valorFiltro !== "todos"){
        partidosFiltrados = partidos.filter(p =>
            p.loc?.charAt(0) === valorFiltro ||
            p.vis?.charAt(0) === valorFiltro
        );
    }

    partidosFiltrados.forEach(p => {

        const marcador = p.golesLoc !== "" && p.golesVis !== ""
            ? `${p.golesLoc}-${p.golesVis}`
            : "VS";

        html += `
            <div class="partido ${getClaseStatus(p.status)}" onclick="verPartido(${p.id})">

                <div class="equipo">
                    <img src="${getFlag(p.local)}">
                    <p>${p.local}</p>
                </div>

            <div class="marcador-box">
                <div class="marcador">${marcador}</div>
                <div class="estado-partido ${getClaseTextoStatus(p.status)}">
                    ${p.status || "Pendiente"}
                </div>
            </div>

                <div class="equipo">
                    <img src="${getFlag(p.visita)}">
                    <p>${p.visita}</p>
                </div>

            </div>
        `;
    });

    html += getFooterCopyright();
    contenido.innerHTML = html;
}

function verPartido(id){

    window.scrollTo({ top: 0, behavior: "smooth" });

    const p = partidos.find(x => x.id === id);

    if(!p){
        contenido.innerHTML = `<p>No se encontró el partido.</p>${getFooterCopyright()}`;
        return;
    }

    const marcador = p.golesLoc !== "" && p.golesVis !== ""
        ? `${p.golesLoc} - ${p.golesVis}`
        : "VS";

    let html = `
        <button onclick="mostrarPartidos(ultimoFiltroPartidos.tipo, ultimoFiltroPartidos.valor)" class="btnVolver">⬅ Volver</button>

        <div class="detalle-partido">

            <div class="equipo-detalle">
                <img src="${getFlag(p.local)}">
                <h2>${p.local}</h2>
            </div>

            <div class="marcador-detalle">
                <div>${marcador}</div>
                <span>${p.status || "Pendiente"}</span>
            </div>

            <div class="equipo-detalle">
                <img src="${getFlag(p.visita)}">
                <h2>${p.visita}</h2>
            </div>

        </div>

        <p class="info-partido">${p.fecha} · ${p.hora} · ${p.lugar}</p>

        <div class="prediccion-colectiva">
            ${getPrediccionColectiva(id)}
        </div>

        <h2>PRONÓSTICOS <span class="titulo-acento">DEL PARTIDO</span></h2>
   `;

    const lista = picks
    .filter(x => x.partidoId === id)
    .sort((a, b) => {
        const puntosA = getPuntos(p, a);
        const puntosB = getPuntos(p, b);

        if(puntosB !== puntosA) return puntosB - puntosA;

        const userA = usuarios.find(u => u.id === a.idUser)?.nombre || "";
        const userB = usuarios.find(u => u.id === b.idUser)?.nombre || "";

        return userA.localeCompare(userB, "es");
    });


    if(lista.length === 0){
        html += `<p>Aún no hay pronósticos para este partido.</p>`;
    }

    lista.forEach(r => {

        const puntos = getPuntos(p, r);
        const usuario = usuarios.find(u => u.id === r.idUser);

        html += `
            <div class="pronostico">
                <span><strong>${usuario ? usuario.nombre : "Usuario " + r.idUser}</strong></span>
                <span>${r.golLoc}-${r.golVis}</span>
                <span>${puntos} pts</span>
            </div>
        `;
    });

    html += getFooterCopyright();
    contenido.innerHTML = html;
}
