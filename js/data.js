
const CACHE_TABLAS_FIJAS_VERSION = "v4.2.7";

function getCacheTablaFijaKey(nombre){
    return `quiniela_${CACHE_TABLAS_FIJAS_VERSION}_${nombre}`;
}

function leerTablaFijaLocalStorage(nombre){
    try{
        const raw = localStorage.getItem(getCacheTablaFijaKey(nombre));
        if(!raw) return null;

        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : null;
    }
    catch(error){
        console.warn(`No se pudo leer cache local de ${nombre}:`, error);
        return null;
    }
}

function guardarTablaFijaLocalStorage(nombre, data){
    try{
        localStorage.setItem(getCacheTablaFijaKey(nombre), JSON.stringify(data));
    }
    catch(error){
        console.warn(`No se pudo guardar cache local de ${nombre}:`, error);
    }
}

function parseCSV(str){
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for(let i = 0; i < str.length; i++){
        const char = str[i];
        const next = str[i + 1];

        if(char === '"' && inQuotes && next === '"'){
            cell += '"';
            i++;
        } 
        else if(char === '"'){
            inQuotes = !inQuotes;
        } 
        else if(char === "," && !inQuotes){
            row.push(cell.trim());
            cell = "";
        } 
        else if((char === "\n" || char === "\r") && !inQuotes){
            if(cell || row.length){
                row.push(cell.trim());
                rows.push(row);
                row = [];
                cell = "";
            }
        } 
        else {
            cell += char;
        }
    }

    if(cell || row.length){
        row.push(cell.trim());
        rows.push(row);
    }

    return rows;
}

async function cargarPartidos(){

    const cache = leerTablaFijaLocalStorage("Partidos");
    if(cache){
        partidos = cache;
        return;
    }

    const res = await fetch(urlPartidos);
    const text = await res.text();

    const data = parseCSV(text);
    const headers = data[0];

    partidos = data.slice(1).map(r => {

        const obj = {};

        headers.forEach((h, i) => {
            obj[h.trim()] = (r[i] || "").trim();
        });

        return {
            id: Number(obj["ID"]),
            fecha: obj["Fecha"],
            hora: obj["Hora"],
            lugar: obj["Lugar"],
            loc: obj["Loc"],
            local: obj["Local"],
            vis: obj["Vis"],
            visita: obj["Visita"],
            golesLoc: obj["GolesLoc"],
            golesVis: obj["GolesVis"],
            status: obj["Status"] || "Pendiente"
        };
    });

    guardarTablaFijaLocalStorage("Partidos", partidos);
}

async function cargarUsuarios(){

    const cache = leerTablaFijaLocalStorage("Usuarios");
    if(cache){
        usuarios = cache;
        return;
    }

    const res = await fetch(urlUsuarios);
    const text = await res.text();

    const data = parseCSV(text);
    const headers = data[0];

    usuarios = data.slice(1).map(r => {

        const obj = {};

        headers.forEach((h, i) => {
            obj[h.trim()] = (r[i] || "").trim();
        });

        return {
            id: Number(obj["IDUsuario"]),
            nombre: obj["Nombre"],
            paga: (obj["Paga"] || "No").trim().toLowerCase() === "si",
            campeon: obj["Campeon"] || "",
            segundo: obj["Segundo"] || "",
            tercero: obj["Tercero"] || "",
            goleador: obj["Goleador"] || "",
            sorpresa: obj["Sorpresa"] || ""
        };
    });

    guardarTablaFijaLocalStorage("Usuarios", usuarios);
}

async function cargarPicks(){

    const cache = leerTablaFijaLocalStorage("Picks");
    if(cache){
        picks = cache;
        return;
    }

    const res = await fetch(urlPicks);
    const text = await res.text();

    const data = parseCSV(text);
    const headers = data[0];

    picks = data.slice(1).map(r => {

        const obj = {};

        headers.forEach((h, i) => {
            obj[h.trim()] = (r[i] || "").trim();
        });

        return {
            idPick: Number(obj["IDPick"]),
            idUser: Number(obj["IDUser"]),
            partidoId: Number(obj["IDPartido"]),
            golLoc: Number(obj["GolLoc"]),
            golVis: Number(obj["GolVis"])
        };
    });

    guardarTablaFijaLocalStorage("Picks", picks);
}

