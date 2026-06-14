const categoriasEspeciales = {
    campeon: {
        titulo: "Campeón",
        icono: "🏆",
        campo: "campeon"
    },
    segundo: {
        titulo: "Segundo",
        icono: "🥈",
        campo: "segundo"
    },
    tercero: {
        titulo: "Tercero",
        icono: "🥉",
        campo: "tercero"
    },
    goleador: {
        titulo: "Goleador",
        icono: "⚽",
        campo: "goleador"
    },
    sorpresa: {
        titulo: "Sorpresa",
        icono: "🌟",
        campo: "sorpresa"
    },
    clasificados: {
        titulo: "Clasificados",
        icono: "🏆",
        campo: null
    }
};

let categoriaEspecialActual = "campeon";
let vistaEspecialActual = "conteo";
let grupoClasificadosActual = "A";

function normalizarPickEspecial(valor){
    return valor && valor.trim() !== "" ? valor.trim() : "Sin pick";
}

function crearHTMLPaisConBandera(nombre){

    const pais = (nombre || "").trim();

    if(!pais || pais === "-"){
        return `<span>-</span>`;
    }

    return `
        <span class="pais-con-bandera">
            <img src="${getFlag(pais)}" alt="${pais}" class="flag-mini">
            <span>${pais}</span>
        </span>
    `;
}

function getResumenEspecial(categoria){
    const config = categoriasEspeciales[categoria];
    const conteo = {};

    usuarios.forEach(u => {
        const pick = normalizarPickEspecial(u[config.campo]);
        conteo[pick] = (conteo[pick] || 0) + 1;
    });

    const ordenados = Object.entries(conteo)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));

    const total = usuarios.length;
    const favorito = ordenados[0] || ["Sin pick", 0];

    return {
        config,
        total,
        favorito: favorito[0],
        favoritoCantidad: favorito[1],
        opcionesDistintas: ordenados.length,
        ordenados
    };
}

function crearHTMLBotonesEspeciales(categoriaActiva){
    return `
        <div class="tabs-especiales">
            ${Object.entries(categoriasEspeciales).map(([key, cat]) => `
                <button 
                    class="${categoriaActiva === key ? "tab-activa" : ""}"
                    onclick="mostrarEstadisticas('${key}', 'conteo', grupoClasificadosActual, true)"
                >
                    ${cat.icono} ${cat.titulo}
                </button>
            `).join("")}
        </div>
    `;
}

function crearHTMLBotonesVistaEspecial(categoria, vistaActiva){
    return `
        <div class="tabs-mini-estadisticas">
            <button
                class="${vistaActiva === "conteo" ? "tab-activa" : ""}"
                onclick="mostrarEstadisticas('${categoria}', 'conteo', grupoClasificadosActual, true)"
            >
                📊 Conteo General
            </button>

            <button
                class="${vistaActiva === "usuarios" ? "tab-activa" : ""}"
                onclick="mostrarEstadisticas('${categoria}', 'usuarios', grupoClasificadosActual, true)"
            >
                👥 Picks por Usuario
            </button>
        </div>
    `;
}

function getLugaresProGrupos(){
    return lugaresPro.filter(x => /^[A-L][12]$/.test(x.lug));
}

function contarValores(lista, selector){
    const conteo = {};

    lista.forEach(item => {
        const valor = normalizarPickEspecial(selector(item));
        conteo[valor] = (conteo[valor] || 0) + 1;
    });

    return Object.entries(conteo)
        .sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
}

function crearHTMLTopConteo(ordenados, total, limite = 5){
    if(ordenados.length === 0){
        return `<p class="subtexto">Sin picks capturados.</p>`;
    }

    return ordenados.slice(0, limite).map(([equipo, cantidad]) => {
        const porcentaje = total > 0
            ? Math.round((cantidad / total) * 100)
            : 0;

        return `
            <div class="clasificado-comunidad-row">
                <span>${crearHTMLPaisConBandera(equipo)}</span>
                <strong>${cantidad} · ${porcentaje}%</strong>
            </div>
        `;
    }).join("");
}

function crearHTMLBotonesGruposClasificados(grupoActivo){
    const grupos = "ABCDEFGHIJKL".split("");

    return `
        <div class="grupos-clasificados-stats">
            ${grupos.map(g => `
                <button
                    class="${grupoActivo === g ? "filtro-activo" : ""}"
                    onclick="mostrarEstadisticas('clasificados', 'conteo', '${g}', true)"
                >
                    ${g}
                </button>
            `).join("")}
        </div>
    `;
}

