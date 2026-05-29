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
            nombre: obj["Nombre"]
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
