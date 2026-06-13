const contenido = document.getElementById("contenido");

const btnInicio = document.getElementById("btnInicio");
const btnPartidos = document.getElementById("btnPartidos");
const btnTabla = document.getElementById("btnTabla");
const btnEstadisticas = document.getElementById("btnEstadisticas");

const urlPartidos = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2YHMj7nASBNVX0vpYD3P0Uz41gHRsf4D52qu94vfmUX-vZtjN0NV0ONBI6WPWFJx81a1msQB8Xfy1/pub?gid=0&single=true&output=csv";
const urlPicks = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2YHMj7nASBNVX0vpYD3P0Uz41gHRsf4D52qu94vfmUX-vZtjN0NV0ONBI6WPWFJx81a1msQB8Xfy1/pub?gid=1411584310&single=true&output=csv";
const urlUsuarios = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2YHMj7nASBNVX0vpYD3P0Uz41gHRsf4D52qu94vfmUX-vZtjN0NV0ONBI6WPWFJx81a1msQB8Xfy1/pub?gid=1055009044&single=true&output=csv";
const urlLugaresPro = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2YHMj7nASBNVX0vpYD3P0Uz41gHRsf4D52qu94vfmUX-vZtjN0NV0ONBI6WPWFJx81a1msQB8Xfy1/pub?gid=565871920&single=true&output=csv";

let partidos = [];
let usuarios = [];
let picks = [];
let lugaresPro = [];
let ultimaActualizacion = null;
let rankingAnterior = {};

let ultimoFiltroPartidos = {
    tipo: "todos",
    valor: "todos"
};

let paginaDetalleUsuario = 1;
const picksPorPagina = 5;
