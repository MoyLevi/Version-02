let scrollFechas = 0;
let fechaSeleccionadaScroll = null;

const fechasMundial = [
    "11/06/2026","12/06/2026","13/06/2026","14/06/2026","15/06/2026",
    "16/06/2026","17/06/2026","18/06/2026","19/06/2026","20/06/2026",
    "21/06/2026","22/06/2026","23/06/2026","24/06/2026","25/06/2026",
    "26/06/2026","27/06/2026","28/06/2026","29/06/2026","30/06/2026",
    "01/07/2026","02/07/2026","03/07/2026","04/07/2026","05/07/2026",
    "06/07/2026","07/07/2026","09/07/2026","10/07/2026","11/07/2026",
    "14/07/2026","15/07/2026","18/07/2026","19/07/2026"
];

const gruposMundial = ["A","B","C","D","E","F","G","H","I","J","K","L"];

const etapasKO = [
    { label:"32", value:"Ronda32" },
    { label:"8s", value:"Octavos" },
    { label:"4s", value:"Cuartos" },
    { label:"Sem", value:"Semifinal" },
    { label:"3°", value:"Tercero" },
    { label:"Fin", value:"Final" }
];

function normalizarTextoFecha(texto){
    return (texto || "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function fechaAppCoincide(fechaPartido, fechaFiltro){
    const [dia, mes] = fechaFiltro.split("/");
    const diaNum = String(Number(dia));
    const mesNum = String(Number(mes));

    const meses = {
        "06": "junio",
        "07": "julio"
    };

    const texto = normalizarTextoFecha(fechaPartido);
    const mesTexto = meses[mes];

    return texto.includes(diaNum) && texto.includes(mesTexto);
}

function getFechaHoyDisponible(){
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const disponibles = fechasMundial.map(f => {
        const [d,m,y] = f.split("/");
        return {
            texto: f,
            fecha: new Date(Number(y), Number(m) - 1, Number(d))
        };
    });

    const proxima = disponibles.find(x => x.fecha >= hoy);

    return proxima ? proxima.texto : fechasMundial[0];
}



function mostrarPartidos(tipoFiltro = "hoy", valorFiltro = null, panelActivo = null){

    window.scrollTo({ top: 0, behavior: "smooth" });

    const fechasScrollActual = document.querySelector(".fechas-scroll");

    if(fechasScrollActual){
        scrollFechas = fechasScrollActual.scrollLeft;
    }

    if(tipoFiltro === "hoy"){
        valorFiltro = getFechaHoyDisponible();
    }

    ultimoFiltroPartidos = {
        tipo: tipoFiltro,
        valor: valorFiltro
    };

    let partidosFiltrados = [...partidos];

    if(tipoFiltro === "fecha" || tipoFiltro === "hoy"){
        partidosFiltrados = partidos.filter(p => fechaAppCoincide(p.fecha, valorFiltro));
    }

    if(tipoFiltro === "grupo"){
        partidosFiltrados = partidos.filter(p =>
            p.loc?.charAt(0) === valorFiltro ||
            p.vis?.charAt(0) === valorFiltro
        );
    }

    if(tipoFiltro === "ko"){
        partidosFiltrados = partidos.filter(p =>
            p.stage === valorFiltro ||
            p.Stage === valorFiltro
        );
    }

    if(tipoFiltro === "todos"){
        partidosFiltrados = partidos;
    }

    let tituloFiltro = "Partidos";

    if(tipoFiltro === "hoy") tituloFiltro = "Partidos de hoy";
    if(tipoFiltro === "todos") tituloFiltro = "Todos los partidos";
    if(tipoFiltro === "fecha") tituloFiltro = `Partidos del ${valorFiltro}`;
    if(tipoFiltro === "grupo") tituloFiltro = `Grupo ${valorFiltro}`;
    if(tipoFiltro === "ko") tituloFiltro = valorFiltro;

    let html = `
        <h1>PARTIDOS <span class="titulo-acento">FILTRADOS</span></h1>
        <p class="subtexto">${tituloFiltro}</p>

        <div class="filtros-botones">

            <div class="filtro-rapido">
                <button 
                    class="${tipoFiltro === "hoy" ? "filtro-activo" : ""}"
                    onclick="mostrarPartidos('hoy')"
                >
                    📍 Hoy
                </button>

                <button 
                    class="${tipoFiltro === "todos" ? "filtro-activo" : ""}"
                    onclick="mostrarPartidos('todos')"
                >
                    Todos
                </button>
            </div>

            <div class="filtro-tabs">
                <button 
                    class="${panelActivo === "fechas" ? "filtro-activo" : ""}"
                    onclick="mostrarPartidos('${tipoFiltro}', ${valorFiltro ? `'${valorFiltro}'` : "null"}, 'fechas')"
                >
                    📅 Fechas
                </button>

                <button 
                    class="${panelActivo === "grupos" ? "filtro-activo" : ""}"
                    onclick="mostrarPartidos('${tipoFiltro}', ${valorFiltro ? `'${valorFiltro}'` : "null"}, 'grupos')"
                >
                    🏆 Grupos / KO
                </button>
            </div>

            ${panelActivo === "fechas" ? `
                <div class="fechas-scroll">
                    ${fechasMundial.map(f => {
                        const dia = f.split("/")[0];

                        return `
                            <button 
                                class="${valorFiltro === f ? "filtro-activo fecha-activa" : ""}"
                                onclick="mostrarPartidos('fecha', '${f}', 'fechas')"
                            >
                                ${dia}
                            </button>
                        `;
                    }).join("")}
                </div>
            ` : ""}

            ${panelActivo === "grupos" ? `
                <div class="grupos-ko-grid">
                    ${gruposMundial.map(g => `
                        <button 
                            class="${tipoFiltro === "grupo" && valorFiltro === g ? "filtro-activo" : ""}"
                            onclick="mostrarPartidos('grupo', '${g}', 'grupos')"
                        >
                            ${g}
                        </button>
                    `).join("")}

                    ${etapasKO.map(e => `
                        <button 
                            class="${tipoFiltro === "ko" && valorFiltro === e.value ? "filtro-activo" : ""}"
                            onclick="mostrarPartidos('ko', '${e.value}', 'grupos')"
                        >
                            ${e.label}
                        </button>
                    `).join("")}
                </div>
            ` : ""}

        </div>
    `;

    if(partidosFiltrados.length === 0){
        html += `<p class="subtexto">No hay partidos para este filtro.</p>`;
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

    setTimeout(() => {

        const fechasScroll = document.querySelector(".fechas-scroll");
        const fechaActiva = document.querySelector(".fecha-activa");

        if(fechasScroll){

            if(fechaActiva){
                const left = fechaActiva.offsetLeft 
                    - (fechasScroll.clientWidth / 2) 
                    + (fechaActiva.clientWidth / 2);

                fechasScroll.scrollLeft = left;
            }
            else{
                fechasScroll.scrollLeft = scrollFechas;
            }
        }

    }, 10);
    
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
