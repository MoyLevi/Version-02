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
                    onclick="mostrarEstadisticas('${key}')"
                >
                    ${cat.icono} ${cat.titulo}
                </button>
            `).join("")}
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

function crearHTMLTopConteo(ordenados, total, limite = 3){
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

function crearHTMLClasificadosComunidad(){
    const lugaresGrupo = getLugaresProGrupos();
    const totalUsuarios = new Set(lugaresGrupo.map(x => x.idUsuario)).size;
    const conteoGeneral = contarValores(lugaresGrupo, x => x.lugares);
    const favorito = conteoGeneral[0] || ["Sin pick", 0];
    const grupos = "ABCDEFGHIJKL".split("");

    return `
        <h1 class="titulo-stats-principal">PRONÓSTICOS <span class="titulo-acento">ESPECIALES</span></h1>

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

        <div class="clasificados-comunidad-grid">
            ${grupos.map(g => {
                const picksPrimero = lugaresGrupo.filter(x => x.lug === `${g}1`);
                const picksSegundo = lugaresGrupo.filter(x => x.lug === `${g}2`);
                const topPrimero = contarValores(picksPrimero, x => x.lugares);
                const topSegundo = contarValores(picksSegundo, x => x.lugares);

                return `
                    <div class="clasificado-comunidad-card">
                        <h3>Grupo ${g}</h3>

                        <div class="clasificado-comunidad-bloque">
                            <h4>1° lugar más elegido</h4>
                            ${crearHTMLTopConteo(topPrimero, picksPrimero.length)}
                        </div>

                        <div class="clasificado-comunidad-bloque">
                            <h4>2° lugar más elegido</h4>
                            ${crearHTMLTopConteo(topSegundo, picksSegundo.length)}
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function crearHTMLEspecial(categoria){

    if(categoria === "clasificados"){
        return crearHTMLClasificadosComunidad();
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

    return `
        <h1 class="titulo-stats-principal">PRONÓSTICOS <span class="titulo-acento">ESPECIALES</span></h1>

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

        <div class="especiales-layout">
            <div class="especial-panel">
                <h3>Conteo general</h3>
                ${conteoHTML}
            </div>

            <div class="especial-panel">
                <h3>Picks por usuario</h3>
                ${listaUsuarios}
            </div>
        </div>
    `;
}

function mostrarEstadisticas(categoriaEspecial = categoriaEspecialActual){

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    categoriaEspecialActual = categoriasEspeciales[categoriaEspecial]
        ? categoriaEspecial
        : "campeon";

    contenido.innerHTML = `
        ${crearHTMLEspecial(categoriaEspecialActual)}

        ${getFooterCopyright()}
    `;
}