async function cargarLugaresPro(){

    const cache = leerTablaFijaLocalStorage("LugaresPro");
    if(cache){
        lugaresPro = cache;
        return;
    }

    const res = await fetch(urlLugaresPro);
    const text = await res.text();

    const data = parseCSV(text);
    const headers = data[0];

    lugaresPro = data.slice(1).map(r => {

        const obj = {};

        headers.forEach((h, i) => {
            obj[h.trim()] = (r[i] || "").trim();
        });

        return {
            idLug: Number(obj["IDLug"]),
            idUsuario: Number(obj["IDUsuario"]),
            lug: obj["Lug"],
            lugares: obj["Lugares"]
        };
    });

    guardarTablaFijaLocalStorage("LugaresPro", lugaresPro);
}

async function cargarKnockout(){

    const res = await fetch(urlKnockout);
    const text = await res.text();

    const data = parseCSV(text);
    const headers = data[0];

    knockout = data.slice(1).map(r => {

        const obj = {};

        headers.forEach((h, i) => {
            obj[h.trim()] = (r[i] || "").trim();
        });

        return {
            id: Number(obj["ID"]),
            idStage: Number(obj["IDStage"]),
            stage: obj["Stage"],
            fecha: obj["Fecha"],
            hora: obj["Hora"],
            lugar: obj["Lugar"],
            loc: obj["Loc"],
            vis: obj["Vis"],
            local: obj["Local"],
            visita: obj["Visita"],
            penLoc: obj["PenLoc"],
            golesLoc: obj["GolesLoc"],
            golesVis: obj["GolesVis"],
            penVis: obj["PenVis"],
            status: obj["Status"] || "Pendiente",
            esKO: true
        };
    });
}

async function cargarRankKO(){

    const res = await fetch(urlRankKO);
    const text = await res.text();

    const data = parseCSV(text);
    const headers = data[0];

    rankKO = data.slice(1).map(r => {

        const obj = {};

        headers.forEach((h, i) => {
            obj[h.trim()] = (r[i] || "").trim();
        });

        return {
            idStage: Number(obj["IDStage"]),
            stage: obj["Stage"],
            clave: obj["Clave"],
            equipo: obj["Equipo"]
        };
    });
}

async function cargarPicksKO(){

    const res = await fetch(urlPicksKO);
    const text = await res.text();

    const data = parseCSV(text);
    const headers = data[0];

    picksKO = data.slice(1).map(r => {

        const obj = {};

        headers.forEach((h, i) => {
            obj[h.trim()] = (r[i] || "").trim();
        });

        return {
            idPick: Number(obj["IDPick"]),
            idUser: Number(obj["IDUsuario"] || obj["IDUser"]),
            idStage: Number(obj["IDStage"]),
            stage: obj["Stage"],
            partidoId: Number(obj["IDPartido"]),
            loc: obj["Loc"],
            vis: obj["Vis"],
            penLoc: obj["PenLoc"],
            golLoc: Number(obj["GolLoc"]),
            golVis: Number(obj["GolVis"]),
            penVis: obj["PenVis"],
            esKO: true
        };
    });
}


async function cargarForm(){
    formPicksAbierto = false;

    try{
        if(typeof urlForm !== "string" || !urlForm){
            return;
        }

        const res = await fetch(urlForm, { cache: "no-store" });
        if(!res.ok) throw new Error(`Form ${res.status}`);

        const text = await res.text();
        const data = parseCSV(text);

        // Estructura esperada:
        // Abrir Formulario
        // NO / SI
        const valorDirecto = (data?.[1]?.[0] || "").toString().trim().toLowerCase();
        const valorFlexible = data.flat().find(c => /^(si|sí|no)$/i.test((c || "").toString().trim())) || "";
        const valor = valorDirecto || valorFlexible.toString().trim().toLowerCase();

        formPicksAbierto = valor === "si" || valor === "sí";
    }
    catch(error){
        console.warn("No se pudo cargar configuración Form:", error);
        formPicksAbierto = false;
    }
}

