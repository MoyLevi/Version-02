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
}

async function cargarUsuarios(){

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
}

async function cargarPicks(){

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
}

async function cargarLugaresPro(){

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