function crearHTMLClasificadosComunidad(grupoActivo = grupoClasificadosActual){
    const lugaresGrupo = getLugaresProGrupos();
    const totalUsuarios = new Set(lugaresGrupo.map(x => x.idUsuario)).size;
    const conteoGeneral = contarValores(lugaresGrupo, x => x.lugares);
    const favorito = conteoGeneral[0] || ["Sin pick", 0];

    const grupoSeguro = /^[A-L]$/.test(grupoActivo) ? grupoActivo : "A";
    grupoClasificadosActual = grupoSeguro;

    const picksPrimero = lugaresGrupo.filter(x => x.lug === `${grupoSeguro}1`);
    const picksSegundo = lugaresGrupo.filter(x => x.lug === `${grupoSeguro}2`);
    const topPrimero = contarValores(picksPrimero, x => x.lugares);
    const topSegundo = contarValores(picksSegundo, x => x.lugares);

    return `
        <h1>PRONÓSTICOS <span class="titulo-acento">ESPECIALES</span></h1>

        ${crearHTMLBotonesEspeciales("clasificados")}

        <div class="stats-grid especiales-resumen-grid">
            <div class="stat-card">
                <h2>🏆</h2>
                <p>Clasificados</p>
            </div>

            <div class="stat-card">
                <h2 class="stat-pais-favorito">${crearHTMLPaisConBandera(favorito[0])}</h2>
                <p>Equipo más elegido · ${favorito[1]} picks</p>
            </div>

            <div class="stat-card">
                <h2>${totalUsuarios}</h2>
                <p>Usuarios con picks de clasificados</p>
            </div>
        </div>

        ${crearHTMLBotonesGruposClasificados(grupoSeguro)}

        <div class="clasificados-comunidad-grid clasificados-comunidad-grid-unico">
            <div class="clasificado-comunidad-card">
                <h3>Grupo ${grupoSeguro}</h3>

                <div class="clasificado-comunidad-bloque">
                    <h4>1° lugar más elegido</h4>
                    ${crearHTMLTopConteo(topPrimero, picksPrimero.length)}
                </div>

                <div class="clasificado-comunidad-bloque">
                    <h4>2° lugar más elegido</h4>
                    ${crearHTMLTopConteo(topSegundo, picksSegundo.length)}
                </div>
            </div>
        </div>
    `;
}

function crearHTMLEspecial(categoria){

    if(categoria === "clasificados"){
        return crearHTMLClasificadosComunidad(grupoClasificadosActual);
    }

    const resumen = getResumenEspecial(categoria);
    const porcentajeFavorito = resumen.total > 0
        ? Math.round((resumen.favoritoCantidad / resumen.total) * 100)
        : 0;

    const listaUsuarios = [...usuarios]
        .sort((a,b) => a.nombre.localeCompare(b.nombre, "es"))
        .map(u => `
            <div class="especial-row">
                <span>${u.nombre}</span>
                <strong>${normalizarPickEspecial(u[resumen.config.campo])}</strong>
            </div>
        `).join("");

    const conteoHTML = resumen.ordenados.map(([pick, cantidad]) => {
        const porcentaje = resumen.total > 0
            ? Math.round((cantidad / resumen.total) * 100)
            : 0;

        return `
            <div class="especial-row especial-row-conteo">
                <span>${pick}</span>
                <strong>${cantidad} · ${porcentaje}%</strong>
            </div>
        `;
    }).join("");

    const panelActual = vistaEspecialActual === "usuarios" ? "usuarios" : "conteo";

    return `
        <h1>PRONÓSTICOS <span class="titulo-acento">ESPECIALES</span></h1>

        ${crearHTMLBotonesEspeciales(categoria)}

        <div class="stats-grid especiales-resumen-grid">
            <div class="stat-card">
                <h2>${resumen.config.icono}</h2>
                <p>${resumen.config.titulo}</p>
            </div>

            <div class="stat-card">
                <h2>${resumen.favorito}</h2>
                <p>Favorito de la comunidad · ${resumen.favoritoCantidad} picks · ${porcentajeFavorito}%</p>
            </div>

            <div class="stat-card">
                <h2>${resumen.opcionesDistintas}</h2>
                <p>Opciones distintas</p>
            </div>
        </div>

        ${crearHTMLBotonesVistaEspecial(categoria, panelActual)}

        <div class="especiales-layout especiales-layout-unico">
            ${panelActual === "conteo" ? `
                <div class="especial-panel">
                    <h3>Conteo general</h3>
                    ${conteoHTML}
                </div>
            ` : `
                <div class="especial-panel">
                    <h3>Picks por usuario</h3>
                    ${listaUsuarios}
                </div>
            `}
        </div>
    `;
}

function mostrarEstadisticas(categoriaEspecial = categoriaEspecialActual, vistaEspecial = "conteo", grupoClasificados = grupoClasificadosActual, conservarScroll = false){

    const scrollActual = window.scrollY || document.documentElement.scrollTop || 0;

    if(!conservarScroll){
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    categoriaEspecialActual = categoriasEspeciales[categoriaEspecial]
        ? categoriaEspecial
        : "campeon";

    vistaEspecialActual = vistaEspecial === "usuarios" ? "usuarios" : "conteo";

    if(/^[A-L]$/.test(grupoClasificados)){
        grupoClasificadosActual = grupoClasificados;
    }

    contenido.innerHTML = `
        ${crearHTMLEspecial(categoriaEspecialActual)}

        ${getFooterCopyright()}
    `;

    if(conservarScroll){
        requestAnimationFrame(() => {
            window.scrollTo({
                top: scrollActual,
                behavior: "auto"
            });
        });
    }
}
