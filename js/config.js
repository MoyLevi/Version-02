const contenido = document.getElementById("contenido");

const btnInicio = document.getElementById("btnInicio");
const btnPartidos = document.getElementById("btnPartidos");
const btnTabla = document.getElementById("btnTabla");
const btnEstadisticas = document.getElementById("btnEstadisticas");

const urlPartidos = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2YHMj7nASBNVX0vpYD3P0Uz41gHRsf4D52qu94vfmUX-vZtjN0NV0ONBI6WPWFJx81a1msQB8Xfy1/pub?gid=0&single=true&output=csv";
const urlPicks = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2YHMj7nASBNVX0vpYD3P0Uz41gHRsf4D52qu94vfmUX-vZtjN0NV0ONBI6WPWFJx81a1msQB8Xfy1/pub?gid=1411584310&single=true&output=csv";
const urlUsuarios = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2YHMj7nASBNVX0vpYD3P0Uz41gHRsf4D52qu94vfmUX-vZtjN0NV0ONBI6WPWFJx81a1msQB8Xfy1/pub?gid=1055009044&single=true&output=csv";
const urlLugaresPro = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2YHMj7nASBNVX0vpYD3P0Uz41gHRsf4D52qu94vfmUX-vZtjN0NV0ONBI6WPWFJx81a1msQB8Xfy1/pub?gid=565871920&single=true&output=csv";
const urlKnockout = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2YHMj7nASBNVX0vpYD3P0Uz41gHRsf4D52qu94vfmUX-vZtjN0NV0ONBI6WPWFJx81a1msQB8Xfy1/pub?gid=965041697&single=true&output=csv";
const urlRankKO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2YHMj7nASBNVX0vpYD3P0Uz41gHRsf4D52qu94vfmUX-vZtjN0NV0ONBI6WPWFJx81a1msQB8Xfy1/pub?gid=1416723802&single=true&output=csv";
const urlPicksKO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2YHMj7nASBNVX0vpYD3P0Uz41gHRsf4D52qu94vfmUX-vZtjN0NV0ONBI6WPWFJx81a1msQB8Xfy1/pub?gid=512136379&single=true&output=csv";
const urlForm = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2YHMj7nASBNVX0vpYD3P0Uz41gHRsf4D52qu94vfmUX-vZtjN0NV0ONBI6WPWFJx81a1msQB8Xfy1/pub?gid=90296847&single=true&output=csv";
const urlFormularioPicks = "https://docs.google.com/forms/d/e/1FAIpQLSd1FxjcJxgV67tmyrJpP7anEfPmVlbXugxWHoaOaGwmw_W-Jg/viewform";
// Goleadores reales desde HC publicada en Google Sheets.
const urlGoleadores = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2YHMj7nASBNVX0vpYD3P0Uz41gHRsf4D52qu94vfmUX-vZtjN0NV0ONBI6WPWFJx81a1msQB8Xfy1/pub?gid=407044037&single=true&output=csv";
// Videos / resúmenes oficiales por partido.
const urlVideos = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2YHMj7nASBNVX0vpYD3P0Uz41gHRsf4D52qu94vfmUX-vZtjN0NV0ONBI6WPWFJx81a1msQB8Xfy1/pub?gid=896377943&single=true&output=csv";

let partidos = [];
let usuarios = [];
let picks = [];
let lugaresPro = [];
let knockout = [];
let rankKO = [];
let picksKO = [];
let goleadores = [];
let videos = [];
let formPicksAbierto = false;
let ultimaActualizacion = null;
let rankingAnterior = {};

let ultimoFiltroPartidos = {
    tipo: "todos",
    valor: "todos"
};

let paginaDetalleUsuario = 1;
const picksPorPagina = 5;