/* =========================================================
   GOLEADORES · HC publicada en Google Sheets
   ---------------------------------------------------------
   Lee la nueva tabla manual de goleadores:
   POS | Nombre | Equipo | P | G
   Respeta posiciones empatadas y muestra formato:
   L.Messi (Bandera) (ARG) 3 goles
   ========================================================= */
function crearGoleadoresFallback(){
    return [];
}

function quitarAcentosTexto(valor){
    return (valor || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function limpiarTextoGoleador(valor){
    return (valor || "").toString().replace(/\s+/g, " ").trim();
}

function abreviarNombreGoleador(nombre){
    const limpio = limpiarTextoGoleador(nombre);
    if(!limpio || limpio.toLowerCase().includes("por definir")) return "Por Definir";
    const partes = limpio.split(" ").filter(Boolean);
    if(partes.length === 1) return partes[0];
    return `${partes[0].charAt(0).toUpperCase()}.${partes.slice(1).join(" ")}`;
}

function normalizarPaisGoleador(pais){
    const limpio = limpiarTextoGoleador(pais);
    const key = quitarAcentosTexto(limpio).toLowerCase();
    const mapa = {
        "algeria":"Argelia", "argelia":"Argelia",
        "argentina":"Argentina",
        "australia":"Australia",
        "austria":"Austria",
        "belgium":"Belgica", "belgica":"Belgica", "bélgica":"Belgica",
        "bosnia-herzegovina":"Bosnia Herzegovina", "bosnia herzegovina":"Bosnia Herzegovina", "bos":"Bosnia Herzegovina",
        "brazil":"Brasil", "brasil":"Brasil",
        "canada":"Canada", "canadá":"Canada",
        "cape verde":"Cabo Verde", "cabo verde":"Cabo Verde",
        "colombia":"Colombia",
        "congo dr":"Congo", "democratic republic of the congo":"Congo", "congo":"Congo",
        "curacao":"Curazao", "curazao":"Curazao", "curazao":"Curazao",
        "czechia":"Republica Checa", "republica checa":"Republica Checa", "república checa":"Republica Checa", "che":"Republica Checa",
        "denmark":"Dinamarca", "dinamarca":"Dinamarca",
        "ecuador":"Ecuador",
        "egypt":"Egipto", "egipto":"Egipto",
        "england":"Inglaterra", "inglaterra":"Inglaterra",
        "france":"Francia", "francia":"Francia",
        "germany":"Alemania", "alemania":"Alemania",
        "ghana":"Ghana",
        "haiti":"Haiti", "haití":"Haiti",
        "iran":"Iran", "irán":"Iran",
        "iraq":"Iraq",
        "ivory coast":"Costa de Marfil", "costa de marfil":"Costa de Marfil",
        "japan":"Japon", "japon":"Japon", "japón":"Japon",
        "jordan":"Jordania", "jordania":"Jordania",
        "mexico":"Mexico", "méxico":"Mexico",
        "morocco":"Marruecos", "marruecos":"Marruecos",
        "netherlands":"Holanda", "holanda":"Holanda", "paises bajos":"Holanda", "países bajos":"Holanda",
        "new zealand":"Nueva Zelanda", "nueva zelanda":"Nueva Zelanda",
        "norway":"Noruega", "noruega":"Noruega",
        "panama":"Panama", "panamá":"Panama",
        "paraguay":"Paraguay",
        "portugal":"Portugal",
        "qatar":"Qatar",
        "saudi arabia":"Arabia Saudita", "arabia saudita":"Arabia Saudita",
        "scotland":"Escocia", "escocia":"Escocia",
        "senegal":"Senegal",
        "serbia":"Serbia",
        "south africa":"Sudafrica", "sudafrica":"Sudafrica", "sudáfrica":"Sudafrica",
        "south korea":"Corea del Sur", "corea del sur":"Corea del Sur",
        "spain":"Espana", "espana":"Espana", "españa":"Espana",
        "sweden":"Suecia", "suecia":"Suecia",
        "switzerland":"Suiza", "suiza":"Suiza",
        "tunisia":"Tunez", "tunez":"Tunez", "túnez":"Tunez",
        "turkey":"Turquia", "turquia":"Turquia", "turquía":"Turquia",
        "ukraine":"Ucrania", "ucrania":"Ucrania",
        "united states":"Estados Unidos", "united states of america":"Estados Unidos", "estados unidos":"Estados Unidos",
        "uruguay":"Uruguay",
        "uzbekistan":"Uzbekistan", "uzbekistán":"Uzbekistan"
    };
    return mapa[key] || limpio;
}

function abreviarPaisGoleador(pais){
    const rawKey = quitarAcentosTexto(limpiarTextoGoleador(pais)).toLowerCase();
    if(rawKey === "che") return "CHE";
    if(rawKey === "bos") return "BOS";

    const normalizado = normalizarPaisGoleador(pais);
    const key = quitarAcentosTexto(normalizado).toLowerCase();
    const excepciones = {
        "alemania":"GER", "arabia saudita":"KSA", "argelia":"ALG", "argentina":"ARG", "australia":"AUS",
        "austria":"AUT", "belgica":"BEL", "bosnia herzegovina":"BIH", "brasil":"BRA", "cabo verde":"CPV",
        "canada":"CAN", "colombia":"COL", "congo":"COD", "corea del sur":"KOR", "costa de marfil":"CIV",
        "curazao":"CUW", "dinamarca":"DEN", "ecuador":"ECU", "egipto":"EGY", "escocia":"SCO",
        "espana":"ESP", "estados unidos":"USA", "francia":"FRA", "ghana":"GHA",
        "haiti":"HAI", "holanda":"NED", "inglaterra":"ENG", "iran":"IRN", "iraq":"IRQ", "japon":"JPN",
        "jordania":"JOR", "marruecos":"MAR", "mexico":"MEX", "nueva zelanda":"NZL", "noruega":"NOR",
        "panama":"PAN", "paraguay":"PAR", "portugal":"POR", "qatar":"QAT", "republica checa":"CZE",
        "senegal":"SEN", "serbia":"SRB", "sudafrica":"RSA", "suecia":"SWE", "suiza":"SUI",
        "tunez":"TUN", "turquia":"TUR", "ucrania":"UKR", "uruguay":"URU", "uzbekistan":"UZB"
    };
    return excepciones[key] || (normalizado ? quitarAcentosTexto(normalizado).slice(0, 3).toUpperCase() : "");
}

function parsearGoleadoresCSV(texto){
    const data = parseCSV(texto || "");
    if(!data.length) return [];

    const headers = data[0].map(h => limpiarTextoGoleador(h));

    return data.slice(1).map(r => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = limpiarTextoGoleador(r[i] || ""); });

        const pos = Number(obj["POS"] || obj["Pos"] || obj["#"] || "");
        const nombre = obj["Nombre"] || obj["NOMBRE"] || obj["Player"] || obj["Jugador"] || "";
        const pais = normalizarPaisGoleador(obj["Equipo"] || obj["EQUIPO"] || obj["Club"] || obj["Selección"] || "");
        const partidos = Number(obj["P"] || obj["PJ"] || obj["Partidos"] || 0);
        const goles = Number(obj["G"] || obj["Goles"] || obj["GOLES"] || 0);

        if(!nombre || !Number.isFinite(pos)) return null;

        return {
            pos,
            nombre,
            nombreCorto: abreviarNombreGoleador(nombre),
            pais,
            abbr: abreviarPaisGoleador(pais),
            partidos: Number.isFinite(partidos) ? partidos : 0,
            goles: Number.isFinite(goles) ? goles : 0,
            fallback: false
        };
    }).filter(Boolean).slice(0, 50);
}

