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
        .replace(/[\u00a0\t\r\n]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function claveFechaApp(dia, mes, anio = 2026){
    const d = Number(dia);
    const m = Number(mes);
    let y = Number(anio || 2026);

    if(!d || !m) return "";
    if(!y) y = 2026;
    if(y < 100) y += 2000;

    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

function obtenerTextoFechaPartido(partidoOFecha){
    if(partidoOFecha && typeof partidoOFecha === "object"){
        // OJO: para filtrar por fecha usamos principalmente la columna Fecha.
        // No conviene leer todo el objeto porque números de marcador/ID pueden contaminar la búsqueda.
        return partidoOFecha.fecha || partidoOFecha.Fecha || "";
    }

    return partidoOFecha || "";
}

function obtenerClaveFechaPartido(partidoOFecha, anioDefault = 2026){
    const texto = normalizarTextoFecha(obtenerTextoFechaPartido(partidoOFecha));
    if(!texto) return "";

    const meses = {
        ene:1, enero:1,
        feb:2, febrero:2,
        mar:3, marzo:3,
        abr:4, abril:4,
        may:5, mayo:5,
        jun:6, junio:6,
        jul:7, julio:7,
        ago:8, agosto:8,
        sep:9, sept:9, septiembre:9,
        oct:10, octubre:10,
        nov:11, noviembre:11,
        dic:12, diciembre:12
    };

    // Formatos: 01/07/2026, 1/7/26, 01-07-2026, 2026-07-01
    let m = texto.match(/\b(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\b/);
    if(m) return claveFechaApp(m[3], m[2], m[1]);

    m = texto.match(/\b(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?\b/);
    if(m) return claveFechaApp(m[1], m[2], m[3] || anioDefault);

    // Formatos: jue 1 julio 2026, 1 de julio, 01 jul. 2026, miércoles 1 de julio de 2026
    m = texto.match(/\b(\d{1,2})\s*(?:de\s*)?(ene(?:ro)?|feb(?:rero)?|mar(?:zo)?|abr(?:il)?|may(?:o)?|jun(?:io)?|jul(?:io)?|ago(?:sto)?|sep(?:t|tiembre)?|oct(?:ubre)?|nov(?:iembre)?|dic(?:iembre)?)[\.]?(?:\s*(?:de)?\s*(\d{2,4}))?\b/);
    if(m) return claveFechaApp(m[1], meses[m[2]], m[3] || anioDefault);

    return "";
}

function fechaAppCoincide(partidoOFecha, fechaFiltro){
    if(!partidoOFecha || !fechaFiltro) return false;

    const [diaFiltro, mesFiltro, anioFiltro] = fechaFiltro.split("/").map(Number);
    const claveFiltro = claveFechaApp(diaFiltro, mesFiltro, anioFiltro);
    const texto = normalizarTextoFecha(obtenerTextoFechaPartido(partidoOFecha));
    const clavePartido = obtenerClaveFechaPartido(partidoOFecha, anioFiltro);

    if(clavePartido){
        return clavePartido === claveFiltro;
    }

    // Compatibilidad con el filtro viejo, pero corregido:
    // antes hacía texto.includes("1") y por eso 01/julio jalaba 10, 11, 14, 15, 18, etc.
    const mesesTexto = {
        1:["enero", "ene"],
        2:["febrero", "feb"],
        3:["marzo", "mar"],
        4:["abril", "abr"],
        5:["mayo", "may"],
        6:["junio", "jun"],
        7:["julio", "jul"],
        8:["agosto", "ago"],
        9:["septiembre", "sept", "sep"],
        10:["octubre", "oct"],
        11:["noviembre", "nov"],
        12:["diciembre", "dic"]
    };

    const diaExacto = new RegExp(`(^|\\D)0?${diaFiltro}(?=\\D|$)`).test(texto);
    const mesExacto = (mesesTexto[mesFiltro] || []).some(mes => new RegExp(`(^|\\D)${mes}\\.?($|\\D)`).test(texto));

    return diaExacto && mesExacto;
}

function formatearFechaFiltroBonita(fechaFiltro){
    if(!fechaFiltro) return "Partidos";

    const [dia, mes, anio] = fechaFiltro.split("/").map(Number);
    const fecha = new Date(anio, mes - 1, dia);

    const texto = fecha.toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });

    return texto.charAt(0).toUpperCase() + texto.slice(1);
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

    let partidosVista = getPartidosVista();
    let partidosFiltrados = [...partidosVista];

    if(tipoFiltro === "fecha" || tipoFiltro === "hoy"){
        partidosFiltrados = partidosVista.filter(p => fechaAppCoincide(p, valorFiltro));
    }

    if(tipoFiltro === "grupo"){
        partidosFiltrados = partidosVista.filter(p =>
            !p.esKO && (p.loc?.charAt(0) === valorFiltro ||
            p.vis?.charAt(0) === valorFiltro)
        );
    }

    if(tipoFiltro === "ko"){
        partidosFiltrados = partidosVista.filter(p =>
            p.stage === valorFiltro ||
            p.Stage === valorFiltro
        );
    }

    if(tipoFiltro === "todos"){
        partidosFiltrados = partidosVista;
    }

    let tituloFiltro = "Partidos";

    if(tipoFiltro === "hoy") tituloFiltro = formatearFechaFiltroBonita(valorFiltro);
    if(tipoFiltro === "todos") tituloFiltro = "Todos los partidos";
    if(tipoFiltro === "fecha") tituloFiltro = formatearFechaFiltroBonita(valorFiltro);
    if(tipoFiltro === "grupo") tituloFiltro = `Grupo ${valorFiltro}`;
    if(tipoFiltro === "ko") tituloFiltro = valorFiltro;

    let html = `
        <h1>PARTIDOS <span class="titulo-acento">FILTRADOS</span></h1>

        <div class="filtros-botones">

            <div class="filtro-rapido">
                <button 
                    class="${tipoFiltro === "hoy" ? "filtro-activo" : ""}"
                    onclick="mostrarPartidos('hoy')"
                >
                    📍 Hoy
                </button>

                <button 
                    class="${panelActivo === "ko" ? "filtro-activo" : ""}"
                    onclick="mostrarPartidos('${tipoFiltro}', ${valorFiltro ? `'${valorFiltro}'` : "null"}, 'ko')"
                >
                    ⚔️ KO
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
                    🏆 Grupos
                </button>

                <button 
                    class="${tipoFiltro === "todos" ? "filtro-activo" : ""}"
                    onclick="mostrarPartidos('todos')"
                >
                    Todos
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
                </div>
            ` : ""}

            ${panelActivo === "ko" ? `
                <div class="grupos-ko-grid ko-grid">
                    ${etapasKO.map(e => `
                        <button 
                            class="${tipoFiltro === "ko" && valorFiltro === e.value ? "filtro-activo" : ""}"
                            onclick="mostrarPartidos('ko', '${e.value}', 'ko')"
                        >
                            ${e.label}
                        </button>
                    `).join("")}
                </div>
            ` : ""}

        </div>

        <p class="filtro-resultado-titulo">${tituloFiltro}</p>
    `;

    if(partidosFiltrados.length === 0){
        html += `<p class="subtexto">No hay partidos para este filtro.</p>`;
    }

    partidosFiltrados.forEach(p => {

        const marcador = formatearMarcadorConPenales(p.golesLoc, p.golesVis, p.penLoc, p.penVis);

        html += `
            <div class="partido ${getClaseStatus(p.status)}" onclick="verPartido(${p.id})">

                <div class="equipo">
                    <img src="${getFlag(p.local)}">
                    <p>${p.local}</p>
                </div>

                <div class="marcador-box">
                    <div class="marcador">${marcador}</div>
                    ${p.esKO ? `<div class="pasa-partido">Gana: ${crearHTMLPaisConBandera(p.pasa || getEquipoPasaPartido(p))}</div>` : ""}
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

    const p = getPartidoVistaPorId(id);

    if(!p){
        contenido.innerHTML = `<p>No se encontró el partido.</p>${getFooterCopyright()}`;
        return;
    }

    const marcador = formatearMarcadorConPenales(p.golesLoc, p.golesVis, p.penLoc, p.penVis);

    let html = `
        <button onclick="mostrarPartidos(ultimoFiltroPartidos.tipo, ultimoFiltroPartidos.valor)" class="btnVolver">⬅ Volver</button>

        <div class="detalle-partido">

            <div class="equipo-detalle">
                <img src="${getFlag(p.local)}">
                <h2>${p.local}</h2>
            </div>

            <div class="marcador-detalle">
                <div>${marcador}</div>
                <span class="status-partido">${p.status || "Pendiente"}</span>
            </div>

            <div class="equipo-detalle">
                <img src="${getFlag(p.visita)}">
                <h2>${p.visita}</h2>
            </div>

        </div>

        <p class="info-partido">${p.fecha} · ${p.hora} · ${p.lugar}</p>
        ${p.esKO ? `<p class="info-partido pasa-detalle">Gana: ${crearHTMLPaisConBandera(p.pasa || getEquipoPasaPartido(p))}</p>` : ""}

        ${typeof getHTMLVideosPartido === "function" ? getHTMLVideosPartido(id) : ""}

        <div class="prediccion-colectiva">
            ${p.esKO ? getPrediccionColectivaKO(id) : getPrediccionColectiva(id)}
        </div>

        <h2>PRONÓSTICOS <span class="titulo-acento">DEL PARTIDO</span></h2>
   `;

    const lista = (p.esKO ? picksKO : picks)
    .filter(x => x.partidoId === id)
    .sort((a, b) => {
        const puntosA = p.esKO ? getPuntosKO(p, a) : getPuntos(p, a);
        const puntosB = p.esKO ? getPuntosKO(p, b) : getPuntos(p, b);

        if(puntosB !== puntosA) return puntosB - puntosA;

        const userA = usuarios.find(u => u.id === a.idUser)?.nombre || "";
        const userB = usuarios.find(u => u.id === b.idUser)?.nombre || "";

        return userA.localeCompare(userB, "es");
    });


    if(lista.length === 0){
        html += `<p>Aún no hay pronósticos para este partido.</p>`;
    }

    lista.forEach(r => {

        const jugado = partidoFinalizado(p);
        const puntos = jugado ? (p.esKO ? getPuntosKO(p, r) : getPuntos(p, r)) : 0;
        const usuario = usuarios.find(u => u.id === r.idUser);
        const clasePronostico = jugado ? `pronostico-puntos-${Math.max(0, Math.min(3, Number(puntos) || 0))}` : "pronostico-pendiente";

        html += `
            <div class="pronostico ${clasePronostico}">
                <span><strong>${usuario ? usuario.nombre : "Usuario " + r.idUser}</strong></span>
                <span>${p.esKO ? formatearPickKO(r) : `${r.golLoc}-${r.golVis}`}</span>
                <span>${puntos} pts</span>
            </div>
        `;
    });

    html += getFooterCopyright();
    contenido.innerHTML = html;
}
