btnInicio.addEventListener("click", mostrarInicio);
btnPartidos.addEventListener("click", mostrarPartidos);
btnTabla.addEventListener("click", mostrarTabla);
btnEstadisticas.addEventListener("click", mostrarEstadisticas);

async function actualizarDatos(){

    const balon = document.getElementById("balonRefresh");
    const boton = document.querySelector(".btn-refresh");

    try{
        if(balon){
            balon.classList.add("balon-actualizando");
        }

        if(boton){
            boton.disabled = true;
            boton.innerHTML = `<span id="balonRefresh" class="balon-actualizando">⚽</span> Actualizando...`;
        }

        await cargarPartidos();
        await cargarUsuarios();
        await cargarPicks();

        actualizarTimestamp();
        mostrarInicio();
    }
    catch(error){
        console.error(error);
        alert("Error al actualizar datos.");
    }
}

async function iniciarApp(){
    
    contenido.innerHTML = `
        <div class="loading">
            <h1><span class="balon-actualizando">⚽</span> Cargando quiniela...</h1>
            <p>Consultando datos de Google Sheets</p>
        </div>
    `;

    try{
        await cargarPartidos();
        await cargarUsuarios();
        await cargarPicks();

        actualizarTimestamp();
        mostrarInicio();
        console.log("APP LISTA");
    }

    catch(error){
        console.error(error);

        contenido.innerHTML = `
            <div class="error-card">
                <h1>⚠️ Error al cargar datos</h1>
                <p>Revisa la conexión o los enlaces CSV de Google Sheets.</p>
            </div>
            ${getFooterCopyright()}
        `;
    }
}

iniciarApp();