async function cargarGoleadores(){
    try{
        if(typeof urlGoleadores !== "string" || !urlGoleadores){
            goleadores = [];
            return;
        }

        const res = await fetch(urlGoleadores, { cache: "no-store" });
        if(!res.ok) throw new Error(`Goleadores ${res.status}`);

        const text = await res.text();
        goleadores = parsearGoleadoresCSV(text);
    }
    catch(error){
        console.warn("No se pudieron cargar goleadores:", error);
        goleadores = [];
    }
}



/* =========================================================
   VIDEOS · resúmenes oficiales por partido
   Tabla flexible: IDPartido | Titulo | URL | Thumbnail | Fuente
   ========================================================= */
function obtenerIdYouTube(url){
    const texto = (url || "").toString().trim();
    if(!texto) return "";

    const patrones = [
        /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
        /youtube\.com\/watch\?[^\s]*v=([a-zA-Z0-9_-]{6,})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
        /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
        /shorts\/([a-zA-Z0-9_-]{6,})/
    ];

    for(const patron of patrones){
        const m = texto.match(patron);
        if(m) return m[1];
    }
    return "";
}

function normalizarUrlVideo(url){
    const texto = (url || "").toString().trim();
    if(!texto) return "";
    const idYT = obtenerIdYouTube(texto);
    if(idYT) return `https://youtu.be/${idYT}`;
    return texto;
}

