function getFlag(country){

    const clean = (c) => (c || "")
        .toString()
        .trim()
        .toLowerCase();

    const map = {
        "alemania": "de",
        "arabia saudita": "sa",
        "argelia": "dz",
        "argentina": "ar",
        "australia": "au",
        "austria": "at",
        "belgica": "be",
        "bosnia herzegovina": "ba",
        "brasil": "br",
        "cabo verde": "cv",
        "canada": "ca",
        "colombia": "co",
        "congo": "cd",
        "corea del sur": "kr",
        "costa de marfil": "ci",
        "croacia": "hr",
        "curazao": "cw",
        "ecuador": "ec",
        "egipto": "eg",
        "escocia": "gb-sct",
        "espana": "es",
        "españa": "es",
        "estados unidos": "us",
        "francia": "fr",
        "ghana": "gh",
        "haiti": "ht",
        "holanda": "nl",
        "inglaterra": "gb",
        "iran": "ir",
        "iraq": "iq",
        "japon": "jp",
        "jordania": "jo",
        "marruecos": "ma",
        "mexico": "mx",
        "nueva zelanda": "nz",
        "noruega": "no",
        "panama": "pa",
        "paraguay": "py",
        "portugal": "pt",
        "qatar": "qa",
        "republica checa": "cz",
        "senegal": "sn",
        "sudafrica": "za",
        "suecia": "se",
        "suiza": "ch",
        "tunez": "tn",
        "turquia": "tr",
        "uruguay": "uy",
        "uzbekistan": "uz"
    };

    const code = map[clean(country)];

    return code
        ? `https://flagcdn.com/w80/${code}.png`
        : `https://flagcdn.com/w80/un.png`;
}

function actualizarTimestamp(){
    ultimaActualizacion = new Date();
}

function formatearFechaHora(fecha){
    if(!fecha) return "Sin actualización";

    return fecha.toLocaleString("es-MX", {
        dateStyle:"medium",
        timeStyle:"short"
    });
}

function compartirApp(){
    if(navigator.share){
        navigator.share({
            title:"Quiniela Mundial 2026",
            text:"Revisa la quiniela del Mundial 2026",
            url:window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copiado al portapapeles");
    }
}

function getClaseTextoStatus(status){
    const s = (status || "").toLowerCase();

    if(s.includes("final")) return "texto-finalizado";
    if(s.includes("vivo") || s.includes("juego")) return "texto-en-vivo";

    return "texto-pendiente";
}

function getClaseStatus(status){
    const s = (status || "").toLowerCase();

    if(s.includes("final")) return "partido-finalizado";
    if(s.includes("vivo") || s.includes("juego")) return "partido-en-vivo";

    return "partido-pendiente";
}

function getFooterCopyright(){
    return `<div class="dev-footer">© Moy · 2026 (v.2.6.2 DEV)</div>`;
}

function getPrediccionColectiva(partidoId){
    const lista = picks.filter(p => p.partidoId === partidoId);

    if(lista.length === 0){
        return "Sin picks todavía";
    }

    const conteo = {};

    lista.forEach(p => {
        const key = `${p.golLoc}-${p.golVis}`;
        conteo[key] = (conteo[key] || 0) + 1;
    });

    const ganador = Object.entries(conteo)
        .sort((a,b) => b[1] - a[1])[0];

    return `Pick más común: ${ganador[0]} (${ganador[1]} votos)`;
}
