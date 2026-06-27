
function crearHTMLAccesoFormularioPicks(){
    const abierto = formPicksAbierto === true;

    if(abierto){
        return `
            <div class="form-picks-home form-picks-home-abierto form-picks-home-clickable" onclick="mostrarFormularioPicks()" role="button" tabindex="0" onkeydown="if(event.key==='Enter' || event.key===' '){ event.preventDefault(); mostrarFormularioPicks(); }">
                <div class="form-picks-abierto-contenido">
                    <span class="form-picks-abierto-icono" aria-hidden="true">✍️</span>
                    <div class="form-picks-abierto-textos">
                        <strong>Picks Ronda de 32</strong>
                        <span>Captura y Modifica</span>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="form-picks-home form-picks-home-cerrado">
            <strong><img class="form-picks-icono-trionda" src="img/trionda.png" alt=""> Picks Ronda de 32</strong>
            <span>Regresa Pronto</span>
        </div>
    `;
}

function mostrarFormularioPicks(){
    if(formPicksAbierto !== true){
        contenido.innerHTML = `
            <button onclick="mostrarInicio()" class="btnVolver">⬅ Regresar</button>
            <h1>PICKS <span class="titulo-acento">RONDA DE 32</span></h1>
            <div class="form-picks-card form-picks-cerrado">
                <h2>Regresa Pronto</h2>
                <p>El formulario todavía no está abierto.</p>
            </div>
            ${getFooterCopyright()}
        `;
        return;
    }

    contenido.innerHTML = `
        <button onclick="mostrarInicio()" class="btnVolver">⬅ Regresar</button>
        <h1>PICKS <span class="titulo-acento">RONDA DE 32</span></h1>
        <p class="subtexto">Captura o modifica tus picks desde el formulario oficial.</p>

        <div class="form-picks-frame-wrap">
            <iframe
                class="form-picks-frame"
                src="${urlFormularioPicks}"
                title="Formulario Picks Ronda de 32"
                loading="lazy"
            ></iframe>
        </div>

        ${getFooterCopyright()}
    `;

    window.scrollTo({ top:0, behavior:"smooth" });
}

function mostrarInicio(){

    const ranking = typeof getRankingGeneralCompleto === "function" ? getRankingGeneralCompleto() : getRanking();
    const lider = ranking[0];
    const totalPicksCapturados = (Array.isArray(picks) ? picks.length : 0) + (Array.isArray(picksKO) ? picksKO.length : 0);
    const golesMarcados = (Array.isArray(partidos) ? partidos : []).reduce((total, p) => {
        const gl = p.golesLoc !== "" && p.golesLoc !== undefined ? Number(p.golesLoc) : NaN;
        const gv = p.golesVis !== "" && p.golesVis !== undefined ? Number(p.golesVis) : NaN;
        return total + (Number.isFinite(gl) ? gl : 0) + (Number.isFinite(gv) ? gv : 0);
    }, 0);

    const proximos = partidos
        .filter(p => p.status === "Pendiente" || p.status === "En vivo")
        .slice(0, 3);

    contenido.innerHTML = `
        <div class="hero-logo">
            <img 
                src="https://assets.football-logos.cc/logos/tournaments/700x700/fifa-world-cup-2026--white.9ba8a004.png" 
                alt="FIFA World Cup 2026"
            >
        </div>

        <h1>QUINIELA <span class="titulo-acento">MUNDIAL 2026</span></h1>

        ${crearHTMLAccesoFormularioPicks()}

        <div class="acciones-inicio-compactas">
            <button class="btn-leeme" onclick="mostrarLeeme()">Avisos</button>
            <button class="btn-premios" onclick="mostrarReglasPremios()">Premios</button>
            <button class="btn-comparte" onclick="compartirApp()">Comparte</button>
            <button class="btn-refresh btn-refresh-compacto" onclick="actualizarDatos()">Actualiza</button>
        </div>

        <div class="refresh-container refresh-container-simple">
            <p class="ultima-actualizacion">
                Última actualización: ${formatearFechaHora(ultimaActualizacion)}
            </p>
        </div>

        <div class="inicio-grid inicio-grid-compacta">
            <div class="inicio-card inicio-card-compacta">
                <h2>${usuarios.length}</h2>
                <p>Total de jugadores</p>
            </div>

            <div class="inicio-card inicio-card-compacta">
                <h2>${lider ? lider.puntos : 0}</h2>
                <p>Puntos del líder</p>
            </div>

            <div class="inicio-card inicio-card-compacta">
                <h2>${totalPicksCapturados}</h2>
                <p>Picks capturados</p>
            </div>

            <div class="inicio-card inicio-card-compacta">
                <h2>${golesMarcados}</h2>
                <p>Goles marcados</p>
            </div>
        </div>

        <h2>PRÓXIMOS <span class="titulo-acento">PARTIDOS</span></h2>

        ${proximos.map(p => `
            <div class="partido ${getClaseStatus(p.status)}" onclick="verPartido(${p.id})">
                <div class="equipo">
                    <img src="${getFlag(p.local)}">
                    <p>${p.local}</p>
                </div>

                <div class="marcador-box">
                    <div class="marcador">
                        ${p.status === "En vivo" && p.golesLoc !== "" && p.golesVis !== "" 
                            ? `${p.golesLoc}-${p.golesVis}` 
                            : "VS"}
                    </div>
                    ${p.status === "En vivo" ? `<div class="status-mini status-vivo">En vivo</div>` : ""}
                </div>

                <div class="equipo">
                    <img src="${getFlag(p.visita)}">
                    <p>${p.visita}</p>
                </div>
            </div>
        `).join("")}

        ${getFooterCopyright()}
    `;
}

function mostrarReglasPremios(){

    contenido.innerHTML = `
        <button onclick="mostrarInicio()" class="btnVolver">⬅ Regresar</button>

        <h1>REGLAS <span class="titulo-acento">Y PREMIOS</span></h1>

        <p class="subtexto">Puedes hacer zoom con dos dedos en el celular.</p>

        <div class="visor-reglas" id="visorReglas">
            <img 
                src="img/reglas-premios.png" 
                alt="Sistema de puntuación y premios"
                class="img-reglas"
                id="imgReglas"
            >
        </div>

        <a class="btn-descargar-reglas" href="img/reglas-premios.png" download>
            📥 Descargar imagen
        </a>

        ${getFooterCopyright()}
    `;

    setTimeout(() => {
        const imagen = document.getElementById("imgReglas");
        const visor = document.getElementById("visorReglas");

        if(!imagen || !visor || !window.Panzoom){
            return;
        }

        const iniciarZoom = () => {
            const panzoom = Panzoom(imagen, {
                maxScale: 5,
                minScale: 1,
                contain: "outside"
            });

            visor.addEventListener("wheel", panzoom.zoomWithWheel);
        };

        if(imagen.complete){
            iniciarZoom();
        } else {
            imagen.onload = iniciarZoom;
        }
    }, 100);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}



let leemeMensajeActual = 0;

const mensajesLeeme = [
    {
        fecha: "17.Junio.2026 9:42pm",
        titulo: "Actualización v3.0",
        texto: `Hola quiniel@s, disfrutando el Mundial? ya se nos fue la jornada 1 y esto aun le falta!, En este espacio estaré informándoles cosas interesantes que se vienen.<br><br>

Les comparto la versión 3.0 que incluye la segunda fase completa, váyanla checando y entendiendo que son muchos Standings que ir monitorear! no nada más es la etapa de grupos, esto conforme a las Reglas y Premios acordados, LÉANLOS! si aún no lo han hecho.<br><br>

Traté de poner todo de manera super detallada y transparente para que todos puedan ver el detalle de cada sección y como se conforman los puntos de cada categoría.<br><br>

Al finalizar el último partido de fase de grupos de manera automática se sumaran TODAS las demás tablas, Ojito con esto! y no se me confundan! por eso váyanlas viendo y familiarizandose con cada una de ellas.<br><br>

Toda la APP es 100% dinámica, con 1 solo gol se calcula absolutamente todo, así que actualicen la APP cada que quieran ver algo en tiempo real.<br><br>

Les adelanto: para la fase de 32, habrá dos opciones: 1. Conservar sus picks originales que llenaron ANTES de que comenzara el mundial o 2. Volver a hacer nuevos Picks, pero en esta ocasion serán ANTES de comenzar la Fase de 32. Váyanle viendo y en su momento les diré como hacer su nuevos picks. Desde luego que les recomiendo esta opción, pero como quieran.<br><br>

Bueno aqui sigo, me falta desarrollar los Standings de los Goleadores, e integrarlos al final, y otras monerias. Pero a su tiempo.`
    },
    {
        fecha: "18.Junio.2026 10:14pm",
        titulo: "Integración del Bracket",
        texto: `Se agregó la opción <b>Bracket Mundialista.</b> Pueden consultarla en la sección <b>Stats.</b> Además, lo pueden exportar como imagen en formato <b>PNG.</b> El bracket es dinámico, osea que las posiciones se actualizan automáticamente conforme se registran los resultados de los partidos.
`
    },
    {
        fecha: "26.Junio.2026 04:58pm",
        titulo: "Highlights",
        texto: `Se agregó un breve resumen en video de aproximadamente <b>5 minutos</b> para cada partido, ideal para quienes no pudieron verlo en vivo.`
    },
    {
        fecha: "26.Junio.2026 08:20pm",
        titulo: "¡Nueva función disponible!",
        texto: `Ahora puedes <b>instalar la APP de la Quiniela Mundial 2026</b> directamente en tu celular, tablet o computadora. Es completamente segura y te permitirá acceder de forma más rápida, como si fuera una aplicación nativa.<br><br>

        Muy pronto también podrás recibir <b>Notificaciones automáticas</b> hasta <b>15 minutos antes del inicio de cada partido</b>, además de futuras funciones y mejoras exclusivas para la versión instalada.<br><br>

        ¡Instálala y disfruta de una mejor experiencia durante la fase de Knockout! ⚽🏆`
    },
    {
        fecha: "27.Junio.2026 08:58pm",
        titulo: "<b>⚽ Picks - Ronda de 32</b>",
        texto: `<b>¡Ya puedes actualizar tus Picks para la Ronda de 32!</b><br><br>

        <b>1.</b> Puedes modificar tus Picks hasta <b>5 minutos antes</b> del inicio de <b>cada partido</b>.<br><br>

        <b>2.</b> Puedes enviar el formulario <b>las veces que quieras</b>. Siempre contará <b>el último formulario</b> que envíes antes del cierre del partido.<br><br>

        <b>3.</b> Si envías el formulario <b>después del horario de cierre</b>, esa captura <b>ya no contará</b>, aunque el formulario todavía siga apareciendo disponible.<br><br>

        <b>4.</b> Si decides <b>no cambiar tus Picks</b>, no pasa nada. La app conservará automáticamente los Picks que registraste <b>antes de iniciar el Mundial</b>.<br><br>

        <b>5.</b> Por eso es normal que en la app sigas viendo equipos que ya fueron eliminados. Esos Picks originales seguirán siendo válidos para tu puntuación. <b>Así nadie está obligado a modificar sus Picks.</b><br><br>

        <b>6.</b> Antes de enviar, revisa bien tus marcadores. Si pronosticas un <b>empate</b>, también debes capturar <b>el resultado de los penales</b>.<br><br>

        🍀 <b>¡Mucha suerte y que gane el mejor pronosticador! 🏆.</b>`
    }
];

function crearHTMLMensajeLeeme(){
    const total = mensajesLeeme.length;
    const idx = Math.min(Math.max(leemeMensajeActual, 0), total - 1);
    leemeMensajeActual = idx;
    const msg = mensajesLeeme[idx];

    return `
        <div class="leeme-historial-barra">
            <button onclick="cambiarMensajeLeeme(-1)" ${idx <= 0 ? "disabled" : ""}>‹ Anterior</button>
            <span>${idx + 1} / ${total}</span>
            <button onclick="cambiarMensajeLeeme(1)" ${idx >= total - 1 ? "disabled" : ""}>Siguiente ›</button>
        </div>

        <div class="leeme-card" id="leemeCard">
            <p><strong>Last update: ${msg.fecha}</strong></p>
            <p><strong>${msg.titulo}</strong></p>
            <p>${msg.texto}</p>
        </div>
    `;
}

function cambiarMensajeLeeme(delta){
    leemeMensajeActual += Number(delta) || 0;
    const contenedor = document.getElementById("leemeContenido");
    if(contenedor){
        contenedor.innerHTML = crearHTMLMensajeLeeme();
    }
}

function mostrarLeeme(){

    leemeMensajeActual = Math.max((mensajesLeeme || []).length - 1, 0);

    contenido.innerHTML = `
        <button onclick="mostrarInicio()" class="btnVolver">⬅ Regresar</button>

        <h1>AVISOS <span class="titulo-acento">QUINIELA</span></h1>

        <div id="leemeContenido">
            ${crearHTMLMensajeLeeme()}
        </div>

        ${getFooterCopyright()}
    `;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