function getMiniaturaVideo(url, miniatura = ""){
    const img = (miniatura || "").toString().trim();
    if(img) return img;
    const idYT = obtenerIdYouTube(url);
    if(idYT) return `https://i.ytimg.com/vi/${idYT}/hqdefault.jpg`;
    return "";
}

function normalizarHeaderVideo(header){
    return (header || "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function valorVideo(obj, nombres){
    for(const nombre of nombres){
        const key = normalizarHeaderVideo(nombre);
        if(obj[key] !== undefined && obj[key] !== "") return obj[key];
    }
    return "";
}

function parsearVideosCSV(texto){
    const data = parseCSV(texto || "");
    if(!data.length) return [];

    const headers = data[0].map(h => normalizarHeaderVideo(h));

    return data.slice(1).map((r, index) => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (r[i] || "").toString().trim(); });

        const idPartido = Number(valorVideo(obj, [
            "IDPartido", "IdPartido", "PartidoID", "ID Partido", "Partido", "ID"
        ]));

        const url = normalizarUrlVideo(valorVideo(obj, [
            "URL", "Url", "Liga", "Link", "Enlace", "Video", "YouTube", "Youtube", "Resumen"
        ]));

        if(!Number.isFinite(idPartido) || !idPartido || !url) return null;

        const titulo = valorVideo(obj, ["Titulo", "Título", "Nombre", "Descripcion", "Descripción"]) || "Resumen oficial";
        const fuente = valorVideo(obj, ["Fuente", "Sitio", "Canal"]) || "Video externo";
        const miniatura = getMiniaturaVideo(url, valorVideo(obj, ["Thumbnail", "Miniatura", "Imagen"]));

        return {
            idVideo: Number(valorVideo(obj, ["IDVideo", "IdVideo"]) || index + 1),
            partidoId: idPartido,
            titulo,
            fuente,
            url,
            miniatura
        };
    }).filter(Boolean);
}

async function cargarVideos(){
    try{
        if(typeof urlVideos !== "string" || !urlVideos){
            videos = [];
            return;
        }
        const res = await fetch(urlVideos, { cache: "no-store" });
        if(!res.ok) throw new Error(`Videos ${res.status}`);
        const text = await res.text();
        videos = parsearVideosCSV(text);
    }
    catch(error){
        console.warn("No se pudieron cargar videos:", error);
        videos = [];
    }
}

function getVideosPartido(idPartido){
    return (videos || []).filter(v => Number(v.partidoId) === Number(idPartido));
}

function getHTMLVideosPartido(idPartido){
    const listaVideos = getVideosPartido(idPartido);
    if(!listaVideos.length) return "";

    return `
        <section class="videos-partido" aria-label="Videos del partido">
            <h2>RESUMEN <span class="titulo-acento">OFICIAL</span></h2>
            <div class="videos-grid">
                ${listaVideos.map(video => `
                    <a class="video-card" href="${video.url}" target="_blank" rel="noopener noreferrer" aria-label="Ver ${video.titulo}">
                        <div class="video-thumb ${video.miniatura ? "" : "video-thumb-fallback"}">
                            ${video.miniatura ? `<img src="${video.miniatura}" alt="Miniatura de ${video.titulo}" loading="lazy">` : ""}
                            <span class="video-play">▶</span>
                        </div>
                        <div class="video-info">
                            <strong>Highlights</strong>
                            <span>${video.fuente}</span>
                            <small>Se abrirá en YouTube</small>
                        </div>
                    </a>
                `).join("")}
            </div>
        </section>
    `;
}
